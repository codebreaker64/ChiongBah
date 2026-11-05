import type { DocSection } from '@/content/legal';
import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, layout } from './theme';

/** A long-read text page (Terms, Privacy) under the stack header. */
export function DocScreen({ intro, sections, footer }: { intro?: string; sections: DocSection[]; footer?: ReactNode }) {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      {intro ? <Text style={styles.intro}>{intro}</Text> : null}
      {sections.map((s) => (
        <View key={s.heading} style={styles.section}>
          <Text style={styles.heading} accessibilityRole="header">{s.heading}</Text>
          {s.body.map((p) => <Text key={p} style={styles.body} selectable selectionColor={colors.accent}>{p}</Text>)}
        </View>
      ))}
      {footer}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: layout.bottom, gap: 22 },
  intro: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  section: { gap: 8 },
  heading: { fontFamily: fonts.semibold, fontSize: 17, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23, color: colors.muted },
});
