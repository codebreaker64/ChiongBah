import { Body, colors } from '@/ui/kit';
import { Image, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';

// Placeholder until the official IPPT score table image is added.
// To swap it, replace assets/images/score-table.png and update ASPECT (width / height).
const TABLE = require('../../assets/images/score-table.png');
const ASPECT = 1200 / 1600;

/** The official IPPT score table, shown as an image. */
export default function Tables() {
  const width = useWindowDimensions().width - 32;
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} maximumZoomScale={4} minimumZoomScale={1}>
      <Body muted>Points for each station by age group.</Body>
      <Image
        source={TABLE}
        style={[styles.image, { width, height: width / ASPECT }]}
        resizeMode="contain"
        accessibilityLabel="IPPT score table"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  image: { borderRadius: 12, backgroundColor: colors.card },
});
