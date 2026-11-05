import { HELP, SUPPORT_EMAIL } from '@/content/legal';
import { Icon } from '@/ui/Icon';
import { Press, SectionTitle } from '@/ui/kit';
import { colors, fonts, layout, radius } from '@/ui/theme';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

/** Help & Support: an accordion, first answer open (redesign spec section 7.16). */
export default function Help() {
  const [open, setOpen] = useState<string | null>(HELP[0]?.heading ?? null);
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.group}>
        {HELP.map((s, i) => {
          const expanded = open === s.heading;
          return (
            <View key={s.heading} style={[styles.item, i > 0 && styles.divider]}>
              <Press
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                onPress={() => setOpen(expanded ? null : s.heading)}
                style={styles.question}
              >
                <Text style={[styles.questionText, expanded && { fontFamily: fonts.semibold }]}>{s.heading}</Text>
                <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
                  <Icon name="chevronDown" size={20} color={colors.muted} />
                </View>
              </Press>
              {expanded ? (
                <View style={styles.answer}>
                  {s.body.map((p) => <Text key={p} style={styles.body} selectable selectionColor={colors.accent}>{p}</Text>)}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
      {SUPPORT_EMAIL ? (
        <>
          <SectionTitle>Still stuck?</SectionTitle>
          <Press accessibilityRole="link" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Chiong%20Bah%20support`)} style={styles.email}>
            <Icon name="mail" size={22} color={colors.accent} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.emailTitle}>Email us</Text>
              <Text style={styles.emailDetail}>{SUPPORT_EMAIL}</Text>
            </View>
            <Icon name="chevron" size={20} color={colors.muted} />
          </Press>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: layout.bottom, gap: 12 },
  group: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.row, overflow: 'hidden' },
  item: {},
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  question: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 52, paddingHorizontal: 16, paddingVertical: 14 },
  questionText: { flex: 1, fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  answer: { gap: 8, paddingHorizontal: 16, paddingBottom: 14, marginTop: -6 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.muted },
  email: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.row, paddingVertical: 14, paddingHorizontal: 16 },
  emailTitle: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  emailDetail: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
});
