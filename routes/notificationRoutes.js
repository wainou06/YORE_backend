const express = require('express')
const notificationController = require('../controllers/notificationController')
const { isAuthenticated } = require('../middlewares/authMiddleware')

const router = express.Router()

/**
 * @swagger
 * /notifications:
 *   post:
 *     summary: 알림 생성 (관리자/통신사만)
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *               targetUserType:
 *                 type: string
 *               userId:
 *                 type: integer
 *               agencyId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: 생성 성공
 *       400:
 *         description: 필수값 누락
 *       403:
 *         description: 권한 없음
 */
router.post('/', isAuthenticated, notificationController.createNotification)

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: 알림 목록 조회 (로그인 사용자)
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: 알림 목록 반환
 */
router.get('/', isAuthenticated, notificationController.getNotifications)

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: 알림 읽음 처리 (본인만)
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 알림 ID
 *     responses:
 *       200:
 *         description: 읽음 처리 완료
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 알림 없음
 */
router.patch('/:id/read', isAuthenticated, notificationController.markAsRead)

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: 알림 삭제
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 알림 ID
 *     responses:
 *       200:
 *         description: 삭제 완료
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 알림 없음
 */
router.delete('/:id', isAuthenticated, notificationController.deleteNotification)

module.exports = router
