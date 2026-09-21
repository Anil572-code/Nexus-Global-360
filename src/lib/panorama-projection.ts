export type PanoramaProjection = {
  x: number;
  y: number;
  visible: boolean;
  depth: number;
};

export type PanoramaDirection = {
  yaw: number;
  pitch: number;
};

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

function rotateX(point: [number, number, number], angle: number): [number, number, number] {
  const [x, y, z] = point;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [x, c * y - s * z, s * y + c * z];
}

function rotateY(point: [number, number, number], angle: number): [number, number, number] {
  const [x, y, z] = point;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [c * x - s * z, y, s * x + c * z];
}

function normaliseAngle(value: number) {
  let angle = value;
  while (angle < -180) angle += 360;
  while (angle >= 180) angle -= 360;
  return angle;
}

function normaliseVector(point: [number, number, number]): [number, number, number] {
  const length = Math.hypot(point[0], point[1], point[2]) || 1;
  return [point[0] / length, point[1] / length, point[2] / length];
}

export function panoramaPointToScreen(
  pointYaw: number,
  pointPitch: number,
  cameraYaw: number,
  cameraPitch: number,
  horizontalFov: number,
  width: number,
  height: number,
): PanoramaProjection {
  const yaw = pointYaw * DEG;
  const pitch = pointPitch * DEG;
  const cosPitch = Math.cos(pitch);

  let direction: [number, number, number] = [
    Math.sin(yaw) * cosPitch,
    Math.sin(pitch),
    -Math.cos(yaw) * cosPitch,
  ];

  direction = rotateY(direction, -cameraYaw * DEG);
  direction = rotateX(direction, -cameraPitch * DEG);

  const [x, y, z] = direction;
  const forward = -z;
  if (forward <= 0.001) return { x: -9999, y: -9999, visible: false, depth: forward };

  const aspect = Math.max(width / Math.max(height, 1), 0.001);
  const tanH = Math.tan((horizontalFov * DEG) / 2);
  const tanV = tanH / aspect;
  const ndcX = (x / forward) / tanH;
  const ndcY = (y / forward) / tanV;
  const visible = Math.abs(ndcX) <= 1.08 && Math.abs(ndcY) <= 1.08;

  return {
    x: (ndcX * 0.5 + 0.5) * width,
    y: (0.5 - ndcY * 0.5) * height,
    visible,
    depth: forward,
  };
}

/**
 * Converts a viewport pixel into the exact spherical direction used by the
 * WebGL panorama shader. This is the Level-2 inspection authority: the learner
 * selects the photographed condition itself rather than a floating DOM marker.
 */
export function panoramaScreenToDirection(
  screenX: number,
  screenY: number,
  cameraYaw: number,
  cameraPitch: number,
  horizontalFov: number,
  width: number,
  height: number,
): PanoramaDirection {
  const safeWidth = Math.max(width, 1);
  const safeHeight = Math.max(height, 1);
  const aspect = Math.max(safeWidth / safeHeight, 0.001);
  const halfHFov = (horizontalFov * DEG) / 2;
  const tanH = Math.tan(halfHFov);
  const tanV = tanH / aspect;

  const ndcX = (screenX / safeWidth) * 2 - 1;
  const ndcY = 1 - (screenY / safeHeight) * 2;
  let ray: [number, number, number] = normaliseVector([
    ndcX * tanH,
    ndcY * tanV,
    -1,
  ]);

  // Match the fragment shader rotation order exactly.
  ray = rotateX(ray, cameraPitch * DEG);
  ray = rotateY(ray, cameraYaw * DEG);
  ray = normaliseVector(ray);

  return {
    yaw: normaliseAngle(Math.atan2(ray[0], -ray[2]) * RAD),
    pitch: Math.asin(Math.max(-1, Math.min(1, ray[1]))) * RAD,
  };
}

export function panoramaAngularDistance(
  yawA: number,
  pitchA: number,
  yawB: number,
  pitchB: number,
) {
  const yaw1 = yawA * DEG;
  const yaw2 = yawB * DEG;
  const pitch1 = pitchA * DEG;
  const pitch2 = pitchB * DEG;
  const cosine =
    Math.sin(pitch1) * Math.sin(pitch2) +
    Math.cos(pitch1) * Math.cos(pitch2) * Math.cos(yaw1 - yaw2);
  return Math.acos(Math.max(-1, Math.min(1, cosine))) * RAD;
}
