/*
 * @Author: dys
 * @Date: 2025-09-08 13:42:41
 * @LastEditors: dys
 * @LastEditTime: 2025-12-15 17:27:01
 * @Descripttion:
 */
import * as Cesium from 'cesium'
let ViewInit = {
  handler: null,
  popup: null, //弹框
  viewer: null,
  init() {
    this.viewer = new Cesium.Viewer('cesiumContainer', {
      // scene3DOnly:true,
      homeButton: false, // 是否显示home控件
      vrButton: false,
      fullscreenButton: false,
      animation: true, // 是否显示动画控件
      geocoder: false, // 是否显示地名查找控件
      timeline: true, // 是否显示时间线控件
      sceneModePicker: false, // 是否显示投影方式控件
      navigationHelpButton: false, // 是否显示帮助信息控件
      infoBox: false, // 是否显示点击要素之后显示的信息
      baseLayerPicker: false, // 是否显示图层选择控件
      selectionIndicator: false, // Disable selection indicator
      shouldAnimate: true,
      // requestRenderMode: true
    })
    this.viewer._cesiumWidget._creditContainer.style.display = 'none'
    this.viewer.animation.container.style.visibility = 'hidden' // 不显示动画控件
    this.viewer.timeline.container.style.visibility = 'hidden' // 不显示时间控件
    /**
     * 屏幕坐标控制
     */
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas)

    /**
     * 气象开启
     */
    this.viewer.resolutionScale = 1.0
    this.viewer.scene.msaaSamples = 4
    this.viewer.postProcessStages.fxaa.enabled = true
    this.viewer.scene.globe.depthTestAgainstTerrain = true //深度检测

    /**
     * 按需加载
     */
    const entities = this.viewer.entities
    const tilesToRender = this.viewer.scene.globe._surface._tilesToRender
    this.viewer.camera.moveEnd.addEventListener(() => {
      let renderRectangle = new Cesium.Rectangle()
      if (tilesToRender.length > 0) {
        Cesium.Rectangle.clone(tilesToRender[0].rectangle, renderRectangle)
        let num = 0
        tilesToRender.forEach((item) => {
          if (item.level >= 12) {
            num += 1
            Cesium.Rectangle.union(item.rectangle, renderRectangle, renderRectangle)
          }
        })
        if (num > 0) {
          for (let i = 0; i < entities.length; i++) {
            let cartographic = Cesium.Cartographic.fromDegrees(labelArr[i][0], labelArr[i][1])
            if (Cesium.Rectangle.contains(renderRectangle, cartographic)) {
              if (viewer.entities.contains(entities[i])) continue
              viewer.entities.add(entities[i])
            } else {
              if (viewer.entities.contains(entities[i])) {
                viewer.entities.remove(entities[i])
              }
            }
          }
        } else {
          for (let i = 0; i < entities.length; i++) {
            if (viewer.entities.contains(entities[i])) {
              viewer.entities.remove(entities[i])
            }
          }
        }
      }
    })
    /**
     *鼠标移动
     */
    this.handler.setInputAction((movement) => {
      let pickedFeature = this.viewer.scene.pick(movement.endPosition)
      if (pickedFeature) {
        this.viewer.enableCursorStyle = false
        this.viewer._element.style.cursor = ''
        document.documentElement.style.cursor = 'pointer'
      } else {
        this.viewer.enableCursorStyle = true
        document.documentElement.style.cursor = ''
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
  },
}
export default ViewInit
