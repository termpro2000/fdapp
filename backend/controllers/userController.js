const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

// 모든 사용자 목록 조회 (관리자/매니저만)
async function getAllUsers(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role || '';

    // 검색 조건 구성
    let whereClause = 'WHERE 1=1';
    let queryParams = [];

    if (search) {
      whereClause += ' AND (username LIKE ? OR name LIKE ? OR company LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
      whereClause += ' AND role = ?';
      queryParams.push(role);
    }

    // 전체 사용자 수 조회
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    // 사용자 목록 조회
    const [users] = await pool.execute(`
      SELECT 
        id, username, name, phone, company, role, is_active, 
        last_login, created_at, updated_at
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '사용자 목록 조회 중 오류가 발생했습니다.'
    });
  }
}

// 특정 사용자 조회
async function getUser(req, res) {
  try {
    const { id } = req.params;

    const [users] = await pool.execute(
      'SELECT id, username, name, phone, company, role, is_active, last_login, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    res.json({ user: users[0] });

  } catch (error) {
    console.error('사용자 조회 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '사용자 조회 중 오류가 발생했습니다.'
    });
  }
}

// 사용자 생성 (관리자만)
async function createUser(req, res) {
  try {
    const { username, password, name, phone, company, role = 'user' } = req.body;

    // 유효성 검사
    if (!username || !password || !name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '사용자명, 비밀번호, 이름은 필수입니다.'
      });
    }

    // 사용자명 중복 확인
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '이미 존재하는 사용자명입니다.'
      });
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성 (undefined를 null로 변환)
    const [result] = await pool.execute(`
      INSERT INTO users (username, password, name, phone, company, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      username, 
      hashedPassword, 
      name, 
      phone || null, 
      company || null, 
      role
    ]);

    // 활동 로그 기록
    await logUserActivity(req.session.user.id, 'create_user', 'user', result.insertId, {
      target_username: username,
      target_name: name,
      target_role: role
    }, req);

    res.status(201).json({
      message: '사용자가 성공적으로 생성되었습니다.',
      userId: result.insertId
    });

  } catch (error) {
    console.error('사용자 생성 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '사용자 생성 중 오류가 발생했습니다.'
    });
  }
}

// 사용자 정보 업데이트
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, phone, company, role, is_active, password } = req.body;

    // 사용자 존재 확인
    const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    const currentUser = users[0];
    let updateFields = [];
    let updateValues = [];

    // 업데이트할 필드들
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (company !== undefined) {
      updateFields.push('company = ?');
      updateValues.push(company);
    }
    if (role !== undefined && req.session.user.role === 'admin') {
      updateFields.push('role = ?');
      updateValues.push(role);
    }
    if (is_active !== undefined && req.session.user.role === 'admin') {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '업데이트할 필드가 없습니다.'
      });
    }

    // 업데이트 실행
    updateValues.push(id);
    await pool.execute(
      `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    // 활동 로그 기록
    await logUserActivity(req.session.user.id, 'update_user', 'user', id, {
      target_username: currentUser.username,
      changes: { name, phone, company, role, is_active, password: password ? '[변경됨]' : undefined }
    }, req);

    res.json({
      message: '사용자 정보가 성공적으로 업데이트되었습니다.'
    });

  } catch (error) {
    console.error('사용자 업데이트 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '사용자 업데이트 중 오류가 발생했습니다.'
    });
  }
}

// 사용자 삭제 (관리자만)
async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    // 자기 자신은 삭제할 수 없음
    if (parseInt(id) === req.session.user.id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '자기 자신은 삭제할 수 없습니다.'
      });
    }

    // 사용자 존재 확인
    const [users] = await pool.execute('SELECT username FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    const targetUsername = users[0].username;

    // 사용자 삭제 (CASCADE로 관련 데이터도 삭제됨)
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    // 활동 로그 기록
    await logUserActivity(req.session.user.id, 'delete_user', 'user', id, {
      target_username: targetUsername
    }, req);

    res.json({
      message: '사용자가 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('사용자 삭제 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '사용자 삭제 중 오류가 발생했습니다.'
    });
  }
}

// 사용자 활동 로그 조회
async function getUserActivities(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const userId = req.query.user_id;
    const action = req.query.action;

    let whereClause = 'WHERE 1=1';
    let queryParams = [];

    if (userId) {
      whereClause += ' AND a.user_id = ?';
      queryParams.push(userId);
    }

    if (action) {
      whereClause += ' AND a.action = ?';
      queryParams.push(action);
    }

    // 전체 활동 수 조회
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM user_activities a ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    // 활동 목록 조회
    const [activities] = await pool.execute(`
      SELECT 
        a.id, a.action, a.target_type, a.target_id, a.details, 
        a.ip_address, a.created_at,
        u.username, u.name as user_name
      FROM user_activities a
      LEFT JOIN users u ON a.user_id = u.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);

    res.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('활동 로그 조회 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '활동 로그 조회 중 오류가 발생했습니다.'
    });
  }
}

// 사용자 활동 로그 기록 함수
async function logUserActivity(userId, action, targetType = null, targetId = null, details = null, req = null) {
  try {
    const ipAddress = req ? (req.ip || req.connection.remoteAddress || req.socket.remoteAddress) : null;
    const userAgent = req ? req.get('User-Agent') : null;

    await pool.execute(`
      INSERT INTO user_activities (user_id, action, target_type, target_id, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, action, targetType, targetId, details ? JSON.stringify(details) : null, ipAddress, userAgent]);

  } catch (error) {
    console.error('활동 로그 기록 실패:', error);
    // 활동 로그 실패는 메인 기능에 영향을 주지 않도록 에러를 던지지 않음
  }
}

module.exports = {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserActivities,
  logUserActivity
};