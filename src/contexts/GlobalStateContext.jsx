import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiRequest } from '../services/api';

/**
 * Global State Context for cross-panel synchronization
 * Provides shared state for listings, bookings, and other entities
 * with optimistic update support
 */

const GlobalStateContext = createContext(null);

export function GlobalStateProvider({ children, userRole }) {
  // Global state for all entities
  const [state, setState] = useState({
    listings: [],
    bookingRequests: [],
    activeStays: [],
    payments: [],
    cancelRequests: [],
    complaints: [],
    profile: null,
    notifications: [],
    verificationHistory: [],
  });

  // Optimistic updates tracking
  const [optimistic, setOptimistic] = useState({
    listings: {
      added: [],
      updated: new Map(),
      removed: new Set(),
    },
    bookings: {
      added: [],
      updated: new Map(),
      removed: new Set(),
    },
    payments: {
      updated: new Map(),
    },
    cancelRequests: {
      updated: new Map(),
    },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load all data based on user role
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
        admin: [
          ['/api/admin/dashboard/stats', 'stats'],
          ['/api/admin/dashboard/students', 'students'],
          ['/api/admin/dashboard/owners', 'owners'],
          ['/api/admin/dashboard/listings/pending', 'pendingListings'],
          ['/api/admin/queries/me', 'queries'],
        ],
      };

      const roleEndpoints = endpoints[userRole] || [];
      const results = await Promise.all(
        roleEndpoints.map(([endpoint]) =>
          apiRequest(endpoint, { auth: true }).catch(err => {
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

      setState(prev => ({ ...prev, ...newData }));
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Computed state with optimistic updates applied
  const getListings = useCallback(() => {
    const { added, updated, removed } = optimistic.listings;
    
    // CRITICAL: Merge listings from all sources for cross-panel sync
    // Admin sees pendingListings, Owner sees listings
    const allServerListings = [
      ...(state.listings || []),
      ...(state.pendingListings || []).map(pl => ({
        id: pl.listingId || pl.id,
        title: pl.listingTitle || pl.title,
        status: pl.status,
        ...pl
      }))
    ];
    
    // Remove duplicates by ID
    const uniqueListings = Array.from(
      new Map(allServerListings.map(l => [l.id || l.listingId, l])).values()
    );
    
    // Start with unique server listings, filter removed
    let result = uniqueListings.filter(listing => {
      const id = listing.id || listing.listingId;
      return !removed.has(id);
    });
    
    // Apply updates
    result = result.map(listing => {
      const id = listing.id || listing.listingId;
      const update = updated.get(id);
      return update ? { ...listing, ...update } : listing;
    });
    
    // Add optimistic new listings
    result = [...added, ...result];
    
    return result;
  }, [state.listings, state.pendingListings, optimistic.listings]);

  const getBookingRequests = useCallback(() => {
    const { added, updated, removed } = optimistic.bookings;
    
    // Filter out removed bookings FIRST
    let result = (state.bookingRequests || []).filter(booking => {
      const id = booking.id;
      return !removed.has(id);
    });
    
    // Apply updates
    result = result.map(booking => {
      const update = updated.get(booking.id);
      return update ? { ...booking, ...update } : booking;
    });
    
    // Add optimistic new bookings
    result = [...added, ...result];
    
    return result;
  }, [state.bookingRequests, optimistic.bookings]);

  const getPayments = useCallback(() => {
    const { updated } = optimistic.payments;
    
    return state.payments.map(payment => {
      const update = updated.get(payment.id);
      return update ? { ...payment, ...update } : payment;
    });
  }, [state.payments, optimistic.payments]);

  // Optimistic update helpers
  const addOptimisticListing = useCallback((listing) => {
    setOptimistic(prev => ({
      ...prev,
      listings: {
        ...prev.listings,
        added: [listing, ...prev.listings.added],
      },
    }));
  }, []);

  const updateOptimisticListing = useCallback((listingId, updates) => {
    setOptimistic(prev => ({
      ...prev,
      listings: {
        ...prev.listings,
        updated: new Map(prev.listings.updated).set(listingId, updates),
      },
    }));
  }, []);

  const removeOptimisticListing = useCallback((listingId) => {
    setOptimistic(prev => ({
      ...prev,
      listings: {
        ...prev.listings,
        removed: new Set([...prev.listings.removed, listingId]),
      },
    }));
  }, []);

  const clearOptimisticListing = useCallback((listingId) => {
    setOptimistic(prev => {
      const newAdded = prev.listings.added.filter(l => l.id !== listingId);
      const newUpdated = new Map(prev.listings.updated);
      newUpdated.delete(listingId);
      const newRemoved = new Set(prev.listings.removed);
      newRemoved.delete(listingId);
      
      return {
        ...prev,
        listings: {
          added: newAdded,
          updated: newUpdated,
          removed: newRemoved,
        },
      };
    });
  }, []);

  const addOptimisticBooking = useCallback((booking) => {
    setOptimistic(prev => ({
      ...prev,
      bookings: {
        ...prev.bookings,
        added: [booking, ...prev.bookings.added],
      },
    }));
  }, []);

  const updateOptimisticBooking = useCallback((bookingId, updates) => {
    setOptimistic(prev => ({
      ...prev,
      bookings: {
        ...prev.bookings,
        updated: new Map(prev.bookings.updated).set(bookingId, updates),
      },
    }));
  }, []);

  const removeOptimisticBooking = useCallback((bookingId) => {
    setOptimistic(prev => ({
      ...prev,
      bookings: {
        ...prev.bookings,
        removed: new Set([...prev.bookings.removed, bookingId]),
      },
    }));
  }, []);

  const clearOptimisticBooking = useCallback((bookingId) => {
    setOptimistic(prev => {
      const newAdded = prev.bookings.added.filter(b => b.id !== bookingId);
      const newUpdated = new Map(prev.bookings.updated);
      newUpdated.delete(bookingId);
      const newRemoved = new Set(prev.bookings.removed);
      newRemoved.delete(bookingId);
      
      return {
        ...prev,
        bookings: {
          added: newAdded,
          updated: newUpdated,
          removed: newRemoved,
        },
      };
    });
  }, []);

  const updateOptimisticPayment = useCallback((paymentId, updates) => {
    setOptimistic(prev => ({
      ...prev,
      payments: {
        updated: new Map(prev.payments.updated).set(paymentId, updates),
      },
    }));
  }, []);

  const clearOptimisticPayment = useCallback((paymentId) => {
    setOptimistic(prev => {
      const newUpdated = new Map(prev.payments.updated);
      newUpdated.delete(paymentId);
      
      return {
        ...prev,
        payments: {
          updated: newUpdated,
        },
      };
    });
  }, []);

  // Direct state update for cross-panel sync
  const updateServerListing = useCallback((listingId, updates) => {
    setState(prev => ({
      ...prev,
      listings: prev.listings.map(listing => 
        listing.id === listingId ? { ...listing, ...updates } : listing
      ),
      pendingListings: prev.pendingListings?.map(listing => 
        (listing.id === listingId || listing.listingId === listingId) 
          ? { ...listing, ...updates } 
          : listing
      ) || prev.pendingListings,
    }));
  }, []);

  const removeServerListing = useCallback((listingId) => {
    setState(prev => ({
      ...prev,
      listings: prev.listings.filter(listing => listing.id !== listingId),
      pendingListings: prev.pendingListings?.filter(listing => 
        listing.id !== listingId && listing.listingId !== listingId
      ) || prev.pendingListings,
    }));
  }, []);

  const removeServerBooking = useCallback((bookingId) => {
    setState(prev => ({
      ...prev,
      bookingRequests: prev.bookingRequests.filter(booking => booking.id !== bookingId),
    }));
  }, []);

  const value = {
    // Raw state
    state,
    setState,
    
    // Computed state with optimistic updates
    listings: getListings(),
    bookingRequests: getBookingRequests(),
    payments: getPayments(),
    activeStays: state.activeStays || [],
    cancelRequests: state.cancelRequests || [],
    complaints: state.complaints || [],
    profile: state.profile,
    notifications: state.notifications || [],
    verificationHistory: state.verificationHistory || [],
    
    // Admin-specific
    pendingListings: state.pendingListings || [],
    students: state.students || [],
    owners: state.owners || [],
    stats: state.stats,
    
    // Loading state
    loading,
    error,
    
    // Actions
    refresh: loadData,
    
    // Optimistic update helpers
    addOptimisticListing,
    updateOptimisticListing,
    removeOptimisticListing,
    clearOptimisticListing,
    
    addOptimisticBooking,
    updateOptimisticBooking,
    removeOptimisticBooking,
    clearOptimisticBooking,
    
    updateOptimisticPayment,
    clearOptimisticPayment,
    
    // Direct state updates for cross-panel sync
    updateServerListing,
    removeServerListing,
    removeServerBooking,
  };

  return (
    <GlobalStateContext.Provider value={value}>
      {children}
    </GlobalStateContext.Provider>
  );
}

export function useGlobalState() {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error('useGlobalState must be used within GlobalStateProvider');
  }
  return context;
}
