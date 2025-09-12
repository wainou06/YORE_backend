export const yearMonthDay = (date) => {
   if (!date) return
   const newDate = new Date(date)
   return `${newDate.getFullYear()}-${newDate.getMonth() + 1}-${newDate.getDate()}`
}

export const dayLeft = (date) => {
   if (!date) return
   const newDate = new Date(date) - new Date()
   const millisecondsOneDay = 1000 * 60 * 60 * 24
   return Math.ceil(newDate / millisecondsOneDay)
}

export const datePass = (date) => {
   if (!date) return
   return new Date(date) >= new Date()
}

export const nowDateMinus = (minusDay) => {
   if (!minusDay || minusDay < 0 || isNaN(minusDay)) return
   const daysAgo = new Date()
   daysAgo.setDate(daysAgo.getDate() - minusDay)
   return daysAgo
}
