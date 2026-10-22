import { Text } from 'react-native';
import { colors } from './kit';

/** Shown with every score or award: the app is unofficial (spec section 2). */
export function PracticeEstimateLabel() {
  return <Text style={{ fontSize: 13, color: colors.muted, fontStyle: 'italic' }}>Practice estimate</Text>;
}
