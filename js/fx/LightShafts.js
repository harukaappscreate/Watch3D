// Volumetric-looking light cone (additive, soft edges, slow noise)
import * as THREE from 'three';

export function createLightCone(top, bottom, rTop, rBottom, color = 0xfff1dc) {
  const h = top.distanceTo(bottom);
  const g = new THREE.CylinderGeometry(rTop, rBottom, h, 64, 16, true);
  g.translate(0, -h / 2, 0);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uIntensity: { value: 0.16 } },
    vertexShader: /* glsl */`
      varying vec3 vN; varying vec3 vV; varying float vH; varying vec3 vP;
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(cameraPosition - wp.xyz);
        vH = -position.y; vP = position;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec3 uColor; uniform float uIntensity;
      varying vec3 vN; varying vec3 vV; varying float vH; varying vec3 vP;
      float n(vec3 p){ return sin(p.x*0.05+uTime*0.3)*sin(p.y*0.03-uTime*0.2)*sin(p.z*0.05+uTime*0.25); }
      void main(){
        float rim = abs(dot(normalize(vN), normalize(vV)));
        float soft = pow(rim, 2.2);
        float len = ${h.toFixed(1)};
        float fadeTop = smoothstep(0.0, 0.25, vH / len);
        float fadeBot = smoothstep(1.0, 0.82, vH / len);
        float a = soft * fadeTop * fadeBot * (0.75 + 0.25 * n(vP)) * uIntensity;
        gl_FragColor = vec4(uColor * a, 1.0);
      }`,
  });
  const m = new THREE.Mesh(g, mat);
  m.position.copy(top);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), bottom.clone().sub(top).normalize());
  m.renderOrder = 9;
  m.frustumCulled = false;
  return m;
}
