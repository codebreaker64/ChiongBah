import type { CameraStation, RepRecord } from '@/domain/reps/types';
import { createContext, ReactNode, useContext, useState } from 'react';

/** One finished timed set, handed from Counting to Result. */
export type SetResult = { station: CameraStation; startedAt: string; reps: RepRecord[]; stoppedEarly: boolean };

type CameraSession = {
  station: CameraStation;
  setStation(s: CameraStation): void;
  result: SetResult | null;
  setResult(r: SetResult | null): void;
};

const Ctx = createContext<CameraSession | null>(null);

/** State shared by the camera flow's screens: the chosen station and the last set. */
export function CameraSessionProvider({ initial, children }: { initial: CameraStation; children: ReactNode }) {
  const [station, setStation] = useState<CameraStation>(initial);
  const [result, setResult] = useState<SetResult | null>(null);
  return <Ctx.Provider value={{ station, setStation, result, setResult }}>{children}</Ctx.Provider>;
}

export function useCameraSession(): CameraSession {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCameraSession must be used inside CameraSessionProvider');
  return ctx;
}
