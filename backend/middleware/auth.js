const jwt = require('jsonwebtoken');

// JWT 토큰 기반 인증 미들웨어
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  // 토큰이 없으면 세션 기반 인증 확인 (기존 호환성 유지)
  if (!token) {
    if (req.session && req.session.user) {
      req.user = req.session.user;
      return next();
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: '로그인이 필요합니다.'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-key', (err, user) => {
    if (err) {
      console.error('JWT 토큰 검증 오류:', err);
      return res.status(403).json({
        error: 'Forbidden',
        message: '유효하지 않은 토큰입니다.'
      });
    }

    req.user = user;
    next();
  });
}

// 기존 세션 기반 인증 미들웨어 (호환성 유지)
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: '로그인이 필요합니다.'
    });
  }
  next();
}

// 옵셔널 인증 미들웨어 (로그인하지 않아도 접근 가능)
function optionalAuth(req, res, next) {
  // 세션에 사용자 정보가 있으면 req.user에 설정
  if (req.session.user) {
    req.user = req.session.user;
  }
  next();
}

// JWT 토큰 기반 역할 확인 미들웨어
const requireRoleToken = (allowedRoles = []) => {
  return (req, res, next) => {
    // 먼저 JWT 인증 확인
    authenticateToken(req, res, (err) => {
      if (err) return;

      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: '로그인이 필요합니다.'
        });
      }

      const userRole = req.user.role;
      
      // 관리자는 모든 권한을 가집니다
      if (userRole === 'admin') {
        return next();
      }

      // 허용된 역할 확인
      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: '권한이 없습니다.'
        });
      }

      next();
    });
  };
};

// 기존 세션 기반 역할 기반 접근 제어 (호환성 유지)
const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    const userRole = req.session.user.role;
    
    // 관리자는 모든 권한을 가집니다
    if (userRole === 'admin') {
      return next();
    }

    // 허용된 역할 확인
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: '권한이 없습니다.'
      });
    }

    next();
  };
};

// JWT 기반 관리자 전용
const requireAdminToken = requireRoleToken(['admin']);

// JWT 기반 관리자 또는 매니저
const requireManagerToken = requireRoleToken(['admin', 'manager']);

// 기존 세션 기반 (호환성 유지)
const requireAdmin = requireRole(['admin']);
const requireManager = requireRole(['admin', 'manager']);

module.exports = {
  authenticateToken,
  requireRoleToken,
  requireAdminToken,
  requireManagerToken,
  requireAuth,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireManager
};