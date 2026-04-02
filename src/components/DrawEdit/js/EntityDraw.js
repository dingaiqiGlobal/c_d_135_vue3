import * as Cesium from 'cesium'

export default class EntityDraw {
  constructor(viewer) {
    this.viewer = viewer
    this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
      Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
    )
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas)
    this.DrawEndEvent = new Cesium.Event()
  }

  // ====================== 激活 / 禁用 ======================

  activate(drawType) {
    this.deactivate()
    this.clear()
    this.drawType = drawType
    this.positions = []
    this.tempPositions = []
    this.rectStart = null
    this.posArr = []
    this.radius = 0.1
    this.createTooltip()
    this.registerEvents()
    this.viewer._element.style.cursor = 'crosshair'
    this.viewer.enableCursorStyle = true
  }

  deactivate() {
    this.removeTip()
    this.unRegisterEvents()
    this.drawType = undefined
    this.drawEntity = undefined
    this.viewer._element.style.cursor = 'default'
    this.viewer.enableCursorStyle = true
  }

  clear() {
    if (this.drawEntity) {
      this.viewer.entities.remove(this.drawEntity)
      this.drawEntity = undefined
    }
  }

  // ====================== 事件注册 ======================

  registerEvents() {
    this.handler.setInputAction((e) => this.onLeftClick(e), Cesium.ScreenSpaceEventType.LEFT_CLICK)
    this.handler.setInputAction(
      (e) => this.onLeftDoubleClick(e),
      Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
    )
    this.handler.setInputAction((e) => this.onMouseMove(e), Cesium.ScreenSpaceEventType.MOUSE_MOVE)
  }

  unRegisterEvents() {
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE)
  }

  // ====================== 鼠标事件 ======================

  pickGroundPosition(screenPos) {
    return this.viewer.scene.camera.pickEllipsoid(
      screenPos,
      this.viewer.scene.globe.ellipsoid,
    )
  }

  onLeftClick(e) {
    this.viewer._element.style.cursor = 'crosshair'
    let position = this.pickGroundPosition(e.position)
    if (!position) return
    this.positions.push(position)

    if (this.positions.length === 1) {
      if (this.drawType === 'Rectangle') {
        this.initRectStartPoint(position)
      } else if (this.drawType === 'Circle') {
        this.radius = 0.1
      }
      this.handleFirstPosition()
    } else if (this.positions.length === 2) {
      if (this.drawType === 'Rectangle') {
        this.generateRectangle()
        this.drawEnd()
      } else if (this.drawType === 'Circle') {
        this.drawEnd()
      }
    }
  }

  onLeftDoubleClick() {
    if (!this.drawEntity) {
      this.deactivate()
      return
    }
    if (this.drawType === 'Polyline' || this.drawType === 'Polygon') {
      this.positions.pop()
    }

    let minCount
    switch (this.drawType) {
      case 'Polyline':
        this.drawEntity.polyline.positions = this.positions
        minCount = 2
        break
      case 'Polygon':
        this.drawEntity.polygon.hierarchy = this.positions
        this.drawEntity.polyline.positions = this.positions.concat(this.positions[0])
        minCount = 3
        break
      case 'Rectangle':
        this.drawEntity.rectangle.coordinates = this.posArr
        minCount = 2
        break
      case 'Circle':
        this.drawEntity.ellipse.semiMajorAxis = this.radius
        this.drawEntity.ellipse.semiMinorAxis = this.radius
        minCount = 2
        break
    }
    if (this.positions.length < minCount) {
      this.clear()
      this.deactivate()
      return
    }
    this.drawEnd()
  }

  onMouseMove(e) {
    this.viewer._element.style.cursor = 'crosshair'
    this.updateDrawTooltip(e.endPosition)

    let position = this.pickGroundPosition(e.startPosition)
    if (!position || !this.drawEntity) return

    if (this.drawType === 'Circle') {
      this.radius = Cesium.Cartesian3.distance(this.positions[0], position)
    } else if (this.drawType === 'Rectangle') {
      this.updateRectDynamic(position)
    } else {
      this.tempPositions = this.positions.concat([position])
    }
  }

  // ====================== 绘制生成 ======================

  handleFirstPosition() {
    switch (this.drawType) {
      case 'Point':
        this.generatePoint()
        this.drawEnd()
        break
      case 'Polyline':
        this.generatePolyline()
        break
      case 'Polygon':
        this.generatePolygon()
        break
      case 'Rectangle':
        this.generateRectangle()
        break
      case 'Circle':
        this.generateCircle()
        break
    }
  }

  generatePoint() {
    const pinBuilder = new Cesium.PinBuilder()
    this.drawEntity = this.viewer.entities.add({
      position: this.positions[0],
      billboard: {
        image: pinBuilder.fromColor(Cesium.Color.RED, 48),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        disableDepthTestDistance: 50000,
      },
    })
  }

  generatePolyline() {
    this.drawEntity = this.viewer.entities.add({
      polyline: {
        positions: new Cesium.CallbackProperty(() => this.tempPositions, false),
        width: 2,
        material: Cesium.Color.RED,
      },
    })
  }

  generatePolygon() {
    this.drawEntity = this.viewer.entities.add({
      polygon: {
        hierarchy: new Cesium.CallbackProperty(
          () => new Cesium.PolygonHierarchy(this.tempPositions),
          false,
        ),
        material: Cesium.Color.RED.withAlpha(0.4),
        perPositionHeight: true,
      },
      polyline: {
        positions: new Cesium.CallbackProperty(
          () => this.tempPositions.concat(this.tempPositions[0]),
          false,
        ),
        width: 1,
        material: Cesium.Color.RED,
      },
    })
  }

  generateRectangle() {
    this.clear()
    this.drawEntity = this.viewer.entities.add({
      rectangle: {
        coordinates: new Cesium.CallbackProperty(() => this.posArr, false),
        material: Cesium.Color.RED.withAlpha(0.4),
      },
    })
  }

  generateCircle() {
    this.drawEntity = this.viewer.entities.add({
      position: this.positions[0],
      ellipse: {
        semiMajorAxis: new Cesium.CallbackProperty(() => Math.max(this.radius, 0.1), false),
        semiMinorAxis: new Cesium.CallbackProperty(() => Math.max(this.radius, 0.1), false),
        material: Cesium.Color.RED.withAlpha(0.4),
      },
    })
  }

  // ====================== 矩形辅助 ======================

  initRectStartPoint(position) {
    let car = Cesium.Cartographic.fromCartesian(position)
    this.rectStart = {
      lon: +Cesium.Math.toDegrees(car.longitude).toFixed(5),
      lat: +Cesium.Math.toDegrees(car.latitude).toFixed(5),
    }
    this.posArr = Cesium.Rectangle.fromDegrees(
      this.rectStart.lon,
      this.rectStart.lat,
      this.rectStart.lon,
      this.rectStart.lat,
    )
  }

  updateRectDynamic(position) {
    let car = Cesium.Cartographic.fromCartesian(position)
    let endLon = +Cesium.Math.toDegrees(car.longitude).toFixed(5)
    let endLat = +Cesium.Math.toDegrees(car.latitude).toFixed(5)
    this.posArr = Cesium.Rectangle.fromDegrees(
      Math.min(this.rectStart.lon, endLon),
      Math.min(this.rectStart.lat, endLat),
      Math.max(this.rectStart.lon, endLon),
      Math.max(this.rectStart.lat, endLat),
    )
  }

  // ====================== 绘制结束 ======================

  drawEnd() {
    this.drawEntity.remove = () => {
      this.viewer.entities.remove(this.drawEntity)
    }
    this.DrawEndEvent.raiseEvent(this.drawEntity, this.positions, this.drawType)
    this.deactivate()
  }

  // ====================== 提示框 ======================

  updateDrawTooltip(screenPos) {
    let tipText = '单击左键开始绘制'
    if (this.positions.length > 0) {
      if (this.drawType === 'Rectangle' || this.drawType === 'Circle' || this.drawType === 'Point') {
        tipText = '单击左键结束绘制'
      } else {
        tipText = '单击左键增加点，双击左键结束'
      }
    } else if (this.drawType === 'Point') {
      tipText = '单击左键绘制点'
    }
    this.showTip(screenPos, tipText)
  }

  createTooltip() {
    this.tooltip = document.createElement('div')
    Object.assign(this.tooltip.style, {
      position: 'absolute',
      backgroundColor: 'rgba(0,0,0,0.6)',
      color: '#fff',
      padding: '5px 10px',
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

  removeTip() {
    if (this.tooltip) {
      this.tooltip.remove()
      this.tooltip = null
    }
  }
}
