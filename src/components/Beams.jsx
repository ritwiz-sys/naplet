import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';

// ── Vertex: fullscreen triangle passthrough ────────────────────────
const VERT = /* glsl */`
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

// ── Fragment: animated light-beam field ───────────────────────────
const FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;

uniform float uTime;
uniform vec2  uResolution;
uniform float uBeamWidth;
uniform float uBeamHeight;
uniform float uBeamNumber;
uniform vec3  uLightColor;
uniform float uSpeed;
uniform float uNoiseIntensity;
uniform float uScale;
uniform float uRotation;

/* ── Smooth value noise ── */
float hash(float p) {
  return fract(sin(p * 127.1 + p * 311.7) * 43758.5453);
}
float vnoise(float p) {
  float i = floor(p);
  float f = fract(p);
  float u = f * f * (3.0 - 2.0 * f);
  return mix(hash(i), hash(i + 1.0), u);
}

void main() {
  /* Aspect-corrected, centred UV */
  vec2 uv = vUv - 0.5;
  uv.x *= uResolution.x / uResolution.y;

  /* Rotation (degrees → radians) */
  float rad = uRotation * 0.017453293;
  float cosR = cos(rad), sinR = sin(rad);
  vec2 p = vec2(uv.x * cosR - uv.y * sinR,
                uv.x * sinR + uv.y * cosR);

  /* Scale: small scale → zoomed-in, beams fill more of screen */
  p /= max(uScale, 0.001);

  vec3 col = vec3(0.0);
  float t = uTime * uSpeed;

  /* Spread N beams evenly across horizontal range */
  float spread = 2.4; /* normalised half-width in p-space */

  for (int i = 0; i < 64; i++) {
    if (float(i) >= uBeamNumber) break;

    float fi   = float(i);
    float seed = fi * 1.61803 + 0.5;

    /* Base x position, spread evenly */
    float xBase = (fi / (uBeamNumber - 1.0) - 0.5) * spread * 2.0;

    /* Per-beam slow drift (smooth noise) */
    float driftT  = t * 0.18 + seed * 4.73;
    float drift   = (vnoise(driftT) - 0.5) * 2.0 * uNoiseIntensity * 0.35;
    float bx      = xBase + drift;

    /* Gaussian beam cross-section */
    float hw = uBeamWidth * 0.004;
    float dx = p.x - bx;
    float beam = exp(-(dx * dx) / (2.0 * hw * hw));

    /* Gaussian height envelope */
    float hh   = max(uBeamHeight * 0.07, 0.05);
    float henv = exp(-(p.y * p.y) / (2.0 * hh * hh));

    /* Flicker along beam length */
    float flicker = 0.55 + 0.45 * vnoise(fi * 5.31 + p.y * 1.8 + t * 1.4);

    /* Per-beam brightness variation */
    float brite = 0.35 + 0.65 * hash(seed * 2.93);

    col += uLightColor * beam * henv * flicker * brite;
  }

  /* Exposure / tone-map so bright stacks don't blow out */
  col = 1.0 - exp(-col * 1.8);

  /* Alpha = luminance so it composites nicely over dark bg */
  float alpha = clamp(col.r * 0.299 + col.g * 0.587 + col.b * 0.114, 0.0, 1.0);
  alpha = alpha * 0.92;

  gl_FragColor = vec4(col, alpha);
}
`;

// ── hex string → [r,g,b] 0-1 ──────────────────────────────────────
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

// ── Component ─────────────────────────────────────────────────────
export default function Beams({
  beamWidth      = 2,
  beamHeight     = 15,
  beamNumber     = 12,
  lightColor     = '#ffffff',
  speed          = 2,
  noiseIntensity = 1.75,
  scale          = 0.2,
  rotation       = 0,
  style          = {},
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /* ── OGL setup ── */
    const renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    /* Fit canvas to container */
    const canvas = gl.canvas;
    canvas.style.position = 'absolute';
    canvas.style.inset    = '0';
    canvas.style.width    = '100%';
    canvas.style.height   = '100%';
    container.appendChild(canvas);

    const resize = () => {
      renderer.setSize(container.clientWidth || window.innerWidth,
                       container.clientHeight || window.innerHeight);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    /* ── Shader program ── */
    const [lr, lg, lb] = hexToRgb(lightColor);
    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex:   VERT,
      fragment: FRAG,
      uniforms: {
        uTime:          { value: 0 },
        uResolution:    { value: [canvas.width, canvas.height] },
        uBeamWidth:     { value: beamWidth },
        uBeamHeight:    { value: beamHeight },
        uBeamNumber:    { value: beamNumber },
        uLightColor:    { value: [lr, lg, lb] },
        uSpeed:         { value: speed },
        uNoiseIntensity:{ value: noiseIntensity },
        uScale:         { value: scale },
        uRotation:      { value: rotation },
      },
      transparent: true,
    });

    const mesh = new Mesh(gl, { geometry, program });

    let rafId;
    const tick = (ts) => {
      rafId = requestAnimationFrame(tick);
      program.uniforms.uTime.value = ts * 0.001;
      program.uniforms.uResolution.value = [canvas.width, canvas.height];
      renderer.render({ scene: mesh });
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      if (container.contains(canvas)) container.removeChild(canvas);
      try { gl.getExtension('WEBGL_lose_context')?.loseContext(); } catch (_) {}
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beamWidth, beamHeight, beamNumber, lightColor, speed, noiseIntensity, scale, rotation]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
}
