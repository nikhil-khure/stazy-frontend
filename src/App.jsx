import { useEffect, useState } from 'react';
import HomePage from './pages/HomePage';
import { AboutPage, LoginPage, SignupPage, AdminLoginPage, AdminHiringPage } from './pages/AuthPages';
import ExplorePage from './pages/ExplorePage';
import StudentDashboard from './pages/StudentDashboardLive';
import OwnerDashboard from './pages/OwnerDashboardLive';
import AdminDashboard from './pages/AdminDashboardLive';
import SuperAdminDashboard from './pages/SuperAdminDashboardLive';
import { bootstrapCurrentUser } from './services/api';
import { clearSession, getStoredUser } from './services/session';
import { getDashboardPageForUser, isDashboardPage } from './utils/dashboardRouting';

export default function App() {
  const [page, setPage] = useState('home');
  const [user, setUserState] = useState(getStoredUser());

  useEffect(() => {
    let active = true;
    bootstrapCurrentUser().then(currentUser => {
      if (active) {
        setUserState(currentUser);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isDashboardPage(page)) {
      return;
    }
    if (!user) {
      if (page === 'superAdminDash') {
        return;
      }
      setPage('home');
      return;
    }
    const expectedPage = getDashboardPageForUser(user);
    if (expectedPage && page !== expectedPage) {
      setPage(expectedPage);
    }
  }, [page, user]);

  // Simple client-side router
  const navigate = (p) => {
    setPage(p);
    window.scrollTo(0, 0);
  };

  const setUser = (nextUser) => {
    if (!nextUser) {
      clearSession();
    }
    setUserState(nextUser);
  };

  const props = { navigate, user, setUser };

  const pages = {
    home: <HomePage {...props} />,
    about: <AboutPage {...props} />,
    login: <LoginPage {...props} />,
    signup: <SignupPage {...props} />,
    adminLogin: <AdminLoginPage {...props} />,
    adminHiring: <AdminHiringPage {...props} />,
    explore: <ExplorePage {...props} />,
    studentDash: <StudentDashboard {...props} />,
    ownerDash: <OwnerDashboard {...props} />,
    adminDash: <AdminDashboard {...props} />,
    superAdminDash: <SuperAdminDashboard {...props} />,
  };

  return pages[page] || pages['home'];
}
