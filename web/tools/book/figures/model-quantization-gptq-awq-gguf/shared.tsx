import React, { type CSSProperties, type ReactElement, type ReactNode } from 'react'
import { getThemeColors, Scene } from 'vizmatic'
import type { ThemeColors, ThemeMode } from 'vizmatic'

export const width = 800

function flatten(children: ReactNode): ReactNode[] {
    return React.Children.toArray(children).flatMap((child) => {
        if (!React.isValidElement(child) || child.type !== React.Fragment) return [child]
        return flatten((child as ReactElement<{ children?: ReactNode }>).props.children)
    })
}

export function colors(theme: ThemeMode): ThemeColors {
    return getThemeColors(theme, 'engineering')
}

export function bookScene(c: ThemeColors, children: ReactNode): React.ReactElement {
    return <Scene c={c} padding={16} gap={12} contentWidth={width - 32}>{flatten(children)}</Scene>
}

export function panel(
    c: ThemeColors,
    children: ReactNode,
    options: { accent?: string; background?: string; padding?: number; gap?: number; style?: CSSProperties } = {},
): React.ReactElement {
    return <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: options.gap ?? 9,
        minWidth: 0,
        padding: options.padding ?? 13,
        border: `1px solid ${c.borderLight}`,
        borderTop: `3px solid ${options.accent ?? c.borderLight}`,
        borderRadius: 7,
        backgroundColor: options.background ?? c.bgCard,
        boxSizing: 'border-box',
        ...options.style,
    }}>{flatten(children)}</div>
}

export function label(
    c: ThemeColors,
    children: ReactNode,
    options: { size?: number; color?: string; weight?: number; mono?: boolean; style?: CSSProperties } = {},
): React.ReactElement {
    return <div style={{
        display: 'flex',
        minWidth: 0,
        color: options.color ?? c.textPrimary,
        fontFamily: options.mono ? c.fontMono : c.fontSans,
        fontSize: options.size ?? 15,
        fontWeight: options.weight ?? 500,
        lineHeight: 1.25,
        ...options.style,
    }}>{children}</div>
}

export function row(children: ReactNode, gap = 10, style: CSSProperties = {}): React.ReactElement {
    return <div style={{ display: 'flex', alignItems: 'stretch', gap, minWidth: 0, ...style }}>{flatten(children)}</div>
}

export function cell(
    c: ThemeColors,
    children: ReactNode,
    options: { width?: number; color?: string; background?: string; mono?: boolean; weight?: number; align?: 'left' | 'center'; style?: CSSProperties } = {},
): React.ReactElement {
    return <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: options.align === 'left' ? 'flex-start' : 'center',
        width: options.width,
        minWidth: 0,
        minHeight: 34,
        padding: '5px 7px',
        border: `1px solid ${c.borderSubtle}`,
        borderRadius: 4,
        backgroundColor: options.background ?? c.bgSubtle,
        boxSizing: 'border-box',
        ...options.style,
    }}>
        {label(c, children, { size: 14, color: options.color, weight: options.weight ?? 600, mono: options.mono, style: { width: '100%', justifyContent: options.align === 'left' ? 'flex-start' : 'center', ...options.style } })}
    </div>
}

export function tag(c: ThemeColors, children: ReactNode, accent = c.primaryDark): React.ReactElement {
    return <div style={{ display: 'flex', alignItems: 'center', padding: '5px 9px', border: `1px solid ${accent}`, borderRadius: 12, backgroundColor: c.bgSubtle, boxSizing: 'border-box' }}>
        {label(c, children, { size: 14, color: accent, weight: 700, style: { whiteSpace: 'nowrap' } })}
    </div>
}
