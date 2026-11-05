/** Rep outcomes as the version 1 spec section 6.1 defines them. */

export type CameraStation = 'pushup' | 'situp';
export const CAMERA_STATIONS: CameraStation[] = ['pushup', 'situp'];

export type PushUpFault = 'no_lockout' | 'not_deep_enough' | 'hips_sagging' | 'hips_piking';
export type SitUpFault = 'not_back_down' | 'elbows_short_of_knees' | 'hands_off_head';
export type FormFault = PushUpFault | SitUpFault;

export type BodyPart = 'head' | 'shoulders' | 'arms' | 'hips' | 'knees' | 'feet';

export type RepOutcome =
  | { kind: 'valid' }
  /** Primary reason first. An empty list means the rep was marked by hand with no reason. */
  | { kind: 'no_count_form'; reasons: FormFault[] }
  | { kind: 'no_count_unclear'; missing: BodyPart[] };

export type RepRecord = { index: number; startMs: number; endMs: number; outcome: RepOutcome; metrics: Record<string, number> };

/** Length of a timed IPPT station. */
export const SET_MS = 60_000;
