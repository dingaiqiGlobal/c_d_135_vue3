import * as Cesium from 'cesium'
const BoxGeometry = Cesium.BoxGeometry,
  Cartesian3 = Cesium.Cartesian3,
  defined = Cesium.defined,
  destroyObject = Cesium.destroyObject,
  DeveloperError = Cesium.DeveloperError,
  GeometryPipeline = Cesium.GeometryPipeline,
  Matrix3 = Cesium.Matrix3,
  Matrix4 = Cesium.Matrix4,
  Transforms = Cesium.Transforms,
  VertexFormat = Cesium.VertexFormat,
  BufferUsage = Cesium.BufferUsage,
  CubeMap = Cesium.CubeMap,
  DrawCommand = Cesium.DrawCommand,
  loadCubeMap = Cesium.loadCubeMap,
  RenderState = Cesium.RenderState,
  VertexArray = Cesium.VertexArray,
  BlendingState = Cesium.BlendingState,
  SceneMode = Cesium.SceneMode,
  ShaderProgram = Cesium.ShaderProgram,
  ShaderSource = Cesium.ShaderSource
const skyboxMatrix3 = new Matrix3()

const SkyBoxFS = `
uniform samplerCube u_cubeMap;
in vec3 v_texCoord;
void main()
{
    vec4 color = texture(u_cubeMap, normalize(v_texCoord));
    out_FragColor = vec4(czm_gammaCorrect(color).rgb, czm_morphTime);
}
`
const SkyBoxVS = `
in vec3 position;
out vec3 v_texCoord;
uniform mat3 u_rotateMatrix;
void main()
{
    vec3 p = czm_viewRotation * u_rotateMatrix * (czm_temeToPseudoFixed * (czm_entireFrustum.y * position));
    gl_Position = czm_projection * vec4(p, 1.0);
    v_texCoord = position.xyz;
}
`

class SkyBox {
  constructor(options) {
    if (!defined(options)) {
      options = {}
    }

    this.sources = options.sources
    this._sources = undefined

    /**
     * Determines if the sky box will be shown.
     * @type {Boolean}
     * @default true
     */
    this.show = options.show ?? true
    this.speed = options.speed ?? 0

    this._command = new DrawCommand({
      modelMatrix: Matrix4.clone(Matrix4.IDENTITY),
      owner: this,
    })
    this._cubeMap = undefined
    this._attributeLocations = undefined
    this._useHdr = undefined
  }

  update(frameState, useHdr) {
    if (!this.show) {
      return undefined
    }

    if (frameState.mode !== SceneMode.SCENE3D && frameState.mode !== SceneMode.MORPHING) {
      return undefined
    }

    if (!frameState.passes.render) {
      return undefined
    }

    const context = frameState.context

    if (this._sources !== this.sources) {
      this._sources = this.sources
      const sources = this.sources

      if (
        !defined(sources.positiveX) ||
        !defined(sources.negativeX) ||
        !defined(sources.positiveY) ||
        !defined(sources.negativeY) ||
        !defined(sources.positiveZ) ||
        !defined(sources.negativeZ)
      ) {
        throw new DeveloperError(
          'this.sources is required and must have positiveX, negativeX, positiveY, negativeY, positiveZ, and negativeZ properties.',
        )
      }

      if (
        typeof sources.positiveX !== typeof sources.negativeX ||
        typeof sources.positiveX !== typeof sources.positiveY ||
        typeof sources.positiveX !== typeof sources.negativeY ||
        typeof sources.positiveX !== typeof sources.positiveZ ||
        typeof sources.positiveX !== typeof sources.negativeZ
      ) {
        throw new DeveloperError('this.sources properties must all be the same type.')
      }

      if (typeof sources.positiveX === 'string') {
        loadCubeMap(context, this._sources).then((cubeMap) => {
          this._cubeMap = this._cubeMap && this._cubeMap.destroy()
          this._cubeMap = cubeMap
        })
      } else {
        this._cubeMap = this._cubeMap && this._cubeMap.destroy()
        this._cubeMap = new CubeMap({
          context: context,
          source: sources,
        })
      }
    }

    const command = this._command
    command.modelMatrix = Transforms.eastNorthUpToFixedFrame(frameState.camera._positionWC)

    if (!defined(command.vertexArray)) {
      let rotate = 0
      command.uniformMap = {
        u_cubeMap: () => {
          return this._cubeMap
        },
        u_rotateMatrix: () => {
          rotate += this.speed
          const rotationZMatrix = Matrix3.fromRotationZ(Cesium.Math.toRadians(rotate))
          const rotMatrix = Matrix4.fromRotationTranslation(rotationZMatrix)
          Matrix4.multiply(command.modelMatrix, rotMatrix, command.modelMatrix)
          return Matrix4.getMatrix3(command.modelMatrix, skyboxMatrix3)
        },
      }

      const geometry = BoxGeometry.createGeometry(
        BoxGeometry.fromDimensions({
          dimensions: new Cartesian3(2.0, 2.0, 2.0),
          vertexFormat: VertexFormat.POSITION_ONLY,
        }),
      )

      const attributeLocations = (this._attributeLocations =
        GeometryPipeline.createAttributeLocations(geometry))

      command.vertexArray = VertexArray.fromGeometry({
        context: context,
        geometry: geometry,
        attributeLocations: attributeLocations,
        bufferUsage: BufferUsage._DRAW,
      })

      command.renderState = RenderState.fromCache({
        blending: BlendingState.ALPHA_BLEND,
      })
    }

    if (!defined(command.shaderProgram) || this._useHdr !== useHdr) {
      const fs = new ShaderSource({
        defines: [useHdr ? 'HDR' : ''],
        sources: [SkyBoxFS],
      })

      command.shaderProgram = ShaderProgram.fromCache({
        context: context,
        vertexShaderSource: SkyBoxVS,
        fragmentShaderSource: fs,
        attributeLocations: this._attributeLocations,
      })
      this._useHdr = useHdr
    }

    if (!defined(this._cubeMap)) {
      return undefined
    }

    return command
  }

  isDestroyed() {
    return false
  }

  destroy() {
    const command = this._command
    command.vertexArray = command.vertexArray && command.vertexArray.destroy()
    command.shaderProgram = command.shaderProgram && command.shaderProgram.destroy()
    this._cubeMap = this._cubeMap && this._cubeMap.destroy()
    return destroyObject(this)
  }
}

export default SkyBox
