import React, { type ReactNode } from 'react'
import { getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export function colors(theme: ThemeMode) {
    return getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
}

export type PrintColors = ReturnType<typeof colors>

export function frame(c: PrintColors, children: ReactNode) {
    return React.createElement('div', {
        style: { display: 'flex', flexDirection: 'column', width: '100%', gap: 10, fontFamily: c.fontSans, color: c.textPrimary },
    }, children)
}

export function label(c: PrintColors, value: string, size = 15, bold = false, color = c.textPrimary, mono = false) {
    return React.createElement('div', {
        style: { display: 'flex', alignItems: 'center', fontFamily: mono ? c.fontMono : c.fontSans, fontSize: size, fontWeight: bold ? 700 : 400, color },
    }, value)
}

interface CellOptions {
    width?: number
    height?: number
    grow?: number
    background?: string
    color?: string
    border?: string
    fontSize?: number
    bold?: boolean
    mono?: boolean
    align?: 'left' | 'center'
}

export function cell(c: PrintColors, value: string, options: CellOptions = {}) {
    return React.createElement('div', {
        style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: options.align === 'left' ? 'flex-start' : 'center',
            flexGrow: options.grow ?? 0,
            flexShrink: 0,
            width: options.width,
            minWidth: 0,
            height: options.height ?? 38,
            padding: '2px 5px',
            boxSizing: 'border-box',
            backgroundColor: options.background ?? 'transparent',
            border: `1px solid ${options.border ?? c.borderSubtle}`,
            color: options.color ?? c.textPrimary,
            fontFamily: options.mono ? c.fontMono : c.fontSans,
            fontSize: options.fontSize ?? 15,
            fontWeight: options.bold ? 700 : 400,
        },
    }, value)
}

export function panel(c: PrintColors, title: string, children: ReactNode | ReactNode[], width?: number) {
    return React.createElement('div', {
        style: { display: 'flex', flexDirection: 'column', flex: width ? 'none' : 1, ...(width === undefined ? {} : { width }), minWidth: 0, gap: 8, padding: 9, boxSizing: 'border-box', border: `1px solid ${c.border}`, borderRadius: 5 },
    }, [label(c, title, 17, true), ...React.Children.toArray(children)])
}

export function band(c: PrintColors, children: ReactNode, background = c.bgSubtle, border = c.borderSubtle) {
    return React.createElement('div', {
        style: { display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px', boxSizing: 'border-box', backgroundColor: background, border: `1px solid ${border}`, borderRadius: 4 },
    }, children)
}
