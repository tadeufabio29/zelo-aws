import { Dimensions, Platform } from 'react-native'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')

const isSmall  = SCREEN_W < 360
const isLarge  = SCREEN_W >= 414

export function rs(small: number, medium: number, large: number): number {
  if (isSmall) return small
  if (isLarge) return large
  return medium
}

export const colors = {
  blue:         '#5B9BD5',
  blueDark:     '#2A7ABF',
  blueLight:    '#EAF3FB',
  blueMid:      '#BDD9F0',
  purple:       '#9B7BC8',
  purpleDark:   '#7B4FA6',
  purpleLight:  '#F0EBF8',
  bgMain:       '#F4F6F9',
  bgWarm:       '#F5F0EB',
  bgCard:       '#FFFFFF',
  textPrimary:  '#1A1A2E',
  textSecondary:'#5A6478',
  textMuted:    '#8A95A3',
  textHint:     '#A0A8B3',
  border:       '#E8ECF0',
  success:      '#3D7A1A',
  successBg:    '#EEF7E4',
  warning:      '#92600A',
  warningBg:    '#FEF3C7',
  danger:       '#E53E3E',
  dangerBg:     '#FDE8E8',
  green:        '#3D9970',
  greenBg:      '#E8F5EE',
  white:        '#FFFFFF',
  dark:         '#1A1A2E',
  ov15:         'rgba(255,255,255,0.15)',
  ov20:         'rgba(255,255,255,0.20)',
  ov25:         'rgba(255,255,255,0.25)',
  ov70:         'rgba(255,255,255,0.70)',
  ov80:         'rgba(255,255,255,0.80)',
  ov90:         'rgba(255,255,255,0.90)',
}

export const typo = {
  xs:   rs(11, 12, 13),
  sm:   rs(13, 14, 15),
  md:   rs(14, 15, 16),
  lg:   rs(16, 17, 18),
  xl:   rs(18, 20, 22),
  xxl:  rs(22, 26, 30),
  hero: rs(28, 32, 36),
}

export const space = {
  xs:  rs(4,  6,  8),
  sm:  rs(8,  10, 12),
  md:  rs(12, 14, 16),
  lg:  rs(16, 18, 20),
  xl:  rs(20, 24, 28),
  xxl: rs(28, 32, 36),
}

export const radius = {
  sm:  rs(8,  10, 12),
  md:  rs(12, 13, 14),
  lg:  rs(16, 18, 20),
  xl:  rs(20, 24, 28),
  full: 999,
}

export const inputHeight = rs(44, 48, 52)
export const btnHeightMd = rs(46, 50, 54)
export const headerRadius = rs(20, 24, 28)

export const screen = { w: SCREEN_W, h: SCREEN_H, isSmall, isLarge }

export const cardStyle = {
  backgroundColor: colors.bgCard,
  borderRadius: radius.lg,
  borderWidth: 1,
  borderColor: colors.border,
}
