import type { DocSection } from '@/content/legal';
import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from './kit';

/** A long-form text page (help, terms, privacy) under the stack header. */
export function DocScreen({ intro, sections, footer }: { intro?: string; sections: DocSection[]; footer?: ReactNode }) {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      {intro ? <Text style={styles.intro}>{intro}</Text> : null}
      {sections.map((s) => (
        <View key={s.heading} style={styles.section}>
          <Text style={styles.heading} accessibilityRole="header">{s.heading}</Text>
          {s.body.map((p) => <Text key={p} style={styles.body}>{p}</Text>)}
        </View>
      ))}
      {footer}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 20, paddingBottom: 40 },
  intro: { fontSize: 14, color: colors.muted },
  section: { gap: 6 },
  heading: { fontSize: 17, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, lineHeight: 22, color: colors.text },
});
