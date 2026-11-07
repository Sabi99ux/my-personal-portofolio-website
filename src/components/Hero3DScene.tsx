'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { WEATHER_PRESETS, type TimePhase } from '@/lib/weatherPresets';

/* ═══════════════════════════ 2D value noise ═══════════════════════════
   Same integer-hash approach as ridge.ts, extended to two dimensions.  */

const hash2d = (ix: number, iy: number, seed: number): number => {
  let h = (ix * 374761393 + iy * 668265263 + seed * 1376312589) | 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const sm = (t: number) => t * t * (3 - 2 * t);

const noise2d = (x: number, y: number, seed: number): number => {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = sm(x - ix), fy = sm(y - iy);
  const a = hash2d(ix, iy, seed), b = hash2d(ix + 1, iy, seed);
  const c = hash2d(ix, iy + 1, seed), d = hash2d(ix + 1, iy + 1, seed);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
};

/** Fractal Brownian Motion — smooth rolling hills. */
const fbm = (x: number, y: number, seed: number, oct = 6): number => {
  let v = 0, a = 0.5, f = 1, m = 0;
  for (let i = 0; i < oct; i++) {
    v += a * noise2d(x * f, y * f, seed + i * 13);
    m += a; a *= 0.5; f *= 2;
  }
  return v / m;
};

/** Ridged noise — sharp, pointed mountain peaks. */
const ridged = (x: number, y: number, seed: number, oct = 5): number => {
  let v = 0, a = 0.5, f = 1, m = 0;
  for (let i = 0; i < oct; i++) {
    const n = 1 - Math.abs(noise2d(x * f, y * f, seed + i * 13) * 2 - 1);
    v += a * n * n; m += a; a *= 0.5; f *= 2.2;
  }
  return v / m;
};

/* ═══════════════════════════ terrain ═══════════════════════════ */

const SIZE = 40;
const SEGMENTS = 192;
const MAX_H = 8.5;
const SEED = 42;
export const WATER_Y = 0.22;
export const LAKE_CENTER = new THREE.Vector3(0, WATER_Y, 2.0);

function buildTerrain(): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);

    const nx = (x / SIZE + 0.5) * 3.5;
    const ny = (y / SIZE + 0.5) * 3.5;

    // Multi-octave ridged noise for sharp mountain peaks
    const base = fbm(nx * 0.8, ny * 0.8, SEED, 5);
    const peak = ridged(nx * 1.1, ny * 1.1, SEED + 100, 5);
    const presence = fbm(nx * 0.35, ny * 0.35, SEED + 200, 3);
    const mountainFactor = Math.pow(Math.max(0, presence * 1.4 - 0.15), 1.3);

    // Caldera bowl (Lake Toba–like depression centered at x=0, y=-2 which maps to Z=2 after rotateX)
    const dist = Math.sqrt(x * x + (y + 2) * (y + 2)) / (SIZE * 0.18);
    const bowl = dist < 1 ? Math.pow(1 - dist, 2.2) * 4.2 : 0;

    // Edge falloff so terrain fades smoothly to zero at borders
    const ex = Math.abs(x) / (SIZE * 0.48);
    const ey = Math.abs(y) / (SIZE * 0.48);
    const edge = Math.max(0, 1 - Math.pow(Math.max(ex, ey), 3));

    const h = (base * 0.3 + peak * 0.7 * mountainFactor) * MAX_H * edge - bowl;
    pos.setZ(i, h);

    // ── vertex colour based on altitude ──
    const nh = Math.max(0, h) / MAX_H;
    let r: number, g: number, b: number;

    if (h < WATER_Y) {
      r = 0.05; g = 0.08; b = 0.16;                               // lake basin bed
    } else if (nh < 0.06) {
      r = 0.14; g = 0.26; b = 0.12;                               // lush lake shoreline
    } else if (nh < 0.22) {
      const t = (nh - 0.06) / 0.16;
      r = 0.12 + t * 0.06; g = 0.32 + t * 0.18; b = 0.08 + t * 0.05; // dense green forest
    } else if (nh < 0.38) {
      const t = (nh - 0.22) / 0.16;
      r = 0.18 + t * 0.18; g = 0.5 - t * 0.08; b = 0.13 + t * 0.08; // alpine ridges
    } else if (nh < 0.55) {
      const t = (nh - 0.38) / 0.17;
      r = 0.36 + t * 0.14; g = 0.42 - t * 0.1; b = 0.21 + t * 0.09; // volcanic rocks
    } else if (nh < 0.72) {
      const t = (nh - 0.55) / 0.17;
      r = 0.5 + t * 0.12; g = 0.32 + t * 0.12; b = 0.3 + t * 0.18;  // exposed crags
    } else if (nh < 0.86) {
      const t = (nh - 0.72) / 0.14;
      r = 0.62 + t * 0.22; g = 0.44 + t * 0.32; b = 0.48 + t * 0.32; // crest transition
    } else {
      r = 0.88; g = 0.9; b = 0.94;                                 // snow summit
    }

    const cn = fbm(nx * 5, ny * 5, SEED + 300, 3) * 0.06 - 0.03;
    colors[i * 3]     = Math.max(0, Math.min(1, r + cn));
    colors[i * 3 + 1] = Math.max(0, Math.min(1, g + cn));
    colors[i * 3 + 2] = Math.max(0, Math.min(1, b + cn));
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

/* ── Terrain mesh ── */

function Terrain() {
  const geo = useMemo(buildTerrain, []);
  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.72} metalness={0.06} />
    </mesh>
  );
}

/* ── Water surface ── */

function Water({ color, emissive }: { color: string; emissive: string }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = WATER_Y + Math.sin(clock.elapsedTime * 0.6) * 0.012;
    }
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, WATER_Y, 0]} receiveShadow>
      <planeGeometry args={[SIZE * 1.2, SIZE * 1.2, 32, 32]} />
      <meshPhysicalMaterial
        color={color}
        emissive={emissive}
        roughness={0.06}
        metalness={0.75}
        clearcoat={0.95}
        clearcoatRoughness={0.12}
        transmission={0.35}
        ior={1.333}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
}

/* ── Sun / Light Source ── */

function DynamicSun({ position, color, intensity }: { position: [number, number, number]; color: string; intensity: number }) {
  const ref = useRef<THREE.DirectionalLight>(null);

  useEffect(() => {
    if (!ref.current) return;
    const cam = ref.current.shadow.camera as THREE.OrthographicCamera;
    cam.left = -22; cam.right = 22; cam.top = 22; cam.bottom = -22; cam.far = 80;
    cam.updateProjectionMatrix();
    ref.current.shadow.mapSize.set(1024, 1024);
    ref.current.shadow.needsUpdate = true;
  }, []);

  return <directionalLight ref={ref} position={position} intensity={intensity} color={color} castShadow />;
}

/* ═══════════════════════════ camera controller ═══════════════════════════ */

interface CameraControllerProps {
  state: { progress: number; introProgress: number };
  baseFogDensity: number;
}

function CameraController({ state, baseFogDensity }: CameraControllerProps) {
  const { camera, gl, scene } = useThree();

  const sp = useRef({ radius: 22, phi: 1.1, theta: 0 });
  const target = useRef(new THREE.Vector3(0, 1.5, 0));
  const dragging = useRef(false);
  const prev = useRef({ x: 0, y: 0 });
  const vel = useRef({ theta: 0, phi: 0 });

  /* ── pointer drag → orbit (active when near top) ── */
  useEffect(() => {
    const el = gl.domElement;

    const down = (e: PointerEvent) => {
      dragging.current = true;
      prev.current = { x: e.clientX, y: e.clientY };
      el.setPointerCapture(e.pointerId);
    };

    const move = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - prev.current.x;
      const dy = e.clientY - prev.current.y;
      vel.current.theta = -dx * 0.004;
      vel.current.phi   = -dy * 0.004;
      sp.current.theta += vel.current.theta;
      sp.current.phi = THREE.MathUtils.clamp(sp.current.phi + vel.current.phi, 0.35, Math.PI / 2.15);
      prev.current = { x: e.clientX, y: e.clientY };
    };

    const up = (e: PointerEvent) => {
      dragging.current = false;
      try { el.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    };

    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
  }, [gl]);

  /* ── per-frame update ── */
  useFrame((_, delta) => {
    const s = sp.current;
    const dt = Math.min(delta, 0.05);
    const progress = THREE.MathUtils.clamp(state.progress, 0, 1);
    const intro = state.introProgress;

    // Auto-rotate when idle (slows down as we dive towards the lake)
    if (!dragging.current) {
      s.theta += dt * 0.055 * (1 - progress * 0.85);
      vel.current.theta *= 0.92;
      vel.current.phi   *= 0.92;
      s.theta += vel.current.theta;
    }

    // 1. Overview camera position (driven by user orbit and auto-rotation)
    const sph = new THREE.Spherical(s.radius, s.phi, s.theta);
    const overviewPos = new THREE.Vector3().setFromSpherical(sph).add(target.current);

    // 2. Lake dive trajectory
    // Point 1 (Midway swoop: crossing ridge crest toward lake basin)
    const diveMid = new THREE.Vector3(
      Math.sin(s.theta * 0.3) * 3,
      2.8,
      7.0
    );
    // Point 2 (Surface arrival: skimming right over the tranquil water surface)
    const diveEnd = new THREE.Vector3(0, WATER_Y + 0.12, 2.5);

    // Quadratic bezier curve along scroll progress:
    const t = progress;
    const inv = 1 - t;
    const diveX = inv * inv * overviewPos.x + 2 * inv * t * diveMid.x + t * t * diveEnd.x;
    const diveY = inv * inv * overviewPos.y + 2 * inv * t * diveMid.y + t * t * diveEnd.y;
    const diveZ = inv * inv * overviewPos.z + 2 * inv * t * diveMid.z + t * t * diveEnd.z;
    const targetCameraPos = new THREE.Vector3(diveX, diveY, diveZ);

    // Target lookAt interpolation
    const currentTarget = new THREE.Vector3().lerpVectors(
      new THREE.Vector3(0, 1.5, 0),
      new THREE.Vector3(0, WATER_Y + 0.08, 1.0),
      t
    );

    // Intro pull-back interpolation on first page load
    const initialPos = new THREE.Vector3(0, 3.5, 7.5);
    const resolvedPos = new THREE.Vector3().lerpVectors(initialPos, targetCameraPos, intro);

    camera.position.lerp(resolvedPos, dt * 5.5);
    camera.lookAt(currentTarget);

    // Dynamic fog density increase as we sink into the tranquil lake waters
    if (scene.fog && 'density' in scene.fog) {
      (scene.fog as THREE.FogExp2).density = THREE.MathUtils.lerp(
        baseFogDensity,
        0.085,
        Math.max(0, (progress - 0.5) / 0.5)
      );
    }
  });

  return null;
}

/* ═══════════════════════════ exported scene ═══════════════════════════ */

export interface Hero3DState {
  progress: number;
  introProgress: number;
  phase?: TimePhase;
}

export default function Hero3DScene({ state, phase = 'malam' }: { state: Hero3DState; phase?: TimePhase }) {
  const currentPhase = state.phase || phase;
  const p = WEATHER_PRESETS[currentPhase] || WEATHER_PRESETS.malam;

  return (
    <Canvas
      camera={{ position: [0, 4, 8], fov: 55, near: 0.1, far: 200 }}
      shadows
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      dpr={[1, 1.5]}
    >
      {/* Background color and atmospheric fog adapted to time of day */}
      <color attach="background" args={[p.bgColor]} />
      <fogExp2 attach="fog" args={[p.fogColor, p.fogDensity]} />

      {/* Lighting adapted to time of day */}
      <ambientLight intensity={p.ambientIntensity} color={p.ambientColor} />
      <DynamicSun position={p.sunPosition} color={p.sunColor} intensity={p.sunIntensity} />
      <directionalLight position={[-28, 22, 28]} intensity={0.55} color="#6088c4" />
      <hemisphereLight args={[p.hemiSkyColor, p.hemiGroundColor, p.hemiIntensity]} />

      {/* Sky dome with solar coordinates */}
      <Sky
        sunPosition={p.sunPosition}
        turbidity={p.skyTurbidity}
        rayleigh={p.skyRayleigh}
        mieCoefficient={p.skyMieCoeff}
        mieDirectionalG={p.skyMieG}
      />

      {/* Stars visible during night / dawn / twilight */}
      {p.starsCount > 0 && (
        <Stars radius={80} depth={50} count={p.starsCount} factor={3} fade speed={0.5} />
      )}

      {/* World */}
      <Terrain />
      <Water color={p.waterColor} emissive={p.waterEmissive} />

      {/* Camera */}
      <CameraController state={state} baseFogDensity={p.fogDensity} />
    </Canvas>
  );
}
