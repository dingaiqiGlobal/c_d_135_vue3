<!--
 * @Author: dys
 * @Date: 2025-12-26 09:49:27
 * @LastEditors: dys
 * @LastEditTime: 2025-12-26 14:38:20
 * @Descripttion: 
-->
<template></template>
<script setup>
import { ref, reactive, onMounted, onUnmounted, watch, computed } from 'vue'
import * as Cesium from 'cesium'

import SkyBox from './js/SkyBox'
import posx from '../../assets/img/skybox/posx.jpg'
import negx from '../../assets/img/skybox/negx.jpg'
import posz from '../../assets/img/skybox/posz.jpg'
import negz from '../../assets/img/skybox/negz.jpg'
import posy from '../../assets/img/skybox/posy.jpg'
import negy from '../../assets/img/skybox/negy.jpg'

import colorIMG from '../../assets/img/nightCity/color.png'
import color2IMG from '../../assets/img/nightCity/color2.png'

import { ModelMatrix } from './js/ModelMatrix'

const props = defineProps(['viewer'])
let viewer = props.viewer

//动态天空盒
const addSkyBox = () => {
  viewer.scene.skyBox = new SkyBox({
    speed: 0.05,
    sources: {
      positiveX: posx,
      negativeX: negx,
      positiveY: posz,
      negativeY: negz,
      positiveZ: posy,
      negativeZ: negy,
    },
  })
}
//广州塔3Dtiles-customShader只与Model和Cesium3DTileset一起使用。
const addGZT = async () => {
  const gzt = await Cesium.Cesium3DTileset.fromUrl('data/3dtiles/gzt/tileset.json', {
    maximumScreenSpaceError: 2,
    customShader: new Cesium.CustomShader({
      uniforms: {
        u_build0: {
          type: Cesium.UniformType.SAMPLER_2D,
          value: new Cesium.TextureUniform({
            url: colorIMG,
          }),
        },
        u_build1: {
          type: Cesium.UniformType.SAMPLER_2D,
          value: new Cesium.TextureUniform({
            url: color2IMG,
          }),
        },
      },
      lightingModel: Cesium.LightingModel.UNLIT,
      fragmentShaderText: `
                        void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
                            vec3 positionEC = fsInput.attributes.positionEC;
                            vec3 normalEC = fsInput.attributes.normalEC;
                            vec2 uv = fsInput.attributes.texCoord_0;
                            vec3 positionMC = fsInput.attributes.positionMC;
                            float times = czm_frameNumber / 60.0;
                            vec4 textureColor = texture(u_build0,vec2(fract(float(uv.s) - times), uv.t));
                            vec4 textureColor2 = texture(u_build0,vec2(fract(uv.s),float(uv.t) - times));
                            vec4 textureColor3 = texture(u_build1,vec2(fract(uv.s),float(uv.t * 5.0) - times));
                            // material
                            material.diffuse *= textureColor.rgb + textureColor2.rgb + textureColor3.rgb;
                            material.alpha += textureColor.a + textureColor3.a;
                        }
                         `,
    }),
  })
  viewer.scene.primitives.add(gzt)
  gzt.root.transform = ModelMatrix([113.31914084147262, 23.10896926740387, 0], [0, 0, 0], [2, 2, 2]) //3dtiles矩阵变化
}

onMounted(() => {
  addSkyBox()
  addGZT()
})
</script>
<style lang="less" scoped></style>
