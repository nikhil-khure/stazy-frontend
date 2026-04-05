import { useState, useEffect } from 'react';
import { C, BTN } from '../constants/theme';
import { TESTIMONIALS } from '../data/siteContent';
import { Logo, RoomCard, RatingBadge, VerifiedBadge, CategoryBadge, Tag, StarRating, Footer } from '../components/shared/SharedComponents';
import { apiRequest } from '../services/api';
import { mapListingToRoom } from '../utils/listingMapper';
import { getDashboardPageForUser } from '../utils/dashboardRouting';

const isRemoteVisual = (value) => typeof value === 'string' && /^(https?:|blob:|data:)/i.test(value);

// ─── ROOM DETAIL ──────────────────────────────────────────────────────────────
function RoomDetail({ room, onBack, navigate, user }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Auto-slide effect
  useEffect(() => {
    if (!room.images || room.images.length <= 1) return;
    const timer = setInterval(() => {
      setImgIdx(prev => (prev + 1) % room.images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [room.images]);

  const nextImg = (e) => { e.stopPropagation(); setImgIdx(prev => (prev + 1) % room.images.length); };
  const prevImg = (e) => { e.stopPropagation(); setImgIdx(prev => (prev - 1 + room.images.length) % room.images.length); };
  const currentImage = room.images?.[imgIdx];

  const handleBookRoom = async () => {
    if (!user) {
      navigate('login');
      return;
    }
    if (user.role !== 'student') {
      setBookingMessage('Only student accounts can create booking requests.');
      return;
    }
    if (!user.profileComplete) {
      setBookingMessage('Complete your profile before requesting a room.');
      return;
    }
    if (!user.identityVerified) {
      setBookingMessage('Verify your identity before requesting a room.');
      return;
    }
    setBookingLoading(true);
    setBookingMessage('');
    try {
      await apiRequest(`/api/bookings/listings/${room.id}/requests`, {
        method: 'POST',
        auth: true,
        body: { message: `Booking request for ${room.title}` },
      });
      setBookingMessage('Booking request submitted successfully.');
    } catch (error) {
      setBookingMessage(error.message);
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: C.bg, minHeight: '100vh' }}>
      <div style={{ background: C.primary, padding: '0 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ ...BTN.ghost, color: '#fff', fontSize: 20 }}>←</button>
          <div onClick={() => navigate('home')}><Logo white size={22} /></div>
        </div>
      </div>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
        <div style={{ background: C.card, borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.border}` }}>
          
          {/* Enhanced Carousel */}
          <div style={{ height: 320, background: `linear-gradient(135deg, ${C.primary}22, ${C.secondary}33)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 100, position: 'relative' }}>
            <div style={{ animation: 'fadein 0.5s', width: '100%', height: '100%' }}>
              {isRemoteVisual(currentImage) ? (
                <img src={currentImage} alt={room.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{currentImage}</div>
              )}
            </div>
            
            {room.images.length > 1 && (
              <>
                <button onClick={prevImg} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, fontSize: 20, cursor: 'pointer', zIndex: 10 }}>‹</button>
                <button onClick={nextImg} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, fontSize: 20, cursor: 'pointer', zIndex: 10 }}>›</button>
                <div style={{ position: 'absolute', bottom: 12, display: 'flex', gap: 6 }}>
                  {room.images.map((_, i) => (
                    <div key={i} onClick={() => setImgIdx(i)} style={{ width: i === imgIdx ? 24 : 8, height: 8, borderRadius: 4, background: i === imgIdx ? '#fff' : 'rgba(255,255,255,0.5)', transition: 'all 0.3s', cursor: 'pointer' }} />
                  ))}
                </div>
              </>
            )}
          </div>

          <div style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  {room.verified && <VerifiedBadge />}
                  <CategoryBadge category={room.category} />
                  <Tag color={C.secondary}>{room.type}</Tag>
                </div>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: C.text }}>{room.title}</h1>
                <div style={{ color: C.textLight, marginTop: 6, fontSize: 15 }}>📍 {room.location}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <RatingBadge rating={room.rating} />
                <div style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: C.primary }}>₹{room.rent.toLocaleString()}</span>
                  <span style={{ color: C.textLight, fontSize: 13 }}>/month</span>
                </div>
              </div>
            </div>
            <p style={{ color: C.text, lineHeight: 1.7, marginBottom: 20 }}>{room.desc}</p>
            <h3 style={{ color: C.text, marginBottom: 10 }}>🏷️ Amenities</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {room.amenities.map(a => (
                <div key={a} style={{ background: C.primary + '10', color: C.primary, borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 600 }}>✓ {a}</div>
              ))}
            </div>
            <h3 style={{ color: C.text, marginBottom: 10 }}>💬 Student Reviews</h3>
            {TESTIMONIALS.slice(0, 2).map((t, i) => (
              <div key={i} style={{ background: C.bg, borderRadius: 10, padding: 16, marginBottom: 10, border: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 22 }}>{t.avatar}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                    <StarRating rating={t.rating} size={12} />
                  </div>
                </div>
                <p style={{ color: C.textLight, fontSize: 13, margin: 0 }}>{t.text}</p>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
              <button onClick={handleBookRoom}
                style={{ ...BTN.primary, padding: '13px 28px', fontSize: 15, opacity: bookingLoading ? 0.7 : 1, flex: 1, minWidth: 160 }}>
                {bookingLoading ? 'Submitting...' : user ? '📅 Book Room' : '🔒 Login to Book'}
              </button>
              <button style={{ ...BTN.outline, padding: '13px 22px', fontSize: 14 }}>📤 Share Details</button>
            </div>
            {bookingMessage && <div style={{ marginTop: 14, fontSize: 13, color: bookingMessage.includes('successfully') ? C.success : C.danger }}>{bookingMessage}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── EXPLORE PAGE ─────────────────────────────────────────────────────────────
export default function ExplorePage({ navigate, user }) {
  const [filters, setFilters] = useState({ price: '', type: '', rating: '', cat: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [rooms, setRooms] = useState([]);
  const PER_PAGE = 4;

  useEffect(() => {
    let active = true;
    apiRequest('/api/listings', { query: { size: 60 } })
      .then(pageData => {
        if (active) {
          setRooms((pageData.items || []).map(mapListingToRoom));
        }
      })
      .catch(() => {
        if (active) {
          setRooms([]);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = rooms.filter(r => {
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.location.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.type && r.type !== filters.type) return false;
    if (filters.cat && r.category !== filters.cat) return false;
    if (filters.rating && r.rating < parseFloat(filters.rating)) return false;
    if (filters.price === 'low' && r.rent >= 7000) return false;
    if (filters.price === 'mid' && (r.rent < 7000 || r.rent > 9000)) return false;
    if (filters.price === 'high' && r.rent <= 9000) return false;
    return true;
  });

  const pages = Math.ceil(filtered.length / PER_PAGE);
  const shown = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (selected) return <RoomDetail room={selected} onBack={() => setSelected(null)} navigate={navigate} user={user} />;

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: C.bg, minHeight: '100vh' }}>
      <nav style={{ background: C.primary, padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div onClick={() => navigate('home')}><Logo white /></div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => navigate('home')} style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.85)' }}>Home</button>
            <button style={{ ...BTN.accent, padding: '7px 14px', fontSize: 13 }}>🔍 Explore Rooms</button>
            {user ? (
              <>
                <button onClick={() => navigate(getDashboardPageForUser(user) || 'home')}
                  style={{ ...BTN.outline, color: '#fff', borderColor: 'rgba(255,255,255,0.4)', padding: '7px 14px', fontSize: 13 }}>← Return to Dashboard</button>
                <button onClick={() => navigate(getDashboardPageForUser(user) || 'home')}
                  style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.85)' }}>👤 {user.name}</button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('login')} style={{ ...BTN.outline, color: '#fff', borderColor: 'rgba(255,255,255,0.4)', padding: '7px 14px' }}>Login</button>
                <button onClick={() => navigate('signup')} style={{ ...BTN.accent, padding: '7px 14px' }}>Sign Up</button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div style={{ background: 'linear-gradient(135deg, #003B95, #0071C2)', color: '#fff', padding: '28px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>🏠 Explore Available Rooms</h1>
          <p style={{ margin: '8px 0 0', opacity: 0.8 }}>Find the perfect room for your stay</p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px', display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Sidebar Filters */}
        <div style={{ background: C.card, borderRadius: 12, padding: 20, width: 220, flexShrink: 0, border: `1px solid ${C.border}`, position: 'sticky', top: 76 }}>
          <h3 style={{ margin: '0 0 16px', color: C.text, fontWeight: 800 }}>🎛️ Filters</h3>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search rooms..."
            style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, marginBottom: 12, boxSizing: 'border-box', outline: 'none' }} />
          {[
            ['Price Range', 'price', [['', 'All Prices'], ['low', 'Under ₹7K'], ['mid', '₹7K – ₹9K'], ['high', 'Above ₹9K']]],
            ['Room Type', 'type', [['', 'All Types'], ['PG', 'PG'], ['Hostel', 'Hostel'], ['Room', 'Room'], ['Flat', 'Flat']]],
            ['Min Rating', 'rating', [['', 'All'], ['4', '4+'], ['4.5', '4.5+'], ['4.8', '4.8+']]],
            ['Category', 'cat', [['', 'All'], ['Male', 'Male ♂'], ['Female', 'Female ♀'], ['Both', 'Both ⚤']]],
          ].map(([label, key, options]) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 6, textTransform: 'uppercase' }}>{label}</label>
              <select value={filters[key]} onChange={e => { setFilters(p => ({ ...p, [key]: e.target.value })); setPage(1); }}
                style={{ width: '100%', padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, outline: 'none' }}>
                {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          ))}
          <button onClick={() => { setFilters({ price: '', type: '', rating: '', cat: '' }); setSearch(''); setPage(1); }}
            style={{ ...BTN.outline, width: '100%', fontSize: 13, padding: '8px 0' }}>Reset Filters</button>
        </div>

        {/* Room Grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ color: C.textLight, fontSize: 14 }}><b style={{ color: C.text }}>{filtered.length}</b> rooms found</span>
          </div>
          {shown.length === 0 ? (
            <div style={{ background: C.card, borderRadius: 12, padding: 40, textAlign: 'center', border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <div style={{ color: C.text, fontWeight: 700 }}>No rooms match your filters</div>
              <div style={{ color: C.textLight, fontSize: 13, marginTop: 4 }}>Try adjusting your search criteria</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 18 }}>
              {shown.map(r => <RoomCard key={r.id} room={r} onClick={setSelected} />)}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28, alignItems: 'center' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ ...BTN.outline, padding: '8px 16px', opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
              {Array.from({ length: pages }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, background: page === n ? C.primary : C.card, color: page === n ? '#fff' : C.text, border: `1px solid ${page === n ? C.primary : C.border}` }}>{n}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                style={{ ...BTN.outline, padding: '8px 16px', opacity: page === pages ? 0.4 : 1 }}>Next →</button>
            </div>
          )}

          <div style={{ background: 'linear-gradient(135deg, #003B95, #0071C2)', borderRadius: 14, padding: 28, textAlign: 'center', marginTop: 32, color: '#fff' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>Can't find what you need?</h3>
            <p style={{ margin: '0 0 16px', opacity: 0.8, fontSize: 14 }}>Create a free account and get personalized recommendations</p>
            <button onClick={() => navigate('signup')} style={{ ...BTN.accent, padding: '11px 28px', fontSize: 15 }}>Join Stazy Free →</button>
          </div>
        </div>
      </div>
      <Footer navigate={navigate} />
    </div>
  );
}
