import { useState } from 'react';
import { C, BTN } from '../constants/theme';
import { Logo } from '../components/shared/SharedComponents';
import { useGlobalState } from '../contexts/GlobalStateContext';
import { useOptimisticActions } from '../hooks/useOptimisticActions';

/**
 * Owner Dashboard with Global State and Full Optimistic UI
 * All actions update instantly with background API calls
 */

export default function OwnerDashboardGlobal({ user, setUser, navigate }) {
  const [page, setPage] = useState('dashboard');
  
  // Global state - shared across all panels
  const {
    listings,
    bookingRequests,
    activeStays,
    payments,
    profile,
    loading,
    error,
  } = useGlobalState();
  
  // Optimistic actions - instant UI updates
  const {
    createListing,
    updateListing,
    deleteListing,
    acceptBooking,
    rejectBooking,
    updatePayment,
    successToast,
    actionError,
  } = useOptimisticActions();

  if (!user || user.role !== 'owner') {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, padding: 28, maxWidth: 460, width: '100%', textAlign: 'center' }}>
          <h2 style={{ marginTop: 0, color: C.text }}>Owner sign-in required</h2>
          <p style={{ color: C.textLight, fontSize: 14, marginBottom: 18 }}>Sign in with an owner account to access the dashboard.</p>
          <button onClick={() => navigate('login')} style={{ ...BTN.primary, padding: '10px 20px' }}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: '100vh', background: C.bg }}>
      {/* Success Toast */}
      {successToast && (
        <div style={{ 
          position: 'fixed', 
          top: 20, 
          right: 20, 
          zIndex: 9999, 
          background: C.success, 
          color: '#fff', 
          borderRadius: 10, 
          padding: '14px 20px', 
          fontWeight: 700, 
          fontSize: 14, 
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          {successToast}
        </div>
      )}

      {/* Error Display */}
      {actionError && (
        <div style={{ 
          position: 'fixed', 
          top: 20, 
          right: 20, 
          zIndex: 9999, 
          background: C.danger, 
          color: '#fff', 
          borderRadius: 10, 
          padding: '14px 20px', 
          fontWeight: 700, 
          fontSize: 14, 
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          {actionError}
        </div>
      )}

      {/* Navigation */}
      <nav style={{ background: '#001E5E', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div onClick={() => navigate('home')} style={{ cursor: 'pointer' }}>
              <Logo white size={22} />
            </div>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>| Owner Panel</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => navigate('home')} style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
              Home
            </button>
            <div style={{ background: 'rgba(255,183,0,0.2)', color: '#FFB700', borderRadius: 6, padding: '5px 12px', fontSize: 13, fontWeight: 700 }}>
              {user?.name}
            </div>
            <button onClick={() => { setUser(null); navigate('home'); }} style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
        <div style={{ background: 'linear-gradient(135deg, #001E5E, #003B95)', borderRadius: 14, padding: '24px 28px', color: '#fff', marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Owner Dashboard</h1>
          <p style={{ margin: '6px 0 0', opacity: 0.8 }}>Manage your listings and bookings with instant updates</p>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: C.textLight }}>
            Loading dashboard data...
          </div>
        )}

        {error && (
          <div style={{ background: '#FEF2F2', color: C.danger, borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>
            {error}
          </div>
        )}

        {/* Dashboard Content */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: `1px solid ${C.border}` }}>
          <h2 style={{ margin: '0 0 16px', color: C.text }}>Your Listings ({listings.length})</h2>
          
          {listings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: C.textLight }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🏢</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>No listings yet</div>
              <div style={{ fontSize: 13 }}>Create your first listing to get started</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {listings.map(listing => (
                <div 
                  key={listing.id} 
                  style={{ 
                    border: `1px solid ${C.border}`, 
                    borderRadius: 8, 
                    padding: 16,
                    opacity: listing.isOptimistic ? 0.7 : 1,
                    transition: 'opacity 0.3s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px', color: C.text }}>
                        {listing.title}
                        {listing.isOptimistic && (
                          <span style={{ marginLeft: 8, fontSize: 11, color: C.secondary, fontWeight: 600 }}>
                            (Processing...)
                          </span>
                        )}
                      </h3>
                      <div style={{ fontSize: 13, color: C.textLight, marginBottom: 4 }}>
                        {listing.location}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                        ₹{Number(listing.rentAmount || 0).toLocaleString()}/mo
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <span style={{ 
                          background: listing.status === 'LIVE' ? '#F0FFF4' : '#FFFBEB',
                          color: listing.status === 'LIVE' ? C.success : '#D97706',
                          borderRadius: 20,
                          padding: '4px 10px',
                          fontSize: 12,
                          fontWeight: 700
                        }}>
                          {listing.status}
                        </span>
                      </div>
                    </div>
                    {!listing.isOptimistic && (
                      <button 
                        onClick={() => deleteListing(listing.id)}
                        style={{ 
                          background: '#FEF2F2', 
                          color: C.danger, 
                          border: 'none', 
                          borderRadius: 6, 
                          padding: '6px 12px', 
                          cursor: 'pointer', 
                          fontWeight: 700, 
                          fontSize: 12 
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Booking Requests */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: `1px solid ${C.border}`, marginTop: 16 }}>
          <h2 style={{ margin: '0 0 16px', color: C.text }}>Booking Requests ({bookingRequests.length})</h2>
          
          {bookingRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: C.textLight }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>No booking requests</div>
              <div style={{ fontSize: 13 }}>Incoming requests will appear here</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {bookingRequests.map(request => (
                <div 
                  key={request.id} 
                  style={{ 
                    border: `1px solid ${C.border}`, 
                    borderRadius: 8, 
                    padding: 16 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{request.studentName}</div>
                      <div style={{ fontSize: 13, color: C.textLight }}>
                        {request.listingTitle}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button 
                        onClick={() => acceptBooking(request.id)}
                        style={{ 
                          background: '#F0FFF4', 
                          color: C.success, 
                          border: '1px solid #86EFAC', 
                          borderRadius: 6, 
                          padding: '5px 10px', 
                          fontSize: 12, 
                          fontWeight: 700, 
                          cursor: 'pointer' 
                        }}
                      >
                        ✓ Accept
                      </button>
                      <button 
                        onClick={() => rejectBooking(request.id, 'Not available')}
                        style={{ 
                          background: '#FEF2F2', 
                          color: C.danger, 
                          border: '1px solid #FCA5A5', 
                          borderRadius: 6, 
                          padding: '5px 10px', 
                          fontSize: 12, 
                          fontWeight: 700, 
                          cursor: 'pointer' 
                        }}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
