import {
  ACESFilmicToneMapping,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShadowMaterial,
  Sphere,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { fitCameraToSphere, loadShoe } from './loadShoe.js';

const params = new URLSearchParams(location.search);
const view = params.get('view') || 'hero';
const size = Number(params.get('size') || 1000);
const tint = params.get('tint');
const stage = document.querySelector('#stage');
const errorBox = document.querySelector('#error');

const fail = (error) => {
  errorBox.textContent = `STUDIO ERROR\n${error?.message || error}`;
  errorBox.classList.add('show');
  console.error(error);
  window.__studioError = String(error?.message || error);
};

try {
  const renderer = new WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(size, size, false);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  stage.appendChild(renderer.domElement);

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.01, 100);
  renderer.setSize(size, size, false);

  const pmrem = new PMREMGenerator(renderer);
  const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTexture;

  const hemi = new HemisphereLight(0xfffbf5, 0xd9c8b5, 1.15);
  scene.add(hemi);

  const ambient = new HemisphereLight(0xffffff, 0xffffff, 0.22);
  scene.add(ambient);

  const key = new DirectionalLight(0xfff2df, 3.2);
  key.position.set(4.2, 6.5, 5.2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -4;
  key.shadow.camera.right = 4;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -4;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 20;
  key.shadow.bias = -0.00035;
  key.shadow.normalBias = 0.018;
  key.shadow.radius = 4;
  scene.add(key);

  const fill = new DirectionalLight(0xffd9bc, 1.1);
  fill.position.set(-4.5, 2.4, 3.4);
  scene.add(fill);

  const rim = new DirectionalLight(0xffffff, 2.1);
  rim.position.set(-1.5, 4.4, -5.5);
  scene.add(rim);

  const ground = new PlaneGeometry(16, 16);
  const shadow = new ShadowMaterial({ opacity: 0.14, color: new Color('#6f5542') });
  const shadowPlane = new Mesh(ground, shadow);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.002;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  const shoe = await loadShoe('/models/shoe.glb');
  if (tint) {
    shoe.meshes.forEach((mesh) => {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((material) => {
        if (material instanceof MeshStandardMaterial) {
          material.color.multiply(new Color(tint));
          material.needsUpdate = true;
        }
      });
    });
  }

  scene.add(shoe.scene);

  const poses = {
    hero: { rotation: Math.PI / 2 - 0.38, elevation: 0.16, azimuth: -0.12, margin: 1.06, targetY: 0.48 },
    side: { rotation: Math.PI / 2, elevation: 0.11, azimuth: 0, margin: 1.16, targetY: 0.46 },
    toe: { rotation: Math.PI / 2 + 0.74, elevation: 0.15, azimuth: 0.05, margin: 1.14, targetY: 0.45 },
    heel: { rotation: -Math.PI / 2 + 0.54, elevation: 0.16, azimuth: -0.1, margin: 1.14, targetY: 0.45 },
    top: { rotation: Math.PI / 2, elevation: 0.92, azimuth: 0, margin: 1.2, targetY: 0.4 },
    detail: { rotation: Math.PI / 2 - 0.28, elevation: 0.04, azimuth: -0.2, margin: 0.54, targetY: 0.5, targetX: 0.22 },
  };
  const pose = poses[view] || poses.hero;
  shoe.scene.rotation.y = pose.rotation;

  const sphere = shoe.box.getBoundingSphere(new Sphere());
  const target = sphere.center.clone();
  target.y = shoe.size.y * pose.targetY;
  target.x = pose.targetX || 0;

  fitCameraToSphere(camera, sphere, target, {
    margin: pose.margin,
    azimuth: pose.azimuth,
    elevation: pose.elevation,
  });
  renderer.setSize(size, size, false);

  const render = () => renderer.render(scene, camera);
  render();
  render();

  window.__studioInfo = {
    view,
    size,
    tint: tint || null,
    box: shoe.box.max.toArray().concat(shoe.box.min.toArray()),
    size3: shoe.size.toArray(),
    camera: camera.position.toArray(),
    triangles: shoe.meshes.reduce((sum, mesh) => {
      const geometry = mesh.geometry;
      return sum + (geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3);
    }, 0),
  };
  window.__measureCanvas = () => {
    const canvas = renderer.domElement;
    const copy = document.createElement('canvas');
    copy.width = canvas.width;
    copy.height = canvas.height;
    const context = copy.getContext('2d', { willReadFrequently: true });
    context.drawImage(canvas, 0, 0);
    const { data } = context.getImageData(0, 0, copy.width, copy.height);
    let minX = copy.width;
    let minY = copy.height;
    let maxX = -1;
    let maxY = -1;
    let solid = 0;
    for (let y = 0; y < copy.height; y += 1) {
      for (let x = 0; x < copy.width; x += 1) {
        const alpha = data[(y * copy.width + x) * 4 + 3];
        if (alpha < 220) continue;
        solid += 1;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
    return {
      width: copy.width,
      height: copy.height,
      solidPixels: solid,
      coverage: solid / (copy.width * copy.height),
      bbox: maxX < 0 ? null : { minX, minY, maxX, maxY },
      bboxRatio: maxX < 0 ? null : {
        x: minX / copy.width,
        y: minY / copy.height,
        w: (maxX - minX + 1) / copy.width,
        h: (maxY - minY + 1) / copy.height,
      },
    };
  };
  window.__studioReady = true;
  console.info('[studio] ready', window.__studioInfo);
} catch (error) {
  fail(error);
}
