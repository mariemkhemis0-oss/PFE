import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    // Try to get user from session or other sources
    if (req.user) {
      return next();
    }
    return res.status(401).json({ error: 'Pas d\'authentification fournie' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cyberaudit_secret_key');
    // Set the user object with userId from the decoded token
    // Normaliser le rôle en UPPERCASE pour éviter les bugs de casse
    req.user = {
      id: decoded.id || decoded.userId,
      _id: decoded.id || decoded.userId,
      userId: decoded.id || decoded.userId,
      role: (decoded.role || '').toUpperCase(),
      email: decoded.email,
    };
    next();
  } catch (error) {
    console.error('JWT verification error:', error.message);
    res.status(401).json({ error: 'Token invalide ou expiré' });
  }
};

// Middleware d'autorisation par rôle
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'Non authentifié' });
    }
    const userRole = req.user.role.toUpperCase();
    const allowedRoles = roles.map(r => r.toUpperCase());
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: `Accès refusé. Rôle requis: ${allowedRoles.join(' ou ')}` });
    }
    next();
  };
};
