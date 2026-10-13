// =============================================================
//  PostFX — Render → (Bokeh DOF) → Bloom → Vignette/Grain → Output
// =============================================================
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const VignetteShader = {
  uniforms: { tDiffuse: { value: null }, uAmount: { value: 0.9 }, uTime: { value: 0 }, uGrain: { value: 0.035 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uAmount; uniform float uTime; uniform float uGrain; varying vec2 vUv;
    float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + uTime) * 43758.5453); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      vec2 d = vUv - 0.5;
      float v = smoothstep(0.85, 0.2, length(d) * uAmount);
      c.rgb *= mix(0.55, 1.0, v);
      c.rgb += (rnd(vUv * 917.0) - 0.5) * uGrain * (0.4 + c.rgb);
      gl_FragColor = c;
    }`,
};

export class PostFX {
  constructor(renderer, scene, camera) {
    this.renderer = renderer; this.scene = scene; this.camera = camera;
    this.enabled = true;
    this.dofEnabled = false;
    this.focus = 100; this.aperture = 0.00012;
  }
  build(tier, w, h) {
    this.dispose();
    this.tier = tier;
    this.enabled = tier.bloom || tier.vignette || tier.dof;
    if (!this.enabled) return;
    const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: tier.dof ? 0 : 4 });
    const c = new EffectComposer(this.renderer, rt);
    c.addPass(new RenderPass(this.scene, this.camera));
    if (tier.dof) {
      this.bokeh = new BokehPass(this.scene, this.camera, { focus: this.focus, aperture: this.aperture, maxblur: 0.008 });
      this.bokeh.enabled = this.dofEnabled;
      c.addPass(this.bokeh);
    }
    if (tier.bloom) {
      this.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.14, 0.22, 1.5);
      c.addPass(this.bloom);
    }
    c.addPass(new OutputPass());
    if (tier.vignette) {
      this.vignette = new ShaderPass(VignetteShader);
      c.addPass(this.vignette);
    }
    this.composer = c;
  }
  setDOF(on, focus, aperture) {
    this.dofEnabled = on;
    if (focus !== undefined) this.focus = focus;
    if (aperture !== undefined) this.aperture = aperture;
    if (this.bokeh) {
      this.bokeh.enabled = on;
      this.bokeh.uniforms.focus.value = this.focus;
      this.bokeh.uniforms.aperture.value = this.aperture;
    }
  }
  setSize(w, h) { this.composer?.setSize(w, h); }
  render(dt, time) {
    if (this.vignette) this.vignette.uniforms.uTime.value = time % 10;
    if (this.bokeh && this.bokeh.enabled) {
      this.bokeh.uniforms.focus.value = this.focus;
      this.bokeh.uniforms.aperture.value = this.aperture;
    }
    if (this.composer) this.composer.render(dt);
    else this.renderer.render(this.scene, this.camera);
  }
  dispose() {
    if (this.composer) {
      this.composer.passes.forEach((p) => p.dispose?.());
      this.composer.renderTarget1?.dispose(); this.composer.renderTarget2?.dispose();
    }
    this.composer = null; this.bloom = null; this.bokeh = null; this.vignette = null;
  }
}
