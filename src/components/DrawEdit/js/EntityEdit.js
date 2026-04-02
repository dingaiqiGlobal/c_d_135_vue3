import * as Cesium from 'cesium'
import * as turf from '@turf/turf'

const EDITABLE_TYPES = [
  'EditableMarker',
  'EditablePolyline',
  'EditablePolygon',
  'EditableCircle',
  'EditableRectangle',
]
const FLAT_TYPES = ['EditablePolygon', 'EditableRectangle', 'EditableCircle']

export default class EntityEdit {
  constructor(viewer) {
    this.viewer = viewer
    this.eventHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas)
    this.EditEndEvent = new Cesium.Event()
    this.EditMoveEvent = new Cesium.Event()
    this.EditPickEvent = new Cesium.Event()
  }

  // ====================== 激活 / 禁用 ======================

  activate() {
    this.deactivate()
    this.initLeftClickEventHandler()
  }

  deactivate() {
    this.eventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)
    this.unRegisterEvents()
    this.clearAllEditVertex()
    this.removeTip()
  }

  // ====================== 编辑对象管理 ======================

  handlePickEditEntity(pickId) {
    if (!EDITABLE_TYPES.includes(pickId.Type)) return
    this.editEntity = pickId
    this.isEditing = false
    this.isEdited = false
    this.isDraggingAxis = false
    this.isDraggingNode = false

    this.editPositions = this.getEditEntityPositions()
    this.editMoveCenterPos = this.getCenterPosition()

    this.openEntityEditMode()
    this.clearAllEditVertex()
    this.unRegisterEvents()
    this.createEditVertex()
    this.createMidVertex()
    this.createTooltip()
    this.createAxisEntities()
    this.registerEvents()
    this.EditPickEvent.raiseEvent(this.editEntity, this.editPositions)
  }

  handleEditEntity() {
    this.unRegisterEvents()
    this.clearAllEditVertex()
    this.removeTip()
    let editEntity = this.editEntity
    if (!editEntity) return
    this.closeEntityEditMode()
    this.editEntity = undefined
    if (!this.isEdited) return
    this.EditEndEvent.raiseEvent(editEntity)
    this.isEdited = false
    this.isEditing = false
  }

  // ====================== 编辑模式开关 ======================

  openEntityEditMode() {
    switch (this.editEntity.Type) {
      case 'EditableMarker':
        this.editEntity.position = new Cesium.CallbackProperty(() => {
          return this.editPositions[0]
        }, false)
        break
      case 'EditablePolyline':
        this.editEntity.polyline.positions = new Cesium.CallbackProperty(() => {
          return this.editPositions
        }, false)
        break
      case 'EditablePolygon':
        this.editEntity.polygon.hierarchy = new Cesium.CallbackProperty(() => {
          return new Cesium.PolygonHierarchy(this.editPositions)
        }, false)
        if (this.editEntity.polyline) {
          this.editEntity.polyline.positions = new Cesium.CallbackProperty(() => {
            return this.editPositions.concat(this.editPositions[0])
          }, false)
        }
        break
      case 'EditableCircle':
        this.editEntity.position = new Cesium.CallbackProperty(() => {
          return this.editPositions[0]
        }, false)
        this.editEntity.ellipse.semiMajorAxis = new Cesium.CallbackProperty(() => {
          return Cesium.Cartesian3.distance(this.editPositions[0], this.editPositions[1]) || 0.1
        }, false)
        this.editEntity.ellipse.semiMinorAxis = new Cesium.CallbackProperty(() => {
          return Cesium.Cartesian3.distance(this.editPositions[0], this.editPositions[1]) || 0.1
        }, false)
        this.editEntity.ellipse.height = new Cesium.CallbackProperty(() => {
          return Cesium.Cartographic.fromCartesian(this.editPositions[0]).height
        }, false)
        break
      case 'EditableRectangle':
        this.editEntity.rectangle.coordinates = new Cesium.CallbackProperty(() => {
          return Cesium.Rectangle.fromCartesianArray(this.editPositions)
        }, false)
        this.editEntity.rectangle.height = new Cesium.CallbackProperty(() => {
          return Cesium.Cartographic.fromCartesian(this.editPositions[0]).height
        }, false)
        break
    }
  }

  closeEntityEditMode() {
    switch (this.editEntity.Type) {
      case 'EditableMarker':
        this.editEntity.position = this.editPositions[0]
        break
      case 'EditablePolyline':
        this.editEntity.polyline.positions = this.editPositions
        break
      case 'EditablePolygon':
        this.editEntity.polygon.hierarchy = this.editPositions
        if (this.editEntity.polyline) {
          this.editEntity.polyline.positions = this.editPositions.concat(this.editPositions[0])
        }
        break
      case 'EditableCircle': {
        this.editEntity.position = this.editPositions[0]
        let radius = Cesium.Cartesian3.distance(this.editPositions[0], this.editPositions[1])
        this.editEntity.ellipse.semiMajorAxis = radius
        this.editEntity.ellipse.semiMinorAxis = radius
        this.editEntity.ellipse.height = Cesium.Cartographic.fromCartesian(
          this.editPositions[0],
        ).height
        break
      }
      case 'EditableRectangle': {
        this.editEntity.rectangle.coordinates = Cesium.Rectangle.fromCartesianArray(
          this.editPositions,
        )
        this.editEntity.rectangle.height = Cesium.Cartographic.fromCartesian(
          this.editPositions[0],
        ).height
        const rectExtruded = this.editEntity.rectangle.extrudedHeight
        if (rectExtruded !== undefined) {
          const v =
            rectExtruded._value ??
            (typeof rectExtruded.getValue === 'function'
              ? rectExtruded.getValue(Cesium.JulianDate.now())
              : rectExtruded)
          if (v !== undefined) this.editEntity.rectangle.extrudedHeight = v
        }
        break
      }
    }
  }

  getEditEntityPositions() {
    switch (this.editEntity.Type) {
      case 'EditableMarker':
        return [this.editEntity.position._value]
      case 'EditablePolyline':
        return this.editEntity.polyline.positions._value
      case 'EditablePolygon':
        return this.editEntity.polygon.hierarchy._value.positions
      case 'EditableCircle': {
        let center =
          this.editEntity.position._value ||
          this.editEntity.position.getValue(Cesium.JulianDate.now())
        let radius =
          this.editEntity.ellipse.semiMajorAxis._value ||
          this.editEntity.ellipse.semiMajorAxis.getValue(Cesium.JulianDate.now())
        let carto = Cesium.Cartographic.fromCartesian(center)
        let lonOffsetRad = Cesium.Math.toRadians(radius / (111319.49 * Math.cos(carto.latitude)))
        let edgeCarto = new Cesium.Cartographic(
          carto.longitude + lonOffsetRad,
          carto.latitude,
          carto.height,
        )
        let edge = Cesium.Cartographic.toCartesian(edgeCarto, this.viewer.scene.globe.ellipsoid)
        return [center, edge]
      }
      case 'EditableRectangle': {
        const rect =
          this.editEntity.rectangle.coordinates._value ||
          this.editEntity.rectangle.coordinates.getValue(Cesium.JulianDate.now())
        const heightProp = this.editEntity.rectangle.height
        const height =
          heightProp != null && typeof heightProp.getValue === 'function'
            ? (heightProp._value ?? heightProp.getValue(Cesium.JulianDate.now()))
            : heightProp
        const h = height != null ? height : 0
        return [
          Cesium.Cartesian3.fromRadians(rect.west, rect.north, h),
          Cesium.Cartesian3.fromRadians(rect.east, rect.south, h),
        ]
      }
    }
  }

  // ====================== 事件注册 / 注销 ======================

  registerEvents() {
    this.initLeftDownEventHandler()
    this.initMouseMoveEventHandler()
    this.initLeftUpEventHandler()
    this.initRightClickEventHandler()
  }

  unRegisterEvents() {
    this.eventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN)
    this.eventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP)
    this.eventHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE)
    this.eventHandler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK)
  }

  // ====================== 鼠标事件处理 ======================

  initLeftClickEventHandler() {
    this.eventHandler.setInputAction((e) => {
      let id = this.viewer.scene.pick(e.position)
      if (!id || !id.id) {
        if (this.activeAxisNode) {
          this.activeAxisNode = null
          return
        }
        this.handleEditEntity()
        return
      }
      if (id.id.type === 'EditVertex' || id.id.type === 'EditMove') {
        this.activeAxisNode = id.id
        return
      }
      if (id.id.type && id.id.type.startsWith('EditAxis')) return
      if (!id.id.Type) return
      if (this.editEntity && this.editEntity.id == id.id.id) return

      this.handleEditEntity()
      this.handlePickEditEntity(id.id)
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
  }

  initLeftDownEventHandler() {
    this.eventHandler.setInputAction((e) => {
      let id = this.viewer.scene.pick(e.position)
      if (!id || !id.id || !id.id.type) return

      if (id.id.type.startsWith('EditAxis')) {
        if (id.id.axisName === 'Z' && this.isVertexOfFlatType()) return

        this.enterDragMode(id.id)
        this.clearMidVertex()

        let ray = this.viewer.camera.getPickRay(e.position)
        let origin = this.getAxisOrigin()
        let direction = this.getEnuDirection(origin, id.id.axisName)
        let t = this.rayAxisIntersectT(ray, origin, direction)
        if (t !== null) {
          this.dragOffsetT = t
          this.dragStartNodePos = Cesium.Cartesian3.clone(origin)
          this.dragDirection = direction
          this.isDraggingAxis = true
          this.draggingAxisName = id.id.axisName
          this.highlightDraggingAxis(id.id.axisName)
        }
        return
      }

      if (id.id.type === 'EditVertex' || id.id.type === 'EditMove') {
        this.activeAxisNode = id.id
        this.enterDragMode(id.id)
        this.dragVertex.show = false
        this.dragStartNodePos = Cesium.Cartesian3.clone(this.getAxisOrigin())
        this.isDraggingNode = true
        this.clearMidVertex()
      } else if (id.id.type === 'EditMidVertex') {
        this.activeAxisNode = null
        this.editPositions.splice(id.id.vertexIndex, 0, id.id.position._value)
        this.refreshEditVertices()
        this.isEdited = true
        if (this.editEntity && this.EditMoveEvent) {
          this.EditMoveEvent.raiseEvent(this.editEntity, this.editPositions)
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN)
  }

  initLeftUpEventHandler() {
    this.eventHandler.setInputAction(() => {
      if (!this.isEditing) return
      this.exitDragMode()
      if (this.isDraggingAxis) {
        this.isDraggingAxis = false
        this.restoreAxisColors()
        this.draggingAxisName = null
      }
      this.isDraggingNode = false
      this.clearMidVertex()
      this.createMidVertex()
    }, Cesium.ScreenSpaceEventType.LEFT_UP)
  }

  initRightClickEventHandler() {
    this.eventHandler.setInputAction((e) => {
      let id = this.viewer.scene.pick(e.position)
      if (!id || !id.id || id.id.type !== 'EditVertex') return
      if (this.editEntity.Type === 'EditablePolyline' && this.editPositions.length <= 2) return
      if (this.editEntity.Type === 'EditablePolygon' && this.editPositions.length <= 3) return
      if (['EditableRectangle', 'EditableCircle', 'EditableMarker'].includes(this.editEntity.Type))
        return

      this.deletePosition(id.id.vertexIndex)
      if (this.editEntity && this.EditMoveEvent) {
        this.EditMoveEvent.raiseEvent(this.editEntity, this.editPositions)
      }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
  }

  initMouseMoveEventHandler() {
    this.eventHandler.setInputAction((e) => {
      this.updateTooltip(e.endPosition)

      let pickPosition = this.viewer.scene.pickPosition(e.endPosition)
      if (!pickPosition) {
        pickPosition = this.viewer.scene.camera.pickEllipsoid(
          e.endPosition,
          this.viewer.scene.globe.ellipsoid,
        )
      }
      if (!pickPosition || !this.isEditing) return

      if (this.dragVertex.type && this.dragVertex.type.startsWith('EditAxis')) {
        this.handleAxisDrag(e.endPosition)
      } else if (this.dragVertex.type === 'EditMove') {
        if (this.editMoveCenterPos) {
          this.moveEntityByOffset(this.editMoveCenterPos, pickPosition)
        }
      } else {
        if (this.isVertexOfFlatType()) {
          pickPosition = this.clampToOriginalHeight(
            this.editPositions[this.dragVertex.vertexIndex],
            pickPosition,
          )
        }
        this.editPositions[this.dragVertex.vertexIndex] = pickPosition
      }

      this.isEdited = true
      this.editMoveCenterPos = this.getCenterPosition()
      if (this.editEntity && this.EditMoveEvent) {
        this.EditMoveEvent.raiseEvent(this.editEntity, this.editPositions)
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
  }

  // ====================== 拖拽辅助 ======================

  enterDragMode(entity) {
    this.isEditing = true
    this.viewer.scene.screenSpaceCameraController.enableRotate = false
    this.viewer.enableCursorStyle = false
    this.viewer._element.style.cursor = ''
    document.body.style.cursor = 'move'
    this.dragVertex = entity
  }

  exitDragMode() {
    this.viewer.enableCursorStyle = true
    document.body.style.cursor = 'default'
    this.viewer.scene.screenSpaceCameraController.enableRotate = true
    this.dragVertex.show = true
    this.isEditing = false
  }

  handleAxisDrag(screenPos) {
    let ray = this.viewer.camera.getPickRay(screenPos)
    let origin = this.dragStartNodePos
    let direction = this.dragDirection
    if (!ray || !origin || !direction) return
    let t = this.rayAxisIntersectT(ray, origin, direction)
    if (t === null) return

    let delta = t - this.dragOffsetT
    let movement = new Cesium.Cartesian3()
    Cesium.Cartesian3.multiplyByScalar(direction, delta, movement)
    let newPos = new Cesium.Cartesian3()
    Cesium.Cartesian3.add(origin, movement, newPos)

    const axisName = this.activeAxisNode?.axisName
    const isFlatShape = this.editEntity && FLAT_TYPES.includes(this.editEntity.Type)

    if (this.activeAxisNode.type === 'EditVertex') {
      if (isFlatShape && (axisName === 'X' || axisName === 'Y')) {
        newPos = this.clampToOriginalHeight(origin, newPos)
      }
      this.editPositions[this.activeAxisNode.vertexIndex] = newPos
    } else if (this.activeAxisNode.type === 'EditMove') {
      this.moveEntityByOffset(this.editMoveCenterPos, newPos, isFlatShape && (axisName === 'X' || axisName === 'Y'))
    }
  }

  /** 射线与轴线最近点参数 t，返回 null 表示平行无解 */
  rayAxisIntersectT(ray, origin, direction) {
    let w0 = Cesium.Cartesian3.subtract(ray.origin, origin, new Cesium.Cartesian3())
    let a = Cesium.Cartesian3.dot(ray.direction, ray.direction)
    let b = Cesium.Cartesian3.dot(ray.direction, direction)
    let c = Cesium.Cartesian3.dot(direction, direction)
    let d = Cesium.Cartesian3.dot(ray.direction, w0)
    let e2 = Cesium.Cartesian3.dot(direction, w0)
    let denom = a * c - b * b
    if (denom === 0) return null
    return (a * e2 - b * d) / denom
  }

  /** 获取 ENU 坐标系下指定轴的方向向量 */
  getEnuDirection(origin, axisName) {
    let enu = Cesium.Transforms.eastNorthUpToFixedFrame(origin)
    if (axisName === 'X') return new Cesium.Cartesian3(enu[0], enu[1], enu[2])
    if (axisName === 'Y') return new Cesium.Cartesian3(enu[4], enu[5], enu[6])
    return new Cesium.Cartesian3(enu[8], enu[9], enu[10])
  }

  /** 保留原始高度，只更新经纬度 */
  clampToOriginalHeight(originalPos, newPos) {
    let originalCarto = Cesium.Cartographic.fromCartesian(originalPos)
    let newCarto = Cesium.Cartographic.fromCartesian(newPos)
    return Cesium.Cartesian3.fromRadians(newCarto.longitude, newCarto.latitude, originalCarto.height)
  }

  /** 判断当前激活节点是否为平面类型的顶点 */
  isVertexOfFlatType() {
    return (
      this.activeAxisNode &&
      this.activeAxisNode.type === 'EditVertex' &&
      this.editEntity &&
      FLAT_TYPES.includes(this.editEntity.Type)
    )
  }

  // ====================== 位置计算 ======================

  getCenterPosition() {
    if (this.editEntity.Type === 'EditableMarker' || this.editEntity.Type === 'EditableCircle') {
      return this.editPositions[0]
    }
    let points = []
    let maxHeight = 0
    this.editPositions.forEach((position) => {
      const p = this.cartesian3ToPoint3D(position)
      points.push([p.x, p.y])
      if (maxHeight < p.z) maxHeight = p.z
    })
    let geo = turf.lineString(points)
    let bbox = turf.bbox(geo)
    let bboxPolygon = turf.bboxPolygon(bbox)
    let center = turf.center(bboxPolygon)
    let lonLat = center.geometry.coordinates
    return Cesium.Cartesian3.fromDegrees(lonLat[0], lonLat[1], maxHeight)
  }

  moveEntityByOffset(startPosition, endPosition, keepHeight = false) {
    let start = this.cartesian3ToPoint3D(startPosition)
    let end = this.cartesian3ToPoint3D(endPosition)
    let dx = end.x - start.x
    let dy = end.y - start.y
    let dz = keepHeight ? 0 : end.z - start.z
    for (let i = 0; i < this.editPositions.length; i++) {
      let p = this.cartesian3ToPoint3D(this.editPositions[i])
      this.editPositions[i] = Cesium.Cartesian3.fromDegrees(p.x + dx, p.y + dy, p.z + dz)
    }
  }

  getAxisOrigin() {
    if (!this.activeAxisNode) return null
    if (this.activeAxisNode.type === 'EditVertex') {
      return this.editPositions[this.activeAxisNode.vertexIndex]
    }
    if (this.activeAxisNode.type === 'EditMove') {
      return this.editMoveCenterPos
    }
    return null
  }

  cartesian3ToPoint3D(position) {
    const carto = Cesium.Cartographic.fromCartesian(position)
    return {
      x: Cesium.Math.toDegrees(carto.longitude),
      y: Cesium.Math.toDegrees(carto.latitude),
      z: carto.height,
    }
  }

  midPosition(first, second) {
    if (!first || !second) return null
    let p1 = this.cartesian3ToPoint3D(first)
    let p2 = this.cartesian3ToPoint3D(second)
    return Cesium.Cartesian3.fromDegrees(
      (p1.x + p2.x) / 2,
      (p1.y + p2.y) / 2,
      (p1.z + p2.z) / 2,
    )
  }

  // ====================== 编辑顶点 / 中点 ======================

  refreshEditVertices() {
    this.clearAllEditVertex()
    this.createEditVertex()
    this.createMidVertex()
    this.createAxisEntities()
  }

  clearAllEditVertex() {
    this.clearEditVertex()
    this.clearMidVertex()
    this.activeAxisNode = null
  }

  createEditVertex() {
    this.vertexEntities = []
    this.editPositions.forEach((p, index) => {
      if (this.editEntity.Type === 'EditableCircle' && index === 0) return
      const entity = this.viewer.entities.add({
        position: new Cesium.CallbackProperty(() => this.editPositions[index], false),
        type: 'EditVertex',
        vertexIndex: index,
        point: {
          color: Cesium.Color.DARKBLUE.withAlpha(0.4),
          pixelSize: 10,
          outlineColor: Cesium.Color.YELLOW.withAlpha(0.4),
          outlineWidth: 3,
          disableDepthTestDistance: 2000,
        },
      })
      this.vertexEntities.push(entity)
    })
    if (this.editPositions.length > 1) {
      this.createEditMoveCenterEntity()
    }
  }

  createEditMoveCenterEntity() {
    this.EditMoveCenterEntity = this.viewer.entities.add({
      position: new Cesium.CallbackProperty(() => this.editMoveCenterPos, false),
      type: 'EditMove',
      point: {
        color: Cesium.Color.RED.withAlpha(0.4),
        pixelSize: 10,
        outlineColor: Cesium.Color.WHITE.withAlpha(0.3),
        outlineWidth: 3,
        disableDepthTestDistance: 2000,
      },
    })
  }

  clearEditVertex() {
    if (this.vertexEntities) {
      this.vertexEntities.forEach((item) => this.viewer.entities.remove(item))
    }
    if (this.axisEntities) {
      this.axisEntities.forEach((item) => this.viewer.entities.remove(item))
      this.axisEntities = null
    }
    this.vertexEntities = []
    this.viewer.entities.remove(this.EditMoveCenterEntity)
  }

  createMidVertex() {
    this.midVertexEntities = []
    if (this.editEntity.Type === 'EditableCircle' || this.editEntity.Type === 'EditableRectangle')
      return

    for (let i = 0; i < this.editPositions.length; i++) {
      let midP = this.midPosition(this.editPositions[i], this.editPositions[i + 1])
      const entity = this.viewer.entities.add({
        position: midP,
        type: 'EditMidVertex',
        vertexIndex: i + 1,
        point: {
          color: Cesium.Color.LIMEGREEN.withAlpha(0.4),
          pixelSize: 10,
          outlineColor: Cesium.Color.YELLOW.withAlpha(0.4),
          outlineWidth: 3,
          disableDepthTestDistance: 2000,
        },
      })
      this.midVertexEntities.push(entity)
    }
  }

  clearMidVertex() {
    if (this.midVertexEntities) {
      this.midVertexEntities.forEach((item) => this.viewer.entities.remove(item))
    }
    this.midVertexEntities = []
  }

  // ====================== 坐标轴实体 ======================

  createAxisEntities() {
    if (this.axisEntities) return
    this.axisEntities = []

    const axes = [
      { name: 'X', color: Cesium.Color.RED },
      { name: 'Y', color: Cesium.Color.GREEN },
      { name: 'Z', color: Cesium.Color.BLUE },
    ]

    axes.forEach((axis) => {
      const entity = this.viewer.entities.add({
        show: new Cesium.CallbackProperty(() => {
          if (!this.activeAxisNode) return false
          if (axis.name === 'Z' && this.isVertexOfFlatType()) return false
          return true
        }, false),
        polyline: {
          positions: new Cesium.CallbackProperty(() => {
            if (!this.activeAxisNode) return []
            if (axis.name === 'Z' && this.isVertexOfFlatType()) return []
            let origin = this.getAxisOrigin()
            if (!origin) return []
            let direction = this.getEnuDirection(origin, axis.name)
            let dist = Cesium.Cartesian3.distance(origin, this.viewer.camera.position)
            let end = new Cesium.Cartesian3()
            Cesium.Cartesian3.multiplyByScalar(direction, dist * 0.15, end)
            Cesium.Cartesian3.add(origin, end, end)
            return [origin, end]
          }, false),
          width: 15,
          material: new Cesium.PolylineArrowMaterialProperty(axis.color),
          depthFailMaterial: new Cesium.PolylineArrowMaterialProperty(axis.color.withAlpha(0.2)),
        },
        type: 'EditAxis' + axis.name,
        axisName: axis.name,
        _originalColor: axis.color,
      })
      this.axisEntities.push(entity)
    })

    this.createDragLineEntity()
  }

  createDragLineEntity() {
    const isDragging = () => this.isDraggingAxis || this.isDraggingNode
    const getCurrentPos = () => {
      if (!isDragging() || !this.dragStartNodePos) return null
      return this.getAxisOrigin()
    }

    const dragLineEntity = this.viewer.entities.add({
      show: new Cesium.CallbackProperty(() => isDragging(), false),
      polyline: {
        positions: new Cesium.CallbackProperty(() => {
          let pos = getCurrentPos()
          return pos ? [this.dragStartNodePos, pos] : []
        }, false),
        width: 3,
        material: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.YELLOW,
          dashLength: 10,
        }),
        depthFailMaterial: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.YELLOW.withAlpha(0.2),
          dashLength: 10,
        }),
      },
      position: new Cesium.CallbackProperty(() => {
        let pos = getCurrentPos()
        if (!pos) return undefined
        return Cesium.Cartesian3.midpoint(this.dragStartNodePos, pos, new Cesium.Cartesian3())
      }, false),
      label: {
        text: new Cesium.CallbackProperty(() => {
          let pos = getCurrentPos()
          if (!pos) return ''
          return this.formatAxisDistanceLabel(this.dragStartNodePos, pos)
        }, false),
        font: '13px monospace',
        fillColor: Cesium.Color.YELLOW,
        showBackground: true,
        backgroundColor: new Cesium.Color(0, 0, 0, 0.7),
        backgroundPadding: new Cesium.Cartesian2(7, 5),
        pixelOffset: new Cesium.Cartesian2(0, -20),
        disableDepthTestDistance: 2000,
      },
    })
    this.axisEntities.push(dragLineEntity)
  }

  formatAxisDistanceLabel(startPos, currentPos) {
    let enu = Cesium.Transforms.eastNorthUpToFixedFrame(startPos)
    let inverseEnu = Cesium.Matrix4.inverse(enu, new Cesium.Matrix4())
    let local = Cesium.Matrix4.multiplyByPoint(inverseEnu, currentPos, new Cesium.Cartesian3())
    const fmt = (v) => {
      let abs = Math.abs(v)
      let sign = v >= 0 ? '+' : '-'
      return sign + (abs > 1000 ? (abs / 1000).toFixed(2) + 'km' : abs.toFixed(2) + 'm')
    }
    if (this.isVertexOfFlatType()) {
      return `X: ${fmt(local.x)}  Y: ${fmt(local.y)}`
    }
    return `X: ${fmt(local.x)}  Y: ${fmt(local.y)}  Z: ${fmt(local.z)}`
  }

  highlightDraggingAxis(axisName) {
    if (!this.axisEntities) return
    this.axisEntities.forEach((entity) => {
      if (entity.axisName === axisName && entity.polyline) {
        entity.polyline.material = new Cesium.PolylineArrowMaterialProperty(Cesium.Color.YELLOW)
        entity.polyline.depthFailMaterial = new Cesium.PolylineArrowMaterialProperty(
          Cesium.Color.YELLOW.withAlpha(0.2),
        )
      }
    })
  }

  restoreAxisColors() {
    if (!this.axisEntities) return
    this.axisEntities.forEach((entity) => {
      if (entity.axisName && entity.polyline && entity._originalColor) {
        let color = entity._originalColor
        entity.polyline.material = new Cesium.PolylineArrowMaterialProperty(color)
        entity.polyline.depthFailMaterial = new Cesium.PolylineArrowMaterialProperty(
          color.withAlpha(0.2),
        )
      }
    })
  }

  // ====================== 从 UI 操作节点 ======================

  updatePosition(index, position) {
    if (this.editPositions && this.editPositions.length > index) {
      this.editPositions[index] = position
      this.isEdited = true
      this.refreshEditVertices()
    }
  }

  addPosition(index) {
    if (!this.editPositions) return
    let newPos
    if (index > 0 && index < this.editPositions.length) {
      newPos = this.midPosition(this.editPositions[index - 1], this.editPositions[index])
    } else if (this.editPositions.length > 0) {
      let ref =
        index === 0 ? this.editPositions[0] : this.editPositions[this.editPositions.length - 1]
      let p = this.cartesian3ToPoint3D(ref)
      newPos = Cesium.Cartesian3.fromDegrees(p.x + 0.0001, p.y + 0.0001, p.z)
    }
    if (newPos) {
      this.editPositions.splice(index, 0, newPos)
      this.isEdited = true
      this.refreshEditVertices()
    }
  }

  deletePosition(index) {
    if (this.editPositions && this.editPositions.length > index) {
      this.editPositions.splice(index, 1)
      this.isEdited = true
      this.refreshEditVertices()
    }
  }

  // ====================== 提示框 ======================

  updateTooltip(screenPos) {
    if (this.isEditing) {
      this.hideTip()
      return
    }
    let id = this.viewer.scene.pick(screenPos)
    if (id && id.id && id.id.type === 'EditVertex') {
      const type = this.editEntity && this.editEntity.Type
      const canRightDelete = type === 'EditablePolyline' || type === 'EditablePolygon'
      if (type === 'EditableMarker' || type === 'EditableCircle' || type === 'EditableRectangle') {
        this.showTip(screenPos, '按住左键拖动移动，单击激活轴线平移')
      } else if (canRightDelete) {
        this.showTip(screenPos, '单击激活轴线平移，右击删除节点')
      } else {
        this.showTip(screenPos, '单击激活轴线平移')
      }
    } else if (id && id.id && id.id.type === 'EditMove') {
      this.showTip(screenPos, '单击激活轴线平移')
    } else if (id && id.id && id.id.type && id.id.type.startsWith('EditAxis')) {
      this.showTip(screenPos, `按住左键沿${id.id.axisName}轴精确移动`)
    } else if (id && id.id && id.id.type === 'EditMidVertex') {
      this.showTip(screenPos, '点击左键增加新节点')
    } else {
      this.hideTip()
    }
  }

  createTooltip() {
    if (this.tooltip) return
    this.tooltip = document.createElement('div')
    Object.assign(this.tooltip.style, {
      position: 'absolute',
      backgroundColor: 'rgba(0,0,0,0.65)',
      color: '#fff',
      padding: '6px 12px',
      borderRadius: '4px',
      fontSize: '12px',
      pointerEvents: 'none',
      display: 'none',
      zIndex: '999',
    })
    this.viewer.container.appendChild(this.tooltip)
  }

  showTip(position, text) {
    if (this.tooltip && position) {
      this.tooltip.style.display = 'block'
      this.tooltip.style.left = position.x + 15 + 'px'
      this.tooltip.style.top = position.y + 15 + 'px'
      this.tooltip.innerHTML = text
    }
  }

  hideTip() {
    if (this.tooltip) {
      this.tooltip.style.display = 'none'
    }
  }

  removeTip() {
    if (this.tooltip) {
      this.tooltip.remove()
      this.tooltip = null
    }
  }
}
