import { Box3, Group, Mesh, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * Load the hero sneaker and normalize it for a predictable scene.
 * The source model is Z-up-ish after Sketchfab's node transforms, so we
 * measure the world-space box instead of assuming an axis.
 */
export async function loadShoe(url, onProgress) {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(url, (event) => {
    if (onProgress) onProgress(event);
  });

  const root = gltf.scene;
  const group = new Group();
  group.add(root);
  root.updateMatrixWorld(true);

  const rawBox = new Box3().setFromObject(root);
  const rawSize = rawBox.getSize(new Vector3());

  const longest = Math.max(rawSize.x, rawSize.y, rawSize.z);
  const target = 2.6;
  const scale = target / longest;
  root.scale.setScalar(scale);
  root.updateMatrixWorld(true);

  // Center the scaled shoe around the pivot and put the outsole on y=0.
  // The pivot itself stays at the origin so rotation and scaling are stable.
  let box = new Box3().setFromObject(root);
  const center = box.getCenter(new Vector3());
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= box.min.y;
  root.updateMatrixWorld(true);

  box = new Box3().setFromObject(group);
  const size = box.getSize(new Vector3());
  const centered = box.getCenter(new Vector3());

  const meshes = [];
  group.traverse((child) => {
    if (!child.isMesh) return;
    meshes.push(child);
    child.castShadow = true;
    child.receiveShadow = true;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      if (!material) return;
      material.envMapIntensity = 0.55;
      if (material.map) material.map.anisotropy = 8;
      if (material.normalMap) material.normalMap.anisotropy = 4;
      material.needsUpdate = true;
    });
  });

  return {
    scene: group,
    meshes,
    box,
    size,
    center: centered,
    meta: gltf.parser?.json?.asset ?? gltf.userData ?? {},
    license: gltf.parser?.json?.asset?.extras ?? null,
    animations: gltf.animations || [],
  };
}

/** Fit a perspective camera to a sphere so rotation never clips the shoe. */
export function fitCameraToSphere(camera, sphere, controlsTarget, { margin = 1.32, azimuth = 0, elevation = 0.12 } = {}) {
  const radius = Math.max(sphere.radius, 0.01);
  const vFov = (camera.fov * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  const fitFov = Math.min(vFov, hFov);
  const distance = (radius / Math.sin(fitFov / 2)) * margin;

  const target = controlsTarget || sphere.center;
  const camX = Math.sin(azimuth) * Math.cos(elevation) * distance;
  const camY = target.y + Math.sin(elevation) * distance;
  const camZ = Math.cos(azimuth) * Math.cos(elevation) * distance;

  camera.position.set(target.x + camX, camY, target.z + camZ);
  camera.near = Math.max(0.01, distance - radius * 4);
  camera.far = distance + radius * 8;
  camera.lookAt(target.x, target.y, target.z);
  camera.updateProjectionMatrix();

  return { distance, radius, target };
}

/** Keep the renderer's CSS pixels and drawing buffer in sync. */
export function resizeRenderer(renderer, camera, width, height) {
  camera.aspect = width / Math.max(height, 1);
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

export function shadowSafeMaterial(mesh) {
  if (mesh instanceof Mesh) mesh.frustumCulled = false;
}
