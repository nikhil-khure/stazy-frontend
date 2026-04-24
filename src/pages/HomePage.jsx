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

// Mobile responsive helper
const isMobile = () => window.innerWidth <= 768;

export default function HomePage({ navigate, user }) {
  const [search, setSearch] = useState('');
  const [filterLoc, setFilterLoc] = useState('');
  const [filterPrice, setFilterPrice] = useState('');
  const [heroOffset, setHeroOffset] = useState(0);
  const [listings, setListings] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [ownerTestimonials, setOwnerTestimonials] = useState([]);
  const [studentTestimonials, setStudentTestimonials] = useState([]);
  const [cities, setCities] = useState([]);
  const [contactDetails, setContactDetails] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const marqueeRef = useRef(null);
  const trackRef = useRef(null);
  const studentMarqueeRef = useRef(null);
  const studentTrackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isStudentDragging, setIsStudentDragging] = useState(false);
  const [studentStartX, setStudentStartX] = useState(0);
  const [studentScrollLeft, setStudentScrollLeft] = useState(0);

  // Responsive styles
  const mobile = windowWidth <= 768;
  const heroStyle = {
    background: 'linear-gradient(160deg, #001E5E 0%, #003B95 50%, #0071C2 100%)',
    minHeight: mobile ? 360 : 480,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: mobile ? '40px 16px' : '60px 24px'
  };

  const navStyle = {
    background: C.primary,
    padding: mobile ? '0 12px' : '0 24px',
    position: 'sticky',
    top: 0,
    zIndex: 100
  };

  const sectionPadding = mobile ? '24px 16px' : '40px 24px';
  const largeSectionPadding = mobile ? '32px 16px' : '50px 24px';

  const handleMouseDown = (e) => {
    if (!marqueeRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - marqueeRef.current.offsetLeft);
    setScrollLeft(marqueeRef.current.scrollLeft);
    if (trackRef.current) {
      trackRef.current.style.animationPlayState = 'paused';
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !marqueeRef.current) return;
    e.preventDefault();
    const x = e.pageX - marqueeRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    marqueeRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (trackRef.current) {
      trackRef.current.style.animationPlayState = 'running';
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      if (trackRef.current) {
        trackRef.current.style.animationPlayState = 'running';
      }
    }
  };

  const handleStudentMouseDown = (e) => {
    if (!studentMarqueeRef.current) return;
    setIsStudentDragging(true);
    setStudentStartX(e.pageX - studentMarqueeRef.current.offsetLeft);
    setStudentScrollLeft(studentMarqueeRef.current.scrollLeft);
    if (studentTrackRef.current) {
      studentTrackRef.current.style.animationPlayState = 'paused';
    }
  };

  const handleStudentMouseMove = (e) => {
    if (!isStudentDragging || !studentMarqueeRef.current) return;
    e.preventDefault();
    const x = e.pageX - studentMarqueeRef.current.offsetLeft;
    const walk = (x - studentStartX) * 1.5;
    studentMarqueeRef.current.scrollLeft = studentScrollLeft - walk;
  };

  const handleStudentMouseUp = () => {
    setIsStudentDragging(false);
    if (studentTrackRef.current) {
      studentTrackRef.current.style.animationPlayState = 'running';
    }
  };

  const handleStudentMouseLeave = () => {
    if (isStudentDragging) {
      setIsStudentDragging(false);
      if (studentTrackRef.current) {
        studentTrackRef.current.style.animationPlayState = 'running';
      }
    }
  };

  useEffect(() => {
    const handler = () => setHeroOffset(window.scrollY * 0.4);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiRequest('/api/listings', { query: { size: 6 } }),
      apiRequest('/api/public/testimonials'),
      apiRequest('/api/public/cities'),
      apiRequest('/api/public/contact-details'),
    ])
      .then(([listingPage, feedbacks, cityOptions, liveContactDetails]) => {
        if (!active) {
          return;
        }
        setListings((listingPage.items || []).map(mapListingToRoom));
        
        const allTestimonials = (feedbacks || []).map(item => ({
          text: item.message,
          name: item.displayName || item.displayNameSnapshot,
          role: item.authenticated ? 'Verified User' : 'Guest User',
          rating: item.rating || 5,
          avatar: item.authenticated ? '👤' : '💬',
          profilePhotoUrl: item.profilePhotoUrl || null,
          location: item.location || null,
          userRole: item.userRole || null,
        }));
        
        setTestimonials(allTestimonials);
        setOwnerTestimonials(allTestimonials.filter(t => t.userRole === 'OWNER'));
        setStudentTestimonials(allTestimonials.filter(t => t.userRole === 'STUDENT'));
        
        setCities(cityOptions || []);
        setContactDetails(liveContactDetails || null);
      })
      .catch(() => {
        if (active) {
          setListings([]);
          setTestimonials([]);
          setCities([]);
          setContactDetails(null);
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
      <nav style={navStyle}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: mobile ? 56 : 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div onClick={() => navigate('home')}><Logo white /></div>
          <div style={{ display: 'flex', gap: mobile ? 4 : 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {!mobile && ['Home', 'About Us'].map(l => (
              <button key={l} onClick={() => navigate(l === 'Home' ? 'home' : 'about')}
                style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>{l}</button>
            ))}
            {user ? (
              <>
                {!mobile && <button onClick={() => navigate('explore')} style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.85)' }}>Explore Rooms</button>}
                <button onClick={() => navigate(user.role === 'student' ? 'studentDash' : user.role === 'owner' ? 'ownerDash' : 'adminDash')}
                  style={{ ...BTN.accent, padding: mobile ? '6px 10px' : '7px 14px', fontSize: mobile ? 13 : 14 }}>👤 {mobile ? user.name.split(' ')[0] : user.name}</button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('login')} style={{ ...BTN.outline, color: '#fff', borderColor: 'rgba(255,255,255,0.5)', padding: mobile ? '6px 12px' : '7px 16px', fontSize: mobile ? 13 : 14 }}>Login</button>
                <button onClick={() => navigate('signup')} style={{ ...BTN.accent, padding: mobile ? '6px 12px' : '7px 16px', fontSize: mobile ? 13 : 14 }}>Sign Up</button>
                <button onClick={() => navigate('adminLogin')} style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.6)', fontSize: mobile ? 11 : 12 }}>Admin</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="home-hero-animate" style={heroStyle}>
        {!mobile && [200, 350, 500].map((sz, i) => (
          <div key={i} style={{ position: 'absolute', width: sz, height: sz, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.07)', top: `${20 + i * 15}%`, right: `${5 + i * 8}%`, transform: `translateY(${heroOffset * (0.1 + i * 0.05)}px)`, transition: 'transform 0.1s linear' }} />
        ))}
        <div style={{ textAlign: 'center', maxWidth: mobile ? '100%' : 700, position: 'relative', zIndex: 1 }}>
          <div style={{ background: 'rgba(255,183,0,0.15)', display: 'inline-block', borderRadius: 20, padding: mobile ? '4px 12px' : '6px 16px', marginBottom: mobile ? 12 : 16 }}>
            <span style={{ color: C.accent, fontWeight: 700, fontSize: mobile ? 11 : 13 }}>🎓 India's #1 Student Room Finder</span>
          </div>
          <h1 style={{ color: '#fff', fontSize: 'clamp(24px, 6vw, 52px)', fontWeight: 900, margin: '0 0 16px', lineHeight: 1.15, fontFamily: "'Georgia', serif" }}>
            Find Your Perfect <span style={{ color: C.accent }}>Room</span> Near Campus
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: mobile ? 14 : 17, marginBottom: mobile ? 24 : 32, lineHeight: 1.6 }}>
            AI-verified listings, secure bookings, and thousands of student-friendly PGs, hostels & rooms — all in one place.
          </p>
          <div style={{ display: 'flex', gap: mobile ? 8 : 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('explore')} style={{ ...BTN.accent, padding: mobile ? '11px 24px' : '13px 32px', fontSize: mobile ? 14 : 16, borderRadius: 10 }}>🔍 Explore Rooms</button>
            <button onClick={() => navigate('signup')} style={{ ...BTN.outline, color: '#fff', borderColor: 'rgba(255,255,255,0.5)', padding: mobile ? '11px 20px' : '13px 28px', fontSize: mobile ? 14 : 16, borderRadius: 10 }}>Join Free →</button>
          </div>
          <div style={{ display: 'flex', gap: mobile ? 12 : 24, justifyContent: 'center', marginTop: mobile ? 20 : 28, flexWrap: 'wrap' }}>
            {['2,400+ Listings', '15,000+ Students', '500+ Owners', 'AI Verified'].map(s => (
              <div key={s} style={{ color: 'rgba(255,255,255,0.75)', fontSize: mobile ? 11 : 13, fontWeight: 600 }}>✓ {s}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="home-section-animate" style={{ background: C.card, padding: mobile ? '20px 16px' : '28px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ color: C.text, marginBottom: mobile ? 12 : 16, fontSize: mobile ? 18 : 22, fontWeight: 800 }}>🔎 Find Your Room</h2>
          <div style={{ display: 'flex', gap: mobile ? 8 : 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, location, type..."
              style={{ flex: '1 1 200px', padding: mobile ? '10px 12px' : '11px 16px', border: `2px solid ${C.border}`, borderRadius: 8, fontSize: mobile ? 13 : 14, outline: 'none', color: C.text }} />
            <select value={filterLoc} onChange={e => setFilterLoc(e.target.value)}
              style={{ padding: mobile ? '10px 12px' : '11px 14px', border: `2px solid ${C.border}`, borderRadius: 8, fontSize: mobile ? 13 : 14, color: C.text, minWidth: mobile ? 140 : 160 }}>
              <option value="">📍 All Locations</option>
              {cities.map(city => <option key={city.cityId} value={city.cityName}>{city.cityName}</option>)}
            </select>
            <select value={filterPrice} onChange={e => setFilterPrice(e.target.value)}
              style={{ padding: mobile ? '10px 12px' : '11px 14px', border: `2px solid ${C.border}`, borderRadius: 8, fontSize: mobile ? 13 : 14, color: C.text, minWidth: mobile ? 140 : 160 }}>
              <option value="">💰 All Prices</option>
              <option value="low">Under ₹7,000</option>
              <option value="mid">₹7,000 - ₹9,000</option>
              <option value="high">Above ₹9,000</option>
            </select>
            <button onClick={() => navigate('explore', { searchQuery: search })} style={{ ...BTN.primary, padding: mobile ? '10px 20px' : '12px 24px', fontSize: mobile ? 13 : 14 }}>Search</button>
          </div>
        </div>
      </div>

      {/* Featured Rooms */}
      <div className="home-section-animate" style={{ background: C.bg, padding: sectionPadding }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: mobile ? 16 : 24 }}>
            <h2 style={{ color: C.text, margin: 0, fontSize: mobile ? 18 : 22, fontWeight: 800 }}>✨ Featured Rooms</h2>
            <span style={{ color: C.textLight, fontSize: mobile ? 11 : 13 }}>{filtered.length} results</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: mobile ? 16 : 20, marginBottom: mobile ? 16 : 24 }}>
            {filtered.map(r => <RoomCard key={r.id} room={r} onClick={() => navigate('explore')} />)}
          </div>
          <div style={{ textAlign: 'center' }}>
            <button onClick={() => navigate('explore')} style={{ ...BTN.primary, padding: mobile ? '11px 28px' : '13px 36px', fontSize: mobile ? 14 : 16, borderRadius: 10 }}>Explore All Rooms →</button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="home-section-animate" style={{ background: C.card, padding: largeSectionPadding }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: mobile ? 24 : 36 }}>
            <h2 style={{ color: C.text, fontSize: mobile ? 22 : 28, fontWeight: 900, margin: 0 }}>Why Choose Stazy?</h2>
            <p style={{ color: C.textLight, marginTop: 8, fontSize: mobile ? 13 : 14 }}>Cutting-edge features built for student safety and convenience</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(4, 1fr)', gap: mobile ? 16 : 24, maxWidth: mobile ? '100%' : 1100, margin: '0 auto' }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="home-card-animate" style={{ background: C.bg, borderRadius: 14, padding: mobile ? 20 : 24, textAlign: 'center', border: `1px solid ${C.border}`, transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,59,149,0.15)'; e.currentTarget.style.borderColor = C.secondary; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = C.border; }}>
                <div style={{ fontSize: mobile ? 32 : 40, marginBottom: mobile ? 8 : 12 }}>{f.icon}</div>
                <h3 style={{ color: C.primary, fontWeight: 800, fontSize: mobile ? 14 : 16, margin: '0 0 8px' }}>{f.title}</h3>
                <p style={{ color: C.textLight, fontSize: mobile ? 12 : 13, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Owner Testimonials */}
      <div className="home-section-animate" style={{ background: `linear-gradient(135deg, ${C.primary} 0%, #001E5E 100%)`, padding: mobile ? '32px 16px 20px' : '50px 24px 30px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: mobile ? 24 : 36 }}>
            <h2 style={{ color: '#fff', fontSize: mobile ? 22 : 28, fontWeight: 900, margin: 0 }}>What Our Owners Say</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 8, fontSize: mobile ? 12 : 14 }}>Property owners share their experience</p>
          </div>
          <div 
            ref={marqueeRef}
            className="testimonial-marquee-container"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
          >
            <div ref={trackRef} className="testimonial-marquee-track">
              {[...ownerTestimonials, ...ownerTestimonials, ...ownerTestimonials].map((t, i) => (
                <div key={i} className="testimonial-card" style={{ background: '#fff', borderRadius: 14, padding: mobile ? 16 : 20, border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 30, 94, 0.1)', transition: isDragging ? 'none' : 'all 0.3s ease' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                    {t.profilePhotoUrl ? (
                      <img 
                        src={t.profilePhotoUrl} 
                        alt={t.name} 
                        draggable="false"
                        style={{ 
                          width: mobile ? 36 : 40, 
                          height: mobile ? 36 : 40, 
                          borderRadius: '50%', 
                          objectFit: 'cover', 
                          border: `2px solid ${C.border}` 
                        }} 
                      />
                    ) : (
                      <div style={{ 
                        width: mobile ? 36 : 40, 
                        height: mobile ? 36 : 40, 
                        borderRadius: '50%', 
                        background: C.primary + '20', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: mobile ? 16 : 18, 
                        fontWeight: 700, 
                        color: C.primary, 
                        border: `2px solid ${C.border}` 
                      }}>
                        {(t.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 800, fontSize: mobile ? 13 : 15, color: C.text }}>{t.name}</div>
                      <div style={{ color: C.textLight, fontSize: mobile ? 10 : 12 }}>{t.location || t.role || '-'} {t.userRole ? `(${t.userRole === 'OWNER' ? 'Owner' : t.userRole === 'STUDENT' ? 'Student' : t.userRole})` : ''}</div>
                    </div>
                  </div>
                  <div style={{ color: '#FFB700', fontSize: mobile ? 14 : 16, marginBottom: 8 }}>
                    {'★'.repeat(t.rating || 0)}{'☆'.repeat(5 - (t.rating || 0))}
                  </div>
                  <div style={{ color: C.text, fontSize: mobile ? 12 : 13, lineHeight: 1.6 }}>
                    {t.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Student Testimonials */}
      <div className="home-section-animate" style={{ background: `linear-gradient(135deg, #001E5E 0%, ${C.primary} 100%)`, padding: mobile ? '20px 16px 32px' : '30px 24px 50px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: mobile ? 24 : 36 }}>
            <h2 style={{ color: '#fff', fontSize: mobile ? 22 : 28, fontWeight: 900, margin: 0 }}>What Our Students Say</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 8, fontSize: mobile ? 12 : 14 }}>Students share their room finding journey</p>
          </div>
          <div 
            ref={studentMarqueeRef}
            className="testimonial-marquee-container"
            onMouseDown={handleStudentMouseDown}
            onMouseMove={handleStudentMouseMove}
            onMouseUp={handleStudentMouseUp}
            onMouseLeave={handleStudentMouseLeave}
            style={{ cursor: isStudentDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
          >
            <div ref={studentTrackRef} className="testimonial-marquee-track testimonial-marquee-reverse">
              {[...studentTestimonials, ...studentTestimonials, ...studentTestimonials].map((t, i) => (
                <div key={i} className="testimonial-card" style={{ background: '#fff', borderRadius: 14, padding: mobile ? 16 : 20, border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 30, 94, 0.1)', transition: isStudentDragging ? 'none' : 'all 0.3s ease' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                    {t.profilePhotoUrl ? (
                      <img 
                        src={t.profilePhotoUrl} 
                        alt={t.name} 
                        draggable="false"
                        style={{ 
                          width: mobile ? 36 : 40, 
                          height: mobile ? 36 : 40, 
                          borderRadius: '50%', 
                          objectFit: 'cover', 
                          border: `2px solid ${C.border}` 
                        }} 
                      />
                    ) : (
                      <div style={{ 
                        width: mobile ? 36 : 40, 
                        height: mobile ? 36 : 40, 
                        borderRadius: '50%', 
                        background: C.secondary + '20', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: mobile ? 16 : 18, 
                        fontWeight: 700, 
                        color: C.secondary, 
                        border: `2px solid ${C.border}` 
                      }}>
                        {(t.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 800, fontSize: mobile ? 13 : 15, color: C.text }}>{t.name}</div>
                      <div style={{ color: C.textLight, fontSize: mobile ? 10 : 12 }}>{t.location || t.role || '-'} {t.userRole ? `(${t.userRole === 'OWNER' ? 'Owner' : t.userRole === 'STUDENT' ? 'Student' : t.userRole})` : ''}</div>
                    </div>
                  </div>
                  <div style={{ color: '#FFB700', fontSize: mobile ? 14 : 16, marginBottom: 8 }}>
                    {'★'.repeat(t.rating || 0)}{'☆'.repeat(5 - (t.rating || 0))}
                  </div>
                  <div style={{ color: C.text, fontSize: mobile ? 12 : 13, lineHeight: 1.6 }}>
                    {t.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="home-section-animate" style={{ background: C.accent, padding: sectionPadding, textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ color: C.primary, fontSize: mobile ? 22 : 28, fontWeight: 900, margin: '0 0 8px' }}>Ready to Find Your Perfect Stay?</h2>
          <p style={{ color: '#5a4400', marginBottom: mobile ? 20 : 24, fontSize: mobile ? 13 : 15 }}>Join thousands of students who found their ideal accommodation through Stazy</p>
          <div style={{ display: 'flex', gap: mobile ? 8 : 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('signup')} style={{ ...BTN.primary, padding: mobile ? '11px 24px' : '13px 32px', fontSize: mobile ? 14 : 16 }}>🎓 Register as Student</button>
            <button onClick={() => navigate('signup')} style={{ background: '#fff', color: C.primary, border: 'none', borderRadius: 8, padding: mobile ? '11px 24px' : '13px 32px', fontSize: mobile ? 14 : 16, fontWeight: 700, cursor: 'pointer' }}>🏠 List Your Room</button>
          </div>
        </div>
      </div>

      <Footer navigate={navigate} contactDetails={contactDetails} />
    </div>
  );
}
