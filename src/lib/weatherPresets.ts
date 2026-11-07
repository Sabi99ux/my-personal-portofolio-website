export type TimePhase = 'shubuh' | 'pagi' | 'siang' | 'senja' | 'malam';

export interface WeatherPreset {
  id: TimePhase;
  labelId: string;
  labelEn: string;
  labelZh: string;
  sunPosition: [number, number, number];
  sunColor: string;
  sunIntensity: number;
  ambientColor: string;
  ambientIntensity: number;
  hemiSkyColor: string;
  hemiGroundColor: string;
  hemiIntensity: number;
  skyTurbidity: number;
  skyRayleigh: number;
  skyMieCoeff: number;
  skyMieG: number;
  fogColor: string;
  fogDensity: number;
  bgColor: string;
  starsCount: number;
  waterColor: string;
  waterEmissive: string;
}

export const WEATHER_PRESETS: Record<TimePhase, WeatherPreset> = {
  shubuh: {
    id: 'shubuh',
    labelId: 'Shubuh (Fajar)',
    labelEn: 'Dawn',
    labelZh: '拂晓 (黎明)',
    sunPosition: [80, 8, -60],
    sunColor: '#fca286',
    sunIntensity: 1.4,
    ambientColor: '#6a5685',
    ambientIntensity: 0.5,
    hemiSkyColor: '#785b98',
    hemiGroundColor: '#161932',
    hemiIntensity: 0.55,
    skyTurbidity: 8,
    skyRayleigh: 3.5,
    skyMieCoeff: 0.012,
    skyMieG: 0.85,
    fogColor: '#17132e',
    fogDensity: 0.02,
    bgColor: '#100d24',
    starsCount: 900,
    waterColor: '#16183a',
    waterEmissive: '#09091c',
  },
  pagi: {
    id: 'pagi',
    labelId: 'Pagi Hari',
    labelEn: 'Morning',
    labelZh: '清晨',
    sunPosition: [55, 38, -40],
    sunColor: '#ffe6be',
    sunIntensity: 2.2,
    ambientColor: '#8eaee8',
    ambientIntensity: 0.55,
    hemiSkyColor: '#88b0e8',
    hemiGroundColor: '#203222',
    hemiIntensity: 0.65,
    skyTurbidity: 3.5,
    skyRayleigh: 1.2,
    skyMieCoeff: 0.003,
    skyMieG: 0.75,
    fogColor: '#1c2844',
    fogDensity: 0.015,
    bgColor: '#142038',
    starsCount: 0,
    waterColor: '#0e2b52',
    waterEmissive: '#061326',
  },
  siang: {
    id: 'siang',
    labelId: 'Siang Hari',
    labelEn: 'Midday',
    labelZh: '正午',
    sunPosition: [15, 65, -20],
    sunColor: '#fffaf0',
    sunIntensity: 2.5,
    ambientColor: '#a0c4f8',
    ambientIntensity: 0.6,
    hemiSkyColor: '#a2cbff',
    hemiGroundColor: '#2d4227',
    hemiIntensity: 0.7,
    skyTurbidity: 2,
    skyRayleigh: 0.8,
    skyMieCoeff: 0.002,
    skyMieG: 0.7,
    fogColor: '#1e2c48',
    fogDensity: 0.012,
    bgColor: '#16233b',
    starsCount: 0,
    waterColor: '#103562',
    waterEmissive: '#061934',
  },
  senja: {
    id: 'senja',
    labelId: 'Senja (Sore)',
    labelEn: 'Golden Hour',
    labelZh: '黄昏 (日落)',
    sunPosition: [95, 14, -60],
    sunColor: '#ff9445',
    sunIntensity: 2.3,
    ambientColor: '#826090',
    ambientIntensity: 0.5,
    hemiSkyColor: '#e28055',
    hemiGroundColor: '#241a32',
    hemiIntensity: 0.58,
    skyTurbidity: 9,
    skyRayleigh: 3.2,
    skyMieCoeff: 0.01,
    skyMieG: 0.86,
    fogColor: '#1e1632',
    fogDensity: 0.018,
    bgColor: '#141026',
    starsCount: 450,
    waterColor: '#1e1c3e',
    waterEmissive: '#110c22',
  },
  // Malam hari: Gunung terlihat jelas disinari cahaya bulan perak kebiruan (crisp moonlit mountain peaks & lake)
  malam: {
    id: 'malam',
    labelId: 'Malam Hari',
    labelEn: 'Night',
    labelZh: '深夜',
    sunPosition: [35, 38, -30], // Posisi bulan di langit atas menyinari punggung dan puncak gunung
    sunColor: '#c8dcff',        // Cahaya bulan perak-kebiruan terang
    sunIntensity: 1.75,          // Cukup terang agar detail punggung gunung & salju terlihat jelas
    ambientColor: '#455a88',    // Ambient malam biru sejuk
    ambientIntensity: 0.58,     // Menghindari bayangan hitam pekat
    hemiSkyColor: '#4f6ea8',    // Cahaya langit malam bertabur bintang
    hemiGroundColor: '#151d30', // Pantulan lereng bawah
    hemiIntensity: 0.65,
    skyTurbidity: 4,
    skyRayleigh: 0.5,
    skyMieCoeff: 0.003,
    skyMieG: 0.7,
    fogColor: '#10152c',        // Kabut malam tipis dan transparan
    fogDensity: 0.014,          // Kepadatan kabut rendah agar siluet gunung tidak tertutup
    bgColor: '#10132a',         // Selaras dengan tema gelap situs
    starsCount: 2500,           // Langit malam penuh bintang
    waterColor: '#14254c',      // Air danau memantulkan cahaya rembulan
    waterEmissive: '#0a1630',
  },
};

/**
 * Automatically detects the time phase from user's local clock:
 *  - 04:00 – 06:00 → shubuh (dawn)
 *  - 06:00 – 11:00 → pagi (morning)
 *  - 11:00 – 15:00 → siang (midday)
 *  - 15:00 – 18:30 → senja (sunset / golden hour)
 *  - 18:30 – 04:00 → malam (night)
 */
export function getTimePhase(date = new Date()): TimePhase {
  const h = date.getHours() + date.getMinutes() / 60;
  if (h >= 4.0 && h < 6.0) return 'shubuh';
  if (h >= 6.0 && h < 11.0) return 'pagi';
  if (h >= 11.0 && h < 15.0) return 'siang';
  if (h >= 15.0 && h < 18.5) return 'senja';
  return 'malam';
}
