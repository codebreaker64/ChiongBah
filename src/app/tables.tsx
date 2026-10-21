import { useAppData } from '@/app-state/useAppData';
import { formatRunTime } from '@/domain/entries/validate';
import { scoringAge } from '@/domain/profile';
import { heatmap } from '@/domain/scoring/heatmap';
import { bandForAge, MAX_POINTS, Station, STATIONS } from '@/domain/scoring/table';
import { currentTable } from '@/domain/scoring/tables';
import { Emblem } from '@/ui/Emblem';
import { Body, Chip, ChipRow, colors } from '@/ui/kit';
import { plural, STATION_LABEL } from '@/ui/labels';
import { PracticeEstimateLabel } from '@/ui/PracticeEstimateLabel';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const CELL_W = 52;
const CELL_H = 32;
const LABEL_W = 64;

/** Blend two #RRGGBB colours; t = 0 gives a, 1 gives b. */
function mix(a: string, b: string, t: number): string {
  const ch = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t).toString(16).padStart(2, '0')).join('')}`;
}

/** Points by age group and result for one station, as a colour-scaled grid. */
export default function Tables() {
  const { profile, today, latest } = useAppData();
  const [station, setStation] = useState<Station>('pushup');

  if (!currentTable) {
    return (
      <View style={[styles.page, styles.empty]}>
        <Emblem symbol={{ ios: 'tablecells', android: 'table_chart', web: 'table_chart' }} />
        <Text style={styles.emptyTitle}>Score tables not added yet</Text>
        <Body muted>Once the official IPPT tables are in the app, you&apos;ll see points for every age group and result here.</Body>
      </View>
    );
  }

  const h = heatmap(currentTable, station);
  const myBand = profile ? bandForAge(currentTable, scoringAge(profile, today))?.id : undefined;
  const mine = latest[station];
  // The row your latest result falls into: first threshold you meet.
  const myRow = mine === null ? -1 : h.results.findIndex((r) => (station === 'run' ? mine <= r : mine >= r));
  const max = MAX_POINTS[station];
  const fmt = (r: number) => (station === 'run' ? formatRunTime(r) : String(r));

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <ChipRow>
        {STATIONS.map((s) => <Chip key={s} label={STATION_LABEL[s]} selected={station === s} onPress={() => setStation(s)} />)}
      </ChipRow>
      <Body muted>{`Points out of ${max} by age group. Your age group and latest result are outlined.`}</Body>

      <View style={styles.grid}>
        <View>
          <View style={[styles.headCell, { width: LABEL_W }]}><Text style={styles.headText}>{station === 'run' ? 'Time' : 'Reps'}</Text></View>
          {h.results.map((r, i) => (
            <View key={r} style={[styles.rowLabel, i === myRow && styles.rowLabelMine]}>
              <Text style={[styles.rowText, i === myRow && styles.mineText]}>{fmt(r)}</Text>
            </View>
          ))}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={styles.row}>
              {h.bands.map((b) => (
                <View key={b.id} style={[styles.headCell, b.id === myBand && styles.headMine]}>
                  <Text style={[styles.headText, b.id === myBand && styles.mineText]}>{b.maxAge >= 99 ? `${b.minAge}+` : b.minAge === 0 ? `<${b.maxAge + 1}` : `${b.minAge}–${b.maxAge}`}</Text>
                </View>
              ))}
            </View>
            {h.points.map((row, i) => (
              <View key={h.results[i]} style={styles.row}>
                {row.map((p, j) => {
                  const t = p / max;
                  const isMine = i === myRow && h.bands[j].id === myBand;
                  return (
                    <View
                      key={h.bands[j].id}
                      accessibilityLabel={`${fmt(h.results[i])}, age ${h.bands[j].minAge} to ${h.bands[j].maxAge}: ${plural(p, 'point')}`}
                      style={[styles.cell, { backgroundColor: p === 0 ? colors.bg : mix(colors.card, colors.accent, 0.15 + 0.85 * t) }, isMine && styles.cellMine]}
                    >
                      <Text style={[styles.cellText, { color: t > 0.6 ? colors.accentText : colors.text }]}>{p === 0 ? '–' : String(p)}</Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendText}>1</Text>
        <View style={styles.legendBar}>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => <View key={t} style={[styles.legendStep, { backgroundColor: mix(colors.card, colors.accent, 0.15 + 0.85 * t) }]} />)}
        </View>
        <Text style={styles.legendText}>{String(max)}</Text>
      </View>
      <PracticeEstimateLabel />
      <Body muted>{`Source: ${currentTable.source}, retrieved ${currentTable.retrievedOn}.`}</Body>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  empty: { padding: 24, gap: 16, justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: colors.text, textAlign: 'center' },
  grid: { flexDirection: 'row' },
  row: { flexDirection: 'row' },
  headCell: { width: CELL_W, height: CELL_H, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  headMine: { backgroundColor: colors.chipBg },
  headText: { fontSize: 12, color: colors.muted, fontVariant: ['tabular-nums'] },
  mineText: { color: colors.text, fontWeight: '700' },
  rowLabel: { width: LABEL_W, height: CELL_H, justifyContent: 'center', paddingRight: 8, alignItems: 'flex-end', borderRadius: 6 },
  rowLabelMine: { backgroundColor: colors.chipBg },
  rowText: { fontSize: 13, color: colors.muted, fontVariant: ['tabular-nums'] },
  cell: { width: CELL_W - 2, height: CELL_H - 2, margin: 1, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  cellMine: { borderWidth: 2, borderColor: colors.text },
  cellText: { fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendBar: { flex: 1, flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden' },
  legendStep: { flex: 1 },
  legendText: { fontSize: 12, color: colors.muted },
});
