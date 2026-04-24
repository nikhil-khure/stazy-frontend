import { useState, useEffect, useCallback, useRef } from 'react';
import { apiRequest } from '../services/api';
import { registerRefreshCallback } from '../services/apiWithRefresh';

/**
 * Custom hook for dashboard data management with auto-refresh
 * Solves Requirement 36: Automatic UI updates without reload
 */
export function useDashboardData(userRole) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    profile: null,
    bookingRequests: [],
    currentStay: null,
    payments: [],
    cancelRequests: [],
    filedComplaints: [],
    receivedComplaints: [],
    notifications: [],
    verificationHistory: [],
    listings: [],
  });

  const debounceTimer = useRef(null);

  const loadData = useCallback(async () => {
    if (!userRole) return;

    setLoading(true);
    setError('');

    try {
      const endpoints = {
        student: [
          ['/api/profiles/student/me', 'profile'],
          ['/api/bookings/requests/me', 'bookingRequests'],
          ['/api/bookings/payments/me', 'payments'],
          ['/api/bookings/cancel-requests/me', 'cancelRequests'],
          ['/api/complaints/filed', 'filedComplaints'],
          ['/api/complaints/received', 'receivedComplaints'],
          ['/api/verifications/me/history', 'verificationHistory'],
          ['/api/notifications/me', 'notifications'],
        ],
        owner: [
          ['/api/profiles/owner/me', 'profile'],
          ['/api/bookings/requests/owner', 'bookingRequests'],
          ['/api/bookings/active/owner', 'activeStays'],
          ['/api/bookings/payments/me', 'payments'],
          ['/api/bookings/cancel-requests/me', 'cancelRequests'],
          ['/api/complaints/filed', 'filedComplaints'],
          ['/api/complaints/received', 'receivedComplaints'],
          ['/api/listings/owner/me', 'listings'],
          ['/api/verifications/me/history', 'verificationHistory'],
          ['/api/notifications/me', 'notifications'],
        ],
      };

      const roleEndpoints = endpoints[userRole] || [];
      const results = await Promise.all(
        roleEndpoints.map(([endpoint]) =>
          apiRequest(endpoint, { auth: true }).catch(err => {
            // Handle "not found" errors gracefully
            if (err.message?.includes('not found') || err.message?.includes('No active')) {
              return null;
            }
            throw err;
          })
        )
      );

      const newData = {};
      roleEndpoints.forEach(([, key], index) => {
        newData[key] = results[index];
      });

      // Try to get current stay for student
      if (userRole === 'student') {
        try {
          const stay = await apiRequest('/api/bookings/active/me', { auth: true });
          newData.currentStay = stay;
        } catch (err) {
          newData.currentStay = null;
        }
      }

      setData(prev => ({ ...prev, ...newData }));
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  // Debounced wrapper — collapses multiple rapid triggers (e.g. 5 keys firing
  // at once after acceptBooking) into a single loadData call after a 300ms
  // quiet period. useCallback is imported from react already.
  const debouncedLoad = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => loadData(), 150);
  }, [loadData]);

  // Initial load — immediate, not debounced
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Register refresh callbacks — all keys use debouncedLoad so simultaneous
  // triggers from one action collapse into a single fetch instead of 5+.
  useEffect(() => {
    const unregisterCallbacks = [
      registerRefreshCallback('dashboard', debouncedLoad),
      registerRefreshCallback('profile', debouncedLoad),
      registerRefreshCallback('bookings', debouncedLoad),
      registerRefreshCallback('studentBookings', debouncedLoad),
      registerRefreshCallback('ownerBookings', debouncedLoad),
      registerRefreshCallback('payments', debouncedLoad),
      registerRefreshCallback('cancelRequests', debouncedLoad),
      registerRefreshCallback('complaints', debouncedLoad),
      registerRefreshCallback('filedComplaints', debouncedLoad),
      registerRefreshCallback('receivedComplaints', debouncedLoad),
      registerRefreshCallback('listings', debouncedLoad),
      registerRefreshCallback('ownerListings', debouncedLoad),
      registerRefreshCallback('activeStays', debouncedLoad),
      registerRefreshCallback('connectedStudents', debouncedLoad),
    ];

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      unregisterCallbacks.forEach(fn => fn());
    };
  }, [debouncedLoad]);

  const mutateData = useCallback((updater) => {
    setData(prev => (typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }));
  }, []);

  // Expose loadData (not debouncedLoad) as refresh so manual calls from
  // handlers are immediate.
  return { data, loading, error, refresh: loadData, mutateData };
}

/**
 * Hook for checking booking status of listings
 * Solves Requirement 11: Disable book button for already booked listings
 */
export function useBookingStatus(listings, user) {
  const [bookedListings, setBookedListings] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Stabilize the dependency: derive a string key from listing IDs
  // so the effect only re-runs when actual listings change, not on
  // every render when called with an inline array like [room].
  const listingIds = (listings || []).map(l => l.id).join(',');

  useEffect(() => {
    if (!user || !listings || listings.length === 0) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    const checkStatuses = async () => {
      const results = await Promise.all(
        listings.map(async (listing) => {
          try {
            const hasBooked = await apiRequest(
              `/api/bookings/listings/${listing.id}/booking-status`,
              { auth: true }
            );
            return hasBooked ? listing.id : null;
          } catch (err) {
            return null;
          }
        })
      );

      if (!cancelled) {
        setBookedListings(new Set(results.filter(Boolean)));
        setLoading(false);
      }
    };

    checkStatuses();
    return () => { cancelled = true; };
  }, [listingIds, user]);

  return { bookedListings, loading };
}
