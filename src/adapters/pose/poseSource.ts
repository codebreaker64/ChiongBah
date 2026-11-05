import type { PoseFrame } from '@/domain/pose/types';
import type { CameraStation, RepRecord } from '@/domain/reps/types';

/**
 * Streams pose frames from the camera (version 1 spec section 5). The on-device MediaPipe plugin
 * (`NativePoseSource`, a VisionCamera v5 frame processor) and `ReplayPoseSource` for recorded
 * landmark files will implement this.
 */
export interface PoseSource {
  /** False until a pose model is wired in; the camera screens then fall back to counting by tap. */
  readonly available: boolean;
  /** Saved with each camera session so results can be traced to the model that made them. */
  readonly modelVersion: string | null;
  /** Starts delivering frames, already rotated upright; returns a function that stops them. */
  start(onFrame: (frame: PoseFrame) => void): () => void;
}

/** Turns pose frames into reps for one station (version 1 spec sections 6.3 and 6.4). */
export interface RepCounter {
  /** Feeds one frame; returns the rep it completed, if any. */
  push(frame: PoseFrame): RepRecord | null;
}

export type RepCounterFactory = (station: CameraStation, startMs: number) => RepCounter;

/** No pose model in this build yet. */
export const poseSource: PoseSource = {
  available: false,
  modelVersion: null,
  start: () => () => {},
};

/** Set alongside a real PoseSource. */
export const createRepCounter: RepCounterFactory | null = null;
