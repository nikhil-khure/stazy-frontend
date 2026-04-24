import React, { useState, useRef, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { addWebSocketListener } from '../../services/websocket';
import { applyRealtimeNotificationEvent, sortNotificationsNewestFirst } from '../../utils/realtimeNotifications';

export default function NotificationBell({ notifications = [], refreshData }) {
  const [open, setOpen] = useState(false);
  const [localNotifications, setLocalNotifications] = useState(() => sortNotificationsNewestFirst(notifications));
  const containerRef = useRef(null);

  useEffect(() => {
    setLocalNotifications(sortNotificationsNewestFirst(notifications));
  }, [notifications]);

  useEffect(() => {
    const unsubscribe = addWebSocketListener((topic, payload) => {
      if (topic !== 'user') {
        return;
      }

      setLocalNotifications(current => applyRealtimeNotificationEvent(current, payload));
    });

    return () => unsubscribe();
  }, []);

  // Unread notifications
  const unreadCount = localNotifications.filter(n => !n.read).length;

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    const previousNotifications = localNotifications;
    setLocalNotifications(current =>
      current.map(notification =>
        notification.id === id
          ? {
              ...notification,
              read: true,
              readAt: notification.readAt || new Date().toISOString(),
            }
          : notification
      )
    );

    try {
      const updatedNotification = await apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH', auth: true });
      setLocalNotifications(current =>
        applyRealtimeNotificationEvent(current, {
          eventType: 'notification_read',
          payload: updatedNotification,
        })
      );
    } catch (err) {
      setLocalNotifications(previousNotifications);
      if (refreshData) refreshData();
      console.error('Failed to mark notification as read:', err);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button 
        onClick={() => setOpen(!open)} 
        title="Notifications" 
        style={{ 
          background: 'none', border: 'none', cursor: 'pointer', 
          color: '#fff', fontSize: 20, position: 'relative', padding: '4px 8px' 
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{ 
            position: 'absolute', top: 2, right: 2, 
            minWidth: 16, height: 16, background: '#EF4444', 
            borderRadius: '50%', fontSize: 10, color: 'white', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 8,
          width: 320, background: '#fff', borderRadius: 12,
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 50,
          maxHeight: 400, display: 'flex', flexDirection: 'column',
          overflow: 'hidden', border: '1px solid #E5E7EB'
        }}>
          <div style={{ 
            padding: '12px 16px', background: '#F9FAFB', 
            borderBottom: '1px solid #E5E7EB', display: 'flex', 
            justifyContent: 'space-between', alignItems: 'center' 
          }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>Notifications</h3>
            {unreadCount > 0 && <span style={{ fontSize: 12, color: '#3B82F6', fontWeight: 600 }}>{unreadCount} New</span>}
          </div>
          
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {localNotifications.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#6B7280', fontSize: 13 }}>
                You have no notifications yet.
              </div>
            ) : (
              localNotifications.map((notif) => (
                <div 
                  key={notif.id} 
                  style={{ 
                    padding: '12px 16px', borderBottom: '1px solid #F3F4F6',
                    background: notif.read ? '#fff' : '#EFF6FF',
                    transition: 'background 0.2s', cursor: 'default'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>
                      {notif.title}
                    </div>
                    {!notif.read && (
                      <button 
                        onClick={(e) => handleMarkAsRead(notif.id, e)}
                        style={{ 
                          background: 'none', border: 'none', color: '#3B82F6', 
                          fontSize: 11, cursor: 'pointer', padding: 0 
                        }}
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.4 }}>
                    {notif.message}
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>
                    {new Date(notif.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
