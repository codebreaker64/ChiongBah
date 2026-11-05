import { createRepCounter, poseSource } from '@/adapters/pose/poseSource';
import { now } from '@/app-state/clock';
import { useCameraSession } from '@/app-state/CameraSession';
import { lockLandscape } from '@/app-state/orientation';
import { useRepositories } from '@/app-state/RepositoriesContext';
import { useAppData } from '@/app-state/useAppData';
import type { PoseFrame } from '@/domain/pose/types';
import { validCount } from '@/domain/reps/pacing';
import { FormFault, RepOutcome, RepRecord, SET_MS } from '@/domain/reps/types';
import { scoringAge } from '@/domain/profile';
import { bandForAge, stationPoints } from '@/domain/scoring/table';
import { currentTable } from '@/domain/scoring/tables';
import { CameraPreview, Pill, TimerRing } from '@/ui/camera/parts';
import { Icon } from '@/ui/Icon';
import { Button } from '@/ui/kit';
import { FAULT_CUE, FAULT_SPOKEN, STATION_LABEL } from '@/ui/labels';
import { DURATION, EASE, useMotionOK } from '@/ui/motion';
import { colors, fonts } from '@/ui/theme';
import { useAudioPlayer } from 'expo-audio';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PANEL = 240;
const CUE_MS = 2500;

const formatLeft = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} left`;
};

/** Words for a no-count, for the cue card and the screen reader. */
type Cue = { text: string; spoken: string; icon: 'arrowDown' | 'arrowUp' | 'info' };

/** Faults fixed by going higher get an up arrow; the rest point down. */
const UP_FAULTS = new Set<FormFault>(['no_lockout', 'elbows_short_of_knees', 'hips_sagging']);

function cueFor(outcome: RepOutcome): Cue {
  if (outcome.kind === 'no_count_form' && outcome.reasons[0]) {
    const f = outcome.reasons[0];
    return { text: FAULT_CUE[f], spoken: `Not counted, ${FAULT_SPOKEN[f]}`, icon: UP_FAULTS.has(f) ? 'arrowUp' : 'arrowDown' };
  }
  if (outcome.kind === 'no_count_unclear') return { text: "Couldn't see you clearly: that one didn't count", spoken: 'Not counted, the camera could not see you clearly', icon: 'info' };
  return { text: "That one didn't count", spoken: 'Not counted', icon: 'info' };
}

/**
 * Counting (redesign spec section 7.13), landscape. A 60 s set: the ring drains, each counted rep
 * pops the number and ticks, and a no-count slides up a cue for 2.5 s. Without a pose model,
 * a tap on the preview counts a rep and a long press marks one that didn't count.
 */
const WAKE_TAG = 'chiongbah-counting';

export default function Counting() {
  // Keep the screen on for the whole set. Failures (e.g. the lock not granted yet) are not worth a crash.
  useEffect(() => {
    activateKeepAwakeAsync(WAKE_TAG).catch(() => {});
    return () => { deactivateKeepAwake(WAKE_TAG).catch(() => {}); };
  }, []);
  const repos = useRepositories();
  const { today, profile } = useAppData();
  const { station, setResult } = useCameraSession();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const motionOK = useMotionOK();
  const tickPlayer = useAudioPlayer(require('../../../assets/sounds/tick.wav'));

  const [startMs] = useState(() => Date.now());
  const [startedAt] = useState(() => now().toISOString());
  const [elapsed, setElapsed] = useState(0);
  const [reps, setReps] = useState<RepRecord[]>([]);
  const [frame, setFrame] = useState<PoseFrame | null>(null);
  const [cue, setCue] = useState<Cue | null>(null);
  const finished = useRef(false);
  const repsRef = useRef<RepRecord[]>([]);

  const best = useMemo(() => repos.sessions.bestResults()[station], [repos, station]);
  const band = profile && currentTable ? bandForAge(currentTable, scoringAge(profile, today)) : null;
  const count = validCount(reps);
  const notCounted = reps.length - count;
  const points = band && currentTable ? stationPoints(currentTable, band.id, station, count) : null;
  const remaining = Math.max(0, SET_MS - elapsed);

  useFocusEffect(useCallback(() => { lockLandscape(); }, []));

  const finish = useCallback((stoppedEarly: boolean) => {
    if (finished.current) return;
    finished.current = true;
    setResult({ station, startedAt: startedAt, reps: repsRef.current, stoppedEarly });
    router.replace('/camera/result');
  }, [station, startedAt, setResult]);

  // The real timer; the ring and the "left" pill follow it.
  useEffect(() => {
    const id = setInterval(() => {
      const e = Date.now() - startMs;
      setElapsed(e);
      if (e >= SET_MS) finish(false);
    }, 250);
    return () => clearInterval(id);
  }, [finish, startMs]);

  // Number pop on each counted rep; cue card slides up on each no-count.
  const pop = useSharedValue(1);
  const cueIn = useSharedValue(0);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const cueStyle = useAnimatedStyle(() => ({ opacity: cueIn.value, transform: [{ translateY: (1 - cueIn.value) * 10 }] }));
  const cueTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (cueTimer.current) clearTimeout(cueTimer.current); }, []);

  const record = useCallback((rep: RepRecord) => {
    if (finished.current) return;
    const next = [...repsRef.current, rep];
    repsRef.current = next;
    setReps(next);
    if (rep.outcome.kind === 'valid') {
      tickPlayer.seekTo(0).catch(() => {});
      tickPlayer.play();
      if (motionOK) pop.set(withSequence(withTiming(1.1, { duration: 60 }), withTiming(1, { duration: 240, easing: EASE })));
      const n = validCount(next);
      if (n % 5 === 0) AccessibilityInfo.announceForAccessibility(`${n} reps`);
    } else {
      const c = cueFor(rep.outcome);
      setCue(c);
      AccessibilityInfo.announceForAccessibility(c.spoken);
      cueIn.set(motionOK ? 0 : 1);
      if (motionOK) cueIn.set(withTiming(1, { duration: DURATION.cue, easing: EASE }));
      if (cueTimer.current) clearTimeout(cueTimer.current);
      cueTimer.current = setTimeout(() => {
        if (motionOK) cueIn.set(withTiming(0, { duration: DURATION.cue }));
        setTimeout(() => setCue(null), motionOK ? DURATION.cue : 0);
      }, CUE_MS);
    }
  }, [tickPlayer, motionOK, pop, cueIn]);

  // Pose-driven counting, when a model is available.
  useEffect(() => {
    if (!poseSource.available || !createRepCounter) return undefined;
    const counter = createRepCounter(station, startMs);
    return poseSource.start((f) => {
      setFrame(f);
      const rep = counter.push(f);
      if (rep) record(rep);
    });
  }, [station, startMs, record]);

  // Counting by tap: a buddy, or you, taps the preview for each rep.
  const tapRep = (outcome: RepOutcome) => {
    const t = Date.now() - startMs;
    record({ index: repsRef.current.length, startMs: Math.max(0, t - 1000), endMs: t, outcome, metrics: {} });
  };

  // The panel's rounded corners show the camera background, as on the canvas.
  const previewWidth = Math.max(0, width - PANEL);
  return (
    <View style={styles.root}>
      <Pressable
        onPress={() => tapRep({ kind: 'valid' })}
        onLongPress={() => tapRep({ kind: 'no_count_form', reasons: [] })}
        disabled={poseSource.available}
        accessibilityRole={poseSource.available ? 'image' : 'button'}
        accessibilityLabel={poseSource.available ? undefined : 'Count a rep'}
        accessibilityHint={poseSource.available ? undefined : 'Long press for a rep that did not count'}
      >
        <CameraPreview width={previewWidth} height={height} frame={frame} brackets={false}
          label={`Camera view: ${STATION_LABEL[station].toLowerCase()} in progress`} />
      </Pressable>

      <View style={[styles.topLeft, { left: 16 + insets.left }]} pointerEvents="none">
        <Pill>{STATION_LABEL[station]}</Pill>
        <Pill dot>{formatLeft(remaining)}</Pill>
      </View>

      {!poseSource.available && reps.length === 0 ? (
        <View style={[styles.hintWrap, { width: previewWidth }]} pointerEvents="none">
          <Text style={styles.hint}>Tap the screen for each rep. Long press for one that didn&apos;t count.</Text>
        </View>
      ) : null}

      {cue ? (
        <View style={[styles.cueWrap, { width: previewWidth }]} pointerEvents="none">
          <Animated.View style={[styles.cue, cueStyle]}>
            <Icon name={cue.icon} size={20} color={colors.gold} strokeWidth={2.2} />
            <Text style={styles.cueText}>{cue.text}</Text>
          </Animated.View>
        </View>
      ) : null}

      <View style={[styles.panel, { paddingRight: 20 + insets.right }]}>
        <TimerRing remainingMs={remaining} totalMs={SET_MS} smooth={motionOK}>
          <View accessible accessibilityLiveRegion="polite" accessibilityLabel={`${count} reps`}>
            <Animated.Text style={[styles.count, popStyle]} maxFontSizeMultiplier={1}>{String(count)}</Animated.Text>
          </View>
        </TimerRing>
        <Text style={styles.sub}>{points !== null ? `reps · ${points} pts` : 'reps'}</Text>
        <View style={styles.foot}>
          <Text style={styles.footStrong}>{`${notCounted} not counted`}</Text>
          {best !== null ? <Text style={styles.footMuted}>{`Best so far: ${best}`}</Text> : null}
        </View>
        <View style={{ alignSelf: 'stretch', marginTop: 8 }}>
          <Button variant="danger" icon="stop" label="Stop" accessibilityHint="Ends the set and shows your result" onPress={() => finish(true)} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cameraBg },
  topLeft: { position: 'absolute', top: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  hintWrap: { position: 'absolute', left: 0, bottom: 24, alignItems: 'center' },
  hint: { fontFamily: fonts.medium, fontSize: 14, color: colors.text, backgroundColor: colors.scrimStrong, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 14, overflow: 'hidden' },
  cueWrap: { position: 'absolute', left: 0, top: 76, alignItems: 'center' },
  cue: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, backgroundColor: colors.scrimStrong, borderWidth: 1, borderColor: colors.gold },
  cueText: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  panel: { position: 'absolute', right: 0, top: 0, bottom: 0, width: PANEL, backgroundColor: colors.bg, borderTopLeftRadius: 24, borderBottomLeftRadius: 24, paddingTop: 22, paddingLeft: 20, paddingBottom: 20, alignItems: 'center', gap: 6 },
  count: { fontFamily: fonts.display, fontSize: 84, lineHeight: 88, color: colors.text, fontVariant: ['tabular-nums'] },
  sub: { fontFamily: fonts.medium, fontSize: 16, color: colors.text, fontVariant: ['tabular-nums'] },
  foot: { marginTop: 'auto', alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between' },
  footStrong: { fontFamily: fonts.medium, fontSize: 13, color: colors.text, fontVariant: ['tabular-nums'] },
  footMuted: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, fontVariant: ['tabular-nums'] },
});
