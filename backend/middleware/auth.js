// 인증 미들웨어
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

// 역할 기반 접근 제어
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

// 관리자 전용
const requireAdmin = requireRole(['admin']);

// 관리자 또는 매니저
const requireManager = requireRole(['admin', 'manager']);

module.exports = {
  requireAuth,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireManager
};