export const theme = {
  colors: {
    background: '#F7F8FA',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F3F7',
    text: '#111318',
    textOnPrimary: '#FFFFFF',
    muted: '#6B7280',
    subtle: '#9CA3AF',
    border: '#E7E9EE',
    divider: '#EFF1F5',
    primary: '#1B4DE4',
    primaryPressed: '#1440BE',
    primarySoft: '#EEF2FE',
    danger: '#D92D20',
    dangerSoft: '#FDECEA',
    success: '#12805C',
    successSoft: '#E6F4EA',
    star: '#F5A524',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 999,
  },
  // Role objects bundling size+weight+lineHeight so screens stop re-pairing
  // a bare size with an ad-hoc weight/lineHeight each time. Spread into a
  // Text style: `{ ...theme.text.title, color: theme.colors.text }`.
  text: {
    display: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
    title: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const },
    heading: { fontSize: 17, lineHeight: 22, fontWeight: '600' as const },
    body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
    bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' as const },
    label: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
    caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
    micro: { fontSize: 11, lineHeight: 14, fontWeight: '600' as const },
  },
  shadow: {
    // In-flow cards: hairline border already does the separation, shadow is
    // just a hint of lift.
    soft: {
      shadowColor: '#111318',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    // Map overlays only (floating buttons, bottom sheet over the map).
    floating: {
      shadowColor: '#111318',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 8,
    },
  },
};
