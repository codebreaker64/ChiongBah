import { LM, Landmark, PoseFrame, rotateFrame } from '../pose/types';
import { allPassed, firstFailing, nearSide, runChecks } from './frameChecks';

/** A 33-landmark frame with every joint hidden, then the given joints placed. */
function frame(points: Partial<Record<number, [number, number, number?]>>): PoseFrame {
  const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0 }));
  for (const [i, p] of Object.entries(points)) {
    if (p) landmarks[Number(i)] = { x: p[0], y: p[1], z: 0, visibility: p[2] ?? 0.95 };
  }
  return { tMs: 0, width: 1280, height: 720, landmarks };
}

// Side-on push-up plank, left side to the camera, head on the left. Far shoulder just behind the near one.
const plank = {
  [LM.leftEar]: [0.12, 0.55], [LM.leftShoulder]: [0.2, 0.6], [LM.rightShoulder]: [0.21, 0.6, 0.5],
  [LM.leftElbow]: [0.2, 0.7], [LM.leftWrist]: [0.2, 0.8], [LM.leftHip]: [0.5, 0.63],
  [LM.leftKnee]: [0.7, 0.66], [LM.leftAnkle]: [0.9, 0.68],
} as const;

// Lying back for sit-ups, knees bent up.
const situpReady = {
  [LM.leftEar]: [0.12, 0.8], [LM.leftShoulder]: [0.2, 0.8], [LM.rightShoulder]: [0.21, 0.8, 0.5],
  [LM.leftElbow]: [0.15, 0.75], [LM.leftWrist]: [0.13, 0.78], [LM.leftHip]: [0.5, 0.82],
  [LM.leftKnee]: [0.62, 0.62], [LM.leftAnkle]: [0.74, 0.82],
} as const;

test('with no pose frame every check is unknown', () => {
  expect(runChecks('pushup', null).map((c) => c.status)).toEqual(['unknown', 'unknown', 'unknown']);
  expect(runChecks('situp', null).map((c) => c.id)).toEqual(['side_on', 'whole_body', 'knees_bent']);
});

test('a side-on plank in frame passes every push-up check', () => {
  const checks = runChecks('pushup', frame(plank as never));
  expect(checks.map((c) => c.status)).toEqual(['pass', 'pass', 'pass']);
  expect(allPassed(checks)).toBe(true);
});

test('feet past the edge fail "whole body in frame" and flag the ankle', () => {
  const checks = runChecks('pushup', frame({ ...plank, [LM.leftAnkle]: [1.02, 0.68] } as never));
  expect(firstFailing(checks)).toEqual({ id: 'whole_body', status: 'fail', problem: 'feet_cut_off', joint: LM.leftAnkle });
});

test('facing the camera fails "side on"', () => {
  const checks = runChecks('pushup', frame({ ...plank, [LM.rightShoulder]: [0.35, 0.6] } as never));
  expect(firstFailing(checks)?.problem).toBe('facing_camera');
});

test('bent arms fail "in push-up position"', () => {
  const checks = runChecks('pushup', frame({ ...plank, [LM.leftElbow]: [0.27, 0.66] } as never));
  expect(firstFailing(checks)).toMatchObject({ id: 'pushup_position', problem: 'arms_bent', joint: LM.leftElbow });
});

test('sit-ups need bent knees', () => {
  expect(allPassed(runChecks('situp', frame(situpReady as never)))).toBe(true);
  const straight = runChecks('situp', frame({ ...situpReady, [LM.leftKnee]: [0.7, 0.81], [LM.leftAnkle]: [0.88, 0.8] } as never));
  expect(firstFailing(straight)).toMatchObject({ id: 'knees_bent', problem: 'legs_straight', joint: LM.leftKnee });
});

test('the near side is the more visible one', () => {
  expect(nearSide(frame(plank as never))).toBe('left');
  expect(nearSide(frame({ [LM.rightShoulder]: [0.2, 0.6], [LM.rightHip]: [0.5, 0.6] }))).toBe('right');
});

test('a frame from a phone turned the other way up reads the same once rotated', () => {
  const upright = frame(plank as never);
  const upsideDown = rotateFrame(upright, 180);
  expect(upsideDown.landmarks[LM.leftAnkle].y).toBeCloseTo(0.32);
  expect(runChecks('pushup', rotateFrame(upsideDown, 180)).map((c) => c.status)).toEqual(['pass', 'pass', 'pass']);
  expect(rotateFrame(rotateFrame(upright, 90), 270).landmarks[LM.leftAnkle]).toEqual(upright.landmarks[LM.leftAnkle]);
});
