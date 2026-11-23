import { getThemeColors } from 'vizmatic'
import type { ThemeColors, ThemeMode } from 'vizmatic'

export function figureColors(theme: ThemeMode): ThemeColors {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    return {
        ...c,
        shadow: 'transparent',
        textMuted: c.textSecondary,
        ...(theme === 'light' ? {
            infoLight: '#0e7490', primaryLight: '#6d28d9',
            positiveLight: '#047857', criticalLight: '#b91c1c',
        } : {}),
    }
}
