import { poseSource } from '@/adapters/pose/poseSource';
import { useCameraSession } from '@/app-state/CameraSession';
import { lockLandscape, lockPortrait } from '@/app-state/orientation';
import type { PoseFrame } from '@/domain/pose/types';
import { allPassed, firstFailing, runChecks } from '@/domain/reps/frameChecks';
import { CameraPreview, Checklist, Pill } from '@/ui/camera/parts';
import { Button, IconButton } from '@/ui/kit';
import { PROBLEM_COPY, STATION_LABEL, STATION_POSITION } from '@/ui/labels';
import { colors, fonts, MAX_FONT_SCALE } from '@/ui/theme';
import * as Speech from 'expo-speech';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PANEL = 300;
const COUNT_WORDS = ['3', '2', '1', 'Go'];

/**
 * Get in frame (redesign spec section 7.12), landscape. Shows the first failing check and flags its
 * joint. When every check passes, or on "Start anyway", the phone says "3, 2, 1, go" and the set begins.
 */
export default function GetInFrame() {
  const { station } = useCameraSession();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [frame, setFrame] = useState<PoseFrame | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const forced = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(useCallback(() => {
    lockLandscape();
    return () => { if (timer.current) clearTimeout(timer.current); Speech.stop(); };
  }, []));

  // Hands-free: the countdown starts once every check passes, and a check failing mid-countdown
  // cancels it, unless the user forced the start with "Start anyway".
  useEffect(() => {
    if (!poseSource.available) return undefined;
    return poseSource.start((f) => {
      setFrame(f);
      const ok = allPassed(runChecks(station, f));
      setCount((c) => {
        if (c === null) { if (ok) forced.current = false; return ok ? 0 : null; }
        if (!ok && !forced.current) { Speech.stop(); return null; }
        return c;
      });
    });
  }, [station]);

  const checks = runChecks(station, frame);
  const failing = firstFailing(checks);
  const ready = poseSource.available && allPassed(checks);

  const cancel = useCallback(() => {
    Speech.stop();
    setCount(null);
  }, []);

  // Each step of "3, 2, 1, go" is spoken and shown, then the next one follows a second later.
  useEffect(() => {
    if (count === null) return undefined;
    Speech.speak(COUNT_WORDS[count], { rate: 1.05 });
    AccessibilityInfo.announceForAccessibility(COUNT_WORDS[count]);
    const last = count === COUNT_WORDS.length - 1;
    timer.current = setTimeout(() => {
      if (last) router.replace('/camera/live');
      else setCount(count + 1);
    }, last ? 600 : 1000);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [count]);

  const startAnyway = () => { if (count !== null) return; forced.current = true; setCount(0); };
  const close = () => { cancel(); lockPortrait(); router.dismissTo('/'); };

  const heading = count !== null ? 'Get ready'
    : failing?.problem ? PROBLEM_COPY[failing.problem].heading
    : ready ? 'Hold still'
    : `Get into ${STATION_POSITION[station]}`;
  const help = failing?.problem ? `${PROBLEM_COPY[failing.problem].help} The timer starts by itself once everything is ticked.`
    : poseSource.available ? 'The timer starts by itself once everything is ticked.'
    : 'Body tracking is not in this version yet. Check the list yourself, then tap Start anyway.';
  // The panel's rounded corners show the camera background, as on the canvas.
  const previewWidth = Math.max(0, width - PANEL);

  return (
    <View style={styles.root}>
      <CameraPreview
        width={previewWidth}
        height={height}
        frame={frame}
        flaggedJoint={failing?.joint}
        label={`Camera view for ${STATION_LABEL[station].toLowerCase()}${failing?.problem ? `. ${PROBLEM_COPY[failing.problem].help}` : ''}`}
      />
      <View style={[styles.topLeft, { left: 16 + insets.left }]}>
        <IconButton icon="close" label="Close" variant="scrim" iconSize={22} onPress={close} />
        <Pill>{`${STATION_LABEL[station]} · 1:00`}</Pill>
      </View>
      {count !== null ? (
        <View style={[styles.countWrap, { width: previewWidth }]} pointerEvents="none">
          <Text style={styles.countText} maxFontSizeMultiplier={1}>{COUNT_WORDS[count]}</Text>
        </View>
      ) : null}
      <View style={[styles.panel, { paddingRight: 24 + insets.right }]}>
        <ScrollView contentContainerStyle={{ gap: 12, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <Text style={styles.heading} accessibilityRole="header" accessibilityLiveRegion="polite" maxFontSizeMultiplier={MAX_FONT_SCALE}>{heading}</Text>
          <Text style={styles.help}>{help}</Text>
          <Checklist checks={checks} />
          <View style={{ marginTop: 'auto', paddingTop: 12 }}>
            {count === null ? <Button secondary label="Start anyway" onPress={startAnyway} /> : <Button variant="tertiary" label="Cancel" onPress={cancel} />}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cameraBg, flexDirection: 'row' },
  topLeft: { position: 'absolute', top: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  countWrap: { position: 'absolute', left: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  countText: { fontFamily: fonts.display, fontSize: 120, lineHeight: 124, color: colors.text, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 12 },
  panel: { position: 'absolute', right: 0, top: 0, bottom: 0, width: PANEL, backgroundColor: colors.bg, borderTopLeftRadius: 24, borderBottomLeftRadius: 24, paddingTop: 24, paddingLeft: 24, paddingBottom: 20 },
  heading: { fontFamily: fonts.display, fontSize: 26, lineHeight: 29, color: colors.text },
  help: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.muted },
});
