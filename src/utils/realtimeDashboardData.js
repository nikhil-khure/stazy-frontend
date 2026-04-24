import { applyRealtimeNotificationEvent, isRealtimeNotificationEvent } from './realtimeNotifications';

const ID_KEYS = ['id', 'listingId', 'requestId', 'complaintId', 'activeStayId', 'userId', 'roomCode'];

const asArray = (value) => (Array.isArray(value) ? value : []);

const asLower = (value) => String(value || '').toLowerCase();

const hasOwn = (value, key) => Boolean(value) && Object.prototype.hasOwnProperty.call(value, key);

const getIdValues = (value) =>
  ID_KEYS.map((key) => value?.[key]).filter((item) => item !== undefined && item !== null);

const matchesEntity = (left, right) => {
  const leftIds = getIdValues(left).map(String);
  const rightIds = getIdValues(right).map(String);
  return leftIds.some((value) => rightIds.includes(value));
};

const matchesList = (items, entity) => asArray(items).some((item) => matchesEntity(item, entity));

const upsertEntity = (items, entity) => {
  const currentItems = asArray(items);
  if (!entity) {
    return currentItems;
  }

  const index = currentItems.findIndex((item) => matchesEntity(item, entity));
  if (index === -1) {
    return [entity, ...currentItems];
  }

  const nextItems = [...currentItems];
  nextItems[index] = { ...nextItems[index], ...entity };
  return nextItems;
};

const removeEntity = (items, entity) =>
  asArray(items).filter((item) => !matchesEntity(item, entity));

const inferEntityKind = (eventType, entity) => {
  const normalizedEventType = asLower(eventType);

  if (!entity || typeof entity !== 'object') {
    return null;
  }

  if (
    normalizedEventType.includes('payment') ||
    (hasOwn(entity, 'amount') && hasOwn(entity, 'periodStart') && hasOwn(entity, 'dueDate'))
  ) {
    return 'payment';
  }

  if (
    normalizedEventType.includes('notification') ||
    (hasOwn(entity, 'notificationType') && hasOwn(entity, 'read'))
  ) {
    return 'notification';
  }

  if (
    normalizedEventType.includes('complaint') ||
    hasOwn(entity, 'againstRoleCode') ||
    hasOwn(entity, 'messages')
  ) {
    return 'complaint';
  }

  if (
    normalizedEventType.includes('cancel') ||
    hasOwn(entity, 'cancelReason') ||
    hasOwn(entity, 'reviewMessage') ||
    hasOwn(entity, 'cancelRequestId') ||
    hasOwn(entity, 'accountStatusSnapshot')
  ) {
    return 'cancel';
  }

  if (
    normalizedEventType.includes('listing') ||
    hasOwn(entity, 'rentAmount') ||
    hasOwn(entity, 'genderCategory') ||
    hasOwn(entity, 'fakeDetectionStatus') ||
    hasOwn(entity, 'latestFakeDetectionStatus') ||
    hasOwn(entity, 'amenities')
  ) {
    return 'listing';
  }

  if (
    normalizedEventType.includes('stay') ||
    hasOwn(entity, 'roomCode') ||
    hasOwn(entity, 'joinDate') ||
    hasOwn(entity, 'monthlyRent')
  ) {
    return 'stay';
  }

  if (
    normalizedEventType.includes('booking') ||
    hasOwn(entity, 'requestedAt') ||
    hasOwn(entity, 'listingTitle') ||
    hasOwn(entity, 'studentUserCode') ||
    hasOwn(entity, 'ownerUserCode')
  ) {
    return 'booking';
  }

  return null;
};

const extractEntity = (payload) => {
  const body = payload?.payload;
  if (!body || typeof body !== 'object') {
    return null;
  }

  const candidates = [
    body.booking,
    body.bookingRequest,
    body.activeStay,
    body.stay,
    body.rentPayment,
    body.payment,
    body.complaint,
    body.cancelRequest,
    body.listing,
    body.notification,
    body.entity,
    body.data,
    body,
  ];

  return candidates.find((candidate) => candidate && typeof candidate === 'object') || null;
};

const isRemovalEvent = (eventType) => {
  const normalizedEventType = asLower(eventType);
  return (
    normalizedEventType.includes('delete') ||
    normalizedEventType.includes('remove') ||
    normalizedEventType.includes('revoke') ||
    normalizedEventType.includes('checkout') ||
    normalizedEventType.includes('closed') ||
    normalizedEventType.includes('deleted')
  );
};

const isReceivedComplaint = (role, complaint) => {
  const targetRole = asLower(complaint?.againstRoleCode);
  return role === 'owner'
    ? targetRole.includes('owner')
    : targetRole.includes('student');
};

const isFiledComplaint = (role, complaint) => {
  const targetRole = asLower(complaint?.againstRoleCode);
  return role === 'owner'
    ? targetRole.includes('student')
    : targetRole.includes('owner');
};

const isRelevantEntity = (role, currentData, kind, entity) => {
  const profileCode = currentData?.profile?.userCode;
  if (!profileCode || !entity) {
    return true;
  }

  if (kind === 'booking' || kind === 'cancel' || kind === 'payment' || kind === 'stay') {
    const ownerCode = entity.ownerUserCode;
    const studentCode = entity.studentUserCode;
    return role === 'owner'
      ? ownerCode === profileCode ||
          matchesList(currentData.bookingRequests, entity) ||
          matchesList(currentData.activeStays, entity) ||
          matchesList(currentData.cancelRequests, entity) ||
          matchesList(currentData.payments, entity)
      : studentCode === profileCode ||
          matchesList(currentData.bookingRequests, entity) ||
          matchesList(currentData.cancelRequests, entity) ||
          matchesEntity(currentData.currentStay, entity) ||
          matchesList(currentData.payments, entity);
  }

  if (kind === 'complaint') {
    return (
      entity.complainantUserCode === profileCode ||
      entity.againstUserCode === profileCode ||
      matchesList(currentData.filedComplaints, entity) ||
      matchesList(currentData.receivedComplaints, entity)
    );
  }

  if (kind === 'listing') {
    return matchesList(currentData.listings, entity);
  }

  return true;
};

export function applyRealtimeDashboardEvent(role, currentData, topic, payload) {
  const nextData = { ...currentData };

  if (topic === 'user' && isRealtimeNotificationEvent(payload)) {
    nextData.notifications = applyRealtimeNotificationEvent(nextData.notifications, payload);
  }

  const entity = extractEntity(payload);
  const kind = inferEntityKind(payload?.eventType, entity);
  if (!kind || !entity) {
    return nextData;
  }

  if (!isRelevantEntity(role, currentData, kind, entity)) {
    return nextData;
  }

  if (kind === 'booking') {
    nextData.bookingRequests = isRemovalEvent(payload?.eventType)
      ? removeEntity(nextData.bookingRequests, entity)
      : upsertEntity(nextData.bookingRequests, entity);
    return nextData;
  }

  if (kind === 'payment') {
    nextData.payments = isRemovalEvent(payload?.eventType)
      ? removeEntity(nextData.payments, entity)
      : upsertEntity(nextData.payments, entity);
    return nextData;
  }

  if (kind === 'stay') {
    nextData.activeStays = isRemovalEvent(payload?.eventType)
      ? removeEntity(nextData.activeStays, entity)
      : upsertEntity(nextData.activeStays, entity);

    if (role === 'student') {
      const stayEnded = asLower(entity?.status) === 'ended';
      nextData.currentStay = isRemovalEvent(payload?.eventType) || stayEnded
        ? null
        : { ...(nextData.currentStay || {}), ...entity };
      if (stayEnded) {
        nextData.payments = asArray(nextData.payments).filter(
          (payment) => String(payment?.activeStayId) !== String(entity?.id)
        );
      }
    }
    return nextData;
  }

  if (kind === 'complaint') {
    if (
      isFiledComplaint(role, entity) ||
      matchesList(nextData.filedComplaints, entity)
    ) {
      nextData.filedComplaints = upsertEntity(nextData.filedComplaints, entity);
    }
    if (
      isReceivedComplaint(role, entity) ||
      matchesList(nextData.receivedComplaints, entity)
    ) {
      nextData.receivedComplaints = upsertEntity(nextData.receivedComplaints, entity);
    }
    return nextData;
  }

  if (kind === 'cancel') {
    nextData.cancelRequests = isRemovalEvent(payload?.eventType)
      ? removeEntity(nextData.cancelRequests, entity)
      : upsertEntity(nextData.cancelRequests, entity);
    return nextData;
  }

  if (kind === 'listing') {
    nextData.listings = isRemovalEvent(payload?.eventType)
      ? removeEntity(nextData.listings, entity)
      : upsertEntity(nextData.listings, entity);
  }

  return nextData;
}
