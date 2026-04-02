const BD_FACTOR = (3.14159265358979324 * 3000.0) / 180.0
const PI = 3.1415926535897932384626
const a = 6378245.0
const ee = 0.00669342162296594323
import * as Cesium from 'cesium'

//
class CoordTransform {
  /**
   * 百度坐标系 (BD-09) 与 火星坐标系 (GCJ-02)的转换
   * 即 百度 转 谷歌、高德
   * @param lng
   * @param lat
   * @returns {number[]}
   */
  static BD09ToGCJ02(lng, lat) {
    var x = +lng - 0.0065
    var y = +lat - 0.006
    var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * BD_FACTOR)
    var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * BD_FACTOR)
    var gg_lng = z * Math.cos(theta)
    var gg_lat = z * Math.sin(theta)
    return [gg_lng, gg_lat]
  }

  /**
   * 火星坐标系(GCJ-02) 与 百度坐标系(BD-09)的转换
   * 即谷歌、高德 转 百度
   * @param lng
   * @param lat
   * @returns {number[]}
   */
  static GCJ02ToBD09(lng, lat) {
    lat = +lat
    lng = +lng
    var z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * BD_FACTOR)
    var theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * BD_FACTOR)
    var bd_lng = z * Math.cos(theta) + 0.0065
    var bd_lat = z * Math.sin(theta) + 0.006
    return [bd_lng, bd_lat]
  }

  /**
   * WGS84转GCJ02
   * @param lng
   * @param lat
   * @returns {number[]}
   */
  static WGS84ToGCJ02(lng, lat) {
    var wgLat = +lat
    var wgLon = +lng
    var mgLat = 0
    var mgLon = 0
    if (this.out_of_china(wgLon, wgLat)) {
      mgLat = wgLat
      mgLon = wgLon
    } else {
      var dLat = this.transformLat(wgLon - 105.0, wgLat - 35.0)
      var dLon = this.transformLon(wgLon - 105.0, wgLat - 35.0)
      var radLat = (wgLat / 180.0) * PI
      var magic = Math.sin(radLat)
      magic = 1 - ee * magic * magic
      var sqrtMagic = Math.sqrt(magic)
      dLat = (dLat * 180.0) / (((a * (1 - ee)) / (magic * sqrtMagic)) * PI)
      dLon = (dLon * 180.0) / ((a / sqrtMagic) * Math.cos(radLat) * PI)
      mgLat = wgLat + dLat
      mgLon = wgLon + dLon
    }
    return [mgLon, mgLat]
  }

  /**
   * GCJ02 转换为 WGS84
   * @param lng
   * @param lat
   * @returns {number[]}
   */
  static GCJ02ToWGS84(lng, lat) {
    var gcjLat = +lat
    var gcjLon = +lng
    var wgs_point = this.toWGS84(gcjLon, gcjLat, gcjLon, gcjLat)
    for (var i = 0; i < 10; ++i) {
      wgs_point = this.toWGS84(wgs_point[0], wgs_point[1], gcjLon, gcjLat)
    }
    return wgs_point
  }

  static toWGS84(wgsLon, wgsLat, gcjLon, gcjLat) {
    var ng_point = this.WGS84ToGCJ02(wgsLon, wgsLat)
    var real_point = [gcjLon - ng_point[0] + wgsLon, gcjLat - ng_point[1] + wgsLat]
    return real_point
  }

  static transformLat(x, y) {
    var ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
    ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0
    ret += ((20.0 * Math.sin(y * PI) + 40.0 * Math.sin((y / 3.0) * PI)) * 2.0) / 3.0
    ret += ((160.0 * Math.sin((y / 12.0) * PI) + 320 * Math.sin((y * PI) / 30.0)) * 2.0) / 3.0
    return ret
  }

  static transformLon(x, y) {
    var ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
    ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0
    ret += ((20.0 * Math.sin(x * PI) + 40.0 * Math.sin((x / 3.0) * PI)) * 2.0) / 3.0
    ret += ((150.0 * Math.sin((x / 12.0) * PI) + 300.0 * Math.sin((x / 30.0) * PI)) * 2.0) / 3.0
    return ret
  }

  static toCartographic(viewer, position) {
    var ellipsoid = viewer.scene.globe.ellipsoid
    var cartographic = ellipsoid.cartesianToCartographic(position)
    var lat = Cesium.Math.toDegrees(cartographic.latitude)
    var lon = Cesium.Math.toDegrees(cartographic.longitude)
    var alt = cartographic.height
    return [lon, lat]
  }

  static cartographicToCartesian(viewer, lon, lat, height = 0) {
    var ellipsoid = viewer.scene.globe.ellipsoid
    var cartographic = Cesium.Cartographic.fromDegrees(lon, lat, height)
    var position = ellipsoid.cartographicToCartesian(cartographic)
    return position
  }

  /**
   * 判断是否在国内，不在国内则不做偏移
   * @param lng
   * @param lat
   * @returns {boolean}
   */
  static out_of_china(lng, lat) {
    var lat = +lat
    var lng = +lng
    return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271 || false
  }

  /**
   * 经纬度由小数形式转换为度分秒形式
   */
  static DDToDMS(data) {
    let value = parseFloat(data)
    let _d = Math.floor(value) //度
    let _m = Math.floor((value - _d) * 60) //分
    let _s = Math.round(((value - _d) * 3600) % 60) //秒 保留整数
    // let _s =  parseFloat((value - _d) * 3600 % 60).toFixed(2);//精确小数点后面两位
    return [_d, _m, _s]
  }

  /**
   * 经纬度由度分秒形式转换为小数形式
   */
  static DMSToDD(data) {
    let du = data[0]
    let fen = data[1]
    let miao = data[2]
    let res = Math.abs(du) + (Math.abs(fen) / 60 + Math.abs(miao) / 3600)
    res = parseFloat(res).toFixed(6)
    return res
  }

  /**
   * 笛卡尔To经纬度
   */
  static cartesianToDegreesPoint(cartesian) {
    const carto = Cesium.Cartographic.fromCartesian(cartesian)
    return {
      longitude: Cesium.Math.toDegrees(carto.longitude),
      latitude: Cesium.Math.toDegrees(carto.latitude),
      height: carto.height,
    }
  }
}

export default CoordTransform
