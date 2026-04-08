'use client';
import { useNavigate } from 'react-router-dom';
import { useClerk, useAuth } from '@clerk/react';
import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';
import ScrollVelocity from './ScrollVelocity';
import Lenis from '@studio-freight/lenis';
import ScrollReveal from './ScrollTrigger';
import { useEffect, useRef, useState, useCallback } from 'react';



const metallicVertexShader = `#version 300 es
precision highp float;
in vec2 a_position;
out vec2 vP;
void main(){vP=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;

const metallicFragmentShader = `#version 300 es
precision highp float;
in vec2 vP;
out vec4 oC;
uniform sampler2D u_tex;
uniform float u_time,u_ratio,u_imgRatio,u_seed,u_scale,u_refract,u_blur,u_liquid;
uniform float u_bright,u_contrast,u_angle,u_fresnel,u_sharp,u_wave,u_noise,u_chroma;
uniform float u_distort,u_contour;
uniform vec3 u_lightColor,u_darkColor,u_tint;

vec3 sC,sM;

vec3 pW(vec3 v){
  vec3 i=floor(v),f=fract(v),s=sign(fract(v*.5)-.5),h=fract(sM*i+i.yzx),c=f*(f-1.);
  return s*c*((h*16.-4.)*c-1.);
}

vec3 aF(vec3 b,vec3 c){return pW(b+c.zxy-pW(b.zxy+c.yzx)+pW(b.yzx+c.xyz));}
vec3 lM(vec3 s,vec3 p){return(p+aF(s,p))*.5;}

vec2 fA(){
  vec2 c=vP-.5;
  c.x*=u_ratio>u_imgRatio?u_ratio/u_imgRatio:1.;
  c.y*=u_ratio>u_imgRatio?1.:u_imgRatio/u_ratio;
  return vec2(c.x+.5,.5-c.y);
}

vec2 rot(vec2 p,float r){float c=cos(r),s=sin(r);return vec2(p.x*c+p.y*s,p.y*c-p.x*s);}

float bM(vec2 c,float t){
  vec2 l=smoothstep(vec2(0.),vec2(t),c),u=smoothstep(vec2(0.),vec2(t),1.-c);
  return l.x*l.y*u.x*u.y;
}

float mG(float hi,float lo,float t,float sh,float cv){
  sh*=(2.-u_sharp);
  float ci=smoothstep(.15,.85,cv),r=lo;
  float e1=.08/u_scale;
  r=mix(r,hi,smoothstep(0.,sh*1.5,t));
  r=mix(r,lo,smoothstep(e1-sh,e1+sh,t));
  float e2=e1+.05/u_scale*(1.-ci*.35);
  r=mix(r,hi,smoothstep(e2-sh,e2+sh,t));
  float e3=e2+.025/u_scale*(1.-ci*.45);
  r=mix(r,lo,smoothstep(e3-sh,e3+sh,t));
  float e4=e1+.1/u_scale;
  r=mix(r,hi,smoothstep(e4-sh,e4+sh,t));
  float rm=1.-e4,gT=clamp((t-e4)/rm,0.,1.);
  r=mix(r,mix(hi,lo,smoothstep(0.,1.,gT)),smoothstep(e4-sh*.5,e4+sh*.5,t));
  return r;
}

void main(){
  sC=fract(vec3(.7548,.5698,.4154)*(u_seed+17.31))+.5;
  sM=fract(sC.zxy-sC.yzx*1.618);
  vec2 sc=vec2(vP.x*u_ratio,1.-vP.y);
  float angleRad=u_angle*3.14159/180.;
  sc=rot(sc-.5,angleRad)+.5;
  sc=clamp(sc,0.,1.);
  float sl=sc.x-sc.y,an=u_time*.001;
  vec2 iC=fA();
  vec4 texSample=texture(u_tex,iC);
  float dp=texSample.r;
  float shapeMask=texSample.a;
  vec3 hi=u_lightColor*u_bright;
  vec3 lo=u_darkColor*(2.-u_bright);
  lo.b+=smoothstep(.6,1.4,sc.x+sc.y)*.08;
  vec2 fC=sc-.5;
  float rd=length(fC+vec2(0.,sl*.15));
  vec2 ag=rot(fC,(.22-sl*.18)*3.14159);
  float cv=1.-pow(rd*1.65,1.15);
  cv*=pow(sc.y,.35);
  float vs=shapeMask;
  vs*=bM(iC,.01);
  float fr=pow(1.-cv,u_fresnel)*.3;
  vs=min(vs+fr*vs,1.);
  float mT=an*.0625;
  vec3 wO=vec3(-1.05,1.35,1.55);
  vec3 wA=aF(vec3(31.,73.,56.),mT+wO)*.22*u_wave;
  vec3 wB=aF(vec3(24.,64.,42.),mT-wO.yzx)*.22*u_wave;
  vec2 nC=sc*45.*u_noise;
  nC+=aF(sC.zxy,an*.17*sC.yzx-sc.yxy*.35).xy*18.*u_wave;
  vec3 tC=vec3(.00041,.00053,.00076)*mT+wB*nC.x+wA*nC.y;
  tC=lM(sC,tC);
  tC=lM(sC+1.618,tC);
  float tb=sin(tC.x*3.14159)*.5+.5;
  tb=tb*2.-1.;
  float noiseVal=pW(vec3(sc*8.+an,an*.5)).x;
  float edgeFactor=smoothstep(0.,.5,dp)*smoothstep(1.,.5,dp);
  float lD=dp+(1.-dp)*u_liquid*tb;
  lD+=noiseVal*u_distort*.15*edgeFactor;
  float rB=clamp(1.-cv,0.,1.);
  float fl=ag.x+sl;
  fl+=noiseVal*sl*u_distort*edgeFactor;
  fl*=mix(1.,1.-dp*.5,u_contour);
  fl-=dp*u_contour*.8;
  float eI=smoothstep(0.,1.,lD)*smoothstep(1.,0.,lD);
  fl-=tb*sl*1.8*eI;
  float cA=cv*clamp(pow(sc.y,.12),.25,1.);
  fl*=.12+(1.05-lD)*cA;
  fl*=smoothstep(1.,.65,lD);
  float vA1=smoothstep(.08,.18,sc.y)*smoothstep(.38,.18,sc.y);
  float vA2=smoothstep(.08,.18,1.-sc.y)*smoothstep(.38,.18,1.-sc.y);
  fl+=vA1*.16+vA2*.025;
  fl*=.45+pow(sc.y,2.)*.55;
  fl*=u_scale;
  fl-=an;
  float rO=rB+cv*tb*.025;
  float vM1=smoothstep(-.12,.18,sc.y)*smoothstep(.48,.08,sc.y);
  float cM1=smoothstep(.35,.55,cv)*smoothstep(.95,.35,cv);
  rO+=vM1*cM1*4.5;
  rO-=sl;
  float bO=rB*1.25;
  float vM2=smoothstep(-.02,.35,sc.y)*smoothstep(.75,.08,sc.y);
  float cM2=smoothstep(.35,.55,cv)*smoothstep(.75,.35,cv);
  bO+=vM2*cM2*.9;
  bO-=lD*.18;
  rO*=u_refract*u_chroma;
  bO*=u_refract*u_chroma;
  float sf=u_blur;
  float rP=fract(fl+rO);
  float rC=mG(hi.r,lo.r,rP,sf+.018+u_refract*cv*.025,cv);
  float gP=fract(fl);
  float gC=mG(hi.g,lo.g,gP,sf+.008/max(.01,1.-sl),cv);
  float bP=fract(fl-bO);
  float bC=mG(hi.b,lo.b,bP,sf+.008,cv);
  vec3 col=vec3(rC,gC,bC);
  col=(col-.5)*u_contrast+.5;
  col=clamp(col,0.,1.);
  col=mix(col,1.-min(vec3(1.),(1.-col)/max(u_tint,vec3(.001))),length(u_tint-1.)*.5);
  col=clamp(col,0.,1.);
  oC=vec4(col*vs,vs);
}`;

function processImage(img) {
  const MAX_SIZE = 1000;
  const MIN_SIZE = 500;
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (width > MAX_SIZE || height > MAX_SIZE || width < MIN_SIZE || height < MIN_SIZE) {
    const scale =
      width > height
        ? width > MAX_SIZE
          ? MAX_SIZE / width
          : width < MIN_SIZE
            ? MIN_SIZE / width
            : 1
        : height > MAX_SIZE
          ? MAX_SIZE / height
          : height < MIN_SIZE
            ? MIN_SIZE / height
            : 1;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const size = width * height;
  const alphaValues = new Float32Array(size);
  const shapeMask = new Uint8Array(size);
  const boundaryMask = new Uint8Array(size);

  for (let i = 0; i < size; i++) {
    const idx = i * 4;
    const a = data[idx + 3];
    const isBackground = a < 5; // Only use alpha to determine background so white text works
    alphaValues[i] = isBackground ? 0 : a / 255;
    shapeMask[i] = alphaValues[i] > 0.1 ? 1 : 0;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (!shapeMask[idx]) continue;
      if (
        x === 0 ||
        x === width - 1 ||
        y === 0 ||
        y === height - 1 ||
        !shapeMask[idx - 1] ||
        !shapeMask[idx + 1] ||
        !shapeMask[idx - width] ||
        !shapeMask[idx + width]
      ) {
        boundaryMask[idx] = 1;
      }
    }
  }

  const u = new Float32Array(size);
  const ITERATIONS = 200;
  const C = 0.01;
  const omega = 1.85;

  for (let iter = 0; iter < ITERATIONS; iter++) {
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (!shapeMask[idx] || boundaryMask[idx]) continue;
        const sum =
          (shapeMask[idx + 1] ? u[idx + 1] : 0) +
          (shapeMask[idx - 1] ? u[idx - 1] : 0) +
          (shapeMask[idx + width] ? u[idx + width] : 0) +
          (shapeMask[idx - width] ? u[idx - width] : 0);
        const newVal = (C + sum) / 4;
        u[idx] = omega * newVal + (1 - omega) * u[idx];
      }
    }
  }

  let maxVal = 0;
  for (let i = 0; i < size; i++) if (u[i] > maxVal) maxVal = u[i];
  if (maxVal === 0) maxVal = 1;

  const outData = ctx.createImageData(width, height);
  for (let i = 0; i < size; i++) {
    const px = i * 4;
    const depth = u[i] / maxVal;
    const gray = Math.round(255 * (1 - depth * depth));
    outData.data[px] = outData.data[px + 1] = outData.data[px + 2] = gray;
    outData.data[px + 3] = Math.round(alphaValues[i] * 255);
  }

  return outData;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255]
    : [1, 1, 1];
}

export function MetallicPaint({
  imageSrc,
  seed = 42,
  scale = 4,
  refraction = 0.01,
  blur = 0.015,
  liquid = 0.75,
  speed = 0.3,
  brightness = 2,
  contrast = 0.5,
  angle = 0,
  fresnel = 1,
  lightColor = '#ffffff',
  darkColor = '#000000',
  patternSharpness = 1,
  waveAmplitude = 1,
  noiseScale = 0.5,
  chromaticSpread = 2,
  mouseAnimation = false,
  distortion = 1,
  contour = 0.2,
  tintColor = '#feb3ff'
}) {
  const canvasRef = useRef(null);
  const glRef = useRef(null);
  const programRef = useRef(null);
  const uniformsRef = useRef({});
  const textureRef = useRef(null);
  const animTimeRef = useRef(0);
  const lastTimeRef = useRef(0);
  const rafRef = useRef(null);
  const imgDataRef = useRef(null);
  const speedRef = useRef(speed);
  const mouseRef = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });
  const mouseAnimRef = useRef(mouseAnimation);

  const [ready, setReady] = useState(false);
  const [textureReady, setTextureReady] = useState(false);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    mouseAnimRef.current = mouseAnimation;
  }, [mouseAnimation]);

  const initGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const gl = canvas.getContext('webgl2', { antialias: true, alpha: true });
    if (!gl) return false;

    const compile = (src, type) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };

    const vs = compile(metallicVertexShader, gl.VERTEX_SHADER);
    const fs = compile(metallicFragmentShader, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return false;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      return false;
    }

    const uniforms = {};
    const count = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const info = gl.getActiveUniform(prog, i);
      if (info) uniforms[info.name] = gl.getUniformLocation(prog, info.name);
    }

    const verts = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    gl.useProgram(prog);
    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    glRef.current = gl;
    programRef.current = prog;
    uniformsRef.current = uniforms;

    return true;
  }, []);

  const uploadTexture = useCallback(imgData => {
    const gl = glRef.current;
    const uniforms = uniformsRef.current;
    if (!gl || !imgData) return;

    if (textureRef.current) gl.deleteTexture(textureRef.current);

    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, imgData.width, imgData.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, imgData.data);
    gl.uniform1i(uniforms.u_tex, 0);

    const ratio = imgData.width / imgData.height;
    gl.uniform1f(uniforms.u_imgRatio, ratio);
    gl.uniform1f(uniforms.u_ratio, 1);

    textureRef.current = tex;
    imgDataRef.current = imgData;
  }, []);

  useEffect(() => {
    if (!initGL()) return;

    const canvas = canvasRef.current;
    const gl = glRef.current;
    const side = 1000 * devicePixelRatio;
    canvas.width = side;
    canvas.height = side;
    gl.viewport(0, 0, side, side);

    setReady(true);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (textureRef.current && glRef.current) {
        glRef.current.deleteTexture(textureRef.current);
      }
    };
  }, [initGL]);

  useEffect(() => {
    if (!ready || !imageSrc) return;

    setTextureReady(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const imgData = processImage(img);
      uploadTexture(imgData);
      setTextureReady(true);
    };
    img.src = imageSrc;
  }, [ready, imageSrc, uploadTexture]);

  useEffect(() => {
    const gl = glRef.current;
    const u = uniformsRef.current;
    if (!gl || !ready) return;

    gl.uniform1f(u.u_seed, seed);
    gl.uniform1f(u.u_scale, scale);
    gl.uniform1f(u.u_refract, refraction);
    gl.uniform1f(u.u_blur, blur);
    gl.uniform1f(u.u_liquid, liquid);
    gl.uniform1f(u.u_bright, brightness);
    gl.uniform1f(u.u_contrast, contrast);
    gl.uniform1f(u.u_angle, angle);
    gl.uniform1f(u.u_fresnel, fresnel);

    const light = hexToRgb(lightColor);
    const dark = hexToRgb(darkColor);
    const tint = hexToRgb(tintColor);
    gl.uniform3f(u.u_lightColor, light[0], light[1], light[2]);
    gl.uniform3f(u.u_darkColor, dark[0], dark[1], dark[2]);
    gl.uniform1f(u.u_sharp, patternSharpness);
    gl.uniform1f(u.u_wave, waveAmplitude);
    gl.uniform1f(u.u_noise, noiseScale);
    gl.uniform1f(u.u_chroma, chromaticSpread);
    gl.uniform1f(u.u_distort, distortion);
    gl.uniform1f(u.u_contour, contour);
    gl.uniform3f(u.u_tint, tint[0], tint[1], tint[2]);
  }, [
    ready,
    seed,
    scale,
    refraction,
    blur,
    liquid,
    brightness,
    contrast,
    angle,
    fresnel,
    lightColor,
    darkColor,
    patternSharpness,
    waveAmplitude,
    noiseScale,
    chromaticSpread,
    distortion,
    contour,
    tintColor
  ]);

  useEffect(() => {
    if (!ready || !textureReady) return;

    const gl = glRef.current;
    const u = uniformsRef.current;
    const canvas = canvasRef.current;
    const mouse = mouseRef.current;

    const handleMouseMove = e => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = (e.clientX - rect.left) / rect.width;
      mouse.targetY = (e.clientY - rect.top) / rect.height;
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    const render = time => {
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      if (mouseAnimRef.current) {
        mouse.x += (mouse.targetX - mouse.x) * 0.08;
        mouse.y += (mouse.targetY - mouse.y) * 0.08;
        animTimeRef.current = mouse.x * 3000 + mouse.y * 1500;
      } else {
        animTimeRef.current += delta * speedRef.current;
      }

      gl.uniform1f(u.u_time, animTimeRef.current);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(render);
    };

    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(render);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [ready, textureReady]);

  return <canvas ref={canvasRef} className="block h-full w-full object-contain" />;
}



const galaxyVertexShader = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const galaxyFragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform vec2 uFocal;
uniform vec2 uRotation;
uniform float uStarSpeed;
uniform float uDensity;
uniform float uHueShift;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uGlowIntensity;
uniform float uSaturation;
uniform bool uMouseRepulsion;
uniform float uTwinkleIntensity;
uniform float uRotationSpeed;
uniform float uRepulsionStrength;
uniform float uMouseActiveFactor;
uniform float uAutoCenterRepulsion;
uniform bool uTransparent;

varying vec2 vUv;

#define NUM_LAYER 4.0
#define STAR_COLOR_CUTOFF 0.2
#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)
#define PERIOD 3.0

float Hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float tri(float x) {
  return abs(fract(x) * 2.0 - 1.0);
}

float tris(float x) {
  float t = fract(x);
  return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0));
}

float trisn(float x) {
  float t = fract(x);
  return 2.0 * (1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0))) - 1.0;
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float Star(vec2 uv, float flare) {
  float d = length(uv);
  float m = (0.05 * uGlowIntensity) / d;
  float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * flare * uGlowIntensity;
  uv *= MAT45;
  rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * 0.3 * flare * uGlowIntensity;
  m *= smoothstep(1.0, 0.2, d);
  return m;
}

vec3 StarLayer(vec2 uv) {
  vec3 col = vec3(0.0);

  vec2 gv = fract(uv) - 0.5; 
  vec2 id = floor(uv);

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 si = id + vec2(float(x), float(y));
      float seed = Hash21(si);
      float size = fract(seed * 345.32);
      float glossLocal = tri(uStarSpeed / (PERIOD * seed + 1.0));
      float flareSize = smoothstep(0.9, 1.0, size) * glossLocal;

      float red = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 1.0)) + STAR_COLOR_CUTOFF;
      float blu = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 3.0)) + STAR_COLOR_CUTOFF;
      float grn = min(red, blu) * seed;
      vec3 base = vec3(red, grn, blu);
      
      float hue = atan(base.g - base.r, base.b - base.r) / (2.0 * 3.14159) + 0.5;
      hue = fract(hue + uHueShift / 360.0);
      float sat = length(base - vec3(dot(base, vec3(0.299, 0.587, 0.114)))) * uSaturation;
      float val = max(max(base.r, base.g), base.b);
      base = hsv2rgb(vec3(hue, sat, val));

      vec2 pad = vec2(tris(seed * 34.0 + uTime * uSpeed / 10.0), tris(seed * 38.0 + uTime * uSpeed / 30.0)) - 0.5;

      float star = Star(gv - offset - pad, flareSize);
      vec3 color = base;

      float twinkle = trisn(uTime * uSpeed + seed * 6.2831) * 0.5 + 1.0;
      twinkle = mix(1.0, twinkle, uTwinkleIntensity);
      star *= twinkle;
      
      col += star * size * color;
    }
  }

  return col;
}

void main() {
  vec2 focalPx = uFocal * uResolution.xy;
  vec2 uv = (vUv * uResolution.xy - focalPx) / uResolution.y;

  vec2 mouseNorm = uMouse - vec2(0.5);
  
  if (uAutoCenterRepulsion > 0.0) {
    vec2 centerUV = vec2(0.0, 0.0);
    float centerDist = length(uv - centerUV);
    vec2 repulsion = normalize(uv - centerUV) * (uAutoCenterRepulsion / (centerDist + 0.1));
    uv += repulsion * 0.05;
  } else if (uMouseRepulsion) {
    vec2 mousePosUV = (uMouse * uResolution.xy - focalPx) / uResolution.y;
    float mouseDist = length(uv - mousePosUV);
    vec2 repulsion = normalize(uv - mousePosUV) * (uRepulsionStrength / (mouseDist + 0.1));
    uv += repulsion * 0.05 * uMouseActiveFactor;
  } else {
    vec2 mouseOffset = mouseNorm * 0.1 * uMouseActiveFactor;
    uv += mouseOffset;
  }

  float autoRotAngle = uTime * uRotationSpeed;
  mat2 autoRot = mat2(cos(autoRotAngle), -sin(autoRotAngle), sin(autoRotAngle), cos(autoRotAngle));
  uv = autoRot * uv;

  uv = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * uv;

  vec3 col = vec3(0.0);

  for (float i = 0.0; i < 1.0; i += 1.0 / NUM_LAYER) {
    float depth = fract(i + uStarSpeed * uSpeed);
    float scale = mix(20.0 * uDensity, 0.5 * uDensity, depth);
    float fade = depth * smoothstep(1.0, 0.9, depth);
    col += StarLayer(uv * scale + i * 453.32) * fade;
  }

  if (uTransparent) {
    float alpha = length(col);
    alpha = smoothstep(0.0, 0.3, alpha);
    alpha = min(alpha, 1.0);
    gl_FragColor = vec4(col, alpha);
  } else {
    gl_FragColor = vec4(col, 1.0);
  }
}
`;

function Galaxy({
  focal = [0.5, 0.5],
  rotation = [1.0, 0.0],
  starSpeed = 0.5,
  density = 1,
  hueShift = 140,
  disableAnimation = false,
  speed = 1.0,
  mouseInteraction = true,
  glowIntensity = 0.3,
  saturation = 0.0,
  mouseRepulsion = true,
  repulsionStrength = 2,
  twinkleIntensity = 0.3,
  rotationSpeed = 0.1,
  autoCenterRepulsion = 0,
  transparent = true,
  ...rest
}) {
  const ctnDom = useRef(null);
  const targetMousePos = useRef({ x: 0.5, y: 0.5 });
  const smoothMousePos = useRef({ x: 0.5, y: 0.5 });
  const targetMouseActive = useRef(0.0);
  const smoothMouseActive = useRef(0.0);

  useEffect(() => {
    if (!ctnDom.current) return;
    const ctn = ctnDom.current;
    const renderer = new Renderer({
      alpha: transparent,
      premultipliedAlpha: false
    });
    const gl = renderer.gl;

    if (transparent) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
    } else {
      gl.clearColor(0, 0, 0, 1);
    }

    let program;

    function resize() {
      const scale = 1;
      renderer.setSize(ctn.offsetWidth * scale, ctn.offsetHeight * scale);
      if (program) {
        program.uniforms.uResolution.value = new Color(
          gl.canvas.width,
          gl.canvas.height,
          gl.canvas.width / gl.canvas.height
        );
      }
    }
    window.addEventListener('resize', resize, false);
    resize();

    const geometry = new Triangle(gl);
    program = new Program(gl, {
      vertex: galaxyVertexShader,
      fragment: galaxyFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: {
          value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height)
        },
        uFocal: { value: new Float32Array(focal) },
        uRotation: { value: new Float32Array(rotation) },
        uStarSpeed: { value: starSpeed },
        uDensity: { value: density },
        uHueShift: { value: hueShift },
        uSpeed: { value: speed },
        uMouse: {
          value: new Float32Array([smoothMousePos.current.x, smoothMousePos.current.y])
        },
        uGlowIntensity: { value: glowIntensity },
        uSaturation: { value: saturation },
        uMouseRepulsion: { value: mouseRepulsion },
        uTwinkleIntensity: { value: twinkleIntensity },
        uRotationSpeed: { value: rotationSpeed },
        uRepulsionStrength: { value: repulsionStrength },
        uMouseActiveFactor: { value: 0.0 },
        uAutoCenterRepulsion: { value: autoCenterRepulsion },
        uTransparent: { value: transparent }
      }
    });

    const mesh = new Mesh(gl, { geometry, program });
    let animateId;

    function update(t) {
      animateId = requestAnimationFrame(update);
      if (!disableAnimation) {
        program.uniforms.uTime.value = t * 0.001;
        program.uniforms.uStarSpeed.value = (t * 0.001 * starSpeed) / 10.0;
      }

      const lerpFactor = 0.05;
      smoothMousePos.current.x += (targetMousePos.current.x - smoothMousePos.current.x) * lerpFactor;
      smoothMousePos.current.y += (targetMousePos.current.y - smoothMousePos.current.y) * lerpFactor;

      smoothMouseActive.current += (targetMouseActive.current - smoothMouseActive.current) * lerpFactor;

      program.uniforms.uMouse.value[0] = smoothMousePos.current.x;
      program.uniforms.uMouse.value[1] = smoothMousePos.current.y;
      program.uniforms.uMouseActiveFactor.value = smoothMouseActive.current;

      renderer.render({ scene: mesh });
    }
    animateId = requestAnimationFrame(update);
    ctn.appendChild(gl.canvas);

    function handleMouseMove(e) {
      const rect = ctn.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height;
      targetMousePos.current = { x, y };
      targetMouseActive.current = 1.0;
    }

    function handleMouseLeave() {
      targetMouseActive.current = 0.0;
    }

    if (mouseInteraction) {
      ctn.addEventListener('mousemove', handleMouseMove);
      ctn.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      cancelAnimationFrame(animateId);
      window.removeEventListener('resize', resize);
      if (mouseInteraction) {
        ctn.removeEventListener('mousemove', handleMouseMove);
        ctn.removeEventListener('mouseleave', handleMouseLeave);
      }
      ctn.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [
    focal,
    rotation,
    starSpeed,
    density,
    hueShift,
    disableAnimation,
    speed,
    mouseInteraction,
    glowIntensity,
    saturation,
    mouseRepulsion,
    twinkleIntensity,
    rotationSpeed,
    repulsionStrength,
    autoCenterRepulsion,
    transparent
  ]);

  return <div ref={ctnDom} className="w-full h-full relative" {...rest} />;
}


function Home() {
  const navigate = useNavigate();
  const { openSignIn, openSignUp } = useClerk();
  const { isLoaded, isSignedIn } = useAuth();
  const mainRef = useRef(null);
  const [revealedCards, setRevealedCards] = useState({});
  const storyCards = [
    {
      id: 'focus',
      tag: '01. Morning Intent',
      title: 'Begin With A Clear Signal',
      copy: 'Set your first intention before noise arrives. One tiny plan creates momentum for everything that follows.',
      accent: '#88a6ff',
      accentSoft: 'rgba(136,166,255,0.28)',
    },
    {
      id: 'flow',
      tag: '02. Protected Focus',
      title: 'Design Hours For Deep Work',
      copy: 'Shape your day in blocks. NAPLET keeps distractions low and your attention where it matters.',
      accent: '#63d1ff',
      accentSoft: 'rgba(99,209,255,0.26)',
    },
    {
      id: 'reflect',
      tag: '03. Evening Reflection',
      title: 'Close The Day With Clarity',
      copy: 'Track wins, mood, and energy in one place so tomorrow starts sharper than today.',
      accent: '#9da8ff',
      accentSoft: 'rgba(157,168,255,0.24)',
    },
  ];

  useEffect(() => {
  const lenis = new Lenis({
    duration: 1.2,
    smooth: true,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);

  return () => lenis.destroy();
}, []);

  useEffect(() => {
    const rootEl = mainRef.current;
    if (!rootEl) return;

    const cards = rootEl.querySelectorAll('[data-story-card]');
    if (!cards.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const cardId = entry.target.getAttribute('data-story-card');
          if (!cardId) return;
          setRevealedCards((prev) => ({ ...prev, [cardId]: entry.isIntersecting }));
        });
      },
      { root: rootEl, threshold: 0.28, rootMargin: '-5% 0px -10% 0px' }
    );

    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return (
   <main
  ref={mainRef}
  className="relative w-full min-h-screen overflow-x-hidden overflow-y-auto bg-[#03070f] text-white"
>
      <div className="fixed inset-0 z-0 scale-[1.2]">
        <Galaxy speed={1.2} />
      </div>

      {/* TOP BAR */}
      <header className="pointer-events-none absolute left-0 top-0 z-20 flex w-full items-center justify-between px-4 py-4 sm:px-8 sm:py-6">
        <div
          className="pointer-events-auto inline-flex items-center gap-3 rounded-2xl border border-white/15 px-3 py-2 backdrop-blur-xl"
          style={{
            backgroundImage:
              'linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.01) 100%)',
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.22), 0 10px 24px rgba(0,0,0,0.3)',
          }}
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/30 text-sm text-zinc-100"
            style={{
              fontFamily: "var(--font-logo)",
              fontWeight: 800,
              backgroundImage:
                'linear-gradient(160deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.08) 42%, rgba(0,0,0,0.14) 100%)',
            }}
          >
            N
          </div>
          <div className="text-left leading-tight">
            <p
              className="text-xs tracking-[0.22em] text-zinc-100"
              style={{ fontFamily: "var(--font-logo)", fontWeight: 700 }}
            >
              NAPLET
            </p>
            <p
              className="text-[10px] uppercase tracking-[0.18em] text-zinc-400"
              style={{ fontFamily: "var(--font-ui)", fontWeight: 600 }}
            >
              Intentional OS
            </p>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => {
              if (isLoaded && isSignedIn) {
                navigate('/dashboard');
                return;
              }
              if (openSignIn) {
                openSignIn({ fallbackRedirectUrl: '/dashboard' });
                return;
              }
              navigate('/login');
            }}
            className="rounded-xl border border-white/25 bg-white/5 px-5 py-2.5 text-[11px] tracking-[0.2em] text-zinc-100 backdrop-blur-xl transition-all duration-300 hover:scale-[1.03] hover:border-white/55 hover:bg-white/15"
            style={{
              fontFamily: "var(--font-ui)",
              fontWeight: 700,
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.2), 0 6px 14px rgba(0,0,0,0.3)',
            }}
          >
            LOGIN
          </button>
          <button
            onClick={() => {
              if (isLoaded && isSignedIn) {
                navigate('/dashboard');
                return;
              }
              if (openSignUp) {
                openSignUp({ fallbackRedirectUrl: '/dashboard' });
                return;
              }
              navigate('/signup');
            }}
            className="rounded-xl border border-white/25 bg-white/5 px-5 py-2.5 text-[11px] tracking-[0.2em] text-zinc-100 backdrop-blur-xl transition-all duration-300 hover:scale-[1.03] hover:border-white/55 hover:bg-white/15"
            style={{
              fontFamily: "var(--font-ui)",
              fontWeight: 700,
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.2), 0 6px 14px rgba(0,0,0,0.3)',
            }}
          >
            SIGN UP
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <div className="pointer-events-none relative z-10 flex min-h-[240vh] flex-col items-center px-4 text-center sm:px-6">
        <div aria-hidden="true" className="h-[15vh] sm:h-[20vh] w-full" />
        <div className="flex min-h-screen w-full flex-col items-center justify-start pb-12 pt-2">
        <div className="flex w-full flex-col items-center text-center -translate-y-6 sm:-translate-y-10">
        {/* TITLE */}
        <div 
          className="relative flex items-center justify-center w-full max-w-[1500px] mx-auto"
          style={{ height: '62vh', minHeight: '350px', maxHeight: '700px' }}
        >
          <h1
            className="group relative cursor-default text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-[0.3em] leading-none transition-transform duration-500 ease-out hover:scale-[1.02]"
            style={{ fontFamily: 'var(--font-logo)', transform: 'perspective(1100px) rotateX(5deg)' }}
          >
            <span aria-hidden="true" className="absolute inset-0 translate-x-[2px] translate-y-[3px] text-[#0d2554] opacity-80 transition-all duration-500 group-hover:translate-x-[3px] group-hover:translate-y-[4px]">NAPLET</span>
            <span aria-hidden="true" className="absolute inset-0 translate-x-[4px] translate-y-[6px] text-[#1d4fa6] opacity-65 transition-all duration-500 group-hover:translate-x-[6px] group-hover:translate-y-[8px]">NAPLET</span>
            <span aria-hidden="true" className="absolute inset-0 text-[#9ac8ff] opacity-55 blur-[10px] transition-all duration-500 group-hover:opacity-75 group-hover:blur-[14px]">NAPLET</span>
            <span aria-hidden="true" className="absolute inset-0 text-[#3b82f6] opacity-30 blur-[22px] transition-all duration-500 group-hover:opacity-50 group-hover:blur-[30px]">NAPLET</span>
            <span
              className="relative bg-gradient-to-b from-white via-[#e9f3ff] to-[#8fbfff] bg-clip-text text-transparent transition-all duration-500 group-hover:tracking-[0.31em]"
              style={{ textShadow: '0 12px 32px rgba(18, 60, 145, 0.38), 0 2px 10px rgba(192, 222, 255, 0.26)' }}
            >
              NAPLET
            </span>
          </h1>
        </div>

        {/* SUBTITLE & EVERYDAY */}
        <div className="flex flex-col items-center justify-center gap-6 mt-[-6vh]">
          <div className="text-center mt-6">
            <p
              className="text-[10px] md:text-[11px] uppercase tracking-[0.35em] text-zinc-400 drop-shadow-md"
              style={{ fontFamily: "var(--font-ui)", fontWeight: 600 }}
            >
              Built For Intentional Days
            </p>
            <p
              className="mt-2 text-xs md:text-sm tracking-[0.18em] text-zinc-300 drop-shadow-md"
              style={{ fontFamily: "var(--font-body)", fontWeight: 400 }}
            >
              Own your rhythm with <span className="font-semibold text-white tracking-[0.25em]">NAPLET</span>
            </p>
          </div>
          
          <div className="w-[100vw] relative left-1/2 -ml-[50vw]">
            <ScrollVelocity
              texts={[
                'Every Day • Every Day • Every Day • Every Day • Every Day • Every Day • Every Day • Every Day',
                'A Better Way • A Better Way • A Better Way • A Better Way • A Better Way • A Better Way • A Better Way'
              ]} 
              velocity={100}
              className="w-full overflow-hidden !font-[var(--font-ui)] !font-medium uppercase tracking-[0.35em] text-[#c7d4ff] opacity-50"
              scrollerClassName="!text-[12px] sm:!text-[13px] md:!text-[14px] !leading-[1.5] !drop-shadow-[0_2px_8px_rgba(128,170,255,0.2)]"
            />
          </div>
        </div>
        </div>
        <section className="pointer-events-auto relative z-20 mt-10 w-full max-w-6xl">
          <div className="mx-auto max-w-2xl">
            <ScrollReveal
              baseOpacity={0.15}
              enableBlur
              baseRotation={2}
              blurStrength={3}
              scrollContainerRef={mainRef}
              containerClassName="!m-0"
              textClassName="!text-[12px] sm:!text-[14px] !tracking-[0.16em] !uppercase !font-[var(--font-ui)] !text-zinc-300"
            >
              A Day In Three Frames
            </ScrollReveal>
          </div>

          <div className="mt-8 flex flex-col gap-6 md:gap-8">
            {storyCards.map((card, idx) => (
              <article
                key={card.id}
                data-story-card={card.id}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  e.currentTarget.style.setProperty('--mx', `${x}%`);
                  e.currentTarget.style.setProperty('--my', `${y}%`);
                }}
                className={`group relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/20 p-6 text-left backdrop-blur-2xl transition-all duration-700 md:p-7 ${
                  idx % 2 === 0 ? 'md:mr-auto' : 'md:ml-auto'
                } ${
                  revealedCards[card.id]
                    ? 'translate-y-0 scale-100 opacity-100'
                    : 'translate-y-8 scale-[0.985] opacity-0'
                }`}
                style={{
                  transitionDelay: `${idx * 120}ms`,
                  boxShadow:
                    'inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(255,255,255,0.08), 0 18px 38px rgba(0,0,0,0.34), 0 0 30px rgba(102,168,255,0.12)',
                  backgroundImage:
                    'linear-gradient(155deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 34%, rgba(255,255,255,0.01) 100%), repeating-linear-gradient(125deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, rgba(255,255,255,0.01) 1px, rgba(255,255,255,0.01) 5px)',
                  borderColor: card.accentSoft,
                }}
              >
                <div className="pointer-events-none absolute inset-0 bg-white/[0.03] opacity-70 mix-blend-screen" />
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(380px circle at var(--mx, 50%) var(--my, 50%), ${card.accentSoft} 0%, transparent 60%)`,
                  }}
                />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(170,205,255,0.26),transparent_38%),radial-gradient(circle_at_84%_82%,rgba(80,152,255,0.2),transparent_42%)] opacity-70 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="pointer-events-none absolute -right-14 -top-14 h-32 w-32 rounded-full bg-blue-300/20 blur-3xl transition-all duration-500 group-hover:scale-125 group-hover:opacity-90" />
                <p
                  className="relative text-[10px] uppercase tracking-[0.2em] text-zinc-300/85"
                  style={{ fontFamily: 'var(--font-ui)', fontWeight: 600 }}
                >
                  <span
                    className="mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle"
                    style={{ backgroundColor: card.accent, boxShadow: `0 0 14px ${card.accent}` }}
                  />
                  {card.tag}
                </p>
                <h3
                  className="relative mt-4 text-xl text-zinc-50 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-white"
                  style={{ fontFamily: 'var(--font-logo)', fontWeight: 700, lineHeight: 1.2 }}
                >
                  {card.title}
                </h3>
                <p
                  className="relative mt-4 text-sm leading-relaxed text-zinc-200/90 transition-colors duration-300 group-hover:text-zinc-100"
                  style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
                >
                  {card.copy}
                </p>
              </article>
            ))}
          </div>
        </section>
        <div aria-hidden="true" className="h-[40vh] w-full" />
      </div>
      </div>
      <style>{`
        @keyframes napletPulse {
          0%, 100% {
            transform: scale(1);
            filter: contrast(1.12) saturate(1.14) drop-shadow(0 0 10px rgba(93,152,255,0.24));
            text-shadow: 0 -1px 0 rgba(255,255,255,0.26), 0 1px 0 rgba(255,255,255,0.1), 0 3px 0 rgba(10,16,52,0.56), 0 10px 24px rgba(0,0,0,0.5), 0 0 14px rgba(96,130,255,0.22), 0 0 20px rgba(96,186,255,0.14);
          }
          50% {
            transform: scale(1.012);
            filter: contrast(1.15) saturate(1.2) drop-shadow(0 0 14px rgba(114,170,255,0.34));
            text-shadow: 0 -1px 0 rgba(255,255,255,0.28), 0 1px 0 rgba(255,255,255,0.12), 0 3px 0 rgba(10,16,52,0.56), 0 10px 24px rgba(0,0,0,0.5), 0 0 22px rgba(108,138,255,0.32), 0 0 34px rgba(106,202,255,0.26);
          }
        }
      `}</style>
    </main>
  );
}

export default Home;  
