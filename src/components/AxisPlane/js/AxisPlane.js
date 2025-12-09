/*
 * @Author: dys
 * @Date: 2025-11-24 17:00:29
 * @LastEditors: dys
 * @LastEditTime: 2025-12-09 11:22:35
 * @Descripttion:
 */
import AxisPlaneGeometry from './AxisPlaneGeometry'
import { VertexFormat, Primitive, MaterialAppearance, Material } from 'cesium'
import * as Cesium from 'cesium'

class AxisPlane {
  constructor(options) {
    this._center = options.center
    this._modelMatrix = options.modelMatrix
    this._color = options.color
    const radius = options.radius
    this._normal = options.normal

    const planeGeometry = new AxisPlaneGeometry({
      normal: this._normal,
      radius: radius,
      vertexFormat: VertexFormat.DEFAULT,
      center: this._center,
    })

    const instance = new Cesium.GeometryInstance({
      geometry: AxisPlaneGeometry.createGeometry(planeGeometry),
    })

    const primitive = new Primitive({
      asynchronous: false,
      geometryInstances: instance,
      modelMatrix: this._modelMatrix,
      appearance: new MaterialAppearance({
        material: Material.fromType('Color', {
          color: this._color,
        }),
      }),
    })

    primitive.isAxisPlane = true
    primitive.normal = this._normal
    primitive.axis = options.axis
    primitive.color = this._color

    return primitive
  }
}

export default AxisPlane
