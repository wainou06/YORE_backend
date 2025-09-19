const express = require('express')
const router = express.Router()
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware')
const adminController = require('../controllers/adminController')

//관리자 등록 (초기 관리자 계정 생성용, 실제 운영시에는 제거 필요)
/**
 * @swagger
 * /admin/register:
 *   post:
 *     summary: 관리자 등록
 *     description: 초기 관리자 계정을 생성합니다. 운영 환경에서는 제거해야 합니다.
 *     responses:
 *       201:
 *         description: 관리자 계정이 성공적으로 생성되었습니다.
 */
router.post('/register', adminController.registerAdmin)

//관리자 로그인
/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: 관리자 로그인
 *     description: 관리자가 로그인합니다.
 *     responses:
 *       200:
 *         description: 로그인 성공
 */
router.post('/login', adminController.loginAdmin)

// 모든 관리자 라우트에 인증 및 관리자 권한 검사 미들웨어 적용
router.use(isAuthenticated)
router.use(isAdmin)

// 사용자 관리
/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: 모든 사용자 조회
 *     description: 모든 사용자 목록을 반환합니다.
 *     responses:
 *       200:
 *         description: 사용자 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   username:
 *                     type: string
 *                   email:
 *                     type: string
 */
router.get('/users', adminController.getAllUsers)
/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: 특정 사용자 조회
 *     description: 특정 사용자의 정보를 조회합니다.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: 사용자 ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 사용자 정보
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
router.get('/users/:id', adminController.getUser)
/**
 * @swagger
 * /admin/users/{id}/status:
 *   patch:
 *     summary: 사용자 상태 수정
 *     description: 사용자의 상태를 수정합니다.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: 사용자 ID
 *         schema:
 *           type: integer
 *       - name: status
 *         in: body
 *         required: true
 *         description: 사용자 상태
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               example: 'active'
 *     responses:
 *       200:
 *         description: 상태 업데이트 성공
 */
router.patch('/users/:id/status', adminController.updateUserStatus)

// 통계
/**
 * @swagger
 * /admin/statistics:
 *   get:
 *     summary: 통계 조회
 *     description: 관리자가 통계 정보를 조회합니다.
 *     responses:
 *       200:
 *         description: 통계 데이터
 */
router.get('/statistics', adminController.getStatistics)

// 로그 내보내기
/**
 * @swagger
 * /admin/logs/export:
 *   get:
 *     summary: 로그 내보내기
 *     description: 서버 로그를 내보냅니다.
 *     responses:
 *       200:
 *         description: 로그 내보내기 성공
 */
router.get('/logs/export', adminController.exportLogs)

module.exports = router
