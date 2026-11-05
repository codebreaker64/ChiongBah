import { angleDeg, Landmark, PoseFrame, Side, SIDE, SideJoints } from '../pose/types';
import { MIN_VISIBILITY, PUSH_UP_RULES, PushUpRules, SIT_UP_RULES, SitUpRules } from './ruleConfig';
import type { CameraStation } from './types';

/** Ready checks shown on "Get in frame" (redesign spec section 7.12), in display order. */
export type CheckId = 'side_on' | 'pushup_position' | 'whole_body' | 'knees_bent';

export const STATION_CHECKS: Record<CameraStation, CheckId[]> = {
  pushup: ['side_on', 'pushup_position', 'whole_body'],
  situp: ['side_on', 'whole_body', 'knees_bent'],
};

/** Why a check failed, so the screen can say what to fix. */
export type CheckProblem =
  | 'feet_cut_off' | 'head_cut_off' | 'body_cut_off'
  | 'facing_camera'
  | 'not_horizontal' | 'arms_bent'
  | 'legs_straight';

export type CheckStatus = 'pass' | 'fail' | 'unknown';

export type CheckResult = {
  id: CheckId;
  status: CheckStatus;
  problem?: CheckProblem;
  /** Landmark index to flag on the preview when the check fails. */
  joint?: number;
};

const EDGE = 0.02;
const inFrame = (l: Landmark) => l.x >= EDGE && l.x <= 1 - EDGE && l.y >= EDGE && l.y <= 1 - EDGE;
const seen = (l: Landmark | undefined): l is Landmark => !!l && l.visibility >= MIN_VISIBILITY;
const dist = (a: Landmark, b: Landmark) => Math.hypot(a.x - b.x, a.y - b.y);

/** The side of the body facing the camera: the one whose joints are more visible (version 1 spec 6.2). */
export function nearSide(frame: PoseFrame): Side {
  const avg = (j: SideJoints) => {
    const ids = Object.values(j);
    return ids.reduce((sum, i) => sum + (frame.landmarks[i]?.visibility ?? 0), 0) / ids.length;
  };
  return avg(SIDE.left) >= avg(SIDE.right) ? 'left' : 'right';
}

function wholeBody(frame: PoseFrame, j: SideJoints): CheckResult {
  const head = frame.landmarks[j.ear];
  const feet = frame.landmarks[j.ankle];
  if (!seen(feet) || !inFrame(feet)) return { id: 'whole_body', status: 'fail', problem: 'feet_cut_off', joint: j.ankle };
  if (!seen(head) || !inFrame(head)) return { id: 'whole_body', status: 'fail', problem: 'head_cut_off', joint: j.ear };
  for (const i of [j.shoulder, j.elbow, j.wrist, j.hip, j.knee]) {
    const l = frame.landmarks[i];
    if (!seen(l) || !inFrame(l)) return { id: 'whole_body', status: 'fail', problem: 'body_cut_off', joint: i };
  }
  return { id: 'whole_body', status: 'pass' };
}

/** Side on: the two shoulders sit one behind the other, so they look close together compared with the torso. */
function sideOn(frame: PoseFrame, j: SideJoints): CheckResult {
  const l = frame.landmarks;
  const shoulders = [l[SIDE.left.shoulder], l[SIDE.right.shoulder]];
  const torso = seen(l[j.shoulder]) && seen(l[j.hip]) ? dist(l[j.shoulder], l[j.hip]) : 0;
  if (!shoulders.every(Boolean) || torso === 0) return { id: 'side_on', status: 'unknown' };
  const spread = dist(shoulders[0], shoulders[1]) / torso;
  return spread <= 0.35 ? { id: 'side_on', status: 'pass' } : { id: 'side_on', status: 'fail', problem: 'facing_camera', joint: j.shoulder };
}

function pushUpPosition(frame: PoseFrame, j: SideJoints, rules: PushUpRules): CheckResult {
  const l = frame.landmarks;
  const [sh, el, wr, an] = [l[j.shoulder], l[j.elbow], l[j.wrist], l[j.ankle]];
  if (![sh, el, wr, an].every(seen)) return { id: 'pushup_position', status: 'unknown' };
  const tilt = Math.abs((Math.atan2(an.y - sh.y, Math.abs(an.x - sh.x)) * 180) / Math.PI);
  if (tilt > rules.readyMaxBodyTiltDeg) return { id: 'pushup_position', status: 'fail', problem: 'not_horizontal', joint: j.hip };
  if (angleDeg(sh, el, wr) < rules.lockoutMinElbowDeg) return { id: 'pushup_position', status: 'fail', problem: 'arms_bent', joint: j.elbow };
  return { id: 'pushup_position', status: 'pass' };
}

function kneesBent(frame: PoseFrame, j: SideJoints, rules: SitUpRules): CheckResult {
  const l = frame.landmarks;
  const [hip, knee, ankle] = [l[j.hip], l[j.knee], l[j.ankle]];
  if (![hip, knee, ankle].every(seen)) return { id: 'knees_bent', status: 'unknown' };
  return angleDeg(hip, knee, ankle) <= rules.kneeBentMaxDeg
    ? { id: 'knees_bent', status: 'pass' }
    : { id: 'knees_bent', status: 'fail', problem: 'legs_straight', joint: j.knee };
}

/**
 * Runs the station's ready checks on one frame. With no frame (no pose model yet), every check is
 * 'unknown' and the user starts by hand.
 */
export function runChecks(
  station: CameraStation,
  frame: PoseFrame | null,
  rules: { pushup: PushUpRules; situp: SitUpRules } = { pushup: PUSH_UP_RULES, situp: SIT_UP_RULES },
): CheckResult[] {
  const ids = STATION_CHECKS[station];
  if (!frame || frame.landmarks.length < 33) return ids.map((id) => ({ id, status: 'unknown' as const }));
  const j = SIDE[nearSide(frame)];
  return ids.map((id) => {
    switch (id) {
      case 'whole_body': return wholeBody(frame, j);
      case 'side_on': return sideOn(frame, j);
      case 'pushup_position': return pushUpPosition(frame, j, rules.pushup);
      case 'knees_bent': return kneesBent(frame, j, rules.situp);
    }
  });
}

export const allPassed = (checks: CheckResult[]) => checks.every((c) => c.status === 'pass');
export const firstFailing = (checks: CheckResult[]) => checks.find((c) => c.status === 'fail') ?? null;
