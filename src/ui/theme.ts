/**
 * Design tokens (redesign spec section 4). Every colour, font, radius and gap the screens use
 * comes from here, so the look can change in one place.
 */

export const colors = {
  bg: '#0B0D0A',
  surface: '#161A14',
  surfaceSelected: '#1D231A',
  chip: '#232920',
  border: '#2A3026',
  text: '#EEF1EA',
  muted: '#9AA394',
  accent: '#8FBF6A',
  accentHover: '#A9D486',
  accentDark: '#5E8A44',
  gold: '#E0B354',
  goldDark: '#B98C34',
  goldShine: '#FFF3D1',
  danger: '#FF6B5E',
  cameraBg: '#1A1E17',
  cameraFloor: '#141712',
  scrim: 'rgba(11,13,10,0.7)',
  scrimLight: 'rgba(11,13,10,0.55)',
  scrimStrong: 'rgba(11,13,10,0.85)',
  white: '#FFFFFF',
} as const;

/** Font family names as registered with expo-font in the root layout. */
export const fonts = {
  display: 'BarlowCondensed_700Bold',
  displaySemi: 'BarlowCondensed_600SemiBold',
  body: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
} as const;

/** Files for expo-font's useFonts. */
export const fontFiles = {
  [fonts.display]: require('../../assets/fonts/BarlowCondensed_700Bold.ttf'),
  [fonts.displaySemi]: require('../../assets/fonts/BarlowCondensed_600SemiBold.ttf'),
  [fonts.body]: require('../../assets/fonts/Inter_400Regular.ttf'),
  [fonts.medium]: require('../../assets/fonts/Inter_500Medium.ttf'),
  [fonts.semibold]: require('../../assets/fonts/Inter_600SemiBold.ttf'),
};

/** The only gaps the layout uses; pick the nearest. */
export const gap = { xs: 8, s: 10, m: 12, l: 14, xl: 16, xxl: 18 } as const;

export const radius = { card: 16, row: 14, field: 12, panel: 24 } as const;

export const layout = {
  side: 24,
  /** Top padding on full screens, below the status bar. */
  top: 48,
  bottom: 40,
  touch: 44,
  primaryHeight: 52,
  secondaryHeight: 48,
} as const;

/** Every changing number lines up and does not jitter as it counts. */
export const tabular = { fontVariant: ['tabular-nums' as const] };

/** Text never grows past this multiple of its size with the system font setting (spec section 8). */
export const MAX_FONT_SCALE = 1.3;

export const type = {
  displayHuge: { fontFamily: fonts.display, fontSize: 112, lineHeight: 112, color: colors.text, ...tabular },
  hero: { fontFamily: fonts.display, fontSize: 84, lineHeight: 84, color: colors.text, ...tabular },
  screenTitle: { fontFamily: fonts.display, fontSize: 34, lineHeight: 36, color: colors.text },
  appBarTitle: { fontFamily: fonts.semibold, fontSize: 19, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.text },
  bodySmall: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.text },
  caption: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.muted },
  label: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  small: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
} as const;
