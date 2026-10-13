// Case: middle with lugs, bezel, sapphire crystals, gaskets, case back, crown
import * as THREE from 'three';
import { latheZ, mesh, screwMesh } from './movement/helpers.js';
import { gasketGeometry } from '../geometry/Small.js';
import { engravingTexture } from '../materials/ProceduralTextures.js';
import { BRAND } from '../config.js';

export function buildCase(W, L) {
  const mats = W.mats;
  const pol = mats.get('casePolished'), bru = mats.get('caseBrushed');
  // ---- case middle (brushed flanks, polished chamfers) ----
  const mid = W.addPart('caseMiddle', 'caseMiddle', null, { group: 'case', important: true });
  const prof = [
    [16.0, -4.3], [19.2, -4.3], [19.75, -4.0], [20.05, -3.3], [20.1, 2.0], [19.9, 2.75], [19.4, 3.05], [16.4, 3.05], [16.0, 2.5], [16.0, -4.3],
  ];
  mid.add(mesh(latheZ(prof, 128), bru));
  // lugs — side profile (u = y, v = z) extruded along x, built for each side
  const lugGeo = (sy) => {
    const P = (u, v) => [u * sy, v];
    const sh = new THREE.Shape();
    sh.moveTo(...P(15.5, 2.7));
    sh.bezierCurveTo(...P(19.0, 2.6), ...P(22.5, 1.4), ...P(25.2, -0.6));
    sh.quadraticCurveTo(...P(25.9, -1.3), ...P(25.4, -2.2));
    sh.bezierCurveTo(...P(23.0, -2.4), ...P(20.2, -3.3), ...P(18.2, -4.1));
    sh.lineTo(...P(15.5, -4.1));
    sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: 2.2, bevelEnabled: true, bevelThickness: 0.28, bevelSize: 0.28, bevelSegments: 3, curveSegments: 24 });
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setXYZ(i, pos.getZ(i), pos.getX(i), pos.getY(i)); // (u,v,w)->(w,u,v)
    g.computeVertexNormals();
    return g;
  };
  for (const sy of [-1, 1]) {
    const g = lugGeo(sy);
    for (const sx of [-1, 1]) {
      const m = mid.add(mesh(g, [pol, bru]));
      m.position.x = sx > 0 ? 10.28 : -12.48;
    }
  }
  // crown tube
  const tube = new THREE.CylinderGeometry(1.25, 1.35, 1.4, 24); tube.rotateZ(Math.PI / 2);
  const tm = mid.add(mesh(tube, pol)); tm.position.set(20.6, 0, L.z.keyless);
  mid.labelAnchor.set(-19.5, -6, 0);
  mid.ex.set(0, 0, -44);

  // ---- gaskets ----
  const gf = W.addPart('gasketFront', 'gasket', null, { group: 'case' });
  gf.add(mesh(gasketGeometry(16.35, 0.18), mats.get('gasket'))); gf.at(0, 0, 3.25); gf.ex.set(0, 0, 41);
  const gb = W.addPart('gasketBack', 'gasket', null, { group: 'case' });
  gb.add(mesh(gasketGeometry(17.6, 0.2), mats.get('gasket'))); gb.at(0, 0, -4.4); gb.ex.set(0, 0, -48);

  // ---- bezel ----
  const bezel = W.addPart('bezel', 'bezel', null, { group: 'case' });
  bezel.add(mesh(latheZ([[16.25, 3.0], [19.5, 3.0], [19.9, 3.25], [19.6, 3.75], [17.6, 4.25], [16.6, 4.32], [16.25, 4.15], [16.25, 3.0]], 128), pol));
  bezel.ex.set(0, 0, 44);

  // ---- front crystal (slightly domed sapphire with AR coating) ----
  const cf = W.addPart('crystalFront', 'crystal', null, { group: 'case', important: true });
  const dome = [];
  for (let i = 0; i <= 16; i++) { const r = (16.45 * i) / 16; dome.push([r, 4.05 + 0.32 * (1 - (r / 16.45) ** 2)]); }
  dome.push([16.45, 3.45]); dome.push([0, 3.45]);
  const cm = cf.add(mesh(latheZ(dome, 96), mats.get('sapphire')), { cast: false, receive: false });
  cm.renderOrder = 5;
  cf.labelAnchor.set(10, 10, 4.2);
  cf.ex.set(0, 0, 50);

  // ---- case back + back crystal + screws ----
  const back = W.addPart('caseback', 'caseback', null, { group: 'case', important: true });
  const tex = engravingTexture(1024, 19.6, [
    { text: `${BRAND.name}  ·  HA-01  ·  ${BRAND.serial}`, r: 16.6, angle: Math.PI / 2, span: Math.PI * 0.72, size: 0.95 },
    { text: 'SAPPHIRE  ·  AUTOMATIC  ·  TOURBILLON', r: 16.6, angle: -Math.PI / 2, span: Math.PI * 0.72, size: 0.85 },
  ], { color: '#3a3a3a', bg: '#ffffff' });
  tex.repeat.set(-1 / 39.2, 1 / 39.2); tex.offset.set(0.5, 0.5);
  const backMat = pol.clone(); backMat.map = tex; backMat.roughness = 0.12;
  const ring = new THREE.Shape(); ring.absarc(0, 0, 19.4, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); hole.absarc(0, 0, 13.9, 0, Math.PI * 2, true); ring.holes.push(hole);
  const rg = new THREE.ExtrudeGeometry(ring, { depth: 1.0, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.3, bevelSegments: 3, curveSegments: 128 });
  back.add(mesh(rg, [backMat, pol]));
  back.at(0, 0, -5.6);
  back.labelAnchor.set(0, -17, -0.4);
  back.ex.set(0, 0, -54);
  const cb = W.addPart('crystalBack', 'crystal', back, { group: 'case' });
  const cbm = cb.add(mesh(latheZ([[0, 0.25], [14.3, 0.25], [14.3, -0.45], [0, -0.45]], 96), mats.get('sapphire')), { cast: false, receive: false });
  cbm.renderOrder = 5;
  cb.at(0, 0, 0.35); cb.ex.set(0, 0, 3);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const s = W.addPart('sc_back_' + i, 'screw', back, { group: 'case', spin: 4 });
    s.add(screwMesh(mats, 0.75, -1, false));
    s.at(Math.cos(a) * 16.9, Math.sin(a) * 16.9, -0.3); s.ex.set(0, 0, -4);
  }

  // ---- crown (fluted, with emblem) ----
  const crown = W.addPart('crown', 'crown', null, { group: 'keyless', important: true });
  const cg = new THREE.CylinderGeometry(2.85, 2.85, 3.0, 96, 4, false);
  const p2 = cg.attributes.position;
  for (let i = 0; i < p2.count; i++) {
    const x = p2.getX(i), y = p2.getY(i), zz = p2.getZ(i);
    const r = Math.hypot(x, zz);
    if (r > 2.0) {
      const a = Math.atan2(zz, x);
      const f = 1 - 0.07 * Math.max(0, Math.cos(a * 24)) ** 2;
      const edge = 1 - 0.06 * Math.max(0, Math.abs(y) / 1.5 - 0.7) / 0.3;
      p2.setX(i, x * f * edge); p2.setZ(i, zz * f * edge);
    }
  }
  cg.computeVertexNormals();
  cg.rotateZ(-Math.PI / 2);
  crown.add(mesh(cg, pol));
  const capC = document.createElement('canvas'); capC.width = capC.height = 256;
  const cx = capC.getContext('2d');
  cx.fillStyle = '#fff'; cx.fillRect(0, 0, 256, 256);
  cx.strokeStyle = '#555'; cx.lineWidth = 8; cx.beginPath(); cx.arc(128, 128, 104, 0, Math.PI * 2); cx.stroke();
  cx.fillStyle = '#4a4a4a'; cx.font = 'italic 600 150px "Hoefler Text","Times New Roman",serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
  cx.fillText('h', 128, 136);
  const capTex = new THREE.CanvasTexture(capC); capTex.colorSpace = THREE.SRGBColorSpace;
  const capMat = pol.clone(); capMat.map = capTex;
  const capG = new THREE.CircleGeometry(2.3, 48); capG.rotateY(Math.PI / 2);
  const capM = crown.add(mesh(capG, capMat)); capM.position.x = 1.52;
  crown.at(23.0, 0, L.z.keyless);
  crown.labelAnchor.set(1, 0, 0);
  crown.ex.set(26, 0, 6);
  return { mid, bezel, cf, back, crown };
}
