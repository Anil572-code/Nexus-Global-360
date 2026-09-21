"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

export type PanoramaCamera = {
  yaw: number;
  pitch: number;
  fov: number;
};

export type EquirectangularViewportHandle = {
  renderCamera: (camera: PanoramaCamera, interactive?: boolean) => void;
  settle: (camera?: PanoramaCamera) => void;
};

export type PanoramaMarker = {
  id: string;
  yaw: number;
  pitch: number;
};

type Props = PanoramaCamera & {
  src: string;
  className?: string;
  ariaHidden?: boolean;
  exposure?: number;
  markers?: PanoramaMarker[];
};

type Renderer = {
  gl: WebGLRenderingContext;
  panoramaProgram: WebGLProgram;
  panoramaBuffer: WebGLBuffer;
  texture: WebGLTexture;
  panoramaPosition: number;
  yaw: WebGLUniformLocation;
  pitch: WebGLUniformLocation;
  fov: WebGLUniformLocation;
  aspect: WebGLUniformLocation;
  exposure: WebGLUniformLocation;
  markerProgram: WebGLProgram;
  markerBuffer: WebGLBuffer;
  markerPosition: number;
  markerSize: WebGLUniformLocation;
  image: HTMLImageElement;
};

// Final runtime freeze: keep one stable backing-store density for every frame.
// Changing DPR while the user rotates the camera forces GPU reallocations and
// can produce the flash/judder that was visible in the previous iterations.
const RENDER_DPR_CAP = 1;
const MARKER_SIZE_CSS_PX = 25;

const PANORAMA_VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 v_position;
void main() {
  v_position = a_position;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const PANORAMA_FRAGMENT_SHADER = `
precision highp float;
varying vec2 v_position;
uniform sampler2D u_texture;
uniform float u_yaw;
uniform float u_pitch;
uniform float u_hfov;
uniform float u_aspect;
uniform float u_exposure;

const float PI = 3.1415926535897932384626433832795;

vec3 rotateX(vec3 p, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
}

vec3 rotateY(vec3 p, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec3(c * p.x - s * p.z, p.y, s * p.x + c * p.z);
}

void main() {
  float halfHFov = radians(u_hfov) * 0.5;
  float tanH = tan(halfHFov);
  float tanV = tanH / max(u_aspect, 0.001);

  vec3 ray = normalize(vec3(v_position.x * tanH, v_position.y * tanV, -1.0));
  ray = rotateX(ray, radians(u_pitch));
  ray = rotateY(ray, radians(u_yaw));

  float longitude = atan(ray.x, -ray.z);
  float latitude = asin(clamp(ray.y, -1.0, 1.0));
  vec2 uv = vec2(fract(0.5 + longitude / (2.0 * PI)), 0.5 - latitude / PI);

  vec4 color = texture2D(u_texture, uv);
  color.rgb = pow(max(color.rgb * u_exposure, vec3(0.0)), vec3(0.985));
  gl_FragColor = color;
}
`;

// Confirmed findings are rendered by the SAME WebGL context and draw cycle as
// the panorama. They are no longer independent DOM/compositor layers, so there
// is no second animation clock that can drift or flicker during rotation.
const MARKER_VERTEX_SHADER = `
attribute vec2 a_marker_position;
uniform float u_marker_size;
void main() {
  gl_Position = vec4(a_marker_position, 0.0, 1.0);
  gl_PointSize = u_marker_size;
}
`;

const MARKER_FRAGMENT_SHADER = `
precision mediump float;

float segmentDistance(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  vec2 p = gl_PointCoord;
  vec2 centered = p * 2.0 - 1.0;
  float radius = length(centered);
  if (radius > 1.0) discard;

  vec4 green = vec4(0.114, 0.639, 0.427, 1.0);
  vec4 white = vec4(1.0, 1.0, 1.0, 0.98);
  vec4 color = radius > 0.80 ? white : green;

  // A compact check mark drawn procedurally inside the point sprite.
  float d1 = segmentDistance(p, vec2(0.27, 0.52), vec2(0.43, 0.68));
  float d2 = segmentDistance(p, vec2(0.43, 0.68), vec2(0.75, 0.31));
  if (min(d1, d2) < 0.055 && radius < 0.76) color = white;

  gl_FragColor = color;
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create panorama shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Panorama shader compilation failed.";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string,
  label: string,
) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) throw new Error(`Unable to create ${label} renderer.`);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || `${label} renderer link failed.`;
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
}

function requireUniform(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  name: string,
) {
  const location = gl.getUniformLocation(program, name);
  if (location === null) throw new Error(`Panorama shader uniform is unavailable: ${name}`);
  return location;
}

function createRenderer(canvas: HTMLCanvasElement): Renderer {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false,
  });
  if (!gl) throw new Error("WebGL is unavailable in this browser.");

  const panoramaProgram = createProgram(
    gl,
    PANORAMA_VERTEX_SHADER,
    PANORAMA_FRAGMENT_SHADER,
    "panorama",
  );
  const markerProgram = createProgram(gl, MARKER_VERTEX_SHADER, MARKER_FRAGMENT_SHADER, "marker");

  const panoramaPosition = gl.getAttribLocation(panoramaProgram, "a_position");
  const markerPosition = gl.getAttribLocation(markerProgram, "a_marker_position");
  const panoramaBuffer = gl.createBuffer();
  const markerBuffer = gl.createBuffer();
  const texture = gl.createTexture();
  if (!panoramaBuffer || !markerBuffer || !texture) {
    throw new Error("Unable to allocate panorama GPU resources.");
  }

  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.STENCIL_TEST);
  gl.disable(gl.CULL_FACE);

  gl.bindBuffer(gl.ARRAY_BUFFER, panoramaBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]),
    gl.STATIC_DRAW,
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, markerBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(12), gl.DYNAMIC_DRAW);

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);

  const placeholder = new Uint8Array([20, 35, 45, 255]);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, placeholder);

  gl.useProgram(panoramaProgram);
  const sampler = gl.getUniformLocation(panoramaProgram, "u_texture");
  if (sampler !== null) gl.uniform1i(sampler, 0);

  return {
    gl,
    panoramaProgram,
    panoramaBuffer,
    texture,
    panoramaPosition,
    yaw: requireUniform(gl, panoramaProgram, "u_yaw"),
    pitch: requireUniform(gl, panoramaProgram, "u_pitch"),
    fov: requireUniform(gl, panoramaProgram, "u_hfov"),
    aspect: requireUniform(gl, panoramaProgram, "u_aspect"),
    exposure: requireUniform(gl, panoramaProgram, "u_exposure"),
    markerProgram,
    markerBuffer,
    markerPosition,
    markerSize: requireUniform(gl, markerProgram, "u_marker_size"),
    image: new Image(),
  };
}

function uploadTexture(renderer: Renderer) {
  const { gl, texture, image } = renderer;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  const powerOfTwo = (value: number) => (value & (value - 1)) === 0;
  if (powerOfTwo(image.naturalWidth) && powerOfTwo(image.naturalHeight)) {
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    const anisotropic = (
      gl.getExtension("EXT_texture_filter_anisotropic") ||
      gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic") ||
      gl.getExtension("MOZ_EXT_texture_filter_anisotropic")
    ) as ({ MAX_TEXTURE_MAX_ANISOTROPY_EXT: number; TEXTURE_MAX_ANISOTROPY_EXT: number } | null);
    if (anisotropic) {
      const maximum = gl.getParameter(anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number;
      gl.texParameterf(
        gl.TEXTURE_2D,
        anisotropic.TEXTURE_MAX_ANISOTROPY_EXT,
        Math.min(maximum || 1, 4),
      );
    }
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  }
}

function resolvePixelRatio() {
  return Math.min(window.devicePixelRatio || 1, RENDER_DPR_CAP);
}

function normaliseAngle(value: number) {
  let angle = value;
  while (angle < -180) angle += 360;
  while (angle >= 180) angle -= 360;
  return angle;
}

function markerToClipSpace(
  marker: PanoramaMarker,
  camera: PanoramaCamera,
  aspect: number,
) {
  const relativeYaw = (normaliseAngle(marker.yaw - camera.yaw) * Math.PI) / 180;
  const markerPitch = (marker.pitch * Math.PI) / 180;
  const cameraPitch = (camera.pitch * Math.PI) / 180;

  // Equivalent to R_x(-cameraPitch) * R_y(-cameraYaw) * worldDirection.
  const x = Math.sin(relativeYaw) * Math.cos(markerPitch);
  let y = Math.sin(markerPitch);
  let z = -Math.cos(relativeYaw) * Math.cos(markerPitch);

  const c = Math.cos(-cameraPitch);
  const s = Math.sin(-cameraPitch);
  const rotatedY = c * y - s * z;
  const rotatedZ = s * y + c * z;
  y = rotatedY;
  z = rotatedZ;

  const depth = -z;
  if (depth <= 0.0001) return null;

  const halfHFov = (camera.fov * Math.PI) / 360;
  const tanH = Math.tan(halfHFov);
  const tanV = tanH / Math.max(aspect, 0.001);
  const clipX = x / (depth * tanH);
  const clipY = y / (depth * tanV);

  // Small guard band prevents rapid appear/disappear at the exact viewport edge.
  if (Math.abs(clipX) > 1.06 || Math.abs(clipY) > 1.06) return null;
  return [clipX, clipY] as const;
}

function drawMarkers(
  renderer: Renderer,
  camera: PanoramaCamera,
  markers: PanoramaMarker[],
  width: number,
  height: number,
  ratio: number,
) {
  if (!markers.length) return;

  const { gl } = renderer;
  const aspect = width / Math.max(height, 1);
  const positions: number[] = [];
  for (const marker of markers) {
    const position = markerToClipSpace(marker, camera, aspect);
    if (position) positions.push(position[0], position[1]);
  }
  if (!positions.length) return;

  gl.useProgram(renderer.markerProgram);
  gl.bindBuffer(gl.ARRAY_BUFFER, renderer.markerBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(renderer.markerPosition);
  gl.vertexAttribPointer(renderer.markerPosition, 2, gl.FLOAT, false, 0, 0);
  gl.uniform1f(renderer.markerSize, MARKER_SIZE_CSS_PX * ratio);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.drawArrays(gl.POINTS, 0, positions.length / 2);
  gl.disable(gl.BLEND);
}

function draw(
  renderer: Renderer,
  canvas: HTMLCanvasElement,
  camera: PanoramaCamera,
  exposure: number,
  markers: PanoramaMarker[],
) {
  const { gl } = renderer;
  const cssWidth = Math.max(canvas.clientWidth, 1);
  const cssHeight = Math.max(canvas.clientHeight, 1);
  const ratio = resolvePixelRatio();
  const width = Math.max(Math.round(cssWidth * ratio), 1);
  const height = Math.max(Math.round(cssHeight * ratio), 1);

  // The backing store changes only when the actual viewport changes. Camera
  // motion never resizes the canvas or swaps render quality.
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  gl.viewport(0, 0, width, height);
  gl.disable(gl.BLEND);
  gl.useProgram(renderer.panoramaProgram);
  gl.bindBuffer(gl.ARRAY_BUFFER, renderer.panoramaBuffer);
  gl.enableVertexAttribArray(renderer.panoramaPosition);
  gl.vertexAttribPointer(renderer.panoramaPosition, 2, gl.FLOAT, false, 0, 0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, renderer.texture);
  gl.uniform1f(renderer.yaw, camera.yaw);
  gl.uniform1f(renderer.pitch, camera.pitch);
  gl.uniform1f(renderer.fov, camera.fov);
  gl.uniform1f(renderer.aspect, width / height);
  gl.uniform1f(renderer.exposure, exposure);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // Marker projection and marker paint happen before this same frame returns.
  drawMarkers(renderer, camera, markers, width, height, ratio);
}

const EquirectangularViewport = forwardRef<EquirectangularViewportHandle, Props>(
  function EquirectangularViewport(
    { src, yaw, pitch, fov, className = "", ariaHidden = true, exposure = 1, markers = [] },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<Renderer | null>(null);
    const cameraRef = useRef<PanoramaCamera>({ yaw, pitch, fov });
    const exposureRef = useRef(exposure);
    const markersRef = useRef<PanoramaMarker[]>(markers);
    const propCameraRef = useRef<PanoramaCamera>({ yaw, pitch, fov });
    const [fallback, setFallback] = useState(false);

    propCameraRef.current = { yaw, pitch, fov };
    exposureRef.current = exposure;
    markersRef.current = markers;

    const renderNow = (camera: PanoramaCamera) => {
      cameraRef.current = camera;
      const canvas = canvasRef.current;
      const renderer = rendererRef.current;
      if (!canvas || !renderer) return;
      draw(renderer, canvas, camera, exposureRef.current, markersRef.current);
    };

    useImperativeHandle(ref, () => ({
      renderCamera(camera) {
        renderNow(camera);
      },
      settle(camera) {
        if (camera) cameraRef.current = camera;
        const canvas = canvasRef.current;
        const renderer = rendererRef.current;
        if (!canvas || !renderer) return;
        draw(renderer, canvas, cameraRef.current, exposureRef.current, markersRef.current);
      },
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      setFallback(false);
      let renderer: Renderer | null = null;

      try {
        renderer = createRenderer(canvas);
        rendererRef.current = renderer;

        renderer.image.decoding = "async";
        renderer.image.onload = () => {
          const active = rendererRef.current;
          const currentCanvas = canvasRef.current;
          if (!active || !currentCanvas) return;
          uploadTexture(active);
          draw(active, currentCanvas, cameraRef.current, exposureRef.current, markersRef.current);
        };
        renderer.image.onerror = () => setFallback(true);
        renderer.image.src = src;

        draw(renderer, canvas, cameraRef.current, exposureRef.current, markersRef.current);
      } catch {
        setFallback(true);
      }

      const observer = new ResizeObserver(() => {
        const active = rendererRef.current;
        const currentCanvas = canvasRef.current;
        if (!active || !currentCanvas) return;
        draw(active, currentCanvas, cameraRef.current, exposureRef.current, markersRef.current);
      });
      observer.observe(canvas);

      const onContextLost = (event: Event) => {
        event.preventDefault();
        setFallback(true);
      };
      canvas.addEventListener("webglcontextlost", onContextLost);

      return () => {
        observer.disconnect();
        canvas.removeEventListener("webglcontextlost", onContextLost);
        const active = rendererRef.current;
        rendererRef.current = null;
        if (active) {
          active.image.onload = null;
          active.image.onerror = null;
          active.gl.deleteTexture(active.texture);
          active.gl.deleteBuffer(active.panoramaBuffer);
          active.gl.deleteBuffer(active.markerBuffer);
          active.gl.deleteProgram(active.panoramaProgram);
          active.gl.deleteProgram(active.markerProgram);
        }
      };
    }, [src]);

    // React owns settled camera state only. Active drag/zoom frames arrive via
    // the imperative handle, so a parent render cannot paint an older camera
    // over a newer GPU frame.
    useLayoutEffect(() => {
      const canvas = canvasRef.current;
      const renderer = rendererRef.current;
      if (!canvas || !renderer) return;
      cameraRef.current = propCameraRef.current;
      draw(renderer, canvas, cameraRef.current, exposureRef.current, markersRef.current);
    }, [yaw, pitch, fov, exposure]);

    useLayoutEffect(() => {
      const canvas = canvasRef.current;
      const renderer = rendererRef.current;
      if (!canvas || !renderer) return;
      draw(renderer, canvas, cameraRef.current, exposureRef.current, markersRef.current);
    }, [markers]);

    if (fallback) {
      return (
        <div
          className={`true360-fallback ${className}`}
          aria-hidden={ariaHidden}
          style={{ backgroundImage: `url(${src})` }}
        />
      );
    }

    return <canvas ref={canvasRef} className={`true360-canvas ${className}`} aria-hidden={ariaHidden} />;
  },
);

export default EquirectangularViewport;
