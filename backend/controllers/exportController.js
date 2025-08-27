const { pool } = require('../config/database');
const XLSX = require('xlsx');
const { Parser } = require('json2csv');

// Excel 형태로 주문 데이터 내보내기
async function exportOrdersToExcel(req, res) {
  try {
    const {
      startDate,
      endDate,
      status,
      userId,
      format = 'xlsx'
    } = req.query;

    // 기본 쿼리
    let whereConditions = ['1=1'];
    let queryParams = [];

    // 날짜 필터
    if (startDate) {
      whereConditions.push('DATE(created_at) >= ?');
      queryParams.push(startDate);
    }
    if (endDate) {
      whereConditions.push('DATE(created_at) <= ?');
      queryParams.push(endDate);
    }

    // 상태 필터
    if (status && status !== 'all') {
      whereConditions.push('status = ?');
      queryParams.push(status);
    }

    // 사용자 필터 (일반 사용자는 자신의 주문만)
    if (req.session.user.role === 'user') {
      whereConditions.push('user_id = ?');
      queryParams.push(req.session.user.id);
    } else if (userId) {
      whereConditions.push('user_id = ?');
      queryParams.push(userId);
    }

    const whereClause = whereConditions.join(' AND ');

    // 주문 데이터 조회
    const [orders] = await pool.execute(`
      SELECT 
        o.id as '주문번호',
        o.status as '배송상태',
        o.tracking_number as '운송장번호',
        o.tracking_company as '택배회사',
        DATE_FORMAT(o.created_at, '%Y-%m-%d %H:%i:%s') as '접수일시',
        DATE_FORMAT(o.updated_at, '%Y-%m-%d %H:%i:%s') as '수정일시',
        o.estimated_delivery as '예상배송일',
        
        -- 발송인 정보
        o.sender_name as '발송인명',
        o.sender_phone as '발송인전화번호',
        o.sender_email as '발송인이메일',
        o.sender_company as '발송인회사',
        CONCAT(o.sender_address, ' ', COALESCE(o.sender_detail_address, '')) as '발송인주소',
        o.sender_zipcode as '발송인우편번호',
        
        -- 수취인 정보
        o.receiver_name as '수취인명',
        o.receiver_phone as '수취인전화번호',
        o.receiver_email as '수취인이메일',
        o.receiver_company as '수취인회사',
        CONCAT(o.receiver_address, ' ', COALESCE(o.receiver_detail_address, '')) as '수취인주소',
        o.receiver_zipcode as '수취인우편번호',
        
        -- 패키지 정보
        o.package_type as '포장타입',
        o.package_weight as '중량(kg)',
        o.package_size as '규격',
        o.package_value as '상품가액',
        o.package_description as '상품설명',
        
        -- 배송 정보
        o.delivery_type as '배송타입',
        o.delivery_date as '희망배송일',
        o.delivery_time as '희망배송시간',
        o.delivery_memo as '배송메모',
        o.special_instructions as '특별요청사항',
        
        -- 특수 옵션
        CASE WHEN o.is_fragile = 1 THEN '예' ELSE '아니오' END as '파손주의',
        CASE WHEN o.is_frozen = 1 THEN '예' ELSE '아니오' END as '냉동보관',
        CASE WHEN o.requires_signature = 1 THEN '예' ELSE '아니오' END as '서명필요',
        o.insurance_amount as '보험금액',
        
        -- 사용자 정보
        u.username as '등록사용자',
        u.name as '등록자명'
        
      FROM shipping_orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE ${whereClause}
      ORDER BY o.created_at DESC
    `, queryParams);

    if (format === 'csv') {
      // CSV 형태로 내보내기
      const fields = Object.keys(orders[0] || {});
      const parser = new Parser({ fields, withBOM: true }); // BOM 추가로 한글 깨짐 방지
      const csv = parser.parse(orders);

      const filename = `shipping_orders_${new Date().toISOString().split('T')[0]}.csv`;
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.send('\uFEFF' + csv); // UTF-8 BOM 추가
      
    } else {
      // Excel 형태로 내보내기
      const worksheet = XLSX.utils.json_to_sheet(orders);
      const workbook = XLSX.utils.book_new();
      
      // 컬럼 너비 자동 조정
      const colWidths = Object.keys(orders[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      worksheet['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, '배송주문목록');
      
      const filename = `shipping_orders_${new Date().toISOString().split('T')[0]}.xlsx`;
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.send(buffer);
    }

    // 활동 로그 기록
    const { logUserActivity } = require('./userController');
    await logUserActivity(req.session.user.id, 'export_orders', 'export', null, {
      format,
      filters: { startDate, endDate, status, userId },
      recordCount: orders.length
    }, req);

  } catch (error) {
    console.error('데이터 내보내기 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '데이터 내보내기 중 오류가 발생했습니다.'
    });
  }
}

// 통계 리포트 내보내기
async function exportStatisticsReport(req, res) {
  try {
    const {
      startDate,
      endDate,
      format = 'xlsx'
    } = req.query;

    // 날짜 필터 설정
    let dateFilter = '';
    let queryParams = [];

    if (startDate && endDate) {
      dateFilter = 'WHERE DATE(created_at) BETWEEN ? AND ?';
      queryParams = [startDate, endDate];
    } else if (startDate) {
      dateFilter = 'WHERE DATE(created_at) >= ?';
      queryParams = [startDate];
    } else if (endDate) {
      dateFilter = 'WHERE DATE(created_at) <= ?';
      queryParams = [endDate];
    }

    // 다양한 통계 데이터 수집
    const [statusStats] = await pool.execute(`
      SELECT 
        status as '배송상태',
        COUNT(*) as '주문수',
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shipping_orders ${dateFilter}), 2) as '비율(%)'
      FROM shipping_orders 
      ${dateFilter}
      GROUP BY status
      ORDER BY COUNT(*) DESC
    `, queryParams);

    const [dailyStats] = await pool.execute(`
      SELECT 
        DATE(created_at) as '날짜',
        COUNT(*) as '주문수',
        SUM(CASE WHEN status = '배송완료' THEN 1 ELSE 0 END) as '완료건수',
        ROUND(SUM(CASE WHEN status = '배송완료' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as '완료율(%)'
      FROM shipping_orders 
      ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) DESC
      LIMIT 30
    `, queryParams);

    const [companyStats] = await pool.execute(`
      SELECT 
        COALESCE(tracking_company, '미배정') as '택배회사',
        COUNT(*) as '주문수',
        SUM(CASE WHEN status = '배송완료' THEN 1 ELSE 0 END) as '완료건수',
        ROUND(AVG(CASE WHEN status = '배송완료' THEN DATEDIFF(updated_at, created_at) END), 1) as '평균배송일'
      FROM shipping_orders 
      ${dateFilter}
      GROUP BY tracking_company
      ORDER BY COUNT(*) DESC
    `, queryParams);

    const [userStats] = await pool.execute(`
      SELECT 
        u.name as '사용자명',
        u.username as '사용자ID',
        COUNT(o.id) as '주문수',
        MAX(DATE(o.created_at)) as '최근주문일'
      FROM users u
      LEFT JOIN shipping_orders o ON u.id = o.user_id ${dateFilter.replace('WHERE', 'AND')}
      GROUP BY u.id, u.name, u.username
      HAVING COUNT(o.id) > 0
      ORDER BY COUNT(o.id) DESC
    `, queryParams);

    if (format === 'csv') {
      // CSV는 하나의 시트만 지원하므로 상태 통계만 내보내기
      const parser = new Parser({ withBOM: true });
      const csv = parser.parse(statusStats);
      
      const filename = `statistics_report_${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.send('\uFEFF' + csv);
      
    } else {
      // Excel로 다중 시트 리포트 생성
      const workbook = XLSX.utils.book_new();
      
      // 상태별 통계 시트
      const statusSheet = XLSX.utils.json_to_sheet(statusStats);
      statusSheet['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(workbook, statusSheet, '상태별통계');
      
      // 일별 통계 시트
      const dailySheet = XLSX.utils.json_to_sheet(dailyStats);
      dailySheet['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(workbook, dailySheet, '일별통계');
      
      // 택배회사별 통계 시트
      const companySheet = XLSX.utils.json_to_sheet(companyStats);
      companySheet['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(workbook, companySheet, '택배회사별통계');
      
      // 사용자별 통계 시트
      const userSheet = XLSX.utils.json_to_sheet(userStats);
      userSheet['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, userSheet, '사용자별통계');
      
      const filename = `statistics_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.send(buffer);
    }

    // 활동 로그 기록
    const { logUserActivity } = require('./userController');
    await logUserActivity(req.session.user.id, 'export_statistics', 'export', null, {
      format,
      filters: { startDate, endDate }
    }, req);

  } catch (error) {
    console.error('통계 리포트 내보내기 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '통계 리포트 생성 중 오류가 발생했습니다.'
    });
  }
}

module.exports = {
  exportOrdersToExcel,
  exportStatisticsReport
};