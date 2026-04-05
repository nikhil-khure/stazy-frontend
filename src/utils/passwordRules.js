export const PASSWORD_RULES = [
  'Minimum 8 characters',
  'At least 1 uppercase letter',
  'At least 1 number',
  'At least 1 special symbol',
];

export function validatePassword(password) {
  const value = password || '';
  const checks = {
    minLength: value.length >= 8,
    uppercase: /[A-Z]/.test(value),
    number: /\d/.test(value),
    special: /[^A-Za-z0-9]/.test(value),
  };

  return {
    valid: Object.values(checks).every(Boolean),
    checks,
    message: 'Password must be at least 8 characters and include an uppercase letter, a number, and a special symbol.',
  };
}
