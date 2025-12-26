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
    url: 'data/json/water.json',
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
            baseWaterColor: Cesium.Color.fromCssColorString('#62809b'),
            blendColor: new Cesium.Color(1, 1, 0.699, 1), //颜色
            refMap: colorIMG,
            normalMap: waterNormals,
            frequency: 800,
            animationSpeed: 0.01, //动画
            amplitude: 5,
            specularIntensity: 1,
            fadeFactor: 3,
          },
          source: `
                        // Thanks for the contribution Jonas
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
                        
                            // get ratios for alignment of the new normal vector with a vector perpendicular to the tangent plane
                            float tsPerturbationRatio = clamp(dot(normalTangentSpace, vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
                        
                            // fade out water effect as specular map value decreases
                            material.alpha = mix(blendColor.a, baseWaterColor.a, specularMapValue) * specularMapValue;
                        
                            // base color is a blend of the water and non-water color based on the value from the specular map
                            // may need a uniform blend factor to better control this
                            material.diffuse = mix(blendColor.rgb, baseWaterColor.rgb, specularMapValue);
                        
                            // diffuse highlights are based on how perturbed the normal is
                            material.diffuse += (0.1 * tsPerturbationRatio);
                        
                            material.diffuse = material.diffuse;

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

/**
 * 方式：Cesium.GeoJsonDataSource
 */

const addRoad = async () => {
  const appearance = new Cesium.PolylineMaterialAppearance({
    material: new Cesium.Material({
      fabric: {
        uniforms: {
          u_color: Cesium.Color.fromCssColorString('#007cfa'),
          u_speed: 200,
        },
        source: `
                        uniform vec4 u_color;
                        uniform float u_speed;
                        uniform float u_glow;
                        czm_material czm_getMaterial(czm_materialInput materialInput){
                            czm_material material = czm_getDefaultMaterial(materialInput);
                            vec2 st = materialInput.st;
                            float t =fract(czm_frameNumber / u_speed);
                            t *= 1.03;
                            float alpha = smoothstep(t- 0.03, t, st.s) * step(-t, -st.s);
                            alpha += 0.1;
                            vec4 fragColor;
                            fragColor.rgb = (u_color.rgb) / 0.5;
                            fragColor = czm_gammaCorrect(fragColor);
                            material.diffuse = fragColor.rgb;
                            material.alpha = alpha;
                            material.emission = fragColor.rgb * 1.5;
                            return material;
                        }
                    `,
      },
    }),
  })
  const instances = []
  const promise = Cesium.GeoJsonDataSource.load('data/json/road.json')
  promise.then((dataSource) => {
    const entities = dataSource.entities.values
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i]

      const instance = new Cesium.GeometryInstance({
        geometry: new Cesium.PolylineGeometry({
          positions: entity.polyline.positions.getValue(),
          width: 3,
        }),
      })
      instances.push(instance)
    }
    let road = new Cesium.Primitive({
      geometryInstances: instances,
      appearance: appearance,
      asynchronous: false,
    })
    viewer.scene.primitives.add(road)
  })
}

onMounted(() => {
  addWater()
  addRoad()
})
</script>
<style lang="less" scoped></style>
