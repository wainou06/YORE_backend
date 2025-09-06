exports.PLAN_STATUS = {
   ACTIVE: 'active',
   EXPIRED: 'expired',
   CANCELLED: 'cancelled',
}

exports.PAYMENT_STATUS = {
   SUCCESS: 'success',
   FAILED: 'failed',
   PENDING: 'pending',
}

exports.COUPON_STATUS = {
   ACTIVE: 'active',
   USED: 'used',
   EXPIRED: 'expired',
}

exports.USER_TYPE = {
   USER: 'user',
   AGENCY: 'agency',
}

exports.SERVICE_STATUS = {
   ACTIVE: 'active',
   INACTIVE: 'inactive',
}

exports.ERROR_MESSAGES = {
   AUTH: {
      INVALID_TOKEN: '유효하지 않은 토큰입니다.',
      TOKEN_EXPIRED: '토큰이 만료되었습니다.',
      UNAUTHORIZED: '권한이 없습니다.',
      INVALID_CREDENTIALS: '잘못된 인증 정보입니다.',
   },
   USER: {
      NOT_FOUND: '사용자를 찾을 수 없습니다.',
      DUPLICATE_EMAIL: '이미 존재하는 이메일입니다.',
      INVALID_PASSWORD: '잘못된 비밀번호입니다.',
   },
   PLAN: {
      NOT_FOUND: '요금제를 찾을 수 없습니다.',
      ALREADY_SUBSCRIBED: '이미 가입된 요금제가 있습니다.',
   },
}
