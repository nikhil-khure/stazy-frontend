const asArray = (value) => (Array.isArray(value) ? value : []);

const hasOwn = (value, key) => Boolean(value) && Object.prototype.hasOwnProperty.call(value, key);

const getId = (value) => value?.listingId ?? value?.cityId ?? value?.userId ?? value?.id;

const upsertById = (items, entity) => {
  const id = getId(entity);
  if (id === undefined || id === null) {
    return asArray(items);
  }

  const currentItems = asArray(items);
  const index = currentItems.findIndex((item) => String(getId(item)) === String(id));
  if (index === -1) {
    return [entity, ...currentItems];
  }

  const nextItems = [...currentItems];
  nextItems[index] = { ...nextItems[index], ...entity };
  return nextItems;
};

const removeById = (items, entity) => {
  const id = getId(entity);
  return asArray(items).filter((item) => String(getId(item)) !== String(id));
};

const isDeleteEvent = (eventType) => /delete|remove/i.test(String(eventType || ''));

const isModeratedUser = (entity) =>
  hasOwn(entity, 'userId') &&
  hasOwn(entity, 'userCode') &&
  hasOwn(entity, 'accountStatus');

const isPendingListing = (entity) =>
  hasOwn(entity, 'listingId') &&
  hasOwn(entity, 'ownerUserCode');

const isAdminQuery = (entity) =>
  hasOwn(entity, 'adminUserCode') &&
  (hasOwn(entity, 'subject') || hasOwn(entity, 'replyMessage') || hasOwn(entity, 'message'));

const isFeedback = (entity) =>
  hasOwn(entity, 'id') &&
  hasOwn(entity, 'message') &&
  (hasOwn(entity, 'rating') || hasOwn(entity, 'published'));

const isHiringRequest = (entity) =>
  hasOwn(entity, 'id') &&
  hasOwn(entity, 'fullName') &&
  hasOwn(entity, 'email') &&
  hasOwn(entity, 'mobileNumber');

const isCity = (entity) =>
  hasOwn(entity, 'cityId') &&
  hasOwn(entity, 'cityName');

const recalcAdminStats = (state) => ({
  ...state.stats,
  totalStudents: asArray(state.students).length,
  totalOwners: asArray(state.owners).length,
  pendingReviewListings: asArray(state.pendingListings).length,
});

const recalcSuperStats = (state) => ({
  ...state.stats,
  totalStudents: asArray(state.students).length,
  totalOwners: asArray(state.owners).length,
  totalAdmins: asArray(state.admins).length,
});

export function applyAdminDashboardEvent(state, payload) {
  const entity = payload?.payload;
  if (!entity || typeof entity !== 'object') {
    return state;
  }

  let nextState = { ...state };

  if (isModeratedUser(entity)) {
    const isDeleted = String(entity.accountStatus || '').toUpperCase() === 'DELETED';
    nextState.students = isDeleted ? removeById(nextState.students, entity) : upsertById(nextState.students, entity);
    nextState.owners = isDeleted ? removeById(nextState.owners, entity) : upsertById(nextState.owners, entity);
    nextState.stats = recalcAdminStats(nextState);
    return nextState;
  }

  if (isPendingListing(entity)) {
    const existing = asArray(nextState.pendingListings).find((item) => String(item.listingId) === String(entity.listingId));
    nextState.pendingListings = String(entity.status || '').toUpperCase() === 'UNDER_REVIEW'
      ? upsertById(nextState.pendingListings, entity)
      : removeById(nextState.pendingListings, entity);
    nextState.stats = {
      ...recalcAdminStats(nextState),
      liveListings: Math.max(
        0,
        (nextState.stats?.liveListings ?? 0) + (
          existing && String(existing.status || '').toUpperCase() === 'UNDER_REVIEW' && String(entity.status || '').toUpperCase() === 'LIVE'
              ? 1
              : 0
        )
      ),
    };
    return nextState;
  }

  if (isAdminQuery(entity)) {
    nextState.myQueries = upsertById(nextState.myQueries, entity);
    return nextState;
  }

  return nextState;
}

export function applySuperAdminDashboardEvent(state, payload) {
  const entity = payload?.payload;
  if (!entity || typeof entity !== 'object') {
    return state;
  }

  let nextState = { ...state };

  if (isModeratedUser(entity)) {
    const isDeleted = String(entity.accountStatus || '').toUpperCase() === 'DELETED';
    nextState.admins = isDeleted ? removeById(nextState.admins, entity) : upsertById(nextState.admins, entity);
    nextState.students = isDeleted ? removeById(nextState.students, entity) : upsertById(nextState.students, entity);
    nextState.owners = isDeleted ? removeById(nextState.owners, entity) : upsertById(nextState.owners, entity);
    nextState.stats = recalcSuperStats(nextState);
    return nextState;
  }

  if (isCity(entity)) {
    nextState.cities = upsertById(nextState.cities, entity);
    return nextState;
  }

  if (isAdminQuery(entity)) {
    nextState.queries = upsertById(nextState.queries, entity);
    return nextState;
  }

  if (isHiringRequest(entity)) {
    nextState.hiringRequests = isDeleteEvent(payload?.eventType) || String(entity.status || '').toUpperCase() !== 'PENDING'
      ? removeById(nextState.hiringRequests, entity)
      : upsertById(nextState.hiringRequests, entity);
    return nextState;
  }

  if (isFeedback(entity)) {
    if (isDeleteEvent(payload?.eventType)) {
      nextState.feedbacksAuth = removeById(nextState.feedbacksAuth, entity);
      nextState.feedbacksUnauth = removeById(nextState.feedbacksUnauth, entity);
      return nextState;
    }

    if (hasOwn(entity, 'published') || hasOwn(entity, 'rating')) {
      nextState.feedbacksAuth = upsertById(nextState.feedbacksAuth, entity);
    } else {
      nextState.feedbacksUnauth = upsertById(nextState.feedbacksUnauth, entity);
    }
    return nextState;
  }

  return nextState;
}
