// =============================================================
//  Environment — procedural studio "softbox" environment map
//  (no external HDRI) + a dark boutique backdrop with bokeh.
// =============================================================
import * as THREE from 'three';

export function createEnvironment(renderer) {
  const env = new THREE.Scene();
  const room = new THREE.Mesh(
    new THREE.BoxGeometry(100, 60, 100),
    new THREE.MeshBasicMaterial({ color: 0x15161b, side: THREE.BackSide })
  );
  env.add(room);
  const panel = (w, h, intensity, color, pos, look) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide })
    );
    m.position.copy(pos); m.lookAt(look); env.add(m); return m;
  };
  const O = new THREE.Vector3();
  // key softbox above-front, strip lights at sides, warm kicker, cool fill
  panel(40, 18, 2.6, 0xffffff, new THREE.Vector3(0, 28, 18), O);
  panel(6, 46, 1.7, 0xfff3e2, new THREE.Vector3(-45, 4, 6), O);
  panel(6, 46, 1.4, 0xe6efff, new THREE.Vector3(45, 4, -4), O);
  panel(30, 4, 2.6, 0xffd9a8, new THREE.Vector3(0, -6, -46), O);
  panel(22, 10, 1.4, 0x9fb8ff, new THREE.Vector3(10, -20, 40), O);
  panel(14, 14, 1.8, 0xffffff, new THREE.Vector3(30, 22, 30), O);
  // floor bounce
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshBasicMaterial({ color: 0x1a1612 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -29; env.add(floor);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(env, 0.02);
  pmrem.dispose();
  env.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
  return rt.texture;
}

/** Inside-out sphere with vertical gradient and soft out-of-focus lights */
export function createBackdrop() {
  const geo = new THREE.SphereGeometry(2400, 48, 24);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTime: { value: 0 }, uFade: { value: 1 } },
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */`
      varying vec3 vDir; uniform float uTime; uniform float uFade;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      void main(){
        float y = vDir.y;
        vec3 top = vec3(0.020,0.022,0.030);
        vec3 mid = vec3(0.045,0.040,0.038);
        vec3 bot = vec3(0.010,0.010,0.012);
        vec3 col = mix(mid, top, smoothstep(0.0, 0.7, y));
        col = mix(bot, col, smoothstep(-0.5, 0.05, y));
        // bokeh lights (boutique far away)
        float a = atan(vDir.z, vDir.x);
        vec2 uv = vec2(a * 6.0, y * 18.0);
        vec2 cell = floor(uv); vec2 f = fract(uv) - 0.5;
        float h = hash(cell);
        if (h > 0.86 && y > -0.12 && y < 0.38) {
          vec2 o = vec2(hash(cell+3.1)-0.5, hash(cell+7.7)-0.5) * 0.5;
          float d = length(f - o);
          float r = 0.18 + 0.2 * hash(cell+1.3);
          float b = smoothstep(r, r*0.7, d) * (0.5 + 0.5*sin(uTime*0.4 + h*40.0));
          vec3 warm = mix(vec3(1.0,0.72,0.42), vec3(0.65,0.75,1.0), step(0.95, h));
          col += warm * b * 0.10;
        }
        gl_FragColor = vec4(col * uFade, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = -10;
  mesh.frustumCulled = false;
  return mesh;
}
