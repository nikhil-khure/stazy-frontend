import { useState, useCallback } from 'react';
import { useGlobalState } from '../contexts/GlobalStateContext';
import { apiRequest, createMultipartForm } from '../services/api';

/**
 * Custom hook for optimistic CRUD operations
 * Provides instant UI updates with background API calls
 */

export function useOptimisticActions() {
  const globalState = useGlobalState();
  const [actionError, setActionError] = useState('');
  const [successToast, setSuccessToast] = useState(null);

  const showSuccess = useCallback((message) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(null), 2000);
  }, []);

  const showError = useCallback((message) => {
    setActionError(message);
    setTimeout(() => setActionError(''), 5000);
  }, []);

  // ========== LISTING ACTIONS ==========

  const createListing = useCallback(async (listingData) => {
    const optimisticId = `temp-${Date.now()}`;
    const optimisticListing = {
      id: optimisticId,
      ...listingData,
      status: 'PENDING',
      latestFakeDetectionStatus: 'PENDING',
      isOptimistic: true,
      createdAt: new Date().toISOString(),
    };

    // Add optimistically
    globalState.addOptimisticListing(optimisticListing);
    showSuccess('Listing created! ✓');

    // Background API call
    try {
      const response = await apiRequest('/api/listings/owner', {
        method: 'POST',
        auth: true,
        isFormData: true,
        body: createMultipartForm(listingData),
      });

      // Replace with real data
      globalState.clearOptimisticListing(optimisticId);
      await globalState.refresh();
    } catch (error) {
      console.error('Failed to create listing:', error);
      globalState.clearOptimisticListing(optimisticId);
      showError(`Failed to create listing: ${error.message}`);
    }
  }, [globalState, showSuccess, showError]);

  const updateListing = useCallback(async (listingId, listingData, wasRejected = false) => {
    // Determine if media is being changed
    const hasNewMedia = (
      (listingData.roomImages && listingData.roomImages.length > 0) ||
      (listingData.ownerPhoto) ||
      (listingData.ownerLiveVideo)
    );
    
    const optimisticUpdate = {
      ...listingData,
      // If media changed, set status to UNDER_REVIEW, otherwise keep current status
      status: hasNewMedia ? 'UNDER_REVIEW' : (wasRejected ? 'UNDER_REVIEW' : listingData.status),
      latestFakeDetectionStatus: hasNewMedia ? 'PENDING' : listingData.latestFakeDetectionStatus,
      isOptimistic: true,
      updatedAt: new Date().toISOString(),
    };

    // Update optimistically
    globalState.updateOptimisticListing(listingId, optimisticUpdate);
    
    if (hasNewMedia) {
      showSuccess('Listing updated! Media changes require re-verification. ✓');
    } else {
      showSuccess('Listing updated! ✓');
    }

    // Background API call
    try {
      const response = await apiRequest(`/api/listings/owner/${listingId}`, {
        method: 'PUT',
        auth: true,
        isFormData: true,
        body: createMultipartForm(listingData),
      });

      // Wait for backend processing
      setTimeout(async () => {
        await globalState.refresh();
        setTimeout(() => {
          globalState.clearOptimisticListing(listingId);
        }, 2000);
      }, 1000);
    } catch (error) {
      console.error('Failed to update listing:', error);
      globalState.clearOptimisticListing(listingId);
      showError(`Failed to update listing: ${error.message}`);
    }
  }, [globalState, showSuccess, showError]);

  const deleteListing = useCallback(async (listingId) => {
    // Remove optimistically
    globalState.removeOptimisticListing(listingId);
    showSuccess('Listing deleted! ✓');

    // Background API call
    try {
      await apiRequest(`/api/listings/owner/${listingId}`, {
        method: 'DELETE',
        auth: true,
      });

      await globalState.refresh();
      globalState.clearOptimisticListing(listingId);
    } catch (error) {
      console.error('Failed to delete listing:', error);
      globalState.clearOptimisticListing(listingId);
      showError(`Failed to delete listing: ${error.message}`);
    }
  }, [globalState, showSuccess, showError]);

  // ========== BOOKING ACTIONS ==========

  const createBookingRequest = useCallback(async (listingId, message) => {
    const optimisticId = `temp-${Date.now()}`;
    const optimisticBooking = {
      id: optimisticId,
      listingId,
      message,
      status: 'PENDING',
      isOptimistic: true,
      requestedAt: new Date().toISOString(),
    };

    globalState.addOptimisticBooking(optimisticBooking);
    showSuccess('Booking request sent! ✓');

    try {
      await apiRequest(`/api/bookings/listings/${listingId}/requests`, {
        method: 'POST',
        auth: true,
        body: { message },
      });

      globalState.clearOptimisticBooking(optimisticId);
      await globalState.refresh();
    } catch (error) {
      console.error('Failed to create booking:', error);
      globalState.clearOptimisticBooking(optimisticId);
      showError(`Failed to create booking: ${error.message}`);
    }
  }, [globalState, showSuccess, showError]);

  const acceptBooking = useCallback(async (requestId) => {
    // CRITICAL: Remove booking from list immediately
    globalState.removeOptimisticBooking(requestId);
    
    // Also remove from server state for instant cross-panel sync
    globalState.removeServerBooking(requestId);
    
    showSuccess('Booking accepted! ✓');

    try {
      await apiRequest(`/api/bookings/requests/${requestId}/accept`, {
        method: 'PATCH',
        auth: true,
      });

      // Refresh to get updated data (new stays, etc.)
      await globalState.refresh();
    } catch (error) {
      console.error('Failed to accept booking:', error);
      // Revert: clear optimistic to show it again
      globalState.clearOptimisticBooking(requestId);
      await globalState.refresh(); // Restore from server
      showError(`Failed to accept booking: ${error.message}`);
    }
  }, [globalState, showSuccess, showError]);

  const rejectBooking = useCallback(async (requestId, reason) => {
    // CRITICAL: Remove booking from list immediately
    globalState.removeOptimisticBooking(requestId);
    
    // Also remove from server state for instant cross-panel sync
    globalState.removeServerBooking(requestId);
    
    showSuccess('Booking rejected! ✓');

    try {
      await apiRequest(`/api/bookings/requests/${requestId}/reject`, {
        method: 'PATCH',
        auth: true,
        body: { reason },
      });

      // Refresh to get updated data
      await globalState.refresh();
    } catch (error) {
      console.error('Failed to reject booking:', error);
      // Revert: clear optimistic to show it again
      globalState.clearOptimisticBooking(requestId);
      await globalState.refresh(); // Restore from server
      showError(`Failed to reject booking: ${error.message}`);
    }
  }, [globalState, showSuccess, showError]);

  const revokeBooking = useCallback(async (requestId) => {
    globalState.removeOptimisticBooking(requestId);
    showSuccess('Booking revoked! ✓');

    try {
      await apiRequest(`/api/bookings/requests/${requestId}/revoke`, {
        method: 'PATCH',
        auth: true,
      });

      await globalState.refresh();
      globalState.clearOptimisticBooking(requestId);
    } catch (error) {
      console.error('Failed to revoke booking:', error);
      globalState.clearOptimisticBooking(requestId);
      showError(`Failed to revoke booking: ${error.message}`);
    }
  }, [globalState, showSuccess, showError]);

  // ========== PAYMENT ACTIONS ==========

  const updatePayment = useCallback(async (paymentId, paymentData) => {
    globalState.updateOptimisticPayment(paymentId, paymentData);
    showSuccess('Payment updated! ✓');

    try {
      await apiRequest(`/api/bookings/payments/${paymentId}`, {
        method: 'PATCH',
        auth: true,
        body: paymentData,
      });

      await globalState.refresh();
      globalState.clearOptimisticPayment(paymentId);
    } catch (error) {
      console.error('Failed to update payment:', error);
      globalState.clearOptimisticPayment(paymentId);
      showError(`Failed to update payment: ${error.message}`);
    }
  }, [globalState, showSuccess, showError]);

  // ========== ADMIN ACTIONS ==========

  const approveListing = useCallback(async (listingId) => {
    // CRITICAL: Update global listings state immediately for cross-panel sync
    globalState.updateOptimisticListing(listingId, {
      status: 'LIVE',
      latestFakeDetectionStatus: 'SUCCESS',
      isOptimistic: true,
    });
    
    // Also update server state directly for instant visibility
    globalState.updateServerListing(listingId, {
      status: 'LIVE',
      latestFakeDetectionStatus: 'SUCCESS',
    });
    
    showSuccess('Listing approved! ✓');

    try {
      await apiRequest(`/api/admin/dashboard/listings/${listingId}/go-live`, {
        method: 'PATCH',
        auth: true,
      });

      // Refresh to get updated data
      await globalState.refresh();
      
      // Clear optimistic flag after refresh
      setTimeout(() => {
        globalState.clearOptimisticListing(listingId);
      }, 1000);
    } catch (error) {
      console.error('Failed to approve listing:', error);
      // Revert optimistic update on error
      globalState.clearOptimisticListing(listingId);
      await globalState.refresh(); // Restore from server
      showError(`Failed to approve listing: ${error.message}`);
    }
  }, [globalState, showSuccess, showError]);

  const rejectListing = useCallback(async (listingId, reviewNotes) => {
    // CRITICAL: Update global listings state immediately for cross-panel sync
    globalState.updateOptimisticListing(listingId, {
      status: 'REJECTED',
      rejectionReason: reviewNotes,
      isOptimistic: true,
    });
    
    // Also update server state directly for instant visibility
    globalState.updateServerListing(listingId, {
      status: 'REJECTED',
      rejectionReason: reviewNotes,
    });
    
    showSuccess('Listing rejected! ✓');

    try {
      await apiRequest(`/api/admin/dashboard/listings/${listingId}/reject`, {
        method: 'PATCH',
        auth: true,
        body: { reviewNotes },
      });

      // Refresh to get updated data
      await globalState.refresh();
      
      // Clear optimistic flag after refresh
      setTimeout(() => {
        globalState.clearOptimisticListing(listingId);
      }, 1000);
    } catch (error) {
      console.error('Failed to reject listing:', error);
      // Revert optimistic update on error
      globalState.clearOptimisticListing(listingId);
      await globalState.refresh(); // Restore from server
      showError(`Failed to reject listing: ${error.message}`);
    }
  }, [globalState, showSuccess, showError]);

  return {
    // Listing actions
    createListing,
    updateListing,
    deleteListing,
    
    // Booking actions
    createBookingRequest,
    acceptBooking,
    rejectBooking,
    revokeBooking,
    
    // Payment actions
    updatePayment,
    
    // Admin actions
    approveListing,
    rejectListing,
    
    // UI state
    actionError,
    successToast,
    showSuccess,
    showError,
  };
}
