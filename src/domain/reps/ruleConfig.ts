import type { CameraStation } from './types';

/**
 * Rep rule thresholds (version 1 spec sections 6.3 to 6.5). These are settings, not code: tune them
 * against labelled recordings and bump `version`, which is saved with every camera session.
 */
export type PushUpRules = {
  version: string;
  lockoutMinElbowDeg: number;
  bottomMaxElbowDeg: number;
  /** Shoulder within this many upper-arm lengths of wrist height counts as deep enough. */
  bottomShoulderToWristMax: number;
  straightBackMinDeg: number;
  /** Ready check: the body line (shoulder to ankle) may tilt this far from horizontal. */
  readyMaxBodyTiltDeg: number;
};

export type SitUpRules = {
  version: string;
  backDownMaxTorsoDeg: number;
  elbowToKneeMaxThighs: number;
  wristToEarMaxUpperArms: number;
  /** Ready check "Knees bent": hip–knee–ankle angle at or below this. About a right angle, with room. */
  kneeBentMaxDeg: number;
};

export const PUSH_UP_RULES: PushUpRules = {
  version: 'pushup-2026.11.1',
  lockoutMinElbowDeg: 160,
  bottomMaxElbowDeg: 90,
  bottomShoulderToWristMax: 0.35,
  straightBackMinDeg: 160,
  readyMaxBodyTiltDeg: 35,
};

export const SIT_UP_RULES: SitUpRules = {
  version: 'situp-2026.11.1',
  backDownMaxTorsoDeg: 20,
  elbowToKneeMaxThighs: 0.35,
  wristToEarMaxUpperArms: 0.5,
  kneeBentMaxDeg: 110,
};

export function ruleVersion(station: CameraStation): string {
  return station === 'pushup' ? PUSH_UP_RULES.version : SIT_UP_RULES.version;
}

/** Minimum landmark visibility for a joint to count as seen (version 1 spec section 6.2). */
export const MIN_VISIBILITY = 0.6;
