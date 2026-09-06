const DEFAULT_SUPER_ADMIN_EMAILS = ['shahaadi285@gmail.com'];

const normalizeEmail = (value) =>
  String(value || '')
    .trim()
    .toLowerCase();

const getConfiguredSuperAdminEmails = () =>
  String(process.env.SUPER_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => normalizeEmail(email))
    .filter(Boolean);

const getSuperAdminEmails = () =>
  Array.from(new Set([...DEFAULT_SUPER_ADMIN_EMAILS, ...getConfiguredSuperAdminEmails()]));

const isSuperAdminEmail = (email) => {
  const normalizedEmail = normalizeEmail(email);
  return normalizedEmail ? getSuperAdminEmails().includes(normalizedEmail) : false;
};

const getAccessProfile = (email, requestedRole = 'user') => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedRequestedRole = requestedRole === 'admin' ? 'admin' : 'user';
  const isSuperAdmin = isSuperAdminEmail(normalizedEmail);
  const role = isSuperAdmin ? 'admin' : normalizedRequestedRole;

  return {
    email: normalizedEmail,
    isSuperAdmin,
    role,
    accessLevel: isSuperAdmin ? 'super-admin' : role,
  };
};

module.exports = {
  getAccessProfile,
  getSuperAdminEmails,
  isSuperAdminEmail,
  normalizeEmail,
};
