'use client';

import { useEffect, useState, useMemo } from 'react';
import { getTimePhase, type TimePhase } from '@/lib/weatherPresets';

interface CelestialSkyProps {
  summits: { d: string; fill: string }[];
  className?: string;
}

// 40 deterministic celestial stars
const STARS = [
  { x: 12, y: 15, r: 1.2, delay: 0.2, dur: 3.2 },
  { x: 18, y: 28, r: 0.8, delay: 1.1, dur: 2.8 },
  { x: 25, y: 12, r: 1.4, delay: 0.7, dur: 3.5 },
  { x: 32, y: 22, r: 0.9, delay: 1.8, dur: 2.5 },
  { x: 38, y: 10, r: 1.1, delay: 0.4, dur: 3.0 },
  { x: 44, y: 30, r: 0.7, delay: 2.1, dur: 3.8 },
  { x: 52, y: 14, r: 1.3, delay: 1.3, dur: 2.7 },
  { x: 58, y: 25, r: 0.8, delay: 0.9, dur: 3.4 },
  { x: 65, y: 11, r: 1.5, delay: 1.6, dur: 3.1 },
  { x: 72, y: 28, r: 0.7, delay: 0.1, dur: 2.9 },
  { x: 78, y: 16, r: 1.2, delay: 1.4, dur: 3.6 },
  { x: 84, y: 24, r: 0.9, delay: 2.3, dur: 2.6 },
  { x: 90, y: 13, r: 1.3, delay: 0.5, dur: 3.3 },
  { x: 15, y: 38, r: 0.8, delay: 1.7, dur: 3.0 },
  { x: 28, y: 35, r: 1.0, delay: 0.8, dur: 2.8 },
  { x: 48, y: 38, r: 0.9, delay: 2.0, dur: 3.2 },
  { x: 68, y: 36, r: 1.1, delay: 1.2, dur: 2.9 },
  { x: 82, y: 39, r: 0.7, delay: 0.6, dur: 3.5 },
  { x: 94, y: 32, r: 1.0, delay: 1.9, dur: 2.7 },
  { x: 8, y: 24, r: 1.1, delay: 0.3, dur: 3.4 },
  { x: 22, y: 44, r: 0.7, delay: 1.5, dur: 2.9 },
  { x: 35, y: 42, r: 1.2, delay: 2.4, dur: 3.6 },
  { x: 62, y: 42, r: 0.8, delay: 0.5, dur: 3.1 },
  { x: 75, y: 45, r: 1.0, delay: 1.8, dur: 2.8 },
  { x: 88, y: 46, r: 0.8, delay: 1.0, dur: 3.3 },
];

export function CelestialSky({ summits, className = '' }: CelestialSkyProps) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timePhase = useMemo<TimePhase>(() => {
    return getTimePhase(now);
  }, [now]);

  // Decimal hours: e.g. 13.5 for 13:30
  const hours = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;

  // --- CELESTIAL CALCULATIONS (Pure Trigonometric Arcs) ---

  // 1. Sun Cycle: 05:30 to 18:30 (13 hours)
  const sunData = useMemo(() => {
    const sunrise = 5.5;
    const sunset = 18.5;
    const isDay = hours >= sunrise && hours <= sunset;
    const isTwilight = (hours >= 5.0 && hours < 5.5) || (hours > 18.5 && hours <= 19.0);

    if (!isDay && !isTwilight) {
      return { visible: false, x: 50, y: 120, altitude: 0, opacity: 0 };
    }

    const progress = Math.max(0, Math.min(1, (hours - sunrise) / (sunset - sunrise)));
    // Trajectory from 10% (East / Left) to 90% (West / Right)
    const x = 10 + progress * 80;
    // Parabolic arc: 80% (horizon) up to 18% (midday zenith)
    const arc = Math.sin(progress * Math.PI);
    const y = 80 - arc * 62;
    const altitude = Math.round(arc * 78);
    const opacity = Math.max(0, Math.min(1, arc * 2.2 + 0.15));

    return { visible: true, x, y, altitude, opacity };
  }, [hours]);

  // 2. Moon Cycle: 17:30 to 06:30 (13 hours)
  const moonData = useMemo(() => {
    const moonRise = 17.5;
    const moonSet = 6.5;
    const isNight = hours >= moonRise || hours <= moonSet;
    const isTwilight = (hours > 6.5 && hours <= 7.0) || (hours >= 17.0 && hours < 17.5);

    if (!isNight && !isTwilight) {
      return { visible: false, x: 50, y: 120, altitude: 0, opacity: 0 };
    }

    const nightHours = hours >= moonRise ? hours - moonRise : hours + (24 - moonRise);
    const progress = Math.max(0, Math.min(1, nightHours / 13));
    const x = 10 + progress * 80;
    const arc = Math.sin(progress * Math.PI);
    const y = 80 - arc * 60;
    const altitude = Math.round(arc * 74);
    const opacity = Math.max(0, Math.min(1, arc * 2.2 + 0.2));

    return { visible: true, x, y, altitude, opacity };
  }, [hours]);

  // Dynamic sky atmosphere styles based on time phase
  const skyBackground = useMemo(() => {
    switch (timePhase) {
      case 'shubuh':
        return 'radial-gradient(ellipse at 25% 85%, #f97316 0%, #7c2d12 25%, #3b1d54 55%, #15112e 85%, #0c0a1a 100%)';
      case 'pagi':
        return 'radial-gradient(ellipse at 35% 60%, #fed7aa 0%, #38bdf8 30%, #1e40af 60%, #0f172a 90%, #090d16 100%)';
      case 'siang':
        return 'radial-gradient(ellipse at 50% 30%, #fef08a 0%, #60a5fa 28%, #1d4ed8 58%, #0f172a 88%, #070d18 100%)';
      case 'senja':
        return 'radial-gradient(ellipse at 78% 80%, #ff4500 0%, #c026d3 30%, #4c1d95 60%, #1e112a 85%, #0d0814 100%)';
      case 'malam':
      default:
        return 'radial-gradient(ellipse at 50% 35%, #1e293b 0%, #0f172a 45%, #070a13 85%, #030712 100%)';
    }
  }, [timePhase]);

  // Ambient glow color on mountains
  const mountainGlow = useMemo(() => {
    switch (timePhase) {
      case 'shubuh':
        return 'drop-shadow(0 -4px 14px rgba(249, 115, 22, 0.35))';
      case 'pagi':
        return 'drop-shadow(0 -4px 12px rgba(254, 215, 170, 0.3))';
      case 'siang':
        return 'drop-shadow(0 -5px 16px rgba(254, 240, 138, 0.4))';
      case 'senja':
        return 'drop-shadow(0 -5px 18px rgba(255, 69, 0, 0.45))';
      case 'malam':
      default:
        return 'drop-shadow(0 -3px 12px rgba(200, 220, 255, 0.28))';
    }
  }, [timePhase]);

  return (
    <div
      className={`relative w-full h-full min-h-[26rem] flex flex-col justify-between overflow-hidden rounded-[2rem] transition-colors duration-1000 ${className}`}
      style={{ background: skyBackground }}
    >
      {/* 1. STARFIELD: Active on Night and Shubuh */}
      {(timePhase === 'malam' || timePhase === 'shubuh') && (
        <svg
          viewBox="0 0 100 50"
          preserveAspectRatio="none"
          className="absolute inset-x-0 top-0 h-[65%] w-full pointer-events-none z-0 transition-opacity duration-1000"
          style={{ opacity: timePhase === 'malam' ? 0.9 : 0.4 }}
          aria-hidden="true"
        >
          {STARS.map((star, i) => (
            <circle
              key={i}
              cx={star.x}
              cy={star.y}
              r={star.r * 0.4}
              fill="#e2e8f0"
              style={{
                animation: `twinkle ${star.dur}s ease-in-out ${star.delay}s infinite alternate`,
              }}
            />
          ))}
        </svg>
      )}

      {/* 2. CELESTIAL ORBIT PATH (Subtle Dashed Trajectory Arc) */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full pointer-events-none z-0"
        aria-hidden="true"
      >
        <path
          d="M 10 80 Q 50 16 90 80"
          fill="none"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="0.75"
          strokeDasharray="2 3"
        />
      </svg>

      {/* 3. DYNAMIC CELESTIAL BODIES (Z-10: Behind Mountains, Above Sky) */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {/* === THE SUN (High-detail custom SVG vector, radiant corona, NO emoji) === */}
        {sunData.visible && (
          <div
            className="absolute transition-all duration-1000 ease-out"
            style={{
              left: `${sunData.x}%`,
              top: `${sunData.y}%`,
              opacity: sunData.opacity,
            }}
          >
            {/* Ambient solar atmosphere bloom */}
            <div className="absolute -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-64 md:h-64 rounded-full bg-amber-400/25 blur-3xl pointer-events-none" />

            <svg
              viewBox="0 0 100 100"
              className="w-16 h-16 md:w-20 md:h-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none drop-shadow-[0_0_24px_rgba(255,180,50,0.7)]"
            >
              <defs>
                <radialGradient id="sun-core" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="35%" stopColor="#fff3bf" />
                  <stop offset="70%" stopColor="#fca311" />
                  <stop offset="100%" stopColor="#e85d04" />
                </radialGradient>
                <radialGradient id="sun-corona" cx="50%" cy="50%" r="50%">
                  <stop offset="40%" stopColor="rgba(255, 200, 80, 0.4)" />
                  <stop offset="75%" stopColor="rgba(255, 140, 20, 0.15)" />
                  <stop offset="100%" stopColor="rgba(255, 100, 0, 0)" />
                </radialGradient>
              </defs>

              {/* Pulsing solar halo */}
              <circle cx="50" cy="50" r="46" fill="url(#sun-corona)" className="animate-pulse" />

              {/* Rotating subtle geometric solar rays */}
              <g className="animate-[spin_40s_linear_infinite] origin-center opacity-75">
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                  <line
                    key={deg}
                    x1="50"
                    y1="10"
                    x2="50"
                    y2="17"
                    transform={`rotate(${deg} 50 50)`}
                    stroke="#ffd166"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity={deg % 60 === 0 ? 0.95 : 0.55}
                  />
                ))}
              </g>

              {/* Inner radiant corona ring */}
              <circle
                cx="50"
                cy="50"
                r="28"
                fill="none"
                stroke="#ffeaa7"
                strokeWidth="1"
                opacity="0.6"
                strokeDasharray="4 3"
              />

              {/* Solar Core */}
              <circle cx="50" cy="50" r="23" fill="url(#sun-core)" />

              {/* Specular glare */}
              <ellipse cx="44" cy="42" rx="7" ry="5" fill="#ffffff" opacity="0.45" />
            </svg>
          </div>
        )}

        {/* === THE MOON (Detailed lunar maria basalt craters, silver glow, NO emoji) === */}
        {moonData.visible && (
          <div
            className="absolute transition-all duration-1000 ease-out"
            style={{
              left: `${moonData.x}%`,
              top: `${moonData.y}%`,
              opacity: moonData.opacity,
            }}
          >
            {/* Ambient moonlit atmosphere bloom */}
            <div className="absolute -translate-x-1/2 -translate-y-1/2 w-44 h-44 md:w-56 md:h-56 rounded-full bg-sky-300/20 blur-3xl pointer-events-none" />

            <svg
              viewBox="0 0 100 100"
              className="w-14 h-14 md:w-18 md:h-18 -translate-x-1/2 -translate-y-1/2 pointer-events-none drop-shadow-[0_0_20px_rgba(180,215,255,0.65)]"
            >
              <defs>
                <radialGradient id="moon-base" cx="40%" cy="35%" r="60%">
                  <stop offset="0%" stopColor="#f8faff" />
                  <stop offset="50%" stopColor="#dce6f8" />
                  <stop offset="85%" stopColor="#9fb4db" />
                  <stop offset="100%" stopColor="#687eab" />
                </radialGradient>
                <radialGradient id="moon-halo" cx="50%" cy="50%" r="50%">
                  <stop offset="50%" stopColor="rgba(180, 215, 255, 0.3)" />
                  <stop offset="80%" stopColor="rgba(140, 185, 245, 0.1)" />
                  <stop offset="100%" stopColor="rgba(100, 150, 240, 0)" />
                </radialGradient>
              </defs>

              {/* Outer faint lunar halo */}
              <circle cx="50" cy="50" r="46" fill="url(#moon-halo)" />

              {/* Moon Sphere */}
              <circle cx="50" cy="50" r="24" fill="url(#moon-base)" />

              {/* Lunar Maria (Basaltic crater basins) */}
              <g fill="#4e6288" opacity="0.35">
                {/* Oceanus Procellarum & Mare Imbrium */}
                <circle cx="43" cy="42" r="5.5" />
                <circle cx="48" cy="38" r="4" />
                <circle cx="56" cy="44" r="5" />
                {/* Mare Tranquillitatis & Serenitatis */}
                <ellipse cx="58" cy="52" rx="4.5" ry="3.5" />
                <circle cx="50" cy="56" r="3.2" />
                <circle cx="40" cy="54" r="3" />
                {/* Tycho crater rays hint */}
                <circle cx="47" cy="64" r="2.2" fill="#758cb5" opacity="0.5" />
              </g>

              {/* Moonlit rim highlight */}
              <circle
                cx="50"
                cy="50"
                r="23.5"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1"
                opacity="0.4"
              />

              {/* Soft limb shadow */}
              <path
                d="M 50 26 A 24 24 0 0 1 74 50 A 24 24 0 0 1 50 74 A 20 20 0 0 0 50 26"
                fill="#1e2740"
                opacity="0.2"
              />
            </svg>
          </div>
        )}
      </div>

      {/* 5. MOUNTAIN SUMMITS SILHOUETTE (Z-20: Mountains In Foreground) */}
      <svg
        viewBox="0 0 800 300"
        preserveAspectRatio="xMidYMax slice"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] w-full z-20 transition-all duration-1000"
        style={{ filter: mountainGlow }}
        aria-hidden="true"
        focusable="false"
      >
        {summits.map((s, i) => (
          <path key={i} d={s.d} style={{ fill: s.fill }} />
        ))}
      </svg>
    </div>
  );
}
