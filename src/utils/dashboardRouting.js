export function getDashboardPageForUser(user) {
  switch (user?.role) {
    case 'student':
      return 'studentDash';
    case 'owner':
      return 'ownerDash';
    case 'admin':
      return 'adminDash';
    case 'superAdmin':
      return 'superAdminDash';
    default:
      return null;
  }
}

export function isDashboardPage(page) {
  return ['studentDash', 'ownerDash', 'adminDash', 'superAdminDash'].includes(page);
}
