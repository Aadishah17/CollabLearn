const Admin = require('../models/Admin');
const User = require('../models/User');
const { getAccessProfile } = require('../config/access');
const { applyAuthContext } = require('../config/auth');

const resolveAuthenticatedAccount = async (decoded = {}) => {
  const userId = String(decoded.userId || '').trim();
  if (!userId) {
    return null;
  }

  const user = await User.findById(userId).select('_id email isActive');
  if (user) {
    const accessProfile = getAccessProfile(user.email, 'user');

    return {
      account: user,
      accountType: 'user',
      role: accessProfile.role,
      isSuperAdmin: accessProfile.isSuperAdmin,
    };
  }

  const admin = await Admin.findById(userId).select('_id email isActive');
  if (admin) {
    const accessProfile = getAccessProfile(admin.email, 'admin');

    return {
      account: admin,
      accountType: 'admin',
      role: 'admin',
      isSuperAdmin: accessProfile.isSuperAdmin,
    };
  }

  return null;
};

const applyResolvedAuthContext = (req, decoded, source, resolvedAccount) => {
  const normalizedDecoded = {
    ...decoded,
    userId: String(resolvedAccount.account._id),
    email: resolvedAccount.account.email,
    role: resolvedAccount.role,
    isSuperAdmin: resolvedAccount.isSuperAdmin,
  };

  applyAuthContext(req, normalizedDecoded, source);
  req.accountType = resolvedAccount.accountType;
  return req;
};

module.exports = {
  applyResolvedAuthContext,
  resolveAuthenticatedAccount,
};
