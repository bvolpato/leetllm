import React, { type CSSProperties, type ReactNode } from 'react'
import { getThemeColors } from 'vizmatic'
import type { ThemeColors, ThemeMode } from 'vizmatic'

export function colors(theme: ThemeMode): ThemeColors {
    return getThemeColors(theme, 'engineering')
}

export function frame(c: ThemeColors, children: ReactNode): React.ReactElement {
    return <div style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        gap: 10,
        padding: 8,
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

export function row(children: ReactNode, gap = 6, style: CSSProperties = {}): React.ReactElement {
    return <div style={{ display: 'flex', alignItems: 'stretch', gap, minWidth: 0, ...style }}>{children}</div>
}

export function cell(
    c: ThemeColors,
    children: ReactNode,
    options: { width: number; height: number; background?: string; color?: string; align?: 'left' | 'center'; padding?: number; style?: CSSProperties },
): React.ReactElement {
    return <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: options.align === 'left' ? 'flex-start' : 'center',
        width: options.width,
        height: options.height,
        minWidth: 0,
        padding: options.padding ?? 7,
        border: `1px solid ${c.borderLight}`,
        borderRadius: 4,
        backgroundColor: options.background ?? c.bgCard,
        boxSizing: 'border-box',
        ...options.style,
    }}>{children}</div>
}
