const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

// 회원가입
async function register(req, res) {
  try {
    const { username, password, name, phone, company } = req.body;

    // 유효성 검증
    if (!username || !password || !name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '필수 필드가 누락되었습니다.'
      });
    }

    // 아이디 중복 확인
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: '이미 사용 중인 아이디입니다.'
      });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const [result] = await pool.execute(
      'INSERT INTO users (username, password, name, phone, company) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, name, phone || null, company || null]
    );

    res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      userId: result.insertId
    });

  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '회원가입 처리 중 오류가 발생했습니다.'
    });
  }
}

// 아이디 중복 확인
async function checkUsername(req, res) {
  try {
    const { username } = req.params;

    const [users] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    res.json({
      available: users.length === 0,
      message: users.length === 0 ? '사용 가능한 아이디입니다.' : '이미 사용 중인 아이디입니다.'
    });

  } catch (error) {
    console.error('아이디 확인 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '아이디 확인 중 오류가 발생했습니다.'
    });
  }
}

// 로그인
async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '아이디와 비밀번호를 입력해주세요.'
      });
    }

    // 사용자 조회 (비밀번호는 별도로 검증)
    const [users] = await pool.execute(
      'SELECT id, username, password, name, phone, company, role, is_active, created_at FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '아이디 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    const user = users[0];

    // 비밀번호 검증
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '아이디 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    // 계정 비활성화 확인
    if (!user.is_active) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '비활성화된 계정입니다. 관리자에게 문의하세요.'
      });
    }

    // 마지막 로그인 시간 업데이트
    await pool.execute(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // 세션에 사용자 정보 저장
    req.session.user = {
      id: user.id,
      username: user.username,
      name: user.name,
      phone: user.phone,
      company: user.company,
      role: user.role
    };

    res.json({
      message: '로그인 성공',
      user: req.session.user
    });

  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '로그인 처리 중 오류가 발생했습니다.'
    });
  }
}

// 로그아웃
async function logout(req, res) {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          error: 'Internal Server Error',
          message: '로그아웃 처리 중 오류가 발생했습니다.'
        });
      }

      res.json({ message: '로그아웃되었습니다.' });
    });

  } catch (error) {
    console.error('로그아웃 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '로그아웃 처리 중 오류가 발생했습니다.'
    });
  }
}

// 현재 사용자 정보
async function me(req, res) {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    res.json({
      user: req.session.user,
      authenticated: true
    });

  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '사용자 정보 조회 중 오류가 발생했습니다.'
    });
  }
}

module.exports = {
  register,
  checkUsername,
  login,
  logout,
  me
};