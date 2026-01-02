const jwt = require('jsonwebtoken');

exports.authenticateUser = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ error: 'Giriş tələb olunur' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token etibarsızdır' });
  }
};

exports.authenticateAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.adminToken;
    
    if (!token) {
      return res.status(401).json({ error: 'Admin girişi tələb olunur' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.adminId) {
      return res.status(403).json({ error: 'Admin icazəsi tələb olunur' });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token etibarsızdır' });
  }
};

exports.authenticateSuperAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.adminToken;
    
    if (!token) {
      return res.status(401).json({ error: 'Admin girişi tələb olunur' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.adminId || !decoded.isSuperAdmin) {
      return res.status(403).json({ error: 'Super admin icazəsi tələb olunur' });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token etibarsızdır' });
  }
};
