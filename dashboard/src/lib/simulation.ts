/* simulation.ts – Browser-side Monte Carlo collision engine */

export const PROTON_MASS = 0.938272088;

export interface SimConfig {
  numEvents: number;
  energyMin: number;
  energyMax: number;
  thetaMin: number;
  thetaMax: number;
  particleMass: number;
  seed?: number;
}

export const DEFAULT_CONFIG: SimConfig = {
  numEvents: 10000,
  energyMin: 10,
  energyMax: 100,
  thetaMin: 0,
  thetaMax: Math.PI,
  particleMass: PROTON_MASS,
};

export interface CollisionEvent {
  id: number;
  energyA: number;
  energyB: number;
  theta: number;
  phi: number;
  px: number;
  py: number;
  pz: number;
  finalEnergy1: number;
  finalEnergy2: number;
  sqrtS: number;
}

function splitmix32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x9e3779b9) | 0;
    let t = a ^ (a >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ (t >>> 15);
    t = Math.imul(t, 0x735a2d97);
    t = t ^ (t >>> 15);
    return (t >>> 0) / 4294967296;
  };
}

export function runSimulation(
  cfg: SimConfig,
  onProgress?: (fraction: number) => void
): CollisionEvent[] {
  const rng =
    cfg.seed !== undefined ? splitmix32(cfg.seed) : () => Math.random();
  const {
    numEvents,
    energyMin,
    energyMax,
    thetaMin,
    thetaMax,
    particleMass,
  } = cfg;
  const cosThetaMin = Math.cos(thetaMax);
  const cosThetaMax = Math.cos(thetaMin);
  const mass2 = particleMass * particleMass;
  const events: CollisionEvent[] = new Array(numEvents);
  const CHUNK = 500;

  for (let i = 0; i < numEvents; i++) {
    const eA = energyMin + rng() * (energyMax - energyMin);
    const eB = energyMin + rng() * (energyMax - energyMin);
    const cosTheta = cosThetaMin + rng() * (cosThetaMax - cosThetaMin);
    const theta = Math.acos(cosTheta);
    const sinTheta = Math.sin(theta);
    const phiA = rng() * 2 * Math.PI;
    const phiB = rng() * 2 * Math.PI;

    const pA = Math.sqrt(Math.max(eA * eA - mass2, 0));
    const pB = Math.sqrt(Math.max(eB * eB - mass2, 0));

    const pxA = pA * sinTheta * Math.cos(phiA);
    const pyA = pA * sinTheta * Math.sin(phiA);
    const pzA = pA * cosTheta;
    const pxB = pB * sinTheta * Math.cos(phiB);
    const pyB = pB * sinTheta * Math.sin(phiB);
    const pzB = -pB * cosTheta;

    const px = pxA + pxB;
    const py = pyA + pyB;
    const pz = pzA + pzB;
    const totalE = eA + eB;
    const p2 = px * px + py * py + pz * pz;
    const s = totalE * totalE - p2;
    const sqrtS = Math.sqrt(Math.max(s, 0));

    const asymmetry = 0.5 + (rng() - 0.5) * 0.2;
    const e1 = totalE * asymmetry;
    const e2 = totalE - e1;

    events[i] = {
      id: i,
      energyA: eA,
      energyB: eB,
      theta,
      phi: phiA,
      px,
      py,
      pz,
      finalEnergy1: e1,
      finalEnergy2: e2,
      sqrtS,
    };
    if (onProgress && i % CHUNK === 0) onProgress(i / numEvents);
  }
  onProgress?.(1);
  return events;
}

export function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function std(arr: number[]): number {
  if (arr.length === 0) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length);
}

export function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export interface HistBin {
  x: number;
  y: number;
}

export function histogram(data: number[], bins = 60): HistBin[] {
  if (data.length === 0) return [];
  const mn = Math.min(...data);
  const mx = Math.max(...data);
  const width = (mx - mn) / bins || 1;
  const counts = new Array(bins).fill(0);
  for (const v of data) {
    const idx = Math.min(Math.floor((v - mn) / width), bins - 1);
    counts[idx]++;
  }
  return counts.map((c, i) => ({
    x: +(mn + (i + 0.5) * width).toFixed(4),
    y: c,
  }));
}

export function correlation(a: number[], b: number[]): number {
  if (a.length === 0) return 0;
  const mA = mean(a);
  const mB = mean(b);
  let num = 0, dA = 0, dB = 0;
  for (let i = 0; i < a.length; i++) {
    const da = a[i] - mA;
    const db = b[i] - mB;
    num += da * db;
    dA += da * da;
    dB += db * db;
  }
  const den = Math.sqrt(dA * dB);
  return den === 0 ? 0 : num / den;
}
