function humanize(value) {
  return (value || '')
    .toString()
    .replace(/\[(\d+)\]/g, ' $1 ')
    .split('.')
    .join(' ')
    .split('_')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function toBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['true', '1', 'yes', 'verified', 'success'].includes(normalized);
  }
  return null;
}

function findVerificationFlag(node) {
  if (!node || typeof node !== 'object') {
    return null;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      const nested = findVerificationFlag(item);
      if (nested !== null) {
        return nested;
      }
    }
    return null;
  }

  for (const key of ['verified', 'is_verified', 'success']) {
    if (Object.prototype.hasOwnProperty.call(node, key)) {
      const value = toBoolean(node[key]);
      if (value !== null) {
        return value;
      }
    }
  }

  for (const value of Object.values(node)) {
    const nested = findVerificationFlag(value);
    if (nested !== null) {
      return nested;
    }
  }

  return null;
}

function collectFailureReasons(node, path = '', reasons = []) {
  if (node === null || node === undefined || node === '') {
    return reasons;
  }

  if (Array.isArray(node)) {
    node.forEach(item => collectFailureReasons(item, path, reasons));
    return reasons;
  }

  if (typeof node === 'object') {
    const entries = Object.entries(node);
    const nestedEntries = entries.filter(([, value]) => value && typeof value === 'object');
    const scalarEntries = entries.filter(([, value]) => !value || typeof value !== 'object');

    if (path && scalarEntries.length > 0 && nestedEntries.length === 0) {
      const details = scalarEntries.flatMap(([key, value]) => {
        if (value === null || value === undefined || value === '' || value === true) {
          return [];
        }
        if (value === false) {
          return [humanize(key)];
        }
        return [`${humanize(key)}: ${String(value)}`];
      });

      if (details.length > 0) {
        reasons.push(`${humanize(path)} - ${details.join(', ')}`);
        return reasons;
      }
    }

    entries.forEach(([key, value]) => {
      collectFailureReasons(value, path ? `${path}.${key}` : key, reasons);
    });
    return reasons;
  }

  if (typeof node === 'boolean') {
    if (!node && path) {
      reasons.push(humanize(path));
    }
    return reasons;
  }

  reasons.push(path ? `${humanize(path)}: ${String(node)}` : String(node));
  return reasons;
}

function dedupe(values) {
  return [...new Set(values.map(value => value.trim()).filter(Boolean))];
}

export function prepareVerificationDisplay(result) {
  if (!result) {
    return null;
  }

  const nestedVerified = findVerificationFlag(result.rawResponse);
  const verified = toBoolean(result.verified) ?? nestedVerified ?? false;
  const failedReasons = verified ? [] : dedupe(collectFailureReasons(result.rejectedParameters));
  const fallbackReasons = !verified && failedReasons.length === 0 && result.message ? [result.message] : [];

  return {
    ...result,
    verified,
    status: verified ? 'SUCCESS' : (result.status || 'FAILED'),
    failedReasons: failedReasons.length > 0 ? failedReasons : fallbackReasons,
  };
}
