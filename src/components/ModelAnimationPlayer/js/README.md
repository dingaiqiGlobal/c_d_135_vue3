<!--
 * @Author: dys
 * @Date: 2025-12-17 16:01:08
 * @LastEditors: dys
 * @LastEditTime: 2025-12-18 09:53:31
 * @Descripttion:
-->

# Cesium 模型动画播放器

这是一个用于 Cesium 实体的动画播放器，能够独立于标准时间线播放 glTF 动画。

## 安装

目前最简单的安装方式是将 `ModelAnimationPlayer.js` 文件复制并整合到您项目的源码目录中。

## 示例

### 基本用法

首先从 glTF 文件加载动画集。当前仅支持包含嵌入式资产数据的 .glb 格式。

```
const animation_set = await AnimationParser.parseAnimationSetFromUri('data/gltf/Fox.glb')
```

接下来实例化 AnimationPlayer，传入动画集、要动画化的 Cesium 实体以及所需的播放帧率。默认播放模式为 "clamp"，但也支持循环播放，如下所示。

```
let player = new AnimationPlayer(animation_set, entity, 30);
player.loop_type = LOOP_TYPE.LOOP;
player.play("animation_name");
```

您也可以设置播放速度（乘数），负值将使动画反向播放。

```
player.speed = 2.0;
```

### 手动控制

除了调用 `play()`，您也可以手动更新播放器。参数是您要设置的动画当前时间（秒）。请确保播放器已停止！

```
player.stop();
player.setAnimation("current_animation_name");
player.setTime(current_time);
```

您还可以通过根据动画持续时间的百分比来设置动画以更新播放器。

```
player.setPercent(0.5);
```

### 调试提示

您可以直接从动画播放器访问有关动画和节点的信息。

```
// 检查当前动画持续时间
player.current_animation.duration

// 打印与此播放器关联的动画名称
for(var i = 0; i < player.animations.length; i++) {
  console.log(player.animations[i].name);
}

// 获取当前动画（或任何动画）的关键帧信息
for(track in player.current_animation.tracks) {
    console.log(track.translation_keys);
    console.log(track.rotation_keys);
    console.log(track.scale_keys);
}
```

## 注意事项与待办事项

- 模型和动画必须符合 glTF 2.0 规范
- 为了使导出的模型/动画与此播放器兼容，所有节点必须命名
- 如前所述，目前仅 .glb 格式与此系统兼容，且动画数据需嵌入在二进制文件中。如果您急需支持标准 glTF 格式，请创建问题并告知我们
- 虽然 glTF 格式允许旋转（`Vec4`）使用字节、短整型、整型和浮点数等组件类型，但目前解析器仅支持浮点数
- 目前 `play()` 方法通过 `setInterval` 在主线程上运行。未来应重新设计以利用 Web Workers
- 如果您发现需要 Web Workers 来实现动画播放的真正并发性，请记住，您仍然可以通过使用 `setTime` 或 `setPercent` 方法来实现
