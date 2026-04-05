import { useState, useEffect, useRef } from 'react';
import { C, BTN } from '../constants/theme';
import { Logo, RoomCard, Footer } from '../components/shared/SharedComponents';
import { apiRequest } from '../services/api';
import { mapListingToRoom } from '../utils/listingMapper';

const FEATURES = [
  { icon: '🤖', title: 'AI Fake Listing Detection', desc: 'Our AI model scans every listing to detect and remove fraudulent room postings, keeping students safe.' },
  { icon: '🪪', title: 'AI Identity Verification', desc: 'Students and owners are verified via AI-powered ID checks ensuring only genuine users on the platform.' },
  { icon: '📅', title: 'Easy Room Booking', desc: 'Book your dream room in just a few clicks with our streamlined booking request system.' },
  { icon: '📢', title: 'Go Online for Owners', desc: 'Room owners near college campuses can list their properties and reach thousands of students instantly.' },
];

export default function HomePage({ navigate, user }) {
  const [search, setSearch] = useState('');
  const [filterLoc, setFilterLoc] = useState('');
  const [filterPrice, setFilterPrice] = useState('');
  const [heroOffset, setHeroOffset] = useState(0);
  const [listings, setListings] = useState([]);
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    const handler = () => setHeroOffset(window.scrollY * 0.4);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiRequest('/api/listings', { query: { size: 6 } }),
      apiRequest('/api/public/testimonials'),
    ])
      .then(([listingPage, feedbacks]) => {
        if (!active) {
          return;
        }
        setListings((listingPage.items || []).map(mapListingToRoom));
        setTestimonials((feedbacks || []).map(item => ({
          text: item.message,
          name: item.displayNameSnapshot,
          role: item.authenticated ? 'Verified User' : 'Guest User',
          rating: item.rating || 5,
          avatar: item.authenticated ? '👤' : '💬',
        })));
      })
      .catch(() => {
        if (active) {
          setListings([]);
          setTestimonials([]);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = listings.filter(r =>
    (search === '' || r.title.toLowerCase().includes(search.toLowerCase()) || r.location.toLowerCase().includes(search.toLowerCase())) &&
    (filterLoc === '' || r.location.includes(filterLoc)) &&
    (filterPrice === '' ||
      (filterPrice === 'low' && r.rent < 7000) ||
      (filterPrice === 'mid' && r.rent >= 7000 && r.rent <= 9000) ||
      (filterPrice === 'high' && r.rent > 9000))
  ).slice(0, 3);

  return (
    <div>
      {/* Navbar */}
      <nav style={{ background: C.primary, padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div onClick={() => navigate('home')}><Logo white /></div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {['Home', 'About Us'].map(l => (
              <button key={l} onClick={() => navigate(l === 'Home' ? 'home' : 'about')}
                style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>{l}</button>
            ))}
            {user ? (
              <>
                <button onClick={() => navigate('explore')} style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.85)' }}>Explore Rooms</button>
                <button onClick={() => navigate(user.role === 'student' ? 'studentDash' : user.role === 'owner' ? 'ownerDash' : 'adminDash')}
                  style={{ ...BTN.accent, padding: '7px 14px' }}>👤 {user.name}</button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('login')} style={{ ...BTN.outline, color: '#fff', borderColor: 'rgba(255,255,255,0.5)', padding: '7px 16px' }}>Login</button>
                <button onClick={() => navigate('signup')} style={{ ...BTN.accent, padding: '7px 16px' }}>Sign Up</button>
                <button onClick={() => navigate('adminLogin')} style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Admin</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(160deg, #001E5E 0%, #003B95 50%, #0071C2 100%)', minHeight: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '60px 24px' }}>
        {[200, 350, 500].map((sz, i) => (
          <div key={i} style={{ position: 'absolute', width: sz, height: sz, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.07)', top: `${20 + i * 15}%`, right: `${5 + i * 8}%`, transform: `translateY(${heroOffset * (0.1 + i * 0.05)}px)`, transition: 'transform 0.1s linear' }} />
        ))}
        <div style={{ textAlign: 'center', maxWidth: 700, position: 'relative', zIndex: 1 }}>
          <div style={{ background: 'rgba(255,183,0,0.15)', display: 'inline-block', borderRadius: 20, padding: '6px 16px', marginBottom: 16 }}>
            <span style={{ color: C.accent, fontWeight: 700, fontSize: 13 }}>🎓 India's #1 Student Room Finder</span>
          </div>
          <h1 style={{ color: '#fff', fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 900, margin: '0 0 16px', lineHeight: 1.15, fontFamily: "'Georgia', serif" }}>
            Find Your Perfect <span style={{ color: C.accent }}>Room</span> Near Campus
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 17, marginBottom: 32, lineHeight: 1.6 }}>
            AI-verified listings, secure bookings, and thousands of student-friendly PGs, hostels & rooms — all in one place.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('explore')} style={{ ...BTN.accent, padding: '13px 32px', fontSize: 16, borderRadius: 10 }}>🔍 Explore Rooms</button>
            <button onClick={() => navigate('signup')} style={{ ...BTN.outline, color: '#fff', borderColor: 'rgba(255,255,255,0.5)', padding: '13px 28px', fontSize: 16, borderRadius: 10 }}>Join Free →</button>
          </div>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
            {['2,400+ Listings', '15,000+ Students', '500+ Owners', 'AI Verified'].map(s => (
              <div key={s} style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 600 }}>✓ {s}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div style={{ background: C.card, padding: '28px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ color: C.text, marginBottom: 16, fontSize: 22, fontWeight: 800 }}>🔎 Find Your Room</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, location, type..."
              style={{ flex: '1 1 260px', padding: '11px 16px', border: `2px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: 'none', color: C.text }} />
            <select value={filterLoc} onChange={e => setFilterLoc(e.target.value)}
              style={{ padding: '11px 14px', border: `2px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, minWidth: 160 }}>
              <option value="">📍 All Locations</option>
              {['Koregaon Park', 'Viman Nagar', 'Baner', 'Aundh', 'Wakad'].map(l => <option key={l}>{l}</option>)}
            </select>
            <select value={filterPrice} onChange={e => setFilterPrice(e.target.value)}
              style={{ padding: '11px 14px', border: `2px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, minWidth: 160 }}>
              <option value="">💰 All Prices</option>
              <option value="low">Under ₹7,000</option>
              <option value="mid">₹7,000 - ₹9,000</option>
              <option value="high">Above ₹9,000</option>
            </select>
            <button onClick={() => navigate('explore')} style={{ ...BTN.primary, padding: '12px 24px' }}>Search</button>
          </div>
        </div>
      </div>

      {/* Featured Rooms */}
      <div style={{ background: C.bg, padding: '40px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ color: C.text, margin: 0, fontSize: 22, fontWeight: 800 }}>✨ Featured Rooms</h2>
            <span style={{ color: C.textLight, fontSize: 13 }}>{filtered.length} results</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginBottom: 24 }}>
            {filtered.map(r => <RoomCard key={r.id} room={r} onClick={() => navigate('explore')} />)}
          </div>
          <div style={{ textAlign: 'center' }}>
            <button onClick={() => navigate('explore')} style={{ ...BTN.primary, padding: '13px 36px', fontSize: 16, borderRadius: 10 }}>Explore All Rooms →</button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ background: C.card, padding: '50px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 style={{ color: C.text, fontSize: 28, fontWeight: 900, margin: 0 }}>Why Choose Stazy?</h2>
            <p style={{ color: C.textLight, marginTop: 8 }}>Cutting-edge features built for student safety and convenience</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ background: C.bg, borderRadius: 14, padding: 24, textAlign: 'center', border: `1px solid ${C.border}`, transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,59,149,0.15)'; e.currentTarget.style.borderColor = C.secondary; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = C.border; }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ color: C.primary, fontWeight: 800, fontSize: 16, margin: '0 0 8px' }}>{f.title}</h3>
                <p style={{ color: C.textLight, fontSize: 13, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div style={{ background: `linear-gradient(135deg, ${C.primary} 0%, #001E5E 100%)`, padding: '50px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 900, margin: 0 }}>What Our Users Say</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {testimonials.map((t, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                  {[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= t.rating ? C.accent : 'rgba(255,255,255,0.2)', fontSize: 16 }}>★</span>)}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 1.6, margin: '0 0 16px', fontStyle: 'italic' }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 28 }}>{t.avatar}</div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: C.accent, padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ color: C.primary, fontSize: 28, fontWeight: 900, margin: '0 0 8px' }}>Ready to Find Your Perfect Stay?</h2>
          <p style={{ color: '#5a4400', marginBottom: 24, fontSize: 15 }}>Join thousands of students who found their ideal accommodation through Stazy</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('signup')} style={{ ...BTN.primary, padding: '13px 32px', fontSize: 16 }}>🎓 Register as Student</button>
            <button onClick={() => navigate('signup')} style={{ background: '#fff', color: C.primary, border: 'none', borderRadius: 8, padding: '13px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>🏠 List Your Room</button>
          </div>
        </div>
      </div>

      <Footer navigate={navigate} />
    </div>
  );
}
