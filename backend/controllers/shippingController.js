const { pool, generateTrackingNumber } = require('../config/database');

/**
 * 새로운 배송 접수를 생성하는 함수
 * @param {Object} req - Express 요청 객체
 * @param {Object} req.session - Express 세션 객체
 * @param {Object} req.session.user - 로그인된 사용자 정보
 * @param {Object} req.body - 배송 접수 데이터 (26개 필드)
 * @param {string} req.body.sender_name - 발송인 이름
 * @param {string} req.body.sender_phone - 발송인 전화번호
 * @param {string} req.body.sender_address - 발송인 주소
 * @param {string} req.body.receiver_name - 수취인 이름
 * @param {string} req.body.receiver_phone - 수취인 전화번호
 * @param {string} req.body.receiver_address - 수취인 주소
 * @param {Object} res - Express 응답 객체
 * @returns {Promise<void>} JSON 응답 (생성된 주문 정보)
 */
async function createShippingOrder(req, res) {
  try {
    // JWT 또는 세션 기반 인증 지원
    const user = req.user || req.session?.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    const {
      // 발송인 정보 (7개)
      sender_name, sender_phone, sender_email, sender_company,
      sender_address, sender_detail_address, sender_zipcode,
      
      // 수취인 정보 (7개)
      receiver_name, receiver_phone, receiver_email, receiver_company,
      receiver_address, receiver_detail_address, receiver_zipcode,
      
      // 배송 정보 (8개)
      package_type, package_weight, package_size, package_value,
      delivery_type, delivery_date, delivery_time, package_description,
      
      // 특수 옵션 (4개)
      is_fragile, is_frozen, requires_signature, insurance_amount,
      
      // 추가 메모
      delivery_memo, special_instructions
    } = req.body;

    // 필수 필드 검증
    const requiredFields = [
      'sender_name', 'sender_phone', 'sender_address', 'sender_zipcode',
      'receiver_name', 'receiver_phone', 'receiver_address', 'receiver_zipcode'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `필수 필드가 누락되었습니다: ${missingFields.join(', ')}`
      });
    }

    // 운송장 번호 생성
    const tracking_number = generateTrackingNumber();

    // 배송 접수 생성
    const [result] = await pool.execute(`
      INSERT INTO shipping_orders (
        user_id, tracking_number,
        
        sender_name, sender_phone, sender_email, sender_company,
        sender_address, sender_detail_address, sender_zipcode,
        
        receiver_name, receiver_phone, receiver_email, receiver_company,
        receiver_address, receiver_detail_address, receiver_zipcode,
        
        package_type, package_weight, package_size, package_value,
        delivery_type, delivery_date, delivery_time, package_description,
        
        is_fragile, is_frozen, requires_signature, insurance_amount,
        
        delivery_memo, special_instructions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      user.id, tracking_number,
      
      sender_name, sender_phone, sender_email || null, sender_company || null,
      sender_address, sender_detail_address || null, sender_zipcode,
      
      receiver_name, receiver_phone, receiver_email || null, receiver_company || null,
      receiver_address, receiver_detail_address || null, receiver_zipcode,
      
      package_type || '소포', package_weight || null, package_size || null, package_value || null,
      delivery_type || '일반', delivery_date || null, delivery_time || null, package_description || null,
      
      is_fragile || false, is_frozen || false, requires_signature || false, insurance_amount || 0,
      
      delivery_memo || null, special_instructions || null
    ]);

    res.status(201).json({
      message: '배송 접수가 완료되었습니다.',
      orderId: result.insertId,
      trackingNumber: tracking_number,
      status: '접수완료'
    });

  } catch (error) {
    console.error('배송 접수 생성 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '배송 접수 처리 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 사용자별 배송 접수 목록을 페이지네이션으로 조회하는 함수
 * @param {Object} req - Express 요청 객체
 * @param {Object} req.query - 쿼리 파라미터
 * @param {number} [req.query.page=1] - 페이지 번호
 * @param {number} [req.query.limit=10] - 페이지당 항목 수
 * @param {Object} req.session - Express 세션 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Promise<void>} JSON 응답 (주문 목록과 페이지네이션 정보)
 */
async function getShippingOrders(req, res) {
  try {
    // JWT 또는 세션 기반 인증 지원
    const user = req.user || req.session?.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // 총 개수 조회
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM shipping_orders WHERE user_id = ?',
      [user.id]
    );
    const total = countResult[0].total;

    // 배송 접수 목록 조회
    const [orders] = await pool.execute(`
      SELECT 
        id, tracking_number, status,
        sender_name, receiver_name,
        package_type, delivery_type,
        created_at, updated_at
      FROM shipping_orders 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [user.id, limit, offset]);

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('배송 접수 목록 조회 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '배송 접수 목록 조회 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 특정 배송 접수의 상세 정보를 조회하는 함수
 * @param {Object} req - Express 요청 객체
 * @param {Object} req.params - URL 파라미터
 * @param {string} req.params.id - 배송 접수 ID
 * @param {Object} req.session - Express 세션 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Promise<void>} JSON 응답 (배송 접수 상세 정보)
 */
async function getShippingOrder(req, res) {
  try {
    // JWT 또는 세션 기반 인증 지원
    const user = req.user || req.session?.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    const { id } = req.params;

    const [orders] = await pool.execute(
      'SELECT * FROM shipping_orders WHERE id = ? AND user_id = ?',
      [id, user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '배송 접수를 찾을 수 없습니다.'
      });
    }

    res.json({ order: orders[0] });

  } catch (error) {
    console.error('배송 접수 상세 조회 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '배송 접수 상세 조회 중 오류가 발생했습니다.'
    });
  }
}

// 운송장 번호로 배송 추적 (공개 API)
async function trackShipment(req, res) {
  try {
    const { trackingNumber } = req.params;

    const [orders] = await pool.execute(`
      SELECT 
        tracking_number, status, 
        sender_name, receiver_name, receiver_address,
        package_type, delivery_type,
        created_at, updated_at
      FROM shipping_orders 
      WHERE tracking_number = ?
    `, [trackingNumber]);

    if (orders.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '해당 운송장 번호를 찾을 수 없습니다.'
      });
    }

    res.json({ 
      tracking: orders[0],
      message: '배송 정보가 조회되었습니다.'
    });

  } catch (error) {
    console.error('배송 추적 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '배송 추적 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 배송 접수의 상태를 업데이트하는 함수
 * @param {Object} req - Express 요청 객체
 * @param {Object} req.params - URL 파라미터
 * @param {string} req.params.id - 배송 접수 ID
 * @param {Object} req.body - 요청 본문
 * @param {string} req.body.status - 새로운 상태값 (접수완료, 배송준비, 배송중, 배송완료, 취소, 반송)
 * @param {Object} req.session - Express 세션 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Promise<void>} JSON 응답 (업데이트된 주문 정보)
 */
async function updateShippingOrderStatus(req, res) {
  try {
    // JWT 또는 세션 기반 인증 지원
    const user = req.user || req.session?.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    const { id } = req.params;
    const { status } = req.body;
    
    console.log('상태 업데이트 요청:', { id, status, userId: req.session?.user?.id });

    // 유효한 상태값 확인
    const validStatuses = ['접수완료', '배송준비', '배송중', '배송완료', '취소', '반송'];
    if (!validStatuses.includes(status)) {
      console.log('유효하지 않은 상태값:', status, '유효한 값:', validStatuses);
      return res.status(400).json({
        error: 'Bad Request',
        message: '유효하지 않은 상태값입니다.'
      });
    }

    // 주문이 존재하는지 확인 (관리자는 모든 주문에 접근 가능)
    const [existingOrder] = await pool.execute(
      'SELECT id FROM shipping_orders WHERE id = ?',
      [id]
    );

    if (existingOrder.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '주문을 찾을 수 없습니다.'
      });
    }

    // 상태 업데이트
    const [updateResult] = await pool.execute(
      'UPDATE shipping_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
    
    console.log('업데이트 결과:', updateResult);

    // 업데이트된 주문 정보 반환
    const [updatedOrder] = await pool.execute(
      'SELECT * FROM shipping_orders WHERE id = ?',
      [id]
    );
    
    console.log('업데이트된 주문:', updatedOrder[0]?.status);

    res.json({
      message: '주문 상태가 성공적으로 업데이트되었습니다.',
      order: updatedOrder[0]
    });

  } catch (error) {
    console.error('배송 접수 상태 업데이트 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '상태 업데이트 중 오류가 발생했습니다.'
    });
  }
}

// 운송장 번호로 배송 추적 (공개 API)
async function trackShipment(req, res) {
  try {
    const { trackingNumber } = req.params;

    if (!trackingNumber) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '운송장 번호가 필요합니다.'
      });
    }

    // 운송장 번호로 주문 조회 (공개 정보만)
    const [orders] = await pool.execute(`
      SELECT 
        id, tracking_number, status, tracking_company, estimated_delivery,
        sender_name, sender_phone, receiver_name, receiver_phone,
        CONCAT(receiver_address, ' ', COALESCE(receiver_detail_address, '')) as recipient_address_full, 
        package_description as product_name, package_weight as product_weight, package_value as product_value,
        created_at, updated_at
      FROM shipping_orders 
      WHERE tracking_number = ?
    `, [trackingNumber]);

    if (orders.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '해당 운송장 번호를 찾을 수 없습니다.'
      });
    }

    const order = orders[0];
    
    // 배송 상태 히스토리 생성 (실제로는 별도 테이블이 필요하지만 간단히 구현)
    const statusHistory = [
      {
        status: '접수완료',
        timestamp: order.created_at,
        location: '집하점',
        description: '배송 접수가 완료되었습니다.'
      }
    ];

    if (['배송준비', '배송중', '배송완료'].includes(order.status)) {
      statusHistory.push({
        status: '배송준비',
        timestamp: order.updated_at,
        location: '물류센터',
        description: '배송 준비 중입니다.'
      });
    }

    if (['배송중', '배송완료'].includes(order.status)) {
      statusHistory.push({
        status: '배송중',
        timestamp: order.updated_at,
        location: '배송 중',
        description: '상품이 배송 중입니다.'
      });
    }

    if (order.status === '배송완료') {
      statusHistory.push({
        status: '배송완료',
        timestamp: order.updated_at,
        location: '수취인',
        description: '배송이 완료되었습니다.'
      });
    }

    res.json({
      trackingNumber: order.tracking_number,
      currentStatus: order.status,
      trackingCompany: order.tracking_company,
      estimatedDelivery: order.estimated_delivery,
      orderInfo: {
        senderName: order.sender_name,
        recipientName: order.receiver_name,
        recipientAddress: order.recipient_address_full,
        productName: order.product_name,
        weight: order.product_weight,
        value: order.product_value
      },
      statusHistory
    });

  } catch (error) {
    console.error('배송 추적 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '배송 추적 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 관리자가 배송 접수에 운송장 번호를 할당하는 함수
 * @param {Object} req - Express 요청 객체
 * @param {Object} req.params - URL 파라미터
 * @param {string} req.params.id - 배송 접수 ID
 * @param {Object} req.body - 요청 본문
 * @param {string} req.body.tracking_number - 운송장 번호
 * @param {string} [req.body.tracking_company] - 운송회사
 * @param {string} [req.body.estimated_delivery] - 예상 배송일
 * @param {Object} req.session - Express 세션 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Promise<void>} JSON 응답 (할당 완료 메시지)
 */
async function assignTrackingNumber(req, res) {
  try {
    const { id } = req.params;
    const { tracking_number, tracking_company, estimated_delivery } = req.body;

    if (!tracking_number) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '운송장 번호가 필요합니다.'
      });
    }

    // 운송장 번호 중복 확인
    const [existingTracking] = await pool.execute(
      'SELECT id FROM shipping_orders WHERE tracking_number = ? AND id != ?',
      [tracking_number, id]
    );

    if (existingTracking.length > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '이미 사용 중인 운송장 번호입니다.'
      });
    }

    // 주문 존재 확인
    const [orders] = await pool.execute(
      'SELECT id FROM shipping_orders WHERE id = ?',
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '주문을 찾을 수 없습니다.'
      });
    }

    // 운송장 번호 및 배송 정보 업데이트
    await pool.execute(`
      UPDATE shipping_orders 
      SET tracking_number = ?, tracking_company = ?, estimated_delivery = ?, 
          status = '배송준비', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [tracking_number, tracking_company || null, estimated_delivery || null, id]);

    // 활동 로그 기록
    const { logUserActivity } = require('./userController');
    await logUserActivity(user.id, 'assign_tracking', 'shipping_order', id, {
      tracking_number,
      tracking_company,
      estimated_delivery
    }, req);

    res.json({
      message: '운송장 번호가 성공적으로 할당되었습니다.',
      tracking_number
    });

  } catch (error) {
    console.error('운송장 번호 할당 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '운송장 번호 할당 중 오류가 발생했습니다.'
    });
  }
}

module.exports = {
  createShippingOrder,
  getShippingOrders,
  getShippingOrder,
  updateShippingOrderStatus,
  trackShipment,
  assignTrackingNumber
};