<!--
 * @Author: dys
 * @Date: 2025-12-26 16:21:49
 * @LastEditors: dys
 * @LastEditTime: 2025-12-26 17:29:43
 * @Descripttion: 
-->
<template></template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import * as Cesium from 'cesium'

import colorIMG from '../../assets/img/nightCity/color.png'
import waterNormals from '../../assets/img/water/waterNormals.jpg'
const props = defineProps(['viewer'])
let viewer = props.viewer
/**
 * 方式：Cesium.Resource.fetchJson
 */
const addWater = async () => {
  const waterPlane = []
  const waterData = await Cesium.Resource.fetchJson({
    url: 'data/json/water_bohai.json',
  })
  waterData.features.map((feature) => {
    feature.geometry.coordinates[0].map((coordinate) => {
      waterPlane.push(Cesium.Cartesian3.fromDegrees(...coordinate))
    })
  })
  const polygon = new Cesium.PolygonGeometry({
    polygonHierarchy: new Cesium.PolygonHierarchy(waterPlane),
  })
  const instance = new Cesium.GeometryInstance({
    geometry: polygon,
  })
  let waterPrimitive = new Cesium.GroundPrimitive({
    geometryInstances: instance,
    appearance: new Cesium.MaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          uniforms: {
            baseWaterColor: Cesium.Color.fromCssColorString('#4b75ff'),
            blendColor: new Cesium.Color(1, 1, 0.699, 1), //颜色
            refMap: colorIMG,
            normalMap: waterNormals,
            frequency: 800,
            animationSpeed: 0.02, //动画
            amplitude: 5,
            specularIntensity: 1,
            fadeFactor: 3,
          },
          source: `
                        // 增强版海水着色器 - 添加水花泡沫和波浪起伏
                        // Based on contribution by Jonas
                        // http://29a.ch/2012/7/19/webgl-terrain-rendering-water-fog
                        
                        uniform sampler2D refMap;
                        uniform sampler2D normalMap;
                        uniform vec4 baseWaterColor;
                        uniform vec4 blendColor;
                        uniform float frequency;
                        uniform float animationSpeed;
                        uniform float amplitude;
                        uniform float specularIntensity;
                        uniform float fadeFactor;
                        
                        // ===== 辅助函数 =====
                        
                        // 噪声函数 - 用于生成泡沫
                        float hash(vec2 p) {
                            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
                        }
                        
                        // 平滑噪声
                        float noise(vec2 p) {
                            vec2 i = floor(p);
                            vec2 f = fract(p);
                            f = f * f * (3.0 - 2.0 * f);
                            
                            float a = hash(i);
                            float b = hash(i + vec2(1.0, 0.0));
                            float c = hash(i + vec2(0.0, 1.0));
                            float d = hash(i + vec2(1.0, 1.0));
                            
                            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
                        }
                        
                        // 波浪高度计算（正弦波叠加）
                        float waveHeight(vec2 pos, float time) {
                            float height = 0.0;
                            
                            // 主波浪
                            height += sin(pos.x * 0.05 + time * 2.0) * amplitude * 0.15;
                            height += sin(pos.y * 0.03 - time * 1.5) * amplitude * 0.12;
                            
                            // 次级波浪
                            height += sin(pos.x * 0.08 + pos.y * 0.05 + time * 2.5) * amplitude * 0.08;
                            height += sin(pos.x * 0.12 - pos.y * 0.07 - time * 1.8) * amplitude * 0.06;
                            
                            return height;
                        }
                        
                        czm_material czm_getMaterial(czm_materialInput materialInput)
                        {
                            czm_material material = czm_getDefaultMaterial(materialInput);
                        
                            float time = czm_frameNumber * animationSpeed;
                        
                            // fade is a function of the distance from the fragment and the frequency of the waves
                            float fade = max(1.0, (length(materialInput.positionToEyeEC) / 10000000000.0) * frequency * fadeFactor);
                        
                            float specularMapValue = 1.0;
                        
                            // note: not using directional motion at this time, just set the angle to 0.0;
                            vec4 noise = czm_getWaterNoise(normalMap, materialInput.st * frequency, time, 0.0);
                            vec3 normalTangentSpace = noise.xyz * vec3(1.0, 1.0, (1.0 / amplitude));
                        
                            // fade out the normal perturbation as we move further from the water surface
                            normalTangentSpace.xy /= fade;
                        
                            // attempt to fade out the normal perturbation as we approach non water areas (low specular map value)
                            normalTangentSpace = mix(vec3(0.0, 0.0, 50.0), normalTangentSpace, specularMapValue);
                        
                            normalTangentSpace = normalize(normalTangentSpace);
                        
                            // ===== 波浪起伏效果 =====
                            vec2 worldPos = materialInput.st * frequency;
                            float wave = waveHeight(worldPos, time);
                            
                            // 波浪影响法线（增加立体感）
                            float waveGradientX = waveHeight(worldPos + vec2(1.0, 0.0), time) - wave;
                            float waveGradientY = waveHeight(worldPos + vec2(0.0, 1.0), time) - wave;
                            normalTangentSpace.xy += vec2(waveGradientX, waveGradientY) * 0.3;
                            normalTangentSpace = normalize(normalTangentSpace);
                            
                            // get ratios for alignment of the new normal vector with a vector perpendicular to the tangent plane
                            float tsPerturbationRatio = clamp(dot(normalTangentSpace, vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
                        
                            // fade out water effect as specular map value decreases
                            material.alpha = mix(blendColor.a, baseWaterColor.a, specularMapValue) * specularMapValue;
                        
                            // base color is a blend of the water and non-water color based on the value from the specular map
                            material.diffuse = mix(blendColor.rgb, baseWaterColor.rgb, specularMapValue);
                        
                            // ===== 水花泡沫效果 =====
                            
                            // 生成泡沫噪声（多层叠加）
                            float foamNoise = 0.0;
                            vec2 foamPos = materialInput.st * frequency * 0.5;
                            foamNoise += noise(foamPos + time * 1.0) * 0.5;
                            foamNoise += noise(foamPos * 2.0 - time * 0.8) * 0.3;
                            foamNoise += noise(foamPos * 4.0 + time * 1.2) * 0.2;
                            
                            // 基于波浪高度的泡沫强度（波峰处更多泡沫）
                            float waveIntensity = smoothstep(amplitude * 0.3, amplitude * 0.8, abs(wave));
                            
                            // 泡沫阈值（产生泡沫的条件）
                            float foamThreshold = 0.65 - waveIntensity * 0.2;
                            float foam = smoothstep(foamThreshold, foamThreshold + 0.15, foamNoise);
                            
                            // 动态泡沫闪烁
                            float sparkle = noise(materialInput.st * frequency * 3.0 + time * 2.0);
                            foam *= (0.7 + sparkle * 0.3);
                            
                            // 泡沫颜色（白色）
                            vec3 foamColor = vec3(1.0, 1.0, 1.0);
                            
                            // 将泡沫混合到水面颜色
                            material.diffuse = mix(material.diffuse, foamColor, foam * 0.6);
                            
                            // diffuse highlights are based on how perturbed the normal is
                            material.diffuse += (0.1 * tsPerturbationRatio);
                            
                            // ===== 波浪深度颜色变化 =====
                            // 波峰浅色，波谷深色
                            float depthVariation = wave / (amplitude * 0.5);
                            depthVariation = clamp(depthVariation, -0.3, 0.3);
                            material.diffuse *= (1.0 + depthVariation * 0.4);
                        
                            // ===== 反射效果 =====
                            vec2 reflectCoord = gl_FragCoord.xy / czm_viewport.zw; 
                            vec2 reflectionTexcoord = vec2(1.0 - reflectCoord.x, reflectCoord.y);
                            material.diffuse += blendColor.rgb * 0.4;
                            material.diffuse *= 0.5;
                            material.diffuse *= texture(refMap, reflectionTexcoord + normalTangentSpace.xz * 5.0).rgb;

                            material.normal = normalize(materialInput.tangentToEyeMatrix * normalTangentSpace);
                        
                            material.specular = specularIntensity;
                            material.shininess = 10.0;
                        
                            return material;
                        }
                        `,
        },
      }),
      translucent: false,
    }),
    asynchronous: false,
  })
  viewer.scene.primitives.add(waterPrimitive)
}

onMounted(() => {
  addWater()
  addRoad()
})
</script>
<style lang="less" scoped></style>
