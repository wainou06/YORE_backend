exports.formatDate = (date) => {
   const d = new Date(date)
   const year = d.getFullYear()
   const month = String(d.getMonth() + 1).padStart(2, '0')
   const day = String(d.getDate()).padStart(2, '0')
   return `${year}-${month}-${day}`
}

exports.formatDateTime = (date) => {
   const d = new Date(date)
   const year = d.getFullYear()
   const month = String(d.getMonth() + 1).padStart(2, '0')
   const day = String(d.getDate()).padStart(2, '0')
   const hours = String(d.getHours()).padStart(2, '0')
   const minutes = String(d.getMinutes()).padStart(2, '0')
   return `${year}-${month}-${day} ${hours}:${minutes}`
}

exports.addMonths = (date, months) => {
   const d = new Date(date)
   d.setMonth(d.getMonth() + months)
   return d
}

exports.isExpired = (date) => {
   return new Date(date) < new Date()
}
