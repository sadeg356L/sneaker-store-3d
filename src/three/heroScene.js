import {
  ACESFilmicToneMapping,
  Box3,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShadowMaterial,
  Sphere,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { fitCameraToSphere, loadShoe } from './loadShoe.js';

const BASE_ROTATION = Math.PI / 2 - 0.4;
const CAMERA_AZIMUTH = -0.14;
const CAMERA_ELEVATION = 0.16;
const CAMERA_MARGIN = 1.06;
const SCROLL_TURNS = 0.625;
const MAX_PIXEL_RATIO = 1.9;

const clamp01 = (value) => Math.min(1, Math.max(0, value));

/**
 * Production hero stage: the real GLB under studio lights with a soft shadow,
 * scroll-linked rotation/translation/scale and horizontal drag rotation.
 *
 * The controller is returned immediately; the model loads asynchronously so
 * the poster stays visible until the canvas can actually draw the shoe.
 */
export function initHeroScene({ host, stage, modelUrl, pose, reducedMotion = false, onProgress, onReady, onError }) {
  if (!host) return null;

  const baseRotation = Number.isFinite(pose?.rotation) ? pose.rotation : BASE_ROTATION;
  const cameraAzimuth = Number.isFinite(pose?.camera?.azimuth) ? pose.camera.azimuth : CAMERA_AZIMUTH;
  const cameraElevation = Number.isFinite(pose?.camera?.elevation) ? pose.camera.elevation : CAMERA_ELEVATION;
  const cameraMargin = Number.isFinite(pose?.camera?.margin) ? pose.camera.margin : CAMERA_MARGIN;
  const scrollTurns = Number.isFinite(pose?.scrollTurns) ? pose.scrollTurns : SCROLL_TURNS;

  let renderer;
  try {
    renderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
  } catch (error) {
    onError?.(error);
    return null;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  const canvas = renderer.domElement;
  const scene = new Scene();
  const camera = new PerspectiveCamera(31, 1, 0.1, 60);

  const pmrem = new PMREMGenerator(renderer);
  const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTexture;
  pmrem.dispose();

  const hemi = new HemisphereLight(0xfffbf3, 0xd9c8b5, 0.95);
  scene.add(hemi);

  // One shadow-casting key light keeps the scene soft and cheap.
  const key = new DirectionalLight(0xfff3e1, 2.7);
  key.position.set(4.2, 6.6, 5.2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -4;
  key.shadow.camera.right = 4;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -4;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 22;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  scene.add(key);

  const fill = new DirectionalLight(0xffdcc2, 0.85);
  fill.position.set(-5, 2.6, 3.6);
  scene.add(fill);

  const rim = new DirectionalLight(0xffffff, 1.7);
  rim.position.set(-2, 4.4, -5.8);
  scene.add(rim);

  const ground = new PlaneGeometry(18, 18);
  const shadow = new Mesh(ground, new ShadowMaterial({ color: 0x6f5542, opacity: 0.2 }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  shadow.receiveShadow = true;
  scene.add(shadow);

  const holder = new Group();
  scene.add(holder);

  let shoe = null;
  let disposed = false;
  let running = false;
  let raf = 0;
  let lastTime = 0;
  let visible = true;
  let progress = 0;
  let progressTarget = 0;
  let spin = 0;
  let drag = 0;
  let inertia = 0;
  let dragging = false;
  let lastPointerX = 0;
  let lastPointerTime = 0;
  let resizeTimer = 0;
  const target = new Vector3();
  const baseCamera = camera.position.clone();

  const info = {
    ready: false,
    error: null,
    modelUrl,
    reducedMotion,
    size: null,
    triangles: 0,
    license: null,
    progress: 0,
  };
  window.__heroInfo = info;

  function handleProgress(event) {
    const total = event?.total || 0;
    const ratio = total > 0 ? clamp01(event.loaded / total) : 0;
    info.progress = ratio;
    onProgress?.(total > 0 ? Math.round(ratio * 100) : null);
  }

  function measureProjection() {
    const width = host.clientWidth || stage?.clientWidth || 1;
    const height = host.clientHeight || stage?.clientHeight || 1;
    if (!shoe || width < 4 || height < 4) return null;

    holder.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    const box = new Box3().setFromObject(shoe.scene);
    const { min, max } = box;
    const corners = [
      [min.x, min.y, min.z],
      [max.x, min.y, min.z],
      [min.x, max.y, min.z],
      [max.x, max.y, min.z],
      [min.x, min.y, max.z],
      [max.x, min.y, max.z],
      [min.x, max.y, max.z],
      [max.x, max.y, max.z],
    ];

    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    for (const [x, y, z] of corners) {
      const point = new Vector3(x, y, z).project(camera);
      const px = ((point.x + 1) / 2) * width;
      const py = ((1 - point.y) / 2) * height;
      left = Math.min(left, px);
      top = Math.min(top, py);
      right = Math.max(right, px);
      bottom = Math.max(bottom, py);
    }

    return {
      left: +left.toFixed(1),
      top: +top.toFixed(1),
      right: +right.toFixed(1),
      bottom: +bottom.toFixed(1),
      width: +(right - left).toFixed(1),
      height: +(bottom - top).toFixed(1),
      rotation: +holder.rotation.y.toFixed(3),
      positionY: +holder.position.y.toFixed(3),
      scale: +holder.scale.x.toFixed(3),
      progress: +clamp01(progress).toFixed(3),
      box: {
        min: box.min.toArray().map((n) => +n.toFixed(2)),
        max: box.max.toArray().map((n) => +n.toFixed(2)),
      },
      stage: { width: +width.toFixed(1), height: +height.toFixed(1) },
    };
  }

  function layout() {
    if (!shoe || disposed) return;
    const width = host.clientWidth || stage?.clientWidth || 1;
    const height = host.clientHeight || stage?.clientHeight || 1;
    if (width < 4 || height < 4) return;

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    const sphere = shoe.box.getBoundingSphere(new Sphere());
    fitCameraToSphere(camera, sphere, target, {
      margin: cameraMargin,
      azimuth: cameraAzimuth,
      elevation: cameraElevation,
    });
    baseCamera.copy(camera.position);

    apply();
    info.projected = measureProjection();
    renderer.render(scene, camera);
  }

  function apply() {
    const p = clamp01(progress);
    holder.rotation.y = baseRotation + spin + drag - p * Math.PI * 2 * scrollTurns;
    holder.position.y = p * 0.32;
    holder.scale.setScalar(1 - p * 0.13);

    camera.position.set(baseCamera.x, baseCamera.y + p * 0.18, baseCamera.z);
    camera.lookAt(target.x, target.y + p * 0.1, target.z);
  }

  function tick(now) {
    if (!running) return;
    const delta = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;

    progress += (progressTarget - progress) * Math.min(1, delta * 7);

    if (!dragging) {
      const idle = 1 - clamp01(progress * 2.2);
      spin += delta * 0.09 * idle;
      if (Math.abs(inertia) > 0.002) {
        drag += inertia * delta;
        inertia *= Math.exp(-3.4 * delta);
      } else {
        inertia = 0;
      }
    }

    apply();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (running || reducedMotion || disposed || !shoe) return;
    running = true;
    lastTime = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function renderOnce() {
    if (!shoe || disposed) return;
    apply();
    renderer.render(scene, camera);
  }

  function onPointerDown(event) {
    if (!shoe || (event.pointerType === 'mouse' && event.button !== 0)) return;
    dragging = true;
    inertia = 0;
    lastPointerX = event.clientX;
    lastPointerTime = performance.now();
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      /* Some browsers reject capture on synthetic events. */
    }
  }

  function onPointerMove(event) {
    if (!dragging || !shoe) return;
    const dx = event.clientX - lastPointerX;
    if (!dx) return;
    lastPointerX = event.clientX;

    const now = performance.now();
    const delta = Math.max(0.012, (now - lastPointerTime) / 1000);
    lastPointerTime = now;

    const step = dx * 0.006;
    drag += step;
    inertia = Math.max(-7, Math.min(7, step / delta));

    if (!running) renderOnce();
  }

  function endDrag(event) {
    if (!dragging) return;
    dragging = false;
    if (event?.pointerId !== undefined) {
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch {
        /* Ignore capture already released by the browser. */
      }
    }
    if (!running) {
      inertia = 0;
      renderOnce();
    }
  }

  function onDocumentVisibility() {
    if (document.hidden) stop();
    else if (visible) start();
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  document.addEventListener('visibilitychange', onDocumentVisibility);

  const resizeObserver = new ResizeObserver(() => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(layout, 90);
  });
  resizeObserver.observe(host);

  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      visible = Boolean(entries[0]?.isIntersecting);
      if (visible && !document.hidden) start();
      else stop();
    },
    { rootMargin: '160px 0px' },
  );
  if (stage) intersectionObserver.observe(stage);

  const handleWindowResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(layout, 120);
  };
  window.addEventListener('resize', handleWindowResize);

  loadShoe(modelUrl, handleProgress)
    .then((loaded) => {
      if (disposed) {
        loaded.scene.traverse((child) => {
          if (!child.isMesh) return;
          child.geometry?.dispose();
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material) => material?.dispose());
        });
        return;
      }

      shoe = loaded;
      holder.add(shoe.scene);

      target.copy(shoe.center);
      target.x = 0;
      target.z = 0;
      target.y = shoe.size.y * 0.5;

      info.size = shoe.size.toArray();
      info.triangles = Math.round(
        shoe.meshes.reduce((sum, mesh) => {
          const geometry = mesh.geometry;
          return sum + (geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3);
        }, 0),
      );
      info.license = shoe.license;
      info.ready = true;

      layout();
      info.camera = camera.position.toArray();
      onReady?.({ size: info.size, triangles: info.triangles, license: info.license });
      start();
    })
    .catch((error) => {
      if (disposed) return;
      info.error = String(error?.message || error);
      console.error('[KHOTWA] hero model failed to load:', error);
      stop();
      onError?.(error);
    });

  return {
    setProgress(value) {
      progressTarget = clamp01(Number(value) || 0);
      if (reducedMotion) {
        progress = 0;
        renderOnce();
      }
    },
    layout,
    project() {
      info.projected = measureProjection();
      return info.projected;
    },
    dispose() {
      disposed = true;
      stop();
      window.clearTimeout(resizeTimer);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      document.removeEventListener('visibilitychange', onDocumentVisibility);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', endDrag);
      canvas.removeEventListener('pointercancel', endDrag);

      scene.traverse((child) => {
        if (!child.isMesh) return;
        child.geometry?.dispose();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          if (!material) return;
          Object.values(material).forEach((value) => {
            if (value && value.isTexture) value.dispose();
          });
          material.dispose();
        });
      });
      envTexture.dispose();
      renderer.dispose();
      renderer.forceContextLoss?.();
      canvas.remove();
      host.innerHTML = '';
    },
  };
}
