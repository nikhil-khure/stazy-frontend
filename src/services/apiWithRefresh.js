import { apiRequest } from './api';

/**
 * Enhanced API service with automatic refresh callbacks
 * Solves Requirement 36: No manual reload needed
 */

const refreshCallbacks = new Map();

export function registerRefreshCallback(key, callback) {
  if (!refreshCallbacks.has(key)) {
    refreshCallbacks.set(key, new Set());
  }
  refreshCallbacks.get(key).add(callback);
  
  // Return unregister function
  return () => {
    const callbacks = refreshCallbacks.get(key);
    if (callbacks) {
      callbacks.delete(callback);
    }
  };
}

export function triggerRefresh(key) {
  const callbacks = refreshCallbacks.get(key);
  if (callbacks) {
    callbacks.forEach(callback => callback());
  }
}

export function triggerMultipleRefresh(keys) {
  keys.forEach(key => triggerRefresh(key));
}

/**
 * API wrapper that automatically triggers refresh after mutations
 */
export const apiWithRefresh = {
  // Listings
  async createListing(data) {
    const result = await apiRequest('/api/listings/owner', {
      method: 'POST',
      auth: true,
      isFormData: true,
      body: data,
    });
    triggerMultipleRefresh(['listings', 'ownerListings', 'dashboard']);
    return result;
  },

  async updateListing(listingId, data) {
    const result = await apiRequest(`/api/listings/owner/${listingId}`, {
      method: 'PUT',
      auth: true,
      isFormData: true,
      body: data,
    });
    triggerMultipleRefresh(['listings', 'ownerListings', 'dashboard', 'listingDetail']);
    return result;
  },

  async deleteListing(listingId) {
    const result = await apiRequest(`/api/listings/owner/${listingId}`, {
      method: 'DELETE',
      auth: true,
    });
    triggerMultipleRefresh(['listings', 'ownerListings', 'dashboard']);
    return result;
  },

  // Bookings
  async createBookingRequest(listingId, message) {
    const result = await apiRequest(`/api/bookings/listings/${listingId}/requests`, {
      method: 'POST',
      auth: true,
      body: { message },
    });
    triggerMultipleRefresh(['bookings', 'studentBookings', 'dashboard']);
    return result;
  },

  async acceptBooking(requestId) {
    const result = await apiRequest(`/api/bookings/requests/${requestId}/accept`, {
      method: 'PATCH',
      auth: true,
    });
    triggerMultipleRefresh(['bookings', 'ownerBookings', 'dashboard', 'activeStays', 'payments']);
    return result;
  },

  async rejectBooking(requestId, reason) {
    const result = await apiRequest(`/api/bookings/requests/${requestId}/reject`, {
      method: 'PATCH',
      auth: true,
      body: { reason },
    });
    triggerMultipleRefresh(['bookings', 'ownerBookings', 'dashboard']);
    return result;
  },

  async revokeBooking(requestId) {
    const result = await apiRequest(`/api/bookings/requests/${requestId}/revoke`, {
      method: 'PATCH',
      auth: true,
    });
    triggerMultipleRefresh(['bookings', 'studentBookings', 'dashboard']);
    return result;
  },

  // Complaints
  async createComplaint(data) {
    const result = await apiRequest('/api/complaints', {
      method: 'POST',
      auth: true,
      body: data,
    });
    triggerMultipleRefresh(['complaints', 'filedComplaints', 'receivedComplaints', 'dashboard']);
    return result;
  },

  async submitJustification(complaintId, data) {
    const result = await apiRequest(`/api/complaints/${complaintId}/justify`, {
      method: 'POST',
      auth: true,
      isFormData: true,
      body: data,
    });
    triggerMultipleRefresh(['complaints', 'filedComplaints', 'receivedComplaints', 'dashboard']);
    return result;
  },

  async reComplaint(complaintId, data) {
    const result = await apiRequest(`/api/complaints/${complaintId}/re-open`, {
      method: 'POST',
      auth: true,
      isFormData: true,
      body: data,
    });
    triggerMultipleRefresh(['complaints', 'filedComplaints', 'receivedComplaints', 'dashboard']);
    return result;
  },

  async closeComplaint(complaintId) {
    const result = await apiRequest(`/api/complaints/${complaintId}/close`, {
      method: 'PATCH',
      auth: true,
    });
    triggerMultipleRefresh(['complaints', 'filedComplaints', 'receivedComplaints', 'dashboard']);
    return result;
  },

  // Payments
  async updatePayment(paymentId, data) {
    const result = await apiRequest(`/api/bookings/payments/${paymentId}`, {
      method: 'PATCH',
      auth: true,
      body: data,
    });
    triggerMultipleRefresh(['payments', 'dashboard', 'activeStays']);
    return result;
  },

  // Cancel Requests
  async createCancelRequest(stayId, reason) {
    const result = await apiRequest(`/api/bookings/active/${stayId}/cancel-requests`, {
      method: 'POST',
      auth: true,
      body: { reason },
    });
    triggerMultipleRefresh(['cancelRequests', 'dashboard', 'activeStays']);
    return result;
  },

  async reviewCancelRequest(requestId, accept, ownerReason) {
    const result = await apiRequest(`/api/bookings/cancel-requests/${requestId}`, {
      method: 'PATCH',
      auth: true,
      body: { accept, ownerReason },
    });
    triggerMultipleRefresh(['cancelRequests', 'dashboard', 'activeStays', 'payments', 'connectedStudents']);
    return result;
  },

  // Profile
  async updateProfile(data, role) {
    const endpoint = role === 'STUDENT' ? '/api/profiles/student/me' : '/api/profiles/owner/me';
    const result = await apiRequest(endpoint, {
      method: 'PUT',
      auth: true,
      body: data,
    });
    triggerMultipleRefresh(['profile', 'dashboard']);
    return result;
  },

  // Feedback
  async submitFeedback(data) {
    const result = await apiRequest('/api/feedbacks/me', {
      method: 'POST',
      auth: true,
      body: data,
    });
    triggerMultipleRefresh(['feedback', 'listings', 'listingDetail']);
    return result;
  },

  // Admin Selection
  async getMatchingAdmin() {
    return await apiRequest('/api/admin/owner/matching-admin', {
      method: 'GET',
      auth: true,
    });
  },

  async getAvailableAdmins() {
    return await apiRequest('/api/admin/owner/available-admins', {
      method: 'GET',
      auth: true,
    });
  },
};
