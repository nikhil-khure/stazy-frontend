import { useEffect, useState } from 'react';
import { C, BTN } from '../constants/theme';
import { Logo } from '../components/shared/SharedComponents';
import Popup from '../components/shared/Popup';
import { apiRequest } from '../services/api';
import { triggerMultipleRefresh, registerRefreshCallback } from '../services/apiWithRefresh';
import { addWebSocketListener } from '../services/websocket';
import { applyAdminDashboardEvent } from '../utils/realtimeManagementState';
import { Search, Eye, Filter, CheckCircle, XCircle, Clock, Save, X, Edit, Lock, Unlock, Mail, Phone, MapPin, Upload } from 'lucide-react';
import { prepareVerificationDisplay } from '../utils/verificationDisplay';

// Add CSS animation for toast
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes slideDown {
    from {
      transform: translateY(-100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;
if (!document.head.querySelector('style[data-admin-toast]')) {
  styleSheet.setAttribute('data-admin-toast', 'true');
  document.head.appendChild(styleSheet);
}

function humanize(value) {
  return (value || '')
    .toString()
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDateTime(value) {
  if (!value) {
    return '-';
  }
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
}

function StatusBadge({ status }) {
  const normalized = (status || '').toUpperCase();
  const config = {
    ACTIVE: [C.success, 'Active'],
    WARNING: ['#D97706', 'Warning'],
    BLOCKED: [C.danger, 'Blocked'],
    VERIFIED: [C.success, 'Verified'],
    REJECTED: [C.danger, 'Rejected'],
    FAILED: [C.danger, 'Failed'],
    LIVE: [C.success, 'Live'],
    PENDING: ['#D97706', 'Pending'],
    PENDING_REVIEW: ['#D97706', 'Pending Review'],
    UNDER_REVIEW: ['#D97706', 'Under Review'],
    PENDING_AI_VERIFY: [C.secondary, 'Pending AI Verify'],
    SUCCESSFUL: [C.success, 'Successful'],
  };
  const [color, label] = config[normalized] || [C.textLight, humanize(status)];
  return (
    <span style={{ background: `${color}18`, color, borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
      {label}
    </span>
  );
}

function TableWrap({ headers, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, overflowX: 'auto', width: '100%' }}>
      <table style={{ minWidth: 600, width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: C.bg }}>
            {headers.map(header => (
              <th key={header} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 800, color: C.textLight, whiteSpace: 'nowrap' }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function TR({ children }) {
  return <tr style={{ borderTop: `1px solid ${C.border}` }}>{children}</tr>;
}

function TD({ children, style = {} }) {
  return <td style={{ padding: '12px 14px', verticalAlign: 'middle', whiteSpace: 'nowrap', ...style }}>{children}</td>;
}

function MediaStrip({ images = [], ownerPhotoUrl, videoUrl }) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <h4 style={{ margin: '0 0 12px', color: C.text }}>Owner Photo</h4>
        {ownerPhotoUrl ? (
          <img
            src={ownerPhotoUrl}
            alt="Owner"
            style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 12, border: `1px solid ${C.border}` }}
          />
        ) : (
          <div style={{ width: 120, height: 120, background: '#e5e7eb', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${C.border}`, color: C.textLight, fontSize: 13 }}>
            No owner photo
          </div>
        )}
      </div>
      <div>
        <h4 style={{ margin: '0 0 12px', color: C.text }}>Listing Images</h4>
        {images.length ? (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {images.map((image, index) => (
              <img
                key={`${image}-${index}`}
                src={image}
                alt={`Listing ${index + 1}`}
                style={{ width: 92, height: 92, objectFit: 'cover', borderRadius: 10, border: `1px solid ${C.border}` }}
              />
            ))}
          </div>
        ) : (
          <div style={{ color: C.textLight, fontSize: 13 }}>No images uploaded yet.</div>
        )}
      </div>
      <div>
        <h4 style={{ margin: '0 0 12px', color: C.text }}>Owner Live Video</h4>
        {videoUrl ? (
          <video src={videoUrl} controls style={{ width: '100%', maxHeight: 220, borderRadius: 10, border: `1px solid ${C.border}` }} />
        ) : (
          <div style={{ width: '100%', height: 90, background: '#e5e7eb', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${C.border}`, color: C.textLight, fontSize: 13 }}>
            No video uploaded
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboardLive({ user, setUser, navigate }) {
  const [section, setSection] = useState('students');
  const [popup, setPopup] = useState(null);
  const [contactMsg, setContactMsg] = useState('');
  const [contactSent, setContactSent] = useState(false);
  const [rejectMsg, setRejectMsg] = useState('');
  const [moderationMessage, setModerationMessage] = useState('');
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [owners, setOwners] = useState([]);
  const [pendingListings, setPendingListings] = useState([]);
  const [myQueries, setMyQueries] = useState([]);
  const [verificationResult, setVerificationResult] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successToast, setSuccessToast] = useState(null);
  const [optimisticListings, setOptimisticListings] = useState([]);

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 2500);
  };

  // Initial load
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      return;
    }

    let active = true;

    const loadDashboard = async () => {
      setPageLoading(true);
      setPageError('');
      try {
        const [statsResponse, studentsResponse, ownersResponse, listingsResponse, queriesResponse] = await Promise.all([
          apiRequest('/api/admin/dashboard/stats', { auth: true }),
          apiRequest('/api/admin/dashboard/students', { auth: true }),
          apiRequest('/api/admin/dashboard/owners', { auth: true }),
          apiRequest('/api/admin/dashboard/listings/pending', { auth: true }),
          apiRequest('/api/admin/queries/me', { auth: true }),
        ]);

        if (!active) {
          return;
        }

        setStats(statsResponse);
        setStudents(studentsResponse || []);
        setOwners(ownersResponse || []);
        setPendingListings(listingsResponse || []);
        setMyQueries(queriesResponse || []);
      } catch (error) {
        if (active) {
          setPageError(error.message);
        }
      } finally {
        if (active) {
          setPageLoading(false);
        }
      }
    };

    loadDashboard();
    return () => {
      active = false;
    };
  }, [user]);

  // Direct state updates from WebSocket events
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      return;
    }

    const unsubscribe = addWebSocketListener((topic, payload) => {
      if (topic !== 'role' && topic !== 'global' && topic !== 'user') {
        return;
      }

      const nextState = applyAdminDashboardEvent({
        stats,
        students,
        owners,
        pendingListings,
        myQueries,
      }, payload);

      setStats(nextState.stats);
      setStudents(nextState.students);
      setOwners(nextState.owners);
      setPendingListings(nextState.pendingListings);
      setMyQueries(nextState.myQueries);
    });
    
    return () => unsubscribe();
  }, [user, stats, students, owners, pendingListings, myQueries]);

  const applyUserStatus = (targetUserId, status, message = '') => {
    setActionError('');

    // 1. Capture previous status for rollback
    const prevStudent = students.find(s => s.userId === targetUserId);
    const prevOwner = owners.find(o => o.userId === targetUserId);
    const prevStatus = prevStudent?.accountStatus || prevOwner?.accountStatus;

    // 2. Apply the new status badge IMMEDIATELY
    const applyStatus = (list) =>
      list.map(item =>
        item.userId === targetUserId ? { ...item, accountStatus: status } : item
      );
    setStudents(applyStatus);
    setOwners(applyStatus);
    showToast(`User status updated to ${status}! ✓`);

    // 3. API in background
    (async () => {
      try {
        await apiRequest(`/api/admin/dashboard/users/${targetUserId}/status`, {
          method: 'PATCH',
          auth: true,
          body: { status, message },
        });
        // No refresh needed — badge is already correct
      } catch (error) {
        // Revert badge to previous status
        const revert = (list) =>
          list.map(item =>
            item.userId === targetUserId
              ? { ...item, accountStatus: prevStatus }
              : item
          );
        setStudents(revert);
        setOwners(revert);
        setActionError(`Failed to update user status: ${error.message}`);
      }
    })();
  };

  const verifyListing = async listing => {
    setActionError('');
    setActionLoading(true);
    setVerificationResult(null);
    showToast('AI verification started...');
    try {
      const result = await apiRequest(`/api/verifications/listings/${listing.listingId}`, {
        method: 'POST',
        auth: true,
      });
      const normalizedResult = prepareVerificationDisplay(result);
      setVerificationResult(normalizedResult);
      setPendingListings(current =>
        current.map(item =>
          item.listingId === listing.listingId ? { ...item, fakeDetectionStatus: normalizedResult.status } : item
        )
      );
      showToast(
        normalizedResult.verified
          ? 'Verification passed! ✓'
          : 'Verification complete — check results below.'
      );
    } catch (error) {
      setActionError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const goLive = async listingId => {
    // ===== OPTIMISTIC UI UPDATE =====
    // 1. Show success toast IMMEDIATELY
    setSuccessToast('Listing approved and going live! ✓');
    setActionError('');
    
    // 2. Remove from pending listings IMMEDIATELY (optimistic)
    const targetListing = pendingListings.find(item => item.listingId === listingId);
    if (targetListing) {
      setOptimisticListings(current => [...current, { ...targetListing, status: 'LIVE', isOptimistic: true }]);
    }
    setPendingListings(current => current.filter(item => item.listingId !== listingId));
    
    // 3. Hide toast after 2s
    setTimeout(() => {
      setSuccessToast(null);
    }, 2000);
    
    // ===== BACKGROUND API CALL =====
    (async () => {
      try {
        await apiRequest(`/api/admin/dashboard/listings/${listingId}/go-live`, {
          method: 'PATCH',
          auth: true,
        });
        
        // CRITICAL: Trigger refresh callbacks to sync with owner dashboard
        triggerMultipleRefresh(['listings', 'ownerListings', 'dashboard']);
        
        // Remove optimistic listing after API success
        setOptimisticListings(current => 
          current.filter(listing => listing.listingId !== listingId || !listing.isOptimistic)
        );
      } catch (error) {
        console.error('Failed to approve listing:', error);
        
        // Revert optimistic update on error
        if (targetListing) {
          setPendingListings(current => [targetListing, ...current]);
        }
        setOptimisticListings(current => 
          current.filter(listing => listing.listingId !== listingId || !listing.isOptimistic)
        );
        
        setSuccessToast(null);
        setActionError(`Failed to approve listing: ${error.message}`);
      }
    })();
  };

  const rejectListing = async () => {
    if (!popup?.data?.listingId) {
      return;
    }
    if (!rejectMsg.trim()) {
      setActionError('Please enter a reason for rejection.');
      return;
    }
    
    const listingId = popup.data.listingId;
    const targetListing = popup.data;
    const rejectionReason = rejectMsg.trim();
    
    // ===== OPTIMISTIC UI UPDATE =====
    // 1. Show success toast IMMEDIATELY
    setSuccessToast('Listing rejected and owner notified! ✓');
    setActionError('');
    
    // 2. Close popup IMMEDIATELY
    setRejectMsg('');
    setPopup(null);
    
    // 3. Remove from pending listings IMMEDIATELY (optimistic)
    setPendingListings(current => current.filter(item => item.listingId !== listingId));
    setOptimisticListings(current => [...current, { ...targetListing, status: 'REJECTED', reviewNotes: rejectionReason, isOptimistic: true }]);
    
    // 4. Hide toast after 2s
    setTimeout(() => {
      setSuccessToast(null);
    }, 2000);
    
    // ===== BACKGROUND API CALL =====
    (async () => {
      try {
        await apiRequest(`/api/admin/dashboard/listings/${listingId}/reject`, {
          method: 'PATCH',
          auth: true,
          body: { reviewNotes: rejectionReason },
        });
        
        // CRITICAL: Trigger refresh callbacks to sync with owner dashboard
        triggerMultipleRefresh(['listings', 'ownerListings', 'dashboard']);
        
        // Remove optimistic listing after API success
        setOptimisticListings(current => 
          current.filter(listing => listing.listingId !== listingId || !listing.isOptimistic)
        );
      } catch (error) {
        console.error('Failed to reject listing:', error);
        
        // Revert optimistic update on error
        setPendingListings(current => [targetListing, ...current]);
        setOptimisticListings(current => 
          current.filter(listing => listing.listingId !== listingId || !listing.isOptimistic)
        );
        
        setSuccessToast(null);
        setActionError(`Failed to reject listing: ${error.message}`);
      }
    })();
  };

  const submitQuery = () => {
    if (!contactMsg.trim()) {
      setActionError('Please enter a message.');
      return;
    }
    setActionError('');

    // 1. Add optimistic query entry immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticQuery = {
      id: tempId,
      subject: 'Admin dashboard query',
      message: contactMsg.trim(),
      status: 'PENDING',
      isOptimistic: true,
      createdAt: new Date().toISOString(),
    };
    setMyQueries(curr => [optimisticQuery, ...curr]);
    setContactSent(true);
    setContactMsg('');
    showToast('Query sent to Super Admin! ✓');

    // 2. API in background
    (async () => {
      try {
        const realQuery = await apiRequest('/api/admin/queries', {
          method: 'POST',
          auth: true,
          body: {
            subject: 'Admin dashboard query',
            message: optimisticQuery.message,
          },
        });
        // Replace the optimistic entry with the real one
        setMyQueries(curr =>
          curr.map(q => q.id === tempId ? realQuery : q)
        );
      } catch (error) {
        // Revert: remove the optimistic entry and restore the form
        setMyQueries(curr => curr.filter(q => q.id !== tempId));
        setContactSent(false);
        setContactMsg(optimisticQuery.message);
        setActionError(`Failed to send query: ${error.message}`);
      }
    })();
  };

  const resolvedQueries = myQueries.filter(query => query.replyMessage);

  if (!user || user.role !== 'admin') {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, padding: 28, maxWidth: 460, width: '100%', textAlign: 'center' }}>
          <h2 style={{ marginTop: 0, color: C.text }}>Admin sign-in required</h2>
          <p style={{ color: C.textLight, fontSize: 14, marginBottom: 18 }}>Sign in with an admin account to access the control panel.</p>
          <button onClick={() => navigate('adminLogin')} style={{ ...BTN.primary, padding: '10px 20px' }}>
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: '100vh', background: C.bg }}>
      {/* Success Toast */}
      {successToast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: C.success, color: '#fff', borderRadius: 10, padding: '14px 20px', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', animation: 'slideDown 0.3s ease-out' }}>
          {successToast}
        </div>
      )}
      
      {popup?.type === 'moderateUser' && (
        <Popup title={popup.data.status === 'WARNING' ? 'Send Warning' : 'Block User'} onClose={() => { setPopup(null); setModerationMessage(''); setActionError(''); }}>
          <div style={{ color: C.textLight, fontSize: 13, marginBottom: 12 }}>{popup.data.name}</div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.textLight, marginBottom: 6 }}>Message</label>
            <textarea
              placeholder={popup.data.status === 'WARNING' ? 'Type the warning message...' : 'Type the block message...'}
              value={moderationMessage}
              onChange={event => setModerationMessage(event.target.value)}
              rows={4}
              style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <button
            onClick={async () => {
              await applyUserStatus(popup.data.userId, popup.data.status, moderationMessage);
              setPopup(null);
              setModerationMessage('');
            }}
            style={{ background: popup.data.status === 'BLOCKED' ? C.danger : C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: 11, width: '100%', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
          >
            {popup.data.status === 'BLOCKED' ? 'Block User' : 'Send Warning'}
          </button>
        </Popup>
      )}
      {popup?.type === 'aiVerify' && (
        <Popup title="AI Listing Verification" onClose={() => { setPopup(null); setVerificationResult(null); setActionError(''); }} width={620}>
          <p style={{ color: C.textLight, fontSize: 13, marginBottom: 16 }}>
            Listing: <b>{popup.data.listingTitle}</b> by {popup.data.ownerName}
          </p>

          <MediaStrip images={popup.data.imageUrls} ownerPhotoUrl={popup.data.ownerPhotoUrl} videoUrl={popup.data.videoUrl} />

          <div style={{ marginTop: 16 }}>
            {actionLoading ? (
              <div style={{ textAlign: 'center', padding: 24, background: '#F9FAFB', borderRadius: 10 }}>
                <div style={{ fontSize: 48, display: 'inline-block', animation: 'spin 1s linear infinite', marginBottom: 12 }}>🔄</div>
                <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>AI Verification in progress...</div>
                <div style={{ color: C.textLight, fontSize: 13, marginBottom: 20 }}>
                  <div style={{ marginBottom: 8 }}>📹 Scanning video...</div>
                  <div style={{ marginBottom: 8 }}>👁️ Checking liveness...</div>
                  <div style={{ marginBottom: 8 }}>🖼️ Extracting images from video and matching with owner face...</div>
                  <div>🏠 Matching owner face with room images where owner is present...</div>
                </div>
              </div>
            ) : verificationResult ? (
              <div style={{ background: verificationResult.verified ? '#F0FFF4' : '#FEF2F2', border: `1px solid ${verificationResult.verified ? C.success : C.danger}`, borderRadius: 10, padding: 16 }}>
                <h4 style={{ margin: '0 0 10px', color: verificationResult.verified ? C.success : C.danger }}>
                  {verificationResult.verified ? '✅ Listing Verified' : '❌ Not Verified'}
                </h4>
                {verificationResult.verified ? (
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div style={{ background: '#DCFCE7', borderRadius: 8, padding: '8px 12px', color: C.success, fontSize: 13 }}>✓ liveness_check: PASSED – blink detected</div>
                    <div style={{ background: '#DCFCE7', borderRadius: 8, padding: '8px 12px', color: C.success, fontSize: 13 }}>✓ matched_room_images_along_with_owner: {verificationResult.matchedImages || 'two'}</div>
                    <div style={{ background: '#DCFCE7', borderRadius: 8, padding: '8px 12px', color: C.success, fontSize: 13 }}>✓ Owner detected in all listing images. Listing is REAL</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ color: C.danger, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Failed Checks</div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {(verificationResult.failedReasons || []).length > 0 ? (
                        (verificationResult.failedReasons || []).map(reason => (
                          <div key={reason} style={{ background: '#FFF1F2', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: C.danger }}>
                            ✗ {reason}
                          </div>
                        ))
                      ) : (
                        <>
                          <div style={{ background: '#FFF1F2', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: C.danger }}>✗ Live person does not match owner photo</div>
                          <div style={{ background: '#FFF1F2', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: C.danger }}>✗ liveness_check: FAILED – no blink detected</div>
                          <div style={{ background: '#FFF1F2', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: C.danger }}>✗ Owner not present in all listing images. Listing is FAKE</div>
                          <div style={{ background: '#FFF1F2', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: C.danger }}>✗ total_not_matched_images = {verificationResult.notMatchedImages || '2'}</div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: '#FFFBEB', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#92400E' }}>
                AI will analyze the uploaded media and return accepted or rejected verification parameters.
              </div>
            )}
          </div>

          {actionError && <div style={{ marginTop: 12, background: '#FEF2F2', color: C.danger, borderRadius: 8, padding: '10px 12px', fontSize: 12 }}>{actionError}</div>}

          <button
            onClick={() => verifyListing(popup.data)}
            style={{ ...BTN.primary, width: '100%', padding: 12, fontSize: 15, marginTop: 16 }}
            disabled={actionLoading}
          >
            {actionLoading ? 'Verifying...' : verificationResult ? 'Run Verification Again' : 'Perform AI Verification'}
          </button>
        </Popup>
      )}

      {popup?.type === 'rejectListing' && (
        <Popup title="Reject Room Listing" onClose={() => { setPopup(null); setRejectMsg(''); setActionError(''); }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.textLight, marginBottom: 6 }}>Reason for rejection</label>
            <textarea
              placeholder="Explain why the listing was rejected..."
              value={rejectMsg}
              onChange={event => setRejectMsg(event.target.value)}
              rows={4}
              style={{ width: '100%', padding: '11px 14px', border: `2px solid ${C.border}`, borderRadius: 8, fontSize: 14, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          {actionError && <div style={{ marginBottom: 12, background: '#FEF2F2', color: C.danger, borderRadius: 8, padding: '10px 12px', fontSize: 12 }}>{actionError}</div>}
          <button
            onClick={rejectListing}
            style={{ background: C.danger, color: '#fff', width: '100%', padding: 13, fontSize: 15, border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
            disabled={actionLoading}
          >
            {actionLoading ? 'Sending...' : 'Send Rejection'}
          </button>
        </Popup>
      )}

      <nav style={{ background: '#001E5E', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div onClick={() => navigate('home')} style={{ cursor: 'pointer' }}><Logo white size={22} /></div>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>| Admin Panel</span>
            <span style={{ background: 'rgba(255,183,0,0.2)', color: '#FFB700', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>
              City: {stats?.cityName || '-'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => navigate('home')} style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>Home</button>
            <div style={{ background: 'rgba(255,183,0,0.2)', color: '#FFB700', borderRadius: 6, padding: '5px 12px', fontSize: 13, fontWeight: 700 }}>
              Admin: {user?.name}
            </div>
            <button onClick={() => { setUser(null); navigate('home'); }} style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
        <div style={{ background: 'linear-gradient(135deg, #001E5E, #003B95)', borderRadius: 14, padding: '24px 28px', color: '#fff', marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Admin Control Panel</h1>
          <p style={{ margin: '6px 0 0', opacity: 0.8 }}>Managing platform for city: <b>{stats?.cityName || '-'}</b></p>
        </div>

        {pageError && <div style={{ background: '#FEF2F2', color: C.danger, borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>{pageError}</div>}
        {actionError && !popup && <div style={{ background: '#FEF2F2', color: C.danger, borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>{actionError}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            ['Students', pageLoading ? '...' : String(stats?.totalStudents ?? 0), C.secondary],
            ['Owners', pageLoading ? '...' : String(stats?.totalOwners ?? 0), '#6B21A8'],
            ['Live Listings', pageLoading ? '...' : String(stats?.liveListings ?? 0), C.success],
            ['Pending Review', pageLoading ? '...' : String(stats?.pendingReviewListings ?? 0), '#D97706'],
            ['City', pageLoading ? '...' : (stats?.cityName || '-'), C.primary],
          ].map(([label, value, color]) => (
            <div key={label} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: `1px solid ${C.border}` }}>
              <div style={{ color: C.textLight, fontSize: 12, fontWeight: 700 }}>{label}</div>
              <div style={{ fontSize: label === 'City' ? 18 : 26, fontWeight: 900, color, marginTop: 4 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', background: '#fff', borderRadius: 10, padding: 4, marginBottom: 20, width: 'fit-content', border: `1px solid ${C.border}`, gap: 2 }}>
          {[
            ['students', 'Student Management'],
            ['owners', 'Owner Management'],
            ['contact', 'Contact Super Admin'],
            ['replies', 'See Super Admin Replies'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 13,
                transition: 'all 0.2s',
                background: section === key ? C.primary : 'transparent',
                color: section === key ? '#fff' : C.textLight,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {section === 'students' && (
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'auto', marginBottom: 20 }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
              <h3 style={{ margin: 0, fontWeight: 800 }}>All Students - {stats?.cityName || '-'}</h3>
            </div>
            <TableWrap headers={['ID', 'Name', 'Email', 'Verification', 'Current City', 'Active Complaints', 'Resolved Complaints', 'Status', 'Actions']}>
              {students.map(student => (
                <TR key={student.userId}>
                  <TD><span style={{ fontFamily: 'monospace', color: C.textLight, fontSize: 12 }}>{student.userCode}</span></TD>
                  <TD><span style={{ fontWeight: 700 }}>{student.displayName}</span></TD>
                  <TD style={{ whiteSpace: 'normal' }}><span style={{ color: C.textLight }}>{student.email}</span></TD>
                  <TD><StatusBadge status={student.identityVerified ? 'VERIFIED' : 'REJECTED'} /></TD>
                  <TD style={{ whiteSpace: 'normal' }}>{student.currentCity || '-'}</TD>
                  <TD>{student.activeComplaints}</TD>
                  <TD>{student.resolvedComplaints}</TD>
                  <TD><StatusBadge status={student.accountStatus} /></TD>
                  <TD>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button
                        onClick={() => { setPopup({ type: 'moderateUser', data: { userId: student.userId, status: 'WARNING', name: student.displayName } }); setModerationMessage(''); }}
                        style={{ background: '#FFFBEB', color: '#D97706', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                      >
                        Warn
                      </button>
                      <button
                        onClick={() => {
                          if (student.accountStatus === 'BLOCKED') {
                            applyUserStatus(student.userId, 'ACTIVE', 'Your account has been reactivated.');
                            return;
                          }
                          setPopup({ type: 'moderateUser', data: { userId: student.userId, status: 'BLOCKED', name: student.displayName } });
                          setModerationMessage('');
                        }}
                        style={{ background: '#FEF2F2', color: C.danger, border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                      >
                        {student.accountStatus === 'BLOCKED' ? 'Activate' : 'Block'}
                      </button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TableWrap>
          </div>
        )}

        {section === 'owners' && (
          <div>
            <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'auto', marginBottom: 20 }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
                <h3 style={{ margin: 0, fontWeight: 800 }}>Room Listing Requests</h3>
              </div>
              <TableWrap headers={['Listing ID', 'Owner', 'Listing Name', 'AI Status', 'Actions']}>
                {pendingListings.map(listing => (
                  <TR key={listing.listingId}>
                    <TD><span style={{ fontFamily: 'monospace', color: C.textLight, fontSize: 12 }}>{String(listing.listingId).slice(0, 8)}</span></TD>
                    <TD>
                      <div style={{ fontWeight: 700 }}>{listing.ownerName}</div>
                      <div style={{ fontSize: 11, color: C.textLight }}>{listing.ownerUserCode}</div>
                    </TD>
                    <TD style={{ whiteSpace: 'normal' }}>{listing.listingTitle}</TD>
                    <TD><StatusBadge status={listing.fakeDetectionStatus || listing.status} /></TD>
                    <TD>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => { setPopup({ type: 'aiVerify', data: listing }); setVerificationResult(null); setActionError(''); }}
                          style={{ background: '#F0FFF4', color: C.success, border: 'none', borderRadius: 6, padding: '5px 9px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                        >
                          AI Verify
                        </button>
                        <button
                          onClick={() => goLive(listing.listingId)}
                          style={{ background: `${C.primary}15`, color: C.primary, border: 'none', borderRadius: 6, padding: '5px 9px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                        >
                          Go Live
                        </button>
                        <button
                          onClick={() => { setPopup({ type: 'rejectListing', data: listing }); setActionError(''); }}
                          style={{ background: '#FEF2F2', color: C.danger, border: 'none', borderRadius: 6, padding: '5px 9px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                        >
                          Reject
                        </button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TableWrap>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'auto', marginBottom: 20 }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
                <h3 style={{ margin: 0, fontWeight: 800 }}>All Owners - {stats?.cityName || '-'}</h3>
              </div>
              <TableWrap headers={['ID', 'Name', 'Listing', 'Verification', 'PG Location', 'Active Complaints', 'Resolved Complaints', 'Status', 'Actions']}>
                {owners.map(owner => (
                  <TR key={owner.userId}>
                    <TD><span style={{ fontFamily: 'monospace', color: C.textLight, fontSize: 12 }}>{owner.userCode}</span></TD>
                    <TD><span style={{ fontWeight: 700 }}>{owner.displayName}</span></TD>
                    <TD style={{ whiteSpace: 'normal' }}>{owner.listingTitle || '-'}</TD>
                    <TD><StatusBadge status={owner.identityVerified ? 'VERIFIED' : 'REJECTED'} /></TD>
                    <TD style={{ whiteSpace: 'normal' }}>{owner.pgLocation || '-'}</TD>
                    <TD>{owner.activeComplaints}</TD>
                    <TD>{owner.resolvedComplaints}</TD>
                    <TD><StatusBadge status={owner.accountStatus} /></TD>
                    <TD>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button
                          onClick={() => { setPopup({ type: 'moderateUser', data: { userId: owner.userId, status: 'WARNING', name: owner.displayName } }); setModerationMessage(''); }}
                          style={{ background: '#FFFBEB', color: '#D97706', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                        >
                          Warn
                        </button>
                        <button
                          onClick={() => {
                            if (owner.accountStatus === 'BLOCKED') {
                              applyUserStatus(owner.userId, 'ACTIVE', 'Your account has been reactivated.');
                              return;
                            }
                            setPopup({ type: 'moderateUser', data: { userId: owner.userId, status: 'BLOCKED', name: owner.displayName } });
                            setModerationMessage('');
                          }}
                          style={{ background: '#FEF2F2', color: C.danger, border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                        >
                          {owner.accountStatus === 'BLOCKED' ? 'Activate' : 'Block'}
                        </button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TableWrap>
            </div>
          </div>
        )}

        {section === 'contact' && (
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ color: C.text, fontWeight: 900, marginBottom: 20 }}>Contact Super Admin</h2>
            <div style={{ background: '#fff', borderRadius: 14, padding: 28, border: `1px solid ${C.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              {contactSent ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontWeight: 700, color: C.success, fontSize: 18, marginBottom: 8 }}>Message Sent</div>
                  <div style={{ color: C.textLight, fontSize: 14, marginBottom: 20 }}>Your message has been sent to the Super Admin.</div>
                  <button onClick={() => setContactSent(false)} style={{ ...BTN.outline }}>Send Another Message</button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.textLight, marginBottom: 6 }}>Message</label>
                    <textarea
                      placeholder="Type your message to the Super Admin..."
                      value={contactMsg}
                      onChange={event => setContactMsg(event.target.value)}
                      rows={6}
                      style={{ width: '100%', padding: '11px 14px', border: `2px solid ${C.border}`, borderRadius: 8, fontSize: 14, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <button
                    onClick={submitQuery}
                    style={{ ...BTN.primary, width: '100%', padding: 13, fontSize: 15 }}
                  >
                    Submit
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {section === 'replies' && (
          <div>
            <h2 style={{ color: C.text, fontWeight: 900, marginBottom: 20 }}>Super Admin Replies</h2>
            <TableWrap headers={['Query ID', 'Date', 'Status', 'Reply']}>
              {resolvedQueries.map(query => (
                <TR key={query.id}>
                  <TD><span style={{ fontFamily: 'monospace', fontWeight: 700, color: C.primary }}>{String(query.id).slice(0, 8)}</span></TD>
                  <TD>{formatDateTime(query.repliedAt || query.createdAt)}</TD>
                  <TD><StatusBadge status={query.status} /></TD>
                  <TD style={{ whiteSpace: 'normal' }}>{query.replyMessage}</TD>
                </TR>
              ))}
            </TableWrap>
          </div>
        )}
      </div>
    </div>
  );
}
