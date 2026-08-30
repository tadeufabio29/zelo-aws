import { Dimensions, ScaledSize } from 'react-native'
import { useState, useEffect } from 'react'

const getBreakpoint = (width: number) => {
  if (width < 480) return 'mobile'
  if (width < 768) return 'tablet'
  return 'desktop'
}

export function useResponsive() {
  const [screen, setScreen] = useState<ScaledSize>(Dimensions.get('window'))

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreen(window)
    })
    return () => subscription.remove()
  }, [])

  const breakpoint = getBreakpoint(screen.width)
  const safeWidth = Math.max(screen.width, 320) // ✅ garante largura mínima segura

  return {
    width: screen.width,
    height: screen.height,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    breakpoint,
    contentWidth: breakpoint === 'desktop' ? 390 : safeWidth, // ✅ nunca retorna 0
  }
}