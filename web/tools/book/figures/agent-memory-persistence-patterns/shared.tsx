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

export function frame(c: ThemeColors, children: ReactNode): React.ReactElement {
    return <Scene c={c} padding={16} gap={10} contentWidth={width - 32}>{flatten(children)}</Scene>
}

export function row(children: ReactNode, gap = 8, style: CSSProperties = {}): React.ReactElement {
    return <div style={{ display: 'flex', alignItems: 'stretch', gap, minWidth: 0, ...style }}>{flatten(children)}</div>
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
        fontSize: options.size ?? 15,
        fontWeight: options.weight ?? 500,
        lineHeight: 1.2,
        ...options.style,
    }}>{children}</div>
}

export function card(
    c: ThemeColors,
    children: ReactNode,
    options: { accent?: string; padding?: number; gap?: number; style?: CSSProperties } = {},
): React.ReactElement {
    return <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: options.gap ?? 5,
        minWidth: 0,
        padding: options.padding ?? 9,
        border: `1px solid ${c.borderLight}`,
        borderTop: `3px solid ${options.accent ?? c.borderLight}`,
        borderRadius: 6,
        backgroundColor: c.bgCard,
        boxSizing: 'border-box',
        ...options.style,
    }}>{flatten(children)}</div>
}
