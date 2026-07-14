import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { easing } from 'maath';
import { INTERNALS } from './config';

/**
 * FluidGlass's non-React core is three.js. Nothing in the technique needs React —
 * @react-three/fiber only supplies the render loop and the JSX. This is the same
 * pipeline in plain DOM: load the GLB, render the backdrop into a WebGLRenderTarget,
 * feed that target to a transmissive material, damp the mesh toward the pointer.
 *
 * The one substitution: MeshTransmissionMaterial is a drei class, so this uses three's
 * own MeshPhysicalMaterial. It gives real refraction and dispersion but not drei's
 * multi-sample buffer refraction, which is exactly what drei adds on top.
 *
 * Returns a dispose function. Every allocation it makes is released there — that is
 * the part a demo normally skips and the part that leaks a WebGL context if you skip it.
 */
export interface VanillaHandle {
  dispose: () => void;
  setBackdrop: (tex: THREE.Texture) => void;
  setIor: (v: number) => void;
  setThickness: (v: number) => void;
  setDispersion: (v: number) => void;
}

export function mountVanillaGlass(host: HTMLElement, backdrop: THREE.Texture): VanillaHandle {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.setSize(host.clientWidth, host.clientHeight);
  host.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(
    INTERNALS.camera.fov,
    host.clientWidth / host.clientHeight,
    0.1,
    100
  );
  camera.position.set(...INTERNALS.camera.position);

  // The scene that gets rendered offscreen — FluidGlass's portalled THREE.Scene.
  const offscreen = new THREE.Scene();
  const target = new THREE.WebGLRenderTarget(1024, 1024, { samples: 4 });

  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 4, 8);
  scene.add(key);

  const planeGeo = new THREE.PlaneGeometry(1, 1);
  const backdropMat = new THREE.MeshBasicMaterial({ map: backdrop });
  const backdropMesh = new THREE.Mesh(planeGeo, backdropMat);
  offscreen.add(backdropMesh);

  const blitMat = new THREE.MeshBasicMaterial({ map: target.texture });
  const blitMesh = new THREE.Mesh(planeGeo, blitMat);
  scene.add(blitMesh);

  // No envMap: three's transmission pass samples the *scene* behind the mesh, which is
  // the blitted render target. Handing it a 2D render-target texture as an envMap instead
  // picks the wrong ENVMAP_TYPE define and the material silently fails to compile.
  const glassMat = new THREE.MeshPhysicalMaterial({
    transmission: 1,
    thickness: 5,
    ior: 1.15,
    roughness: 0,
    metalness: 0,
    dispersion: 2
  });

  let glass: THREE.Mesh | null = null;
  let disposed = false;

  // The three FluidGlass GLBs are Draco-compressed. drei's useGLTF hides this by wiring a
  // DRACOLoader for you — pointed at gstatic.com — so a plain GLTFLoader gets
  // "No DRACOLoader instance provided" and adds nothing to the scene. The decoder is
  // served from /draco here rather than the CDN, so this page has no third-party runtime dep.
  const draco = new DRACOLoader().setDecoderPath('/draco/');
  const loader = new GLTFLoader().setDRACOLoader(draco);

  loader.load(INTERNALS.glb.lens, gltf => {
    if (disposed) return;
    const src = gltf.scene.getObjectByName(INTERNALS.geometryKey.lens) as THREE.Mesh | undefined;
    const geo = src?.geometry ?? new THREE.SphereGeometry(0.5, 48, 48);
    glass = new THREE.Mesh(geo, glassMat);
    glass.rotation.x = Math.PI / 2;
    glass.scale.setScalar(0.25);
    glass.position.z = INTERNALS.meshZ;
    scene.add(glass);
  });

  const pointer = new THREE.Vector2(0, 0);
  const onPointerMove = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
  };
  host.addEventListener('pointermove', onPointerMove);

  const onResize = () => {
    if (!host.clientWidth) return;
    camera.aspect = host.clientWidth / host.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(host.clientWidth, host.clientHeight);
  };
  const ro = new ResizeObserver(onResize);
  ro.observe(host);

  /** World-space size of the frustum at a given z, the way r3f's getCurrentViewport does it. */
  const viewportAt = (z: number) => {
    const d = camera.position.z - z;
    const h = 2 * Math.tan((camera.fov * Math.PI) / 360) * d;
    return { width: h * camera.aspect, height: h };
  };

  const clock = new THREE.Clock();
  let raf = 0;

  const tick = () => {
    raf = requestAnimationFrame(tick);
    const delta = clock.getDelta();

    const v0 = viewportAt(0);
    backdropMesh.scale.set(v0.width, v0.height, 1);
    blitMesh.scale.set(v0.width, v0.height, 1);

    if (glass) {
      const v = viewportAt(INTERNALS.meshZ);
      easing.damp3(
        glass.position,
        [(pointer.x * v.width) / 2, (pointer.y * v.height) / 2, INTERNALS.meshZ],
        INTERNALS.pointerSmoothTime,
        delta
      );
      glass.visible = false;
    }

    renderer.setRenderTarget(target);
    renderer.render(offscreen, camera);
    renderer.setRenderTarget(null);

    if (glass) glass.visible = true;
    renderer.render(scene, camera);
  };
  tick();

  return {
    setBackdrop(tex) {
      backdropMat.map = tex;
      backdropMat.needsUpdate = true;
    },
    setIor(v) {
      glassMat.ior = v;
    },
    setThickness(v) {
      glassMat.thickness = v;
    },
    setDispersion(v) {
      glassMat.dispersion = v;
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener('pointermove', onPointerMove);

      planeGeo.dispose();
      glass?.geometry.dispose();
      backdropMat.dispose();
      blitMat.dispose();
      glassMat.dispose();
      target.dispose();

      draco.dispose();
      renderer.domElement.remove();
      renderer.dispose();
      // Without this the context stays alive; browsers cap you at ~16 and then start
      // silently killing the oldest ones.
      renderer.forceContextLoss();
    }
  };
}
