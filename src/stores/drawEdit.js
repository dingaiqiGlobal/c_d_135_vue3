import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useDrawEditStore = defineStore('drawEdit', () => {
  /**
   * 点
   *  {lonlat: [ { longitude, latitude, height } ]}
   */
  const pointData = ref({
    lonlat: [],
  })
  function normalizePositionNode(node = {}) {
    const longitude =
      node.longitude !== undefined && node.longitude !== null
        ? parseFloat(Number(node.longitude).toFixed(6))
        : ''
    const latitude =
      node.latitude !== undefined && node.latitude !== null
        ? parseFloat(Number(node.latitude).toFixed(6))
        : ''
    const height =
      node.height !== undefined && node.height !== null
        ? parseFloat(Number(node.height).toFixed(0))
        : ''

    return {
      longitude,
      latitude,
      height,
    }
  }
  function setPointPosition(longitude, latitude, height) {
    pointData.value = {
      lonlat: [
        normalizePositionNode({
          longitude,
          latitude,
          height,
        }),
      ],
    }
  }
  function clearPointPosition() {
    pointData.value = {
      lonlat: [],
    }
  }

  /**
   *  线
   *  {lonlat: [ { longitude, latitude, height } ,{ longitude, latitude, height } ...]}
   */
  const polylineData = ref({
    lonlat: [],
  })
  function setPolylinePositions(positions) {
    polylineData.value = {
      lonlat: (positions || []).map((p) => normalizePositionNode(p)),
    }
  }
  function updatePolylineNode(index, longitude, latitude, height) {
    const list = [...polylineData.value.lonlat]
    if (index >= 0 && index < list.length) {
      list[index] = normalizePositionNode({
        ...list[index],
        longitude,
        latitude,
        height,
      })
      polylineData.value = {
        ...polylineData.value,
        lonlat: list,
      }
    }
  }
  function clearPolylinePositions() {
    polylineData.value = {
      lonlat: [],
    }
  }

  /**
   * 面
   *  {absHeight: 0, altitude: 0, lonlat: [ { longitude, latitude } ,{ longitude, latitude } ...]}
   */
  const polygonData = ref({
    absHeight: 0,
    altitude: 0,
    lonlat: [],
  })
  function normalizePolygonNode(node = {}) {
    const longitude =
      node.longitude !== undefined && node.longitude !== null
        ? parseFloat(Number(node.longitude).toFixed(6))
        : ''
    const latitude =
      node.latitude !== undefined && node.latitude !== null
        ? parseFloat(Number(node.latitude).toFixed(6))
        : ''

    return {
      longitude,
      latitude,
    }
  }
  function setPolygonData(data = {}) {
    polygonData.value = {
      absHeight: parseFloat(Number(data.absHeight ?? 0).toFixed(0)),
      altitude: parseFloat(Number(data.altitude ?? 0).toFixed(0)),
      lonlat: (data.lonlat || []).map((node) => normalizePolygonNode(node)),
    }
  }
  function setPolygonHeights(absHeight, altitude) {
    polygonData.value = {
      ...polygonData.value,
      absHeight: parseFloat(Number(absHeight ?? 0).toFixed(0)),
      altitude: parseFloat(Number(altitude ?? 0).toFixed(0)),
    }
  }
  function updatePolygonNode(index, longitude, latitude) {
    const list = [...polygonData.value.lonlat]
    if (index >= 0 && index < list.length) {
      list[index] = normalizePolygonNode({
        ...list[index],
        longitude,
        latitude,
      })
      polygonData.value = {
        ...polygonData.value,
        lonlat: list,
      }
    }
  }
  function clearPolygonData() {
    polygonData.value = {
      absHeight: 0,
      altitude: 0,
      lonlat: [],
    }
  }

  /**
   * 矩形
   * {absHeight: 0, altitude: 0, lonlat: [{ longitude, latitude }, { longitude, latitude }]}
   */
  const rectangleData = ref({
    absHeight: 0,
    altitude: 0,
    lonlat: [],
  })
  function normalizeRectangleNode(node = {}) {
    return {
      longitude:
        node.longitude !== undefined && node.longitude !== null
          ? parseFloat(Number(node.longitude).toFixed(6))
          : '',
      latitude:
        node.latitude !== undefined && node.latitude !== null
          ? parseFloat(Number(node.latitude).toFixed(6))
          : '',
    }
  }
  function setRectangleData(data = {}) {
    rectangleData.value = {
      absHeight: parseFloat(Number(data.absHeight ?? 0).toFixed(0)),
      altitude: parseFloat(Number(data.altitude ?? 0).toFixed(0)),
      lonlat: (data.lonlat || []).map((node) => normalizeRectangleNode(node)),
    }
  }
  function setRectangleHeights(absHeight, altitude) {
    rectangleData.value = {
      ...rectangleData.value,
      absHeight: parseFloat(Number(absHeight ?? 0).toFixed(0)),
      altitude: parseFloat(Number(altitude ?? 0).toFixed(0)),
    }
  }
  function updateRectangleNode(index, longitude, latitude) {
    const list = [...rectangleData.value.lonlat]
    if (index >= 0 && index < list.length) {
      list[index] = normalizeRectangleNode({
        ...list[index],
        longitude,
        latitude,
      })
      rectangleData.value = {
        ...rectangleData.value,
        lonlat: list,
      }
    }
  }
  function clearRectangleData() {
    rectangleData.value = {
      absHeight: 0,
      altitude: 0,
      lonlat: [],
    }
  }

  /**
   * 圆形
   * {radius: 0, absHeight: 0, altitude: 0, lonlat: [{ longitude, latitude, height }, { longitude, latitude, height }]}
   */
  const circleData = ref({
    radius: 0,
    absHeight: 0,
    altitude: 0,
    lonlat: [],
  })
  function normalizeCircleNode(node = {}) {
    return {
      longitude:
        node.longitude !== undefined && node.longitude !== null
          ? parseFloat(Number(node.longitude).toFixed(6))
          : '',
      latitude:
        node.latitude !== undefined && node.latitude !== null
          ? parseFloat(Number(node.latitude).toFixed(6))
          : '',
      height:
        node.height !== undefined && node.height !== null
          ? parseFloat(Number(node.height).toFixed(0))
          : '',
    }
  }
  function setCircleData(data = {}) {
    circleData.value = {
      radius: parseFloat(Number(data.radius ?? 0).toFixed(0)),
      absHeight: parseFloat(Number(data.absHeight ?? 0).toFixed(0)),
      altitude: parseFloat(Number(data.altitude ?? 0).toFixed(0)),
      lonlat: (data.lonlat || []).map((node) => normalizeCircleNode(node)),
    }
  }
  function setCircleHeights(absHeight, altitude) {
    circleData.value = {
      ...circleData.value,
      absHeight: parseFloat(Number(absHeight ?? 0).toFixed(0)),
      altitude: parseFloat(Number(altitude ?? 0).toFixed(0)),
    }
  }
  function setCircleRadius(radius) {
    circleData.value = {
      ...circleData.value,
      radius: parseFloat(Number(radius ?? 0).toFixed(0)),
    }
  }
  function updateCircleNode(index, longitude, latitude, height) {
    const list = [...circleData.value.lonlat]
    if (index >= 0 && index < list.length) {
      list[index] = normalizeCircleNode({
        ...list[index],
        longitude,
        latitude,
        height,
      })
      circleData.value = {
        ...circleData.value,
        lonlat: list,
      }
    }
  }
  function clearCircleData() {
    circleData.value = {
      radius: 0,
      absHeight: 0,
      altitude: 0,
      lonlat: [],
    }
  }

  return {
    pointData,
    setPointPosition,
    clearPointPosition,
    polylineData,
    setPolylinePositions,
    updatePolylineNode,
    clearPolylinePositions,
    polygonData,
    setPolygonData,
    setPolygonHeights,
    updatePolygonNode,
    clearPolygonData,
    rectangleData,
    setRectangleData,
    setRectangleHeights,
    updateRectangleNode,
    clearRectangleData,
    circleData,
    setCircleData,
    setCircleHeights,
    setCircleRadius,
    updateCircleNode,
    clearCircleData,
  }
})
