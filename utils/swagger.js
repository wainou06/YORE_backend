const swaggerJSDoc = require('swagger-jsdoc')

const options = {
   definition: {
      openapi: '3.0.0',
      info: {
         title: 'YORE API',
         version: '1.0.0',
         description: 'YORE 서비스 백엔드 API 문서',
      },
      servers: [{ url: `${process.env.APP_API_URL}`, description: '로컬 개발 서버' }],
      components: {
         securitySchemes: {
            bearerAuth: {
               type: 'http',
               scheme: 'bearer',
               bearerFormat: 'JWT',
            },
         },
      },
      security: [{ bearerAuth: [] }],
   },
   apis: ['./routes/*.js', './models/*.js'], // JSDoc이 붙은 파일 경로
}

const swaggerSpec = swaggerJSDoc(options)
module.exports = swaggerSpec
