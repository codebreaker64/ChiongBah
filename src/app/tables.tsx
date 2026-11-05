import { Station, STATIONS } from '@/domain/scoring/table';
import { Body, Chip, ChipRow, colors } from '@/ui/kit';
import { radius } from '@/ui/theme';
import { STATION_LABEL } from '@/ui/labels';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';

// Official IPPT scoring tables for servicemen, cropped from the published PDFs.
const TABLES: Record<Station, number> = {
  pushup: require('../../assets/images/score-table-pushup.png'),
  situp: require('../../assets/images/score-table-situp.png'),
  run: require('../../assets/images/score-table-run.png'),
};
const ASPECT = 1165 / 1687;
// Wide enough to read 14 age columns; narrower screens scroll sideways.
const MIN_WIDTH = 720;

/** The official IPPT score tables, shown as images. */
export default function Tables() {
  const [station, setStation] = useState<Station>('pushup');
  const width = Math.max(useWindowDimensions().width - 40, MIN_WIDTH);
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <ChipRow>
        {STATIONS.map((s) => <Chip key={s} label={STATION_LABEL[s]} selected={station === s} onPress={() => setStation(s)} />)}
      </ChipRow>
      <Body muted small>Points for each result by age group. Scroll sideways to see every age group.</Body>
      <ScrollView horizontal showsHorizontalScrollIndicator style={styles.wide}>
        <Image
          source={TABLES[station]}
          style={[styles.image, { width, height: width / ASPECT }]}
          resizeMode="contain"
          accessibilityLabel={`${STATION_LABEL[station]} score table`}
        />
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 14, paddingBottom: 40 },
  wide: { borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.white },
  image: { backgroundColor: colors.white },
});
