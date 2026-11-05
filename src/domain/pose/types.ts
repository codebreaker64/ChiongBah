/** Pose data as the version 1 spec section 6.1 defines it. x and y are normalised 0–1. */
export type Landmark = { x: number; y: number; z: number; visibility: number };

/** One camera frame's pose: 33 landmarks in MediaPipe order. */
export type PoseFrame = { tMs: number; width: number; height: number; landmarks: Landmark[] };

/** MediaPipe Pose landmark indices used by the rules. */
export const LM = {
  nose: 0,
  leftEar: 7, rightEar: 8,
  leftShoulder: 11, rightShoulder: 12,
  leftElbow: 13, rightElbow: 14,
  leftWrist: 15, rightWrist: 16,
  leftHip: 23, rightHip: 24,
  leftKnee: 25, rightKnee: 26,
  leftAnkle: 27, rightAnkle: 28,
} as const;

export type Side = 'left' | 'right';

/** The joints of one side of the body, by name. */
export type SideJoints = { ear: number; shoulder: number; elbow: number; wrist: number; hip: number; knee: number; ankle: number };

export const SIDE: Record<Side, SideJoints> = {
  left: { ear: LM.leftEar, shoulder: LM.leftShoulder, elbow: LM.leftElbow, wrist: LM.leftWrist, hip: LM.leftHip, knee: LM.leftKnee, ankle: LM.leftAnkle },
  right: { ear: LM.rightEar, shoulder: LM.rightShoulder, elbow: LM.rightElbow, wrist: LM.rightWrist, hip: LM.rightHip, knee: LM.rightKnee, ankle: LM.rightAnkle },
};

/** Angle ABC in degrees, at B. */
export function angleDeg(a: Landmark, b: Landmark, c: Landmark): number {
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const len = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y);
  if (len === 0) return 0;
  return (Math.acos(Math.max(-1, Math.min(1, dot / len))) * 180) / Math.PI;
}

/**
 * Rotates normalised landmarks so "up" in the result is up in the world. VisionCamera frames arrive
 * in the sensor's orientation, so a phone held in landscape the other way up gives upside-down
 * coordinates; without this, "lower" and "higher" swap (redesign spec section 9.3).
 */
export function rotateFrame(frame: PoseFrame, degrees: 0 | 90 | 180 | 270): PoseFrame {
  if (degrees === 0) return frame;
  const rot = (l: Landmark): Landmark => {
    if (degrees === 90) return { ...l, x: 1 - l.y, y: l.x };
    if (degrees === 180) return { ...l, x: 1 - l.x, y: 1 - l.y };
    return { ...l, x: l.y, y: 1 - l.x };
  };
  const swap = degrees === 90 || degrees === 270;
  return {
    ...frame,
    width: swap ? frame.height : frame.width,
    height: swap ? frame.width : frame.height,
    landmarks: frame.landmarks.map(rot),
  };
}
