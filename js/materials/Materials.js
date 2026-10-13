// =============================================================
//  Materials — one shared library; finishes switchable at runtime
// =============================================================
import * as THREE from 'three';
import * as PT from './ProceduralTextures.js';
import { PALETTE } from '../config.js';

export class MaterialLibrary {
  constructor(tier) {
    this.tier = tier;
    this.texSize = tier.dpr >= 2 ? 1024 : 512;
    const m = {};
    const phys = (o) => new THREE.MeshPhysicalMaterial(o);

    // ---- movement metals ----
    const cotes = PT.cotesDeGeneve(this.texSize >= 1024 ? 768 : 512);
    const perl = PT.perlage(512);
    this.cotes = cotes; this.perl = perl;

    m.gilt = phys({ color: 0xe2b66a, metalness: 1, roughness: 0.26 });
    m.giltPolished = phys({ color: 0xedc57c, metalness: 1, roughness: 0.1 });
    m.gold = phys({ color: 0xf0c471, metalness: 1, roughness: 0.14 });
    m.bridge = phys({ color: 0xd4d7db, metalness: 1, roughness: 1.0, normalMap: cotes.normal, normalScale: new THREE.Vector2(0.35, 0.35), roughnessMap: cotes.rough });
    m.bridgeEdge = phys({ color: 0xe9ebee, metalness: 1, roughness: 0.05 }); // anglage (polished bevel)
    m.plate = phys({ color: 0xc9ccd1, metalness: 1, roughness: 1.0, normalMap: perl.normal, normalScale: new THREE.Vector2(0.22, 0.22), roughnessMap: perl.rough });
    m.plateEdge = phys({ color: 0xd6d9dd, metalness: 1, roughness: 0.2 });
    m.steel = phys({ color: 0xd9dde2, metalness: 1, roughness: 0.12 });
    m.steelDark = phys({ color: 0x9aa1aa, metalness: 1, roughness: 0.25 });
    m.blackPolish = phys({ color: 0xc9cdd2, metalness: 1, roughness: 0.06 });
    m.soleil = phys({ color: 0xd2d6db, metalness: 1, roughness: 0.3 });
    m.titanium = phys({ color: 0xb9bec4, metalness: 1, roughness: 0.18 });
    m.blued = phys({ color: 0x1d3fa8, metalness: 1, roughness: 0.2, iridescence: 0.7, iridescenceIOR: 1.6, iridescenceThicknessRange: [180, 420] });
    m.spring = phys({ color: 0xc7ced8, metalness: 1, roughness: 0.18 });
    m.mainspring = phys({ color: 0xaeb6c0, metalness: 1, roughness: 0.3 });
    m.slot = new THREE.MeshStandardMaterial({ color: 0x050608, metalness: 0.5, roughness: 0.6 });

    // ruby jewels: real transmission on high tier
    m.ruby = tier.transmission
      ? phys({ color: 0xff3355, metalness: 0, roughness: 0.03, transmission: 1, thickness: 0.35, ior: 1.76, attenuationColor: new THREE.Color(0xa0001c), attenuationDistance: 0.18, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.02 })
      : phys({ color: 0xa80c2a, metalness: 0.1, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.02, sheen: 0.6, sheenColor: new THREE.Color(0xff3355), emissive: new THREE.Color(0x3a0008), emissiveIntensity: 0.6 });

    // ---- case ----
    const caseCol = PALETTE.case.steel.color;
    m.casePolished = phys({ color: caseCol, metalness: 1, roughness: 0.13 });
    m.caseBrushed = phys({ color: caseCol, metalness: 1, roughness: 0.24, anisotropy: tier.aniso ? 0.85 : 0, anisotropyRotation: Math.PI / 2 });
    m.sapphire = phys({
      color: 0xffffff, metalness: 0, roughness: 0.05, transparent: true, opacity: 0.035, ior: 1.77, specularIntensity: 0.16,
      iridescence: 0.3, iridescenceIOR: 1.3, iridescenceThicknessRange: [250, 500], depthWrite: false, side: THREE.FrontSide, envMapIntensity: 0.55,
    });
    m.gasket = phys({ color: 0x111214, metalness: 0, roughness: 0.6 });

    // ---- dial ----
    m.dial = phys({ color: 0xffffff, metalness: 0.18, roughness: 0.36, clearcoat: 0.35, clearcoatRoughness: 0.12 });
    m.dialPrint = new THREE.MeshStandardMaterial({ transparent: true, metalness: 0.2, roughness: 0.4, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    m.index = phys({ color: 0xf2f2f2, metalness: 1, roughness: 0.06 });
    m.hand = phys({ color: 0xf0f0f0, metalness: 1, roughness: 0.05 });
    m.lume = phys({ color: 0xe8f0e0, metalness: 0, roughness: 0.6, emissive: new THREE.Color(0x60ff9a), emissiveIntensity: 0.0 });
    m.dateRing = new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0 });

    // ---- strap / display ----
    const lea = PT.leather(512);
    m.leather = phys({ map: lea.map, normalMap: lea.normal, normalScale: new THREE.Vector2(0.6, 0.6), roughness: 0.62, sheen: 0.4, sheenColor: new THREE.Color(0x8a5a3a), clearcoat: 0.15 });
    m.velvet = phys({ color: 0x15171d, roughness: 0.95, sheen: 1, sheenRoughness: 0.6, sheenColor: new THREE.Color(0x58607a), normalMap: PT.velvet(), normalScale: new THREE.Vector2(0.3, 0.3) });
    m.lacquer = phys({ color: 0x0b0b0d, metalness: 0.2, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 });
    m.brass = phys({ color: 0xb08d57, metalness: 1, roughness: 0.3 });
    m.glass = phys({ color: 0xeef4ff, metalness: 0, roughness: 0.02, transparent: true, opacity: 0.015, depthWrite: false, side: THREE.FrontSide, envMapIntensity: 0.07, specularIntensity: 0.25 });
    m.ghost = new THREE.MeshStandardMaterial({ color: 0x8fa3c0, transparent: true, opacity: 0.07, depthWrite: false, metalness: 0, roughness: 1 });

    this.m = m;
  }
  get(name) { return this.m[name]; }

  setCaseFinish(name) {
    const c = (PALETTE.case[name] || PALETTE.case.steel).color;
    this.m.casePolished.color.setHex(c);
    this.m.caseBrushed.color.setHex(c);
    // hands / indices follow the case metal
    this.m.hand.color.setHex(name === 'steel' ? 0xf0f0f0 : c);
    this.m.index.color.setHex(name === 'steel' ? 0xf2f2f2 : c);
  }
}
