/*
 * @Author: dys
 * @Date: 2025-09-15 11:04:37
 * @LastEditors: dys
 * @LastEditTime: 2025-11-05 15:46:27
 * @Descripttion:
 */
/**
 * 图上标绘
 */
import * as Cesium from 'cesium'
import EntityDraw from './EntityDraw'
import EntityEdit from './EntityEdit'
import bus from '@/utils/bus.js'
import CoordTransform from '@/utils/CoordTransform'
import { useDrawEditStore } from '@/stores/drawEdit'

let MapPlotting = {
  init(viewer) {
    this.viewer = viewer
    this.draw = null
    this.initDrawTool()
  },

  //初始化绘制工具
  initDrawTool() {
    this.edit = new EntityEdit(this.viewer)
    this.edit.activate()

    this.edit.EditEndEvent.addEventListener((result) => {})

    this.edit.EditPickEvent.addEventListener((result, positions) => {
      this.syncStore(result, positions, result.Type)
    })
    this.edit.EditMoveEvent.addEventListener((result, positions) => {
      this.syncStore(result, positions, result.Type)
    })
    //监视面板改变
    this.watchPlanChange()

    //绘制结束事件
    this.draw = new EntityDraw(this.viewer)
    this.draw.DrawEndEvent.addEventListener((result, positions, drawType) => {
      const { height, extrudedHeight } = this.getHeightFromDraw(result, positions, drawType)
      result.remove()
      this.addDrawResult(positions, drawType, height, extrudedHeight)
      const drawEditStore = useDrawEditStore()
      if (drawType === 'Point') {
        const point = CoordTransform.cartesianToDegreesPoint(positions[0])
        drawEditStore.setPointPosition(point.longitude, point.latitude, point.height)
      }
      if (drawType === 'Polyline') {
        const nodes = positions.map((p) => CoordTransform.cartesianToDegreesPoint(p))
        drawEditStore.setPolylinePositions(nodes)
      }
      if (drawType === 'Polygon') {
        const nodes = positions.map((p) => this.cartesianToDegreesPoint(p))
        drawEditStore.setPolygonData({
          absHeight: height,
          altitude: extrudedHeight,
          lonlat: nodes,
        })
      }
      if (drawType === 'Rectangle') {
        const nodes = positions.map((p) => this.cartesianToDegreesPoint(p))
        drawEditStore.setRectangleData({
          absHeight: height,
          altitude: extrudedHeight,
          lonlat: nodes,
        })
      }
      if (drawType === 'Circle') {
        const center = this.cartesianToDegreesPoint(positions[0])
        const edge = this.cartesianToDegreesPoint(positions[1])
        const radius = Cesium.Cartesian3.distance(positions[0], positions[1])
        drawEditStore.setCircleData({
          radius,
          absHeight: height,
          altitude: extrudedHeight,
          lonlat: [center, edge],
        })
      }
    })
  },
  //绘制过程中同步到store
  syncStore(entity, positions, entityType) {
    const drawEditStore = useDrawEditStore()
    if (entityType === 'EditableMarker') {
      const { longitude, latitude, height } = CoordTransform.cartesianToDegreesPoint(positions[0])
      drawEditStore.setPointPosition(longitude, latitude, height)
      return
    }
    if (entityType === 'EditablePolyline') {
      const nodes = positions.map((p) => CoordTransform.cartesianToDegreesPoint(p))
      drawEditStore.setPolylinePositions(nodes)
      return
    }
    if (entityType === 'EditablePolygon') {
      const nodes = positions.map((p) => this.cartesianToDegreesPoint(p))
      const { absHeight: entityAbsHeight, altitude: entityAltitude } =
        this.getPolygonHeights(entity)
      const currentAbsHeight = nodes[0]?.height ?? entityAbsHeight
      drawEditStore.setPolygonData({
        absHeight: currentAbsHeight,
        altitude: entityAltitude,
        lonlat: nodes,
      })
      return
    }
    if (entityType === 'EditableRectangle') {
      const nodes = positions.map((p) => this.cartesianToDegreesPoint(p))
      const { absHeight: entityAbsHeight, altitude: entityAltitude } =
        this.getRectangleHeights(entity)
      const currentAbsHeight = nodes[0]?.height ?? entityAbsHeight
      drawEditStore.setRectangleData({
        absHeight: currentAbsHeight,
        altitude: entityAltitude,
        lonlat: nodes,
      })
      return
    }
    if (entityType === 'EditableCircle') {
      const nodes = positions.map((p) => this.cartesianToDegreesPoint(p))
      const { absHeight: entityAbsHeight, altitude: entityAltitude } = this.getCircleHeights(entity)
      const currentAbsHeight = nodes[0]?.height ?? entityAbsHeight
      const radius = Cesium.Cartesian3.distance(positions[0], positions[1])
      drawEditStore.setCircleData({
        radius,
        absHeight: currentAbsHeight,
        altitude: entityAltitude,
        lonlat: nodes,
      })
    }
  },

  /**
   * 监视面板改变
   */
  watchPlanChange() {
    const drawEditStore = useDrawEditStore()

    bus.on('panel:enterEdit', ({ entityType }) => {
      if (!this.viewer) return
      const entity = Array.from(this.viewer.entities.values).find((e) => e.Type === entityType)
      if (!entity) return
      if (this.edit.editEntity?.id === entity.id) return
      if (this.edit.editEntity) this.edit.handleEditEntity()
      this.edit.handlePickEditEntity(entity)
    })

    bus.on('panel:exitEdit', ({ entityType }) => {
      if (this.edit?.editEntity?.Type === entityType) {
        this.edit.handleEditEntity()
      }
    })

    bus.on('bindEditPoint', (obj) => {
      if (!this.edit?.editEntity || this.edit.editEntity.Type !== 'EditableMarker') return
      const { longitude, latitude, height } = obj
      const cartesian = Cesium.Cartesian3.fromDegrees(longitude, latitude, height || 0)
      this.edit.updatePosition(0, cartesian)
    })

    bus.on('bindEditPolyline', (obj) => {
      if (!this.edit?.editEntity || this.edit.editEntity.Type !== 'EditablePolyline') return
      const { action, index, longitude, latitude, height } = obj
      if (action === 'update') {
        const cartesian = Cesium.Cartesian3.fromDegrees(longitude, latitude, height || 0)
        this.edit.updatePosition(index, cartesian)
      } else if (action === 'add') {
        this.edit.addPosition(index)
        const nodes = this.edit.editPositions.map((p) => CoordTransform.cartesianToDegreesPoint(p))
        drawEditStore.setPolylinePositions(nodes)
      } else if (action === 'delete') {
        this.edit.deletePosition(index)
        const nodes = this.edit.editPositions.map((p) => CoordTransform.cartesianToDegreesPoint(p))
        drawEditStore.setPolylinePositions(nodes)
      }
    })

    bus.on('bindEditPolygon', (obj) => {
      if (!this.edit?.editEntity || this.edit.editEntity.Type !== 'EditablePolygon') return
      const { action, index, longitude, latitude, absHeight, altitude } = obj
      if (action === 'update') {
        const currentPos = this.edit.editPositions[index]
        const height = currentPos ? Cesium.Cartographic.fromCartesian(currentPos).height : 0
        const cartesian = Cesium.Cartesian3.fromDegrees(longitude, latitude, height)
        this.edit.updatePosition(index, cartesian)
      } else if (action === 'add') {
        this.edit.addPosition(index)
        const nodes = this.edit.editPositions.map((p) => this.cartesianToDegreesPoint(p))
        const { absHeight: ah, altitude: alt } = this.getPolygonHeights(this.edit.editEntity)
        drawEditStore.setPolygonData({
          absHeight: ah,
          altitude: alt,
          lonlat: nodes,
        })
      } else if (action === 'delete') {
        this.edit.deletePosition(index)
        const nodes = this.edit.editPositions.map((p) => this.cartesianToDegreesPoint(p))
        const { absHeight: ah, altitude: alt } = this.getPolygonHeights(this.edit.editEntity)
        drawEditStore.setPolygonData({
          absHeight: ah,
          altitude: alt,
          lonlat: nodes,
        })
      } else if (action === 'absHeight') {
        this.edit.editEntity.polygon.height = obj.value
        drawEditStore.setPolygonHeights(obj.value, this.getPropertyValue(this.edit.editEntity.polygon.extrudedHeight))
      } else if (action === 'altitude') {
        this.edit.editEntity.polygon.extrudedHeight = obj.value
        drawEditStore.setPolygonHeights(this.getPropertyValue(this.edit.editEntity.polygon.height), obj.value)
      }
    })

    bus.on('bindEditRectangle', (obj) => {
      if (!this.edit?.editEntity || this.edit.editEntity.Type !== 'EditableRectangle') return
      const { action, index, longitude, latitude } = obj
      if (action === 'update') {
        const currentPos = this.edit.editPositions[index]
        const height = currentPos ? Cesium.Cartographic.fromCartesian(currentPos).height : 0
        const cartesian = Cesium.Cartesian3.fromDegrees(longitude, latitude, height)
        this.edit.updatePosition(index, cartesian)
      } else if (action === 'absHeight') {
        this.edit.editEntity.rectangle.height = obj.value
        drawEditStore.setRectangleHeights(obj.value, this.getPropertyValue(this.edit.editEntity.rectangle.extrudedHeight))
      } else if (action === 'altitude') {
        this.edit.editEntity.rectangle.extrudedHeight = obj.value
        drawEditStore.setRectangleHeights(this.getPropertyValue(this.edit.editEntity.rectangle.height), obj.value)
      }
    })

    bus.on('bindEditCircle', (obj) => {
      if (!this.edit?.editEntity || this.edit.editEntity.Type !== 'EditableCircle') return
      const { action, index, longitude, latitude, height } = obj
      if (action === 'update') {
        const cartesian = Cesium.Cartesian3.fromDegrees(longitude, latitude, height || 0)
        this.edit.updatePosition(index, cartesian)
        const radius = Cesium.Cartesian3.distance(this.edit.editPositions[0], this.edit.editPositions[1])
        drawEditStore.setCircleRadius(radius)
      } else if (action === 'absHeight') {
        this.edit.editEntity.ellipse.height = obj.value
        drawEditStore.setCircleHeights(obj.value, this.getPropertyValue(this.edit.editEntity.ellipse.extrudedHeight))
      } else if (action === 'altitude') {
        this.edit.editEntity.ellipse.extrudedHeight = obj.value
        drawEditStore.setCircleHeights(this.getPropertyValue(this.edit.editEntity.ellipse.height), obj.value)
      } else if (action === 'radius') {
        const center = this.edit.editPositions[0]
        const edge = this.getCircleEdgeFromCenter(center, obj.value)
        this.edit.updatePosition(1, edge)
      }
    })
  },
  cartesianToDegreesPoint(cartesian) {
    const carto = Cesium.Cartographic.fromCartesian(cartesian)
    return {
      longitude: Cesium.Math.toDegrees(carto.longitude),
      latitude: Cesium.Math.toDegrees(carto.latitude),
      height: carto.height,
    }
  },
  getPropertyValue(prop) {
    if (prop === undefined || prop === null) return 0
    if (typeof prop.getValue === 'function') {
      return prop._value ?? prop.getValue(Cesium.JulianDate.now())
    }
    return prop._value ?? prop
  },
  getPolygonHeights(entity) {
    const polygon = entity?.polygon
    return {
      absHeight: this.getPropertyValue(polygon?.height),
      altitude: this.getPropertyValue(polygon?.extrudedHeight),
    }
  },
  getRectangleHeights(entity) {
    const rectangle = entity?.rectangle
    return {
      absHeight: this.getPropertyValue(rectangle?.height),
      altitude: this.getPropertyValue(rectangle?.extrudedHeight),
    }
  },
  getCircleHeights(entity) {
    const ellipse = entity?.ellipse
    return {
      absHeight: this.getPropertyValue(ellipse?.height),
      altitude: this.getPropertyValue(ellipse?.extrudedHeight),
    }
  },
  getCircleEdgeFromCenter(center, radius) {
    const carto = Cesium.Cartographic.fromCartesian(center)
    const cosLat = Math.abs(Math.cos(carto.latitude)) || 1e-6
    const lonOffsetRad = Cesium.Math.toRadians(radius / (111319.49 * cosLat))
    const edgeCarto = new Cesium.Cartographic(
      carto.longitude + lonOffsetRad,
      carto.latitude,
      carto.height,
    )
    return Cesium.Cartographic.toCartesian(edgeCarto, this.viewer.scene.globe.ellipsoid)
  },
  /**
   * 从绘制结果/点位获取 height（相对椭球高度）和 extrudedHeight（拉伸底面高度）
   * 绘制阶段未单独设置 extrudedHeight，默认与 height 相同（不拉伸）或 0
   */
  getHeightFromDraw(result, positions, drawType) {
    let height = 0
    let extrudedHeight = 0
    if (!positions || positions.length === 0) return { height, extrudedHeight }

    const getHeightFromCartesian = (cartesian) => {
      const carto = Cesium.Cartographic.fromCartesian(cartesian)
      return carto.height
    }

    switch (drawType) {
      case 'Polygon':
        height = getHeightFromCartesian(positions[0])
        extrudedHeight = result?.polygon?.extrudedHeight ?? height
        break
      case 'Rectangle':
        height = getHeightFromCartesian(positions[0])
        extrudedHeight = result?.rectangle?.extrudedHeight ?? height
        break
      case 'Circle':
        height = getHeightFromCartesian(positions[0])
        extrudedHeight = result?.ellipse?.extrudedHeight ?? height
        break
      default:
        height = getHeightFromCartesian(positions[0])
        extrudedHeight = height
    }
    return { height, extrudedHeight }
  },
  //激活绘制工具
  drawActivate(type) {
    this.draw.activate(type)
    this.viewer.scene.globe.depthTestAgainstTerrain = false //深度检测
  },
  //清空所有绘制
  clearDraw() {
    let entities = this.viewer.entities.values
    let delEntities = entities.filter((item) => item.Type && item.Type.includes('Editable'))
    for (let i = 0; i < delEntities.length; i++) {
      this.viewer.entities.remove(delEntities[i])
    }
    const drawEditStore = useDrawEditStore()
    drawEditStore.clearPointPosition()
    drawEditStore.clearPolylinePositions()
    drawEditStore.clearPolygonData()
    drawEditStore.clearRectangleData()
    drawEditStore.clearCircleData()
  },

  //添加绘制结果
  addDrawResult(positions, drawType, height = 0, extrudedHeight = 0) {
    switch (drawType) {
      case 'Point':
        this.generatePoint(positions)
        break
      case 'Polyline':
        this.generatePolyline(positions)
        break
      case 'Polygon':
        this.generatePolygon(positions, height, extrudedHeight)
        break
      case 'Rectangle':
        this.generateRectangle(positions, height, extrudedHeight)
        break
      case 'Circle':
        this.generateCircle(positions, height, extrudedHeight)
        break
    }
  },
  generatePoint(positions) {
    this.viewer.entities.add({
      Type: 'EditableMarker',
      position: positions[0],
      billboard: {
        image: new URL('@/assets/icon/drawEdit/icon_Red.png', import.meta.url).href,
        scale: 0.2,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        disableDepthTestDistance: 50000,
      },
    })
  },
  generatePolyline(positions) {
    this.viewer.entities.add({
      Type: 'EditablePolyline',
      polyline: {
        positions: positions,
        width: 2,
        material: Cesium.Color.fromCssColorString('rgba(78, 143, 252, 1)'),
        disableDepthTestDistance: 50000,
      },
    })
  },
  /**
   * 这个注释很重要，不要被忽略
   *height 属性被忽略，
   *多边形每个顶点的实际高度由 positions 
   *数组中的坐标决定（即你传入的每个点必须包含高程信息）。此时多边形的底面是起伏的，由顶点高程插值形成
   **/
  generatePolygon(positions, height = 0, extrudedHeight = 0) {
    this.viewer.entities.add({
      Type: 'EditablePolygon',
      polygon: {
        hierarchy: positions,
        material: Cesium.Color.fromCssColorString('rgba(78, 143, 252, 0.4)'),
        perPositionHeight: true,//****很重要 */
        disableDepthTestDistance: 50000,
        height, // 为true时候被忽略
        extrudedHeight, // 拉伸底面高度
      },
    })
  },
  generateRectangle(positions, height = 0, extrudedHeight = 0) {
    this.viewer.entities.add({
      Type: 'EditableRectangle',
      rectangle: {
        coordinates: Cesium.Rectangle.fromCartesianArray(positions),
        material: Cesium.Color.fromCssColorString('rgba(78, 143, 252, 0.4)'),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('rgba(78, 143, 252, 1)'),
        outlineWidth: 3,
        height,
        extrudedHeight,
      },
    })
  },
  generateCircle(positions, height = 0, extrudedHeight = 0) {
    let radius = Cesium.Cartesian3.distance(positions[0], positions[1])
    this.viewer.entities.add({
      Type: 'EditableCircle',
      position: positions[0],
      ellipse: {
        semiMajorAxis: radius,
        semiMinorAxis: radius,
        material: Cesium.Color.fromCssColorString('rgba(78, 143, 252, 0.4)'),
        height,
        extrudedHeight,
      },
    })
  },
}
export default MapPlotting
