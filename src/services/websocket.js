import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getStoredSession } from './session';

let stompClient = null;
const listeners = new Set();
const topicSubscriptions = new Map();

// Helper to notify all generic listeners
const notifyListeners = (topic, payload) => {
  listeners.forEach(listener => {
    try {
      listener(topic, payload);
    } catch (err) {
      console.error('Error in websocket listener:', err);
    }
  });
};

export const connectWebSocket = (user) => {
  if (stompClient && stompClient.connected) {
    return;
  }

  const token = getStoredSession()?.accessToken;
  if (!token) return;

  // Uses the current hostname to determine backend URL
  const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
  
  stompClient = new Client({
    webSocketFactory: () => new SockJS(`${backendUrl}/ws`),
    connectHeaders: {
      Authorization: `Bearer ${token}`
    },
    debug: function (str) {
      // console.log(str); // Uncomment for debugging
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  stompClient.onConnect = (frame) => {
    console.log('Connected to WebSocket');
    
    // Subscribe to global topic
    stompClient.subscribe('/topic/global', (message) => {
      const body = JSON.parse(message.body);
      notifyListeners('global', body);
    });

    // Subscribe to user-specific topic
    if (user && user.uid) {
      stompClient.subscribe(`/topic/user/${user.uid}`, (message) => {
        const body = JSON.parse(message.body);
        notifyListeners('user', body);
      });
    }

    // Subscribe to role-specific topic
    if (user && user.roles && user.roles.length > 0) {
      user.roles.forEach(role => {
        // Strip ROLE_ prefix if present for matching backend logic
        const normalizedRole = role.replace('ROLE_', '');
        stompClient.subscribe(`/topic/role/${normalizedRole}`, (message) => {
          const body = JSON.parse(message.body);
          notifyListeners('role', body);
        });
      });
    }
    
    // Announce connection to UI if they want to refetch on reconnect
    notifyListeners('system', { type: 'CONNECTED' });
  };

  stompClient.onStompError = (frame) => {
    console.error('Broker reported error: ' + frame.headers['message']);
    console.error('Additional details: ' + frame.body);
  };

  stompClient.activate();
};

export const disconnectWebSocket = () => {
  if (stompClient !== null) {
    stompClient.deactivate();
  }
  stompClient = null;
  console.log("Disconnected from WebSocket");
};

/**
 * Register a listener to receive all mapped STOMP messages.
 * Returns an unregister function.
 */
export const addWebSocketListener = (callback) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};
