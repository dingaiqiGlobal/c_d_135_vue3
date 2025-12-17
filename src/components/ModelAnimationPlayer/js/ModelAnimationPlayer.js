import * as Cesium from 'cesium'

// 定义循环类型的枚举常量
export const LOOP_TYPE = Object.freeze({ CLAMP: 1, LOOP: 2 })
// 定义播放状态的枚举常量
export const PLAY_STATE = Object.freeze({ PLAY: 1, STOP: 2, PAUSE: 3 })

// 动画关键帧类，包含时间和值
export class AnimationKey {
  constructor(time, value) {
    this.time = time // 关键帧时间
    this.value = value // 关键帧值
  }
}

// 动画轨道类，包含三种变换的关键帧
export class AnimationTrack {
  constructor() {
    this.translation_keys = [] // 平移关键帧数组
    this.rotation_keys = [] // 旋转关键帧数组
    this.scale_keys = [] // 缩放关键帧数组
  }
}

// 动画类，包含一个动画的所有轨道
export class Animation {
  constructor(name) {
    this.name = name // 动画名称
    this.duration = 0 // 动画持续时间（秒）
    this.tracks = {} // 字典，键为节点名称，值为AnimationTrack对象
  }
}

// 动画集合类，包含所有动画和节点数据
export class AnimationSet {
  constructor(animations, nodes) {
    this.animations = animations // Animation对象数组
    this.nodes = nodes // 节点字典
  }
}

// 动画播放器类 - 核心动画控制类
export class AnimationPlayer {
  constructor(animation_set, entity, fps) {
    this.loop_type = LOOP_TYPE.CLAMP // 循环类型，默认为钳制
    this.play_state = PLAY_STATE.STOP // 播放状态，默认为停止
    this.animation_set = animation_set // AnimationSet对象
    this.entity = entity // Cesium实体对象

    // 设置当前动画（默认使用第一个动画）
    if (this.animation_set.animations.length > 0) {
      this.current_animation = this.animation_set.animations[0]
    } else {
      this.current_animation = ''
    }

    // 为Cesium实体设置初始节点变换
    let cesium_nodes = {}

    for (var node_name in this.animation_set.nodes) {
      // 如果实体已定义节点变换，则使用现有值
      if (
        typeof this.entity.model.nodeTransformations != 'undefined' &&
        typeof this.entity.model.nodeTransformations[node_name] != 'undefined'
      ) {
        cesium_nodes[node_name] = this.entity.model.nodeTransformations[node_name]
      } else {
        // 否则创建默认变换（单位变换）
        cesium_nodes[node_name] = {
          translation: new Cesium.Cartesian3(0, 0, 0), // 零平移
          rotation: new Cesium.Cartesian4(0, 0, 0, 1), // 单位四元数
          scale: new Cesium.Cartesian3(1, 1, 1), // 单位缩放
        }
      }
    }

    this.entity.model.nodeTransformations = cesium_nodes
    this.interval_id = -1 // 定时器ID
    this.current_time = 0 // 当前播放时间
    this.speed = 1 // 播放速度
    this._frame_duration = 1.0 / fps // 每帧持续时间（秒）
  }

  // 设置当前播放的动画
  setAnimation(animation_name) {
    for (var i = 0; i < this.animation_set.animations.length; i++) {
      if (animation_name === this.animation_set.animations[i].name) {
        this.current_animation = this.animation_set.animations[i]
        return
      }
    }
    console.error("Can't set current animation: " + animation_name + ' does not exist')
  }

  // 设置帧率
  setFPS(fps) {
    this._frame_duration = 1.0 / fps
  }

  // 播放动画
  play(animation_name) {
    // 如果没有指定动画名称，继续当前动画
    if (typeof animation_name === 'undefined') {
      if (this.play_state === PLAY_STATE.PLAY) {
        return // 已经在播放中
      } else if (this.play_state === PLAY_STATE.PAUSE) {
        this.play_state = PLAY_STATE.PLAY // 从暂停恢复
      } else if (this.play_state === PLAY_STATE.STOP) {
        this.play_state = PLAY_STATE.PLAY
        // 启动更新定时器
        this.interval_id = window.setInterval(() => this._update(), this._frame_duration * 1000)
      }
      return
    }

    // 查找指定名称的动画
    let animations = this.animation_set.animations
    for (var i = 0; i < animations.length; i++) {
      if (animations[i].name === animation_name) {
        this.current_animation = animations[i]
        // 状态转换逻辑同上
        if (this.play_state === PLAY_STATE.PLAY) {
          return
        } else if (this.play_state === PLAY_STATE.PAUSE) {
          this.play_state = PLAY_STATE.PLAY
        } else if (this.play_state === PLAY_STATE.STOP) {
          this.play_state = PLAY_STATE.PLAY
          this.interval_id = window.setInterval(() => this._update(), this._frame_duration * 1000)
        }
        return
      }
    }
    console.error("Can't play animation: " + animation_name + ' does not exist')
  }

  // 清除更新定时器
  _clearUpdateInterval() {
    clearInterval(this.interval_id)
    this.interval_id = -1
  }

  // 更新函数，由定时器调用
  _update() {
    if (this.play_state === PLAY_STATE.PLAY)
      this.setTime(this.current_time + this._frame_duration * this.speed)
  }

  // 设置播放百分比（0.0到1.0）
  setPercent(percent) {
    if (percent < 0.0) {
      percent = 0.0
    } else if (percent > 1.0) {
      percent = 1.0
    }
    let time = this.current_animation.duration * percent
    this.setTime(time)
  }

  // 设置当前播放时间（核心方法）
  setTime(current_time) {
    this.current_time = current_time

    // 处理时间边界和循环逻辑
    if (this.speed > 0) {
      if (this.current_time > this.current_animation.duration) {
        if (this.loop_type === LOOP_TYPE.CLAMP) {
          this.current_time = this.current_animation.duration // 钳制到末尾
        } else if (this.loop_type === LOOP_TYPE.LOOP) {
          this.current_time = 0 // 循环到开始
        }
      }
    } else if (this.speed < 0) {
      if (this.current_time < 0) {
        if (this.loop_type === LOOP_TYPE.CLAMP) {
          this.current_time = 0
        } else if (this.loop_type === LOOP_TYPE.LOOP) {
          this.current_time = this.current_animation.duration
        }
      }
    }

    // 遍历当前动画的所有轨道
    for (var track_name in this.current_animation.tracks) {
      let track = this.current_animation.tracks[track_name]
      let node = this.animation_set.nodes[track_name]

      // 获取当前时间对应的关键帧
      let curr_trans_keys = this.getKeysAtTime(track.translation_keys, this.current_time)
      let curr_rot_keys = this.getKeysAtTime(track.rotation_keys, this.current_time)
      let curr_scale_keys = this.getKeysAtTime(track.scale_keys, this.current_time)

      //--------------------------
      // 平移变换处理
      //--------------------------
      if (typeof curr_trans_keys !== 'undefined' && curr_trans_keys.length > 0) {
        let orig_trans = node.translation
        let invMat = node.inv_rotation_matrix

        // 如果两个关键帧时间相同，直接使用第一个关键帧的值
        if (curr_trans_keys[0].time == curr_trans_keys[1].time) {
          let result = new Cesium.Cartesian3(
            curr_trans_keys[0].value[0] - orig_trans[0],
            curr_trans_keys[0].value[1] - orig_trans[1],
            curr_trans_keys[0].value[2] - orig_trans[2],
          )
          // 转换到局部节点空间
          Cesium.Matrix3.multiplyByVector(invMat, result, result)
          this.entity.model.nodeTransformations[track_name].translation = result
        } else {
          // 线性插值计算当前平移值
          let keyDelta = curr_trans_keys[1].time - curr_trans_keys[0].time
          let timeDelta = this.current_time - curr_trans_keys[0].time
          let t = timeDelta / keyDelta
          let start = new Cesium.Cartesian3(
            curr_trans_keys[0].value[0],
            curr_trans_keys[0].value[1],
            curr_trans_keys[0].value[2],
          )
          let end = new Cesium.Cartesian3(
            curr_trans_keys[1].value[0],
            curr_trans_keys[1].value[1],
            curr_trans_keys[1].value[2],
          )

          let result = new Cesium.Cartesian3()
          Cesium.Cartesian3.lerp(start, end, t, result) // 线性插值

          // 计算相对于原始平移的偏移量
          result.x -= orig_trans[0]
          result.y -= orig_trans[1]
          result.z -= orig_trans[2]

          // 转换到局部节点空间
          Cesium.Matrix3.multiplyByVector(invMat, result, result)

          this.entity.model.nodeTransformations[track_name].translation = result
        }
      }

      //--------------------------
      // 旋转变换处理
      //--------------------------
      if (typeof curr_rot_keys !== 'undefined' && curr_rot_keys.length > 0) {
        let orig_inv = node.inv_rotation
        let invMat = node.inv_rotation_matrix

        if (curr_rot_keys[0].time == curr_rot_keys[1].time) {
          let result = new Cesium.Quaternion(
            curr_rot_keys[0].value[0],
            curr_rot_keys[0].value[1],
            curr_rot_keys[0].value[2],
            curr_rot_keys[0].value[3],
          )

          // 提取旋转轴和角度
          let resultAxis = new Cesium.Cartesian3(1, 0, 0)
          let resultAngle = Cesium.Quaternion.computeAngle(result)
          if (Math.abs(resultAngle) > Cesium.Math.EPSILON5)
            Cesium.Quaternion.computeAxis(result, resultAxis)

          // 转换到局部节点空间
          Cesium.Matrix3.multiplyByVector(invMat, resultAxis, resultAxis)

          // 重新构建局部空间四元数
          Cesium.Quaternion.fromAxisAngle(resultAxis, resultAngle, result)
          // 计算相对于原始旋转的差值
          Cesium.Quaternion.multiply(result, orig_inv, result)
          this.entity.model.nodeTransformations[track_name].rotation = result
        } else {
          // 球面线性插值计算当前旋转值
          let keyDelta = curr_rot_keys[1].time - curr_rot_keys[0].time
          let timeDelta = this.current_time - curr_rot_keys[0].time
          let t = timeDelta / keyDelta
          let start = new Cesium.Quaternion(
            curr_rot_keys[0].value[0],
            curr_rot_keys[0].value[1],
            curr_rot_keys[0].value[2],
            curr_rot_keys[0].value[3],
          )
          let end = new Cesium.Quaternion(
            curr_rot_keys[1].value[0],
            curr_rot_keys[1].value[1],
            curr_rot_keys[1].value[2],
            curr_rot_keys[1].value[3],
          )

          let result = new Cesium.Quaternion()
          Cesium.Quaternion.slerp(start, end, t, result) // 球面线性插值

          // 后续处理与上面相同
          let resultAxis = new Cesium.Cartesian3(1, 0, 0)
          let resultAngle = Cesium.Quaternion.computeAngle(result)
          if (Math.abs(resultAngle) > Cesium.Math.EPSILON5)
            Cesium.Quaternion.computeAxis(result, resultAxis)

          Cesium.Matrix3.multiplyByVector(invMat, resultAxis, resultAxis)

          Cesium.Quaternion.fromAxisAngle(resultAxis, resultAngle, result)
          Cesium.Quaternion.multiply(result, orig_inv, result)

          this.entity.model.nodeTransformations[track_name].rotation = result
        }
      }

      //--------------------------
      // 缩放变换处理
      //--------------------------
      if (typeof curr_scale_keys !== 'undefined' && curr_scale_keys.length > 0) {
        let orig_scale = this.animation_set.nodes[track_name].scale

        if (curr_scale_keys[0].time == curr_scale_keys[1].time) {
          let result = new Cesium.Cartesian3(
            curr_scale_keys[0].value[0] / orig_scale[0],
            curr_scale_keys[0].value[1] / orig_scale[1],
            curr_scale_keys[0].value[2] / orig_scale[2],
          )
          this.entity.model.nodeTransformations[track_name].scale = result
        } else {
          // 线性插值计算当前缩放值
          let keyDelta = curr_scale_keys[1].time - curr_scale_keys[0].time
          let timeDelta = this.current_time - curr_scale_keys[0].time
          let t = timeDelta / keyDelta
          let start = new Cesium.Cartesian3(
            curr_scale_keys[0].value[0],
            curr_scale_keys[0].value[1],
            curr_scale_keys[0].value[2],
          )
          let end = new Cesium.Cartesian3(
            curr_scale_keys[1].value[0],
            curr_scale_keys[1].value[1],
            curr_scale_keys[1].value[2],
          )
          let result = new Cesium.Cartesian3()
          Cesium.Cartesian3.lerp(start, end, t, result)

          // 计算相对于原始缩放的比率
          result.x /= orig_scale[0]
          result.y /= orig_scale[1]
          result.z /= orig_scale[2]
          this.entity.model.nodeTransformations[track_name].scale = result
        }
      }
    }
  }

  // 获取指定时间对应的两个关键帧（用于插值）
  getKeysAtTime(keys, time) {
    let result = []
    if (keys.length == 0) return result

    // 如果时间小于第一个关键帧时间，返回第一个关键帧两次
    if (keys[0].time > time) {
      result.push(keys[0])
      result.push(keys[0])
      return result
    }

    // 如果时间大于最后一个关键帧时间，返回最后一个关键帧两次
    if (time > keys[keys.length - 1].time) {
      result.push(keys[keys.length - 1])
      result.push(keys[keys.length - 1])
      return result
    }

    // 查找包含当前时间的两个关键帧
    for (var i = 0; i < keys.length - 1; i++) {
      if (keys[i].time <= time && keys[i + 1].time >= time) {
        result.push(keys[i])
        result.push(keys[i + 1])
        return result
      }
    }
  }

  // 停止动画
  stop() {
    this.play_state = PLAY_STATE.STOP
    this.current_time = 0
    // 重置实体节点变换为默认姿态
    let cesium_nodes = {}
    for (var node_name in this.animation_set.nodes) {
      cesium_nodes[node_name] = {
        translation: new Cesium.Cartesian3(0, 0, 0),
        rotation: new Cesium.Cartesian4(0, 0, 0, 1),
        scale: new Cesium.Cartesian3(1, 1, 1),
      }
    }
    this.entity.model.nodeTransformations = cesium_nodes
    this._clearUpdateInterval()
  }

  // 暂停动画
  pause() {
    // 只有播放状态才需要暂停
    if (this.play_state === PLAY_STATE.PLAY) this.play_state = PLAY_STATE.PAUSE
    this._clearUpdateInterval()
  }
}

// GLB/glTF动画解析器类
export class AnimationParser {
  // 异步读取文件
  static _readFileAsync(file) {
    return new Promise((resolve, reject) => {
      let reader = new FileReader()

      reader.onload = () => {
        resolve(reader.result)
      }

      reader.onerror = reject

      reader.readAsArrayBuffer(file)
    })
  }

  // 异步获取网络资源
  static _getResourceAsync(uri) {
    return new Promise((resolve, reject) => {
      var req = new Request(uri)

      fetch(req)
        .then(function (response) {
          if (!response.ok) {
            reject(new Error(response.statusText))
          }
          return response
        })
        .then(function (response) {
          resolve(response.arrayBuffer())
        })
    })
  }

  // 从ArrayBuffer解析节点信息
  static parseAnimationNodesFromArrayBuffer(array_buffer) {
    // 根据glTF标准，从第12字节开始读取JSON数据长度
    let dv = new DataView(array_buffer, 12, 4)
    // glTF使用小端字节序
    let json_chunk_length = dv.getUint32(0, true)
    console.log('gltf JSON length: ' + json_chunk_length + ' bytes')

    // 获取实际的JSON数据（从第20字节开始）
    let json_data_chunk = array_buffer.slice(20, 20 + json_chunk_length)
    let decoder = new TextDecoder('UTF-8')
    let json_text = decoder.decode(json_data_chunk)
    let gltf_json = JSON.parse(json_text)
    console.log('gltf JSON loaded successfully:')

    // 建立父子节点关系
    for (var i = 0; i < gltf_json.nodes.length; i++) {
      if (typeof gltf_json.nodes[i].children != 'undefined') {
        for (var k = 0; k < gltf_json.nodes[i].children.length; k++) {
          gltf_json.nodes[gltf_json.nodes[i].children[k]].parent = gltf_json.nodes[i].name
        }
      }
    }

    return gltf_json.nodes
  }

  // 从ArrayBuffer解析动画数据
  static parseAnimationsFromArrayBuffer(array_buffer) {
    let animations = []

    // 读取JSON数据长度
    let dv = new DataView(array_buffer, 12, 4)
    let json_chunk_length = dv.getUint32(0, true)
    console.log('gltf JSON length: ' + json_chunk_length + ' bytes')

    // 获取并解析JSON数据
    let json_data_chunk = array_buffer.slice(20, 20 + json_chunk_length)
    let decoder = new TextDecoder('UTF-8')
    let json_text = decoder.decode(json_data_chunk)
    let gltf_json = JSON.parse(json_text)
    console.log('gltf JSON loaded successfully:')
    console.log(gltf_json)

    // 获取二进制数据块长度
    let bin_offset = 20 + json_chunk_length
    dv = new DataView(array_buffer, bin_offset, 4)
    let bin_chunk_length = dv.getUint32(0, true)
    console.log('gltf bin length: ' + bin_chunk_length + ' bytes')

    // 获取实际的二进制数据（跳过8字节的头部）
    let bin_data_chunk = array_buffer.slice(bin_offset + 8, bin_offset + 8 + bin_chunk_length)

    //--------------------------------------------------
    // 处理所有动画
    //--------------------------------------------------
    if (typeof gltf_json.animations === 'undefined') return []

    for (var i = 0; i < gltf_json.animations.length; i++) {
      let anim_name = gltf_json.animations[i].name
      if (typeof anim_name == 'undefined' || anim_name == '') anim_name = 'animation_' + i
      let curr_animation = new Animation(anim_name)
      console.log('processing animation: ' + anim_name)

      // 处理动画的所有通道（每个通道对应一个节点的一种变换）
      for (var k = 0; k < gltf_json.animations[i].channels.length; k++) {
        let channel = gltf_json.animations[i].channels[k]

        // 变换类型：translation, rotation, 或 scale
        let dof_type = channel.target.path

        let node = gltf_json.nodes[channel.target.node]
        if (typeof node == 'undefined') {
          console.warn('node is undefined for channel ' + k)
          continue
        }

        let node_name = node.name
        if (typeof node_name == 'undefined' || node.name == '') {
          node_name = 'node_' + channel.target.node
        }

        // 为节点创建新的轨道（如果不存在）
        if (typeof curr_animation.tracks[node_name] == 'undefined')
          curr_animation.tracks[node_name] = new AnimationTrack()

        let sampler = gltf_json.animations[i].samplers[channel.sampler]

        //--------------------------------------------------
        // 处理输入访问器（关键帧时间）
        //--------------------------------------------------
        let input = gltf_json.accessors[sampler.input]

        let input_accessor_byte_offset =
          typeof input.byteOffset == 'undefined' ? 0 : input.byteOffset
        if (input.componentType != 5126)
          // 5126 = FLOAT
          console.warn('input component type is not a float!')

        let input_element_size = 4 // 浮点数占4字节

        // 使用buffer view和accessor定位到二进制数据
        let input_bufferView = gltf_json.bufferViews[input.bufferView]
        let input_accessor_data_offset = input_bufferView.byteOffset + input_accessor_byte_offset
        let input_bin = bin_data_chunk.slice(
          input_accessor_data_offset,
          input_accessor_data_offset + input_element_size * input.count,
        )
        let input_dv = new DataView(input_bin)

        // 解析所有时间戳
        let timestamps = []
        for (var j = 0; j < input.count; j++) {
          let timestamp = input_dv.getFloat32(j * 4, true)
          if (timestamp > curr_animation.duration) {
            curr_animation.duration = timestamp // 更新动画总时长
          }
          timestamps.push(timestamp)
        }

        //--------------------------------------------------
        // 处理输出访问器（关键帧值）
        //--------------------------------------------------
        let output = gltf_json.accessors[sampler.output]

        let output_accessor_byte_offset =
          typeof output.byteOffset == 'undefined' ? 0 : output.byteOffset

        // 只处理VEC3和VEC4类型（平移、旋转、缩放）
        if (output.componentType != 5126) console.warn('output component type is not a float!')

        let output_component_count = output.type == 'VEC3' ? 3 : 4
        let output_element_size = output_component_count * 4 // 4字节浮点数

        let output_bufferView = gltf_json.bufferViews[output.bufferView]
        let output_accessor_data_offset = output_bufferView.byteOffset + output_accessor_byte_offset
        let output_bin = bin_data_chunk.slice(
          output_accessor_data_offset,
          output_accessor_data_offset + output_element_size * output.count,
        )
        let output_dv = new DataView(output_bin)

        // 解析所有值
        let values = []
        for (var j = 0; j < output.count * output_component_count; j += output_component_count) {
          let value = []
          for (var l = 0; l < output_component_count; l++) {
            value.push(output_dv.getFloat32(j * 4 + l * 4, true))
          }
          values.push(value)
        }

        // 根据变换类型存储关键帧
        if (dof_type == 'translation') {
          for (var j = 0; j < output.count; j++) {
            curr_animation.tracks[node_name].translation_keys.push(
              new AnimationKey(timestamps[j], values[j]),
            )
          }
        } else if (dof_type == 'rotation') {
          for (var j = 0; j < output.count; j++) {
            curr_animation.tracks[node_name].rotation_keys.push(
              new AnimationKey(timestamps[j], values[j]),
            )
          }
        } else if (dof_type == 'scale') {
          for (var j = 0; j < output.count; j++) {
            curr_animation.tracks[node_name].scale_keys.push(
              new AnimationKey(timestamps[j], values[j]),
            )
          }
        }
      }
      animations.push(curr_animation)
    }
    return animations
  }

  // 从URI异步解析动画集
  static async parseAnimationSetFromUri(glb_uri) {
    let array_buffer = await this._getResourceAsync(glb_uri)
    return this._parseAnimationSetFromArrayBuffer(array_buffer)
  }

  // 从文件异步解析动画集
  static async parseAnimationSetFromFile(glb_file) {
    let array_buffer = await this._readFileAsync(glb_file)
    return this._parseAnimationSetFromArrayBuffer(array_buffer)
  }

  // 从ArrayBuffer解析完整的动画集
  static _parseAnimationSetFromArrayBuffer(array_buffer) {
    // 解析节点信息
    let animation_nodes = AnimationParser.parseAnimationNodesFromArrayBuffer(array_buffer)

    // 转换为字典格式
    let nodes_dict = {}
    for (var i = 0; i < animation_nodes.length; i++) {
      nodes_dict[animation_nodes[i].name] = animation_nodes[i]

      // 处理矩阵形式的变换（glTF 2.0规范）
      if (typeof animation_nodes[i].matrix !== 'undefined') {
        let mat = new Cesium.Matrix4()
        Cesium.Matrix4.fromColumnMajorArray(animation_nodes[i].matrix, mat)
        nodes_dict[animation_nodes[i].name].matrix = mat
      }

      // 为未定义的变换设置默认值
      if (typeof nodes_dict[animation_nodes[i].name].translation === 'undefined')
        nodes_dict[animation_nodes[i].name].translation = [0, 0, 0]

      if (typeof nodes_dict[animation_nodes[i].name].rotation === 'undefined') {
        nodes_dict[animation_nodes[i].name].rotation = [0, 0, 0, 1] // 单位四元数
        nodes_dict[animation_nodes[i].name].inv_rotation_matrix = Cesium.Matrix3.IDENTITY
        nodes_dict[animation_nodes[i].name].inv_rotation = new Cesium.Quaternion(0, 0, 0, 1)
      } else {
        // 计算并存储逆旋转矩阵和四元数（用于后续计算）
        let orig_rot = nodes_dict[animation_nodes[i].name].rotation
        let orig_quat = new Cesium.Quaternion(orig_rot[0], orig_rot[1], orig_rot[2], orig_rot[3])
        let orig_quat_inv = new Cesium.Quaternion()
        Cesium.Quaternion.inverse(orig_quat, orig_quat_inv)
        let invMat = new Cesium.Matrix3()
        Cesium.Matrix3.fromQuaternion(orig_quat_inv, invMat)
        nodes_dict[animation_nodes[i].name].inv_rotation_matrix = invMat
        nodes_dict[animation_nodes[i].name].inv_rotation = orig_quat_inv
      }

      if (typeof nodes_dict[animation_nodes[i].name].scale === 'undefined')
        nodes_dict[animation_nodes[i].name].scale = [0, 0, 0]
    }

    // 解析动画数据
    let animations = AnimationParser.parseAnimationsFromArrayBuffer(array_buffer)
    console.log(nodes_dict)
    return new AnimationSet(animations, nodes_dict)
  }
}
