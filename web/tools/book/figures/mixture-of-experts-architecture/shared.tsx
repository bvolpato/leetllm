import React, { type CSSProperties, type ReactNode } from 'react'
import { getThemeColors } from 'vizmatic'
import type { ThemeColors, ThemeMode } from 'vizmatic'

export function colors(theme: ThemeMode): ThemeColors {
    return getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
}

export function frame(c: ThemeColors, children: ReactNode): React.ReactElement {
    return <div style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        gap: 8,
        padding: 4,
        boxSizing: 'border-box',
        fontFamily: c.fontSans,
        color: c.textPrimary,
    }}>{children}</div>
}

export function text(
    c: ThemeColors,
    children: ReactNode,
    options: { size?: number; color?: string; weight?: number; mono?: boolean; style?: CSSProperties } = {},
): React.ReactElement {
    return <div style={{
        display: 'flex',
        minWidth: 0,
        color: options.color ?? c.textPrimary,
        fontFamily: options.mono ? c.fontMono : c.fontSans,
        fontSize: options.size ?? 14,
        fontWeight: options.weight ?? 500,
        lineHeight: 1.2,
        ...options.style,
    }}>{children}</div>
}
