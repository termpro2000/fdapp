const { pool, generateTrackingNumber } = require('../config/database');

// 배송 접수 생성
async function createShippingOrder(req, res) {
  try {
    if (!req.session.user) {
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
      req.session.user.id, tracking_number,
      
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

// 사용자별 배송 접수 목록 조회
async function getShippingOrders(req, res) {
  try {
    if (!req.session.user) {
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
      [req.session.user.id]
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
    `, [req.session.user.id, limit, offset]);

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

// 특정 배송 접수 상세 조회
async function getShippingOrder(req, res) {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    const { id } = req.params;

    const [orders] = await pool.execute(
      'SELECT * FROM shipping_orders WHERE id = ? AND user_id = ?',
      [id, req.session.user.id]
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

// 배송 접수 상태 업데이트
async function updateShippingOrderStatus(req, res) {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    // 유효한 상태값 확인
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '유효하지 않은 상태값입니다.'
      });
    }

    // 주문이 해당 사용자의 것인지 확인
    const [existingOrder] = await pool.execute(
      'SELECT id FROM shipping_orders WHERE id = ? AND user_id = ?',
      [id, req.session.user.id]
    );

    if (existingOrder.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '주문을 찾을 수 없습니다.'
      });
    }

    // 상태 업데이트
    await pool.execute(
      'UPDATE shipping_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [status, id, req.session.user.id]
    );

    // 업데이트된 주문 정보 반환
    const [updatedOrder] = await pool.execute(
      'SELECT * FROM shipping_orders WHERE id = ? AND user_id = ?',
      [id, req.session.user.id]
    );

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

module.exports = {
  createShippingOrder,
  getShippingOrders,
  getShippingOrder,
  updateShippingOrderStatus,
  trackShipment
};