import { useState } from 'react';
import { C, BTN } from '../../constants/theme';

const isRemoteVisual = (value) => typeof value === 'string' && /^(https?:|blob:|data:)/i.test(value);

// ─── LOGO ─────────────────────────────────────────────────────────────────────
export function Logo({ size = 28, white = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
      <div style={{
        width: size + 4, height: size + 4, borderRadius: '50%',
        background: white ? 'rgba(255,255,255,0.2)' : C.gradient,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.55,
        border: white ? '2px solid rgba(255,255,255,0.5)' : 'none',
      }}>🏠</div>
      <span style={{
        fontSize: size * 0.85, fontWeight: 900, letterSpacing: -0.5,
        color: white ? '#fff' : C.primary,
        fontFamily: "'Georgia', serif",
      }}>
        Stay<span style={{ color: C.accent }}>zy</span>
      </span>
    </div>
  );
}

// ─── STAR RATING ──────────────────────────────────────────────────────────────
export function StarRating({ rating, size = 14 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} style={{ fontSize: size, color: s <= Math.round(rating) ? C.accent : '#D1D5DB' }}>★</span>
      ))}
      <span style={{ fontSize: size - 1, color: C.textLight, marginLeft: 2 }}>{rating}</span>
    </div>
  );
}

// ─── RATING BADGE ─────────────────────────────────────────────────────────────
export function RatingBadge({ rating }) {
  const color = rating >= 4.5 ? '#00875A' : rating >= 4 ? '#0071C2' : '#F59E0B';
  const label = rating >= 4.5 ? 'Exceptional' : rating >= 4 ? 'Very Good' : 'Good';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        background: color, color: '#fff',
        borderRadius: '6px 6px 6px 0',
        padding: '4px 8px', fontWeight: 800, fontSize: 14, minWidth: 38, textAlign: 'center',
      }}>{rating}</div>
      <span style={{ fontSize: 12, color: C.textLight, fontWeight: 600 }}>{label}</span>
    </div>
  );
}

// ─── TAG ──────────────────────────────────────────────────────────────────────
export function Tag({ children, color = C.primary }) {
  return (
    <span style={{
      background: color + '15', color,
      borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700,
    }}>{children}</span>
  );
}

// ─── CATEGORY BADGE ───────────────────────────────────────────────────────────
export function CategoryBadge({ category }) {
  const cfg = { Male: ['#0071C2', '♂'], Female: ['#E91E8C', '♀'], Both: ['#6B21A8', '⚤'] };
  const [clr, icon] = cfg[category] || [C.textLight, '?'];
  return <Tag color={clr}>{icon} {category}</Tag>;
}

// ─── VERIFIED BADGE ───────────────────────────────────────────────────────────
export function VerifiedBadge() {
  return (
    <div style={{
      background: '#00875A', color: '#fff',
      borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700,
      display: 'flex', alignItems: 'center', gap: 3,
    }}>✓ Verified</div>
  );
}

// ─── ROOM CARD ────────────────────────────────────────────────────────────────
export function RoomCard({ room, onClick }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const currentImage = room.images?.[imgIdx];

  useState(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick && onClick(room)}
      style={{
        background: C.card, borderRadius: isMobile ? 12 : 14, overflow: 'hidden',
        boxShadow: hovered ? '0 12px 40px rgba(0,59,149,0.18)' : '0 2px 12px rgba(0,0,0,0.08)',
        transition: 'all 0.25s', cursor: 'pointer',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        border: `1px solid ${C.border}`,
      }}
    >
      {/* Image Carousel */}
      <div style={{
        position: 'relative', height: isMobile ? 160 : 180,
        background: `linear-gradient(135deg, ${C.primary}22, ${C.secondary}33)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isRemoteVisual(currentImage) ? (
          <img src={currentImage} alt={room.title} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }} />
        ) : (
          <span style={{ fontSize: isMobile ? 48 : 64 }}>{currentImage}</span>
        )}

        {room.images.length > 1 && (
          <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 4 }}>
            {room.images.map((_, i) => (
              <div key={i}
                onClick={e => { e.stopPropagation(); setImgIdx(i); }}
                style={{
                  width: i === imgIdx ? 18 : 6, height: 6, borderRadius: 3,
                  background: i === imgIdx ? '#fff' : 'rgba(255,255,255,0.5)',
                  transition: 'all 0.2s', cursor: 'pointer',
                }}
              />
            ))}
          </div>
        )}

        {room.images.length > 1 && (
          <>
            <button onClick={e => { e.stopPropagation(); setImgIdx(i => (i - 1 + room.images.length) % room.images.length); }}
              style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.35)', color: '#fff', border: 'none', borderRadius: '50%', width: isMobile ? 24 : 26, height: isMobile ? 24 : 26, fontSize: isMobile ? 11 : 12 }}>‹</button>
            <button onClick={e => { e.stopPropagation(); setImgIdx(i => (i + 1) % room.images.length); }}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.35)', color: '#fff', border: 'none', borderRadius: '50%', width: isMobile ? 24 : 26, height: isMobile ? 24 : 26, fontSize: isMobile ? 11 : 12 }}>›</button>
          </>
        )}

        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {room.verified && <VerifiedBadge />}
        </div>
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <CategoryBadge category={room.category} />
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: isMobile ? '12px 14px' : '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <h3 style={{ margin: 0, fontSize: isMobile ? 14 : 15, fontWeight: 800, color: C.text, lineHeight: 1.3 }}>{room.title}</h3>
          <RatingBadge rating={room.rating} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8, color: C.textLight, fontSize: isMobile ? 12 : 13 }}>
          <span>📍</span><span>{room.location}</span>
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
          <Tag color={C.secondary}>{room.type}</Tag>
          {room.amenities.slice(0, isMobile ? 2 : 3).map(a => <Tag key={a} color={C.textLight}>{a}</Tag>)}
          {room.amenities.length > (isMobile ? 2 : 3) && <Tag color={C.textLight}>+{room.amenities.length - (isMobile ? 2 : 3)}</Tag>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
          <div>
            <span style={{ fontSize: isMobile ? 18 : 20, fontWeight: 900, color: C.primary }}>₹{room.rent.toLocaleString()}</span>
            <span style={{ fontSize: isMobile ? 11 : 12, color: C.textLight }}>/month</span>
          </div>
          <button style={{ ...BTN.accent, padding: isMobile ? '6px 12px' : '7px 14px', fontSize: isMobile ? 12 : 13 }}>View Details</button>
        </div>
      </div>
    </div>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
export function Footer({ navigate, contactDetails }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useState(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const email = contactDetails?.email || 'support@stazy.in';
  const mobile = contactDetails?.mobileNumber || '+91 98765 43210';
  const city = contactDetails?.city || 'Pune, Maharashtra';
  return (
    <footer style={{ background: C.primary, color: '#fff', padding: isMobile ? '24px 0 12px' : '32px 0 16px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '0 16px' : '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: isMobile ? 16 : 24, marginBottom: isMobile ? 16 : 24 }}>
          <div>
            <Logo white size={isMobile ? 20 : 22} />
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: isMobile ? 12 : 13, marginTop: 10, lineHeight: 1.6 }}>
              AI-powered room finder for students. Safe, verified, affordable.
            </p>
          </div>
          <div>
            <h4 style={{ margin: '0 0 12px', color: C.accent, fontSize: isMobile ? 13 : 14 }}>Quick Links</h4>
            {[['Home', 'home'], ['About Us', 'about'], ['Explore Rooms', 'explore']].map(([l, key]) => (
              <div key={key} onClick={() => navigate(key)}
                style={{ color: 'rgba(255,255,255,0.75)', fontSize: isMobile ? 12 : 13, marginBottom: 6, cursor: 'pointer' }}
                onMouseEnter={e => e.target.style.color = '#fff'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.75)'}
              >{l}</div>
            ))}
          </div>
          <div>
            <h4 style={{ margin: '0 0 12px', color: C.accent, fontSize: isMobile ? 13 : 14 }}>Contact Us</h4>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: isMobile ? 12 : 13, margin: 0 }}>
              📧 {contactDetails?.email || 'superadmin@stazy.com'}<br />
              📞 {contactDetails?.mobileNumber || '9999999999'}
            </p>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: isMobile ? 12 : 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: isMobile ? 11 : 12 }}>© 2025 Stazy. All rights reserved.</span>
          <button onClick={() => navigate('home')} style={{ ...BTN.accent, padding: isMobile ? '5px 14px' : '6px 16px', fontSize: isMobile ? 11 : 12 }}>↑ Return to Home</button>
        </div>
      </div>
    </footer>
  );
}

// ─── MINI FOOTER ──────────────────────────────────────────────────────────────
export function MiniFooter({ navigate }) {
  return (
    <footer style={{ background: C.primary, padding: '16px 24px', textAlign: 'center' }}>
      <button onClick={() => navigate('home')} style={{ ...BTN.accent, padding: '7px 16px', fontSize: 13 }}>↑ Return to Home</button>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 8 }}>© 2025 Stazy</div>
    </footer>
  );
}
