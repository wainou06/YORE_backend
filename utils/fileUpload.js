const path = require('path')
const fs = require('fs')
const multer = require('multer')
const crypto = require('crypto')

// uploads 디렉토리가 없으면 생성
const uploadsDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) {
   fs.mkdirSync(uploadsDir, { recursive: true })
}

// 파일 저장을 위한 multer 설정
const storage = multer.diskStorage({
   destination: function (req, file, cb) {
      // 오늘 날짜로 폴더 생성
      const today = new Date()
      const dateDir = path.join(uploadsDir, `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`)

      if (!fs.existsSync(dateDir)) {
         fs.mkdirSync(dateDir, { recursive: true })
      }
      cb(null, dateDir)
   },
   filename: function (req, file, cb) {
      // 원본 파일명에서 확장자 추출
      const ext = path.extname(file.originalname)
      // 원본 파일명(확장자 제외)
      const basename = path.basename(file.originalname, ext)

      // 유니크한 파일명 생성 (타임스탬프 + 랜덤해시 + 원본파일명)
      const uniqueHash = crypto.randomBytes(8).toString('hex')
      const timestamp = Date.now()

      // 한글 파일명을 Base64로 인코딩 (한글 깨짐 방지)
      const encodedBasename = Buffer.from(basename).toString('base64')

      // 최종 파일명: timestamp_hash_encodedBasename.ext
      const filename = `${timestamp}_${uniqueHash}_${encodedBasename}${ext}`
      cb(null, filename)
   },
})

// 파일 필터 (이미지 파일만 허용)
const fileFilter = (req, file, cb) => {
   if (file.mimetype.startsWith('image/')) {
      cb(null, true)
   } else {
      cb(new Error('이미지 파일만 업로드할 수 있습니다.'), false)
   }
}

// multer 미들웨어 생성
const upload = multer({
   storage: storage,
   fileFilter: fileFilter,
   limits: {
      fileSize: 5 * 1024 * 1024, // 5MB 제한
   },
})

module.exports = {
   uploadsDir,
   upload,

   // 파일 URL 생성 함수
   getFileUrl: (filename) => {
      if (!filename) return null
      return `/uploads/${filename}`
   },

   // 파일 삭제 함수
   deleteFile: async (filename) => {
      if (!filename) return

      const filePath = path.join(uploadsDir, filename)
      try {
         await fs.promises.unlink(filePath)
      } catch (error) {
         if (error.code !== 'ENOENT') {
            throw error
         }
      }
   },

   // Base64로 인코딩된 파일명 디코딩
   decodeFilename: (filename) => {
      if (!filename) return null

      // timestamp_hash_encodedBasename.ext 형식에서 encodedBasename 추출
      const parts = filename.split('_')
      if (parts.length < 3) return filename

      const lastPart = parts.slice(2).join('_') // encodedBasename.ext
      const ext = path.extname(lastPart)
      const encodedBasename = path.basename(lastPart, ext)

      try {
         const decodedBasename = Buffer.from(encodedBasename, 'base64').toString()
         return decodedBasename + ext
      } catch (error) {
         return filename
      }
   },
}
