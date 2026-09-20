import type { FC } from 'react';

export interface HyperspeedColors {
  roadColor: number;
  islandColor: number;
  background: number;
  shoulderLines: number;
  brokenLines: number;
  leftCars: number[];
  rightCars: number[];
  sticks: number;
}

export interface HyperspeedEffectOptions {
  onSpeedUp?: (ev: Event) => void;
  onSlowDown?: (ev: Event) => void;
  distortion?:
    | 'turbulentDistortion'
    | 'turbulentDistortionStill'
    | 'mountainDistortion'
    | 'xyDistortion'
    | 'LongRaceDistortion'
    | 'deepDistortion'
    | 'deepDistortionStill';
  length?: number;
  roadWidth?: number;
  islandWidth?: number;
  lanesPerRoad?: number;
  fov?: number;
  fovSpeedUp?: number;
  speedUp?: number;
  carLightsFade?: number;
  totalSideLightSticks?: number;
  lightPairsPerRoadWay?: number;
  shoulderLinesWidthPercentage?: number;
  brokenLinesWidthPercentage?: number;
  brokenLinesLengthPercentage?: number;
  lightStickWidth?: [number, number];
  lightStickHeight?: [number, number];
  movingAwaySpeed?: [number, number];
  movingCloserSpeed?: [number, number];
  carLightsLength?: [number, number];
  carLightsRadius?: [number, number];
  carWidthPercentage?: [number, number];
  carShiftX?: [number, number];
  carFloorSeparation?: [number, number];
  colors?: Partial<HyperspeedColors>;
}

export interface HyperspeedProps {
  effectOptions?: HyperspeedEffectOptions;
  lightMode?: boolean;
}

declare const Hyperspeed: FC<HyperspeedProps>;
export default Hyperspeed;
