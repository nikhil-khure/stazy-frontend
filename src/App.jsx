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
import { GlobalStateProvider } from './contexts/GlobalStateContext';
import { connectWebSocket, disconnectWebSocket } from './services/websocket';

export default function App() {
  const [page, setPage] = useState('home');
  const [user, setUserState] = useState(getStoredUser());
  const [searchQuery, setSearchQuery] = useState('');

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

  // Manage WebSocket connection lifecycle
  useEffect(() => {
    if (user) {
      connectWebSocket(user);
    } else {
      disconnectWebSocket();
    }
    return () => disconnectWebSocket();
  }, [user]);

  // Simple client-side router
  const navigate = (p, options = {}) => {
    setPage(p);
    if (options.searchQuery !== undefined) {
      setSearchQuery(options.searchQuery);
    }
    window.scrollTo(0, 0);
  };

  const setUser = (nextUser) => {
    if (!nextUser) {
      clearSession();
    }
    setUserState(nextUser);
  };

  const props = { navigate, user, setUser };

  // Determine user role for global state
  const userRole = user?.role?.toLowerCase();

  const pages = {
    home: <HomePage {...props} />,
    about: <AboutPage {...props} />,
    login: <LoginPage {...props} />,
    signup: <SignupPage {...props} />,
    adminLogin: <AdminLoginPage {...props} />,
    adminHiring: <AdminHiringPage {...props} />,
    explore: <ExplorePage {...props} searchQuery={searchQuery} />,
    studentDash: userRole ? (
      <GlobalStateProvider userRole={userRole}>
        <StudentDashboard {...props} />
      </GlobalStateProvider>
    ) : <StudentDashboard {...props} />,
    ownerDash: userRole ? (
      <GlobalStateProvider userRole={userRole}>
        <OwnerDashboard {...props} />
      </GlobalStateProvider>
    ) : <OwnerDashboard {...props} />,
    adminDash: userRole ? (
      <GlobalStateProvider userRole={userRole}>
        <AdminDashboard {...props} />
      </GlobalStateProvider>
    ) : <AdminDashboard {...props} />,
    superAdminDash: <SuperAdminDashboard {...props} />,
  };

  return pages[page] || pages['home'];
}
