import * as Cesium from 'cesium'

export function formatTimeLine(viewer) {
  // cesium时间轴格式化
  viewer.timeline.makeLabel = function (datetime) {
    const julianDT = new Cesium.JulianDate()
    Cesium.JulianDate.addHours(datetime, 8, julianDT)
    let gregorianDT = Cesium.JulianDate.toGregorianDate(julianDT)

    let hour = gregorianDT.hour + ''
    let minute = gregorianDT.minute + ''
    let second = gregorianDT.second + ''
    return `${gregorianDT.year}年${gregorianDT.month}月${
      gregorianDT.day
    }日${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}`
  }
  //cesium时钟日期格式化
  viewer.animation.viewModel.dateFormatter = function (datetime) {
    let julianDT = new Cesium.JulianDate()
    Cesium.JulianDate.addHours(datetime, 8, julianDT)
    let gregorianDT = Cesium.JulianDate.toGregorianDate(julianDT)
    return `${gregorianDT.year}年${gregorianDT.month}月${gregorianDT.day}日`
  }
  //cesium时钟时间格式化
  viewer.animation.viewModel.timeFormatter = function (datetime) {
    let julianDT = new Cesium.JulianDate()
    Cesium.JulianDate.addHours(datetime, 8, julianDT)
    let gregorianDT = Cesium.JulianDate.toGregorianDate(julianDT)
    let hour = gregorianDT.hour + ''
    let minute = gregorianDT.minute + ''
    let second = gregorianDT.second + ''
    return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}`
  }
}
