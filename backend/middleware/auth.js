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

module.exports = {
  requireAuth,
  optionalAuth
};