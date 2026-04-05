// ─── MOCK DATA (replace with API calls when backend is ready) ─────────────────

export const ROOMS = [
  {
    id: 1,
    title: 'Sunrise PG for Boys',
    location: 'Koregaon Park, Pune',
    rent: 7500,
    rating: 4.7,
    type: 'PG',
    category: 'Male',
    amenities: ['WiFi', 'AC', 'Meals', 'Laundry', 'CCTV'],
    images: ['🏠', '🛏️', '🚿'],
    verified: true,
    desc: 'Comfortable PG accommodation near top engineering colleges. Spacious rooms with all modern facilities.',
  },
  {
    id: 2,
    title: 'Green Valley Hostel',
    location: 'Viman Nagar, Pune',
    rent: 6200,
    rating: 4.4,
    type: 'Hostel',
    category: 'Both',
    amenities: ['WiFi', 'Meals', 'Gym', 'Study Room'],
    images: ['🏡', '🛋️', '📚'],
    verified: true,
    desc: 'Modern hostel with excellent study environment and community kitchen.',
  },
  {
    id: 3,
    title: 'Girls Only Nest',
    location: 'Baner, Pune',
    rent: 8000,
    rating: 4.9,
    type: 'PG',
    category: 'Female',
    amenities: ['WiFi', 'AC', 'Meals', 'Security', 'Laundry'],
    images: ['🏘️', '🌸', '🪴'],
    verified: true,
    desc: 'Safe and secure accommodation exclusively for female students with 24/7 security.',
  },
  {
    id: 4,
    title: "The Scholar's Den",
    location: 'Hadapsar, Pune',
    rent: 5500,
    rating: 4.2,
    type: 'Room',
    category: 'Male',
    amenities: ['WiFi', 'Parking', 'CCTV'],
    images: ['🏠', '💡', '🔑'],
    verified: false,
    desc: 'Budget-friendly single and double occupancy rooms for students.',
  },
  {
    id: 5,
    title: 'Campus View Residency',
    location: 'Aundh, Pune',
    rent: 9500,
    rating: 4.8,
    type: 'Flat',
    category: 'Both',
    amenities: ['WiFi', 'AC', 'Power Backup', 'Gym', 'Pool'],
    images: ['🏢', '🌊', '💪'],
    verified: true,
    desc: 'Premium shared flats with rooftop access and high-speed internet.',
  },
  {
    id: 6,
    title: 'Cozy Corner PG',
    location: 'Wakad, Pune',
    rent: 6800,
    rating: 4.5,
    type: 'PG',
    category: 'Female',
    amenities: ['WiFi', 'Meals', 'Laundry', 'CCTV'],
    images: ['🏡', '🍽️', '🧺'],
    verified: true,
    desc: 'Home-like atmosphere with nutritious meals and strict no-males policy.',
  },
];

export const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    role: 'Student, COEP',
    rating: 5,
    text: 'Stazy helped me find a verified PG within my budget in just 2 days! The AI verification gave me confidence that the listing was genuine.',
    avatar: '👩‍🎓',
  },
  {
    name: 'Rajesh Patil',
    role: 'PG Owner, Pune',
    rating: 5,
    text: 'Since listing on Stazy, my occupancy rate jumped from 60% to 95%. The platform brings genuine students.',
    avatar: '👨‍💼',
  },
  {
    name: 'Ankit Verma',
    role: 'Student, MIT',
    rating: 4,
    text: 'The AI-powered fake listing detection is a game-changer. I felt safe throughout the booking process.',
    avatar: '👨‍🎓',
  },
];

export const TEAM = [
  { name: 'Arjun Mehta', role: 'CEO & Co-founder', avatar: '👨‍💻' },
  { name: 'Sneha Kulkarni', role: 'CTO & Co-founder', avatar: '👩‍💻' },
  { name: 'Ravi Desai', role: 'AI/ML Engineer', avatar: '🤖' },
  { name: 'Pooja Jain', role: 'UI/UX Designer', avatar: '🎨' },
];

export const MOCK_STUDENTS = [
  { id: 'STU001', name: 'Priya Sharma', email: 'priya@gmail.com', verified: true, status: 'Active' },
  { id: 'STU002', name: 'Ankit Verma', email: 'ankit@gmail.com', verified: false, status: 'Warning' },
  { id: 'STU003', name: 'Neha Patel', email: 'neha@gmail.com', verified: true, status: 'Active' },
];

export const MOCK_OWNERS = [
  { id: 'OWN001', name: 'Rajesh Patil', listing: 'Sunrise PG for Boys', verified: true, listingStatus: 'Live' },
  { id: 'OWN002', name: 'Meera Joshi', listing: 'Girls Only Nest', verified: false, listingStatus: 'Under Review' },
];
