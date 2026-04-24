const NOTIFICATION_EVENT_TYPES = new Set(['new_notification', 'notification_read']);

const toTimestamp = (value) => {
  const timestamp = value ? Date.parse(value) : 0;
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export function sortNotificationsNewestFirst(notifications = []) {
  return [...notifications].sort(
    (left, right) => toTimestamp(right?.createdAt) - toTimestamp(left?.createdAt)
  );
}

export function isRealtimeNotificationEvent(payload) {
  return NOTIFICATION_EVENT_TYPES.has(payload?.eventType) && Boolean(payload?.payload?.id);
}

export function applyRealtimeNotificationEvent(notifications = [], payload) {
  if (!isRealtimeNotificationEvent(payload)) {
    return notifications;
  }

  const current = Array.isArray(notifications) ? notifications : [];
  const existingNotification = current.find(item => item?.id === payload.payload.id);
  const nextNotifications = current.filter(item => item?.id !== payload.payload.id);
  nextNotifications.unshift({
    ...existingNotification,
    ...payload.payload,
  });
  return sortNotificationsNewestFirst(nextNotifications);
}

export function shouldRefreshFromRealtimeEvent(topic, payload) {
  if (topic === 'system') {
    return payload?.type === 'CONNECTED';
  }

  if (topic === 'global') {
    return payload?.eventType === 'refresh_needed';
  }

  if (topic === 'role') {
    return true;
  }

  if (topic === 'user') {
    return !isRealtimeNotificationEvent(payload);
  }

  return false;
}
