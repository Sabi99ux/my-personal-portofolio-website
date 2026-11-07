/**
 * Procedural mountain ridgelines.
 *
 * Pure integer-hash value noise + basic arithmetic only (no Math.sin / pow), so the
 * server and every browser engine produce byte-identical paths: zero hydration drift,
 * zero image assets, and the same generator can draw the hero, project covers and the OG image.
 */
const hash = (i: number, seed: number): number => {
  let h = Math.imul(i, 0x27d4eb2d) ^ Math.imul(seed + 1, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const smooth = (t: number) => t * t * (3 - 2 * t);

const noise = (x: number, seed: number): number => {
  const i = Math.floor(x);
  const a = hash(i, seed);
  return a + (hash(i + 1, seed) - a) * smooth(x - i);
};

export interface RidgeOptions {
  seed: number;
  /** viewBox size the path is generated for */
  width?: number;
  height?: number;
  /** 0..1 from the top of the box: where the valleys sit */
  base: number;
  /** 0..1 of the box height: how far summits rise above the valleys */
  rise: number;
  /** approximate number of major summits across the width */
  peaks?: number;
  /** 0..1 small-scale crag detail */
  jag?: number;
  /** horizontal sample spacing in viewBox units */
  step?: number;
}

export function ridgeY(x: number, o: RidgeOptions): number {
  const { seed, width = 1600, height = 700, base, rise, peaks = 3, jag = 0.5 } = o;
  const u = (x / width) * peaks;
  // three octaves of ridged noise: pointed summits, secondary spurs, fine crags
  const s1 = 1 - Math.abs(noise(u, seed) * 2 - 1);
  const s2 = 1 - Math.abs(noise(u * 2.3 + 7, seed + 5) * 2 - 1);
  const s3 = 1 - Math.abs(noise(u * 5.1 + 3, seed + 9) * 2 - 1);
  const swell = noise(u * 0.4 + 11, seed + 3); // slow swell so no two summits match
  const top = 0.88 + 0.12 * (0.5 + jag); // theoretical maximum of the octave sum
  const crest = (s1 * 0.6 + s2 * 0.28 + s3 * 0.12 * (0.5 + jag)) * (0.55 + 0.45 * swell);
  const lift = Math.max(0, crest - 0.1) / (top - 0.1); // 0..1 without ever clipping into flat tops
  const n = lift * (0.4 + 0.6 * lift); // broad low valleys, steep pointed summits
  return height * (base - rise * n);
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Open polyline along the crest (for rim light strokes and route lines). */
export function ridgeLine(o: RidgeOptions): string {
  const { width = 1600, step = 8 } = o;
  let d = '';
  for (let x = 0; x <= width; x += step) d += `${x ? 'L' : 'M'}${x} ${round1(ridgeY(x, o))}`;
  return d;
}

/** Closed silhouette. `bleed` extends the fill below the box (fraction of height) so transforms never reveal a gap. */
export function ridgeFill(o: RidgeOptions, bleed = 0): string {
  const { width = 1600, height = 700 } = o;
  const bottom = round1(height * (1 + bleed));
  return `${ridgeLine(o)}L${width} ${bottom}L0 ${bottom}Z`;
}
