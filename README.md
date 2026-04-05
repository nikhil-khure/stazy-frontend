# 🏠 Stazy - Stay Easy
**AI-Powered Room Finder for Students**

---

## 📋 Project Overview
Stazy is a next-generation room finder platform built exclusively for students. It features AI-powered identity verification, fake listing detection, and seamless room booking near college campuses.

**Tech Stack:**
- Frontend: React.js (this project)
- Backend: Java Spring Boot *(coming soon)*
- Database: PostgreSQL *(coming soon)*
- Deployment: Render Cloud *(coming soon)*

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

The app will run at `http://localhost:3000`

---

## 📁 Project Structure
```
stazy/
├── public/
│   └── index.html
├── src/
│   ├── constants/
│   │   └── theme.js          # Colors, button styles
│   ├── data/
│   │   └── mockData.js       # Mock data (replace with API calls)
│   ├── components/
│   │   └── shared/
│   │       └── SharedComponents.jsx  # Logo, RoomCard, Footer, etc.
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── AuthPages.jsx     # Login, Signup, AdminLogin, About
│   │   ├── ExplorePage.jsx   # Explore rooms + Room detail
│   │   ├── StudentDashboard.jsx
│   │   ├── OwnerDashboard.jsx
│   │   └── AdminDashboard.jsx
│   ├── App.jsx               # Main router
│   ├── index.js
│   └── index.css
└── package.json
```

---

## 🎯 Pages

| Page | Route Key | Description |
|------|-----------|-------------|
| Home | `home` | Landing page with hero, search, featured rooms |
| About Us | `about` | Team, mission, contact form |
| Login | `login` | Student / Owner login with OAuth |
| Sign Up | `signup` | Student / Owner registration |
| Admin Login | `adminLogin` | Secret-code protected admin access |
| Explore Rooms | `explore` | Filterable room listing with pagination |
| Room Detail | *(from explore)* | Full room info, booking button |
| Student Dashboard | `studentDash` | Bookings, profile, verify, feedback |
| Owner Dashboard | `ownerDash` | Listing mgmt, booking mgmt, complaints |
| Admin Dashboard | `adminDash` | Student & owner management panel |

---

## 🔌 Connecting the Backend (Spring Boot)

When the backend is ready, replace mock data calls with API calls. Look for the comment:
```js
// Replace with API call when backend is ready
```

### Example API integration:
```js
// src/data/mockData.js → replace with:
// src/api/roomsApi.js

export const fetchRooms = async (filters) => {
  const response = await fetch(`http://localhost:8080/api/rooms?${new URLSearchParams(filters)}`);
  return response.json();
};

export const loginUser = async (credentials) => {
  const response = await fetch('http://localhost:8080/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  return response.json();
};
```

### Recommended API endpoints to build in Spring Boot:
```
POST   /api/auth/login
POST   /api/auth/signup
POST   /api/auth/admin/login

GET    /api/rooms              (with query params: type, category, minPrice, maxPrice, rating, location)
GET    /api/rooms/:id
POST   /api/rooms              (owner creates listing)
PUT    /api/rooms/:id          (owner edits listing)
DELETE /api/rooms/:id

POST   /api/bookings           (student books room)
GET    /api/bookings/student   (student's bookings)
GET    /api/bookings/owner     (owner's booking requests)
PUT    /api/bookings/:id       (owner accept/reject)

POST   /api/verify/student     (AI identity verification)
POST   /api/verify/owner       (AI PAN verification)
POST   /api/verify/listing     (AI listing verification)

GET    /api/admin/students
GET    /api/admin/owners
PUT    /api/admin/users/:id/block
PUT    /api/admin/users/:id/warn
GET    /api/admin/complaints
PUT    /api/admin/listings/:id/approve
```

---

## 🎨 Design System

Colors defined in `src/constants/theme.js`:
- **Primary Blue:** `#003B95`
- **Secondary Blue:** `#0071C2`
- **Accent Yellow:** `#FFB700`
- **Background:** `#F5F5F5`
- **Card:** `#FFFFFF`
- **Text:** `#333333`

---

## 📦 Deployment on Render

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. New → Static Site
4. Connect your GitHub repo
5. Build Command: `npm run build`
6. Publish Directory: `build`
7. Deploy!

---

## 🤖 AI Features (to be integrated)
- **Fake Listing Detection:** Pass listing images + details to AI model
- **Student Identity Verification:** Pass student ID card photo to AI model
- **Owner PAN Verification:** Pass PAN card photo to AI model

---

*Built with ❤️ by the Stazy Team*
