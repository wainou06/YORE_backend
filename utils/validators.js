// 요금제 데이터 유효성 검사
exports.validatePlanData = (data) => {
   const errors = []

   // 필수 필드 검사
   if (!data.name) errors.push('요금제 이름은 필수입니다.')
   if (!data.carrier) errors.push('통신사 정보는 필수입니다.')
   if (!data.data) errors.push('데이터 정보는 필수입니다.')
   if (!data.price) errors.push('가격 정보는 필수입니다.')

   // 가격 유효성 검사
   if (data.price && (isNaN(data.price) || data.price < 0)) {
      errors.push('가격은 0 이상의 숫자여야 합니다.')
   }

   // 통신사 유효성 검사
   const validCarriers = ['SKT', 'KT', 'LG U+']
   if (data.carrier && !validCarriers.includes(data.carrier)) {
      errors.push('유효하지 않은 통신사입니다.')
   }

   // 네트워크 타입 유효성 검사
   const validNetworkTypes = ['3G', '4G', 'LTE', '5G']
   if (data.networkType && !validNetworkTypes.includes(data.networkType)) {
      errors.push('유효하지 않은 네트워크 타입입니다.')
   }

   // features 배열 검사
   if (data.features && !Array.isArray(data.features)) {
      errors.push('features는 배열 형태여야 합니다.')
   }

   // 이미지 URL 검사
   if (data.images) {
      if (!Array.isArray(data.images)) {
         errors.push('images는 배열 형태여야 합니다.')
      } else {
         const mainImages = data.images.filter((img) => img.isMain)
         if (mainImages.length > 1) {
            errors.push('대표 이미지는 하나만 설정할 수 있습니다.')
         }
      }
   }

   return errors.length > 0 ? errors.join(', ') : null
}
