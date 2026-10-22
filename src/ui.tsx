import { Pressable, StyleSheet, Text, View } from 'react-native';

export const colors = { background: '#F8F7F2', ink: '#0D1734', teal: '#086B63', darkTeal: '#075B58', muted: '#75828B', line: '#E7EBE8', coral: '#F5846C', white: '#FFFFFF' };
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 35 },
  logo: { fontFamily: 'Georgia', fontWeight: '700', color: colors.ink, fontSize: 38, letterSpacing: -3 },
  eyebrow: { color: '#84919A', fontSize: 11, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800', letterSpacing: -1, marginTop: 9 },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 7, lineHeight: 21 },
  sectionTitle: { color: colors.ink, fontSize: 21, fontWeight: '800', letterSpacing: -.5 },
  card: { backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1, borderRadius: 19, padding: 18 },
  button: { backgroundColor: colors.teal, borderRadius: 13, paddingVertical: 14, paddingHorizontal: 17, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  outlineButton: { borderColor: '#AFCCC4', borderWidth: 1, borderRadius: 13, paddingVertical: 13, paddingHorizontal: 15, alignItems: 'center' },
  outlineText: { color: colors.teal, fontWeight: '800', fontSize: 13 },
  label: { color: colors.ink, fontWeight: '700', fontSize: 12, marginBottom: 7 },
  input: { backgroundColor: colors.white, borderColor: '#DDE5E0', borderWidth: 1, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 12, color: colors.ink, fontSize: 15 },
});

export function PrimaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={disabled} style={[styles.button, disabled && { opacity: .5 }]}><Text style={styles.buttonText}>{label}</Text></Pressable>;
}
export function OutlineButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.outlineButton}><Text style={styles.outlineText}>{label}</Text></Pressable>;
}
export function Section({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}><View>{eyebrow ? <Text style={[styles.eyebrow, { marginBottom: 6 }]}>{eyebrow}</Text> : null}<Text style={styles.sectionTitle}>{title}</Text></View>{right}</View>;
}
