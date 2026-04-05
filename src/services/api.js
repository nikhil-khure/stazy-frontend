import { clearSession, getStoredSession, saveSession } from './session';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

function buildUrl(path, query) {
  const url = new URL(path, API_BASE_URL);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }
  return url.toString();
}

function mapRole(role) {
  switch ((role || '').toUpperCase()) {
    case 'STUDENT':
      return 'student';
    case 'OWNER':
      return 'owner';
    case 'ADMIN':
      return 'admin';
    case 'SUPER_ADMIN':
      return 'superAdmin';
    default:
      return 'guest';
  }
}

function mapAuthUser(user) {
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    userCode: user.userCode,
    name: user.displayName,
    role: mapRole(user.role),
    roleCode: user.role,
    email: user.email,
    profileComplete: Boolean(user.profileComplete),
    completionPercentage: user.completionPercentage || 0,
    identityVerified: Boolean(user.identityVerified),
  };
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    return { message: text };
  }
}

async function refreshAccessToken() {
  const session = getStoredSession();
  if (!session?.refreshToken) {
    throw new Error('Session expired. Please sign in again.');
  }

  const response = await fetch(buildUrl('/api/auth/refresh'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });

  const payload = await parseResponse(response);
  if (!response.ok || !payload?.data) {
    clearSession();
    throw new Error(payload?.message || 'Session expired. Please sign in again.');
  }

  const updatedSession = {
    accessToken: payload.data.accessToken,
    refreshToken: payload.data.refreshToken,
    user: mapAuthUser(payload.data.user),
  };
  saveSession(updatedSession);
  return updatedSession.accessToken;
}

export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    body,
    query,
    auth = false,
    isFormData = false,
  } = options;

  const session = getStoredSession();
  const headers = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (auth && session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`;
  }

  const requestInit = {
    method,
    headers,
  };

  if (body !== undefined) {
    requestInit.body = isFormData ? body : JSON.stringify(body);
  }

  let response = await fetch(buildUrl(path, query), requestInit);
  let payload = await parseResponse(response);

  if (response.status === 401 && auth && session?.refreshToken) {
    const accessToken = await refreshAccessToken();
    response = await fetch(buildUrl(path, query), {
      ...requestInit,
      headers: {
        ...headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    payload = await parseResponse(response);
  }

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Request failed.');
  }

  return payload?.data ?? payload;
}

export async function fetchAuthorizedBlob(path, options = {}) {
  const { query } = options;
  const session = getStoredSession();
  if (!session?.accessToken) {
    throw new Error('Session expired. Please sign in again.');
  }

  let response = await fetch(buildUrl(path, query), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  });

  if (response.status === 401 && session?.refreshToken) {
    const accessToken = await refreshAccessToken();
    response = await fetch(buildUrl(path, query), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  if (!response.ok) {
    const payload = await parseResponse(response);
    throw new Error(payload?.message || payload?.error || 'Request failed.');
  }

  return response.blob();
}

export function createSessionFromTokenResponse(tokenResponse) {
  return {
    accessToken: tokenResponse.accessToken,
    refreshToken: tokenResponse.refreshToken,
    user: mapAuthUser(tokenResponse.user),
  };
}

export function createMultipartForm(data) {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(item => {
        if (item !== undefined && item !== null) {
          formData.append(key, item);
        }
      });
      return;
    }
    formData.append(key, value);
  });
  return formData;
}

export async function bootstrapCurrentUser() {
  const session = getStoredSession();
  if (!session?.accessToken) {
    return null;
  }
  try {
    const currentUser = await apiRequest('/api/users/me', { auth: true });
    const updatedSession = {
      ...session,
      user: {
        ...session.user,
        userCode: currentUser.userCode,
        name: currentUser.displayName,
        email: currentUser.email,
        role: mapRole(currentUser.role),
        roleCode: currentUser.role,
        profileComplete: currentUser.profileComplete,
        completionPercentage: currentUser.completionPercentage,
        identityVerified: currentUser.identityVerified,
        profilePhotoUrl: currentUser.profilePhotoUrl,
        mobileNumber: currentUser.mobileNumber,
      },
    };
    saveSession(updatedSession);
    return updatedSession.user;
  } catch (error) {
    clearSession();
    return null;
  }
}

export async function uploadMedia(file, usage = 'general') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('usage', usage);
  return apiRequest('/api/media/upload', {
    method: 'POST',
    auth: true,
    isFormData: true,
    body: formData,
  });
}
