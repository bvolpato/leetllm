import { createElement, type ReactNode } from 'react'
import { SvgFrame, SvgMathText, SvgPoint, VectorArrow, type ThemeColors } from 'vizmatic'

export interface FigureBounds {
    x: number
    y: number
    width: number
    height: number
}

export function roundedPanel(
    c: ThemeColors,
    key: string,
    bounds: FigureBounds,
    fill = c.bgSubtle,
    stroke = c.borderSubtle,
    radius = 18,
) {
    return SvgFrame({ key, c, ...bounds, rx: radius, fill, stroke, strokeWidth: 2 })
}

export function strokeLine(
    key: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    strokeWidth = 3,
    dash?: string,
    opacity = 1,
) {
    return createElement('line', {
        key,
        x1,
        y1,
        x2,
        y2,
        stroke: color,
        strokeWidth,
        strokeDasharray: dash,
        opacity,
        strokeLinecap: 'round',
    })
}

export function arrow(
    key: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    strokeWidth = 5,
) {
    return VectorArrow({ key, x1, y1, x2, y2, color, strokeWidth, arrowSize: 2.8 })
}

export function point(
    key: string,
    cx: number,
    cy: number,
    fill: string,
    radius = 8,
    stroke?: string,
    strokeWidth = 2,
) {
    return SvgPoint({ key, cx, cy, r: radius, fill, stroke, strokeWidth })
}

export function label(
    key: string,
    text: string,
    x: number,
    y: number,
    color: string,
    fontSize = 40,
    anchor: 'start' | 'middle' | 'end' = 'middle',
    fontFamily = 'Inter',
    fontWeight = 700,
) {
    return createElement(SvgMathText, {
        key,
        text,
        x,
        y,
        fill: color,
        fontSize,
        fontFamily,
        fontWeight,
        textAnchor: anchor,
        dominantBaseline: 'middle',
    })
}

/** JetBrains Mono uses a 0.6em advance. Start anchoring preserves that measured box. */
export function boundedMonoLabel(
    key: string,
    text: string,
    bounds: FigureBounds,
    c: ThemeColors,
    fontSize = 40,
    color = '#ffffff',
    minimumPadding = 12,
) {
    const advance = Array.from(text).length * fontSize * 0.6
    const padding = (bounds.width - advance) / 2
    if (padding < minimumPadding) {
        throw new Error(
            `${key} advance ${advance.toFixed(2)}px does not fit ${bounds.width}px with ${minimumPadding}px padding`,
        )
    }
    return label(
        key,
        text,
        bounds.x + padding,
        bounds.y + bounds.height / 2,
        color,
        fontSize,
        'start',
        c.fontMono,
    )
}

/** Renders code identifiers as literal text instead of parsing underscores as math. */
export function literalBoundedMonoLabel(
    key: string,
    text: string,
    bounds: FigureBounds,
    c: ThemeColors,
    fontSize = 40,
    color = '#ffffff',
    minimumPadding = 12,
) {
    const advance = Array.from(text).length * fontSize * 0.6
    const padding = (bounds.width - advance) / 2
    if (padding < minimumPadding) {
        throw new Error(
            `${key} literal advance ${advance.toFixed(2)}px does not fit ${bounds.width}px with ${minimumPadding}px padding`,
        )
    }
    return createElement(
        'div',
        {
            key,
            style: {
                position: 'absolute',
                left: bounds.x,
                top: bounds.y,
                width: bounds.width,
                height: bounds.height,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color,
                fontSize,
                fontFamily: c.fontMono,
                fontWeight: 700,
                lineHeight: 1,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
            },
        },
        text,
    )
}

export function svgLayer(
    key: string,
    width: number,
    height: number,
    shapes: ReactNode,
    labels: ReactNode,
) {
    return createElement(
        'div',
        { key, style: { position: 'relative', width, height } },
        createElement(
            'svg',
            {
                width,
                height,
                viewBox: `0 0 ${width} ${height}`,
                style: { position: 'absolute', left: 0, top: 0 },
            },
            shapes,
        ),
        labels,
    )
}

export function themeText(c: ThemeColors): string {
    return c.textPrimary
}

export function readableTone(
    tone: 'blue' | 'purple' | 'green' | 'warm' | 'critical' | 'cyan',
    c: ThemeColors,
): string {
    return tone === 'blue'
        ? c.primaryDark
        : tone === 'purple'
          ? c.secondaryDark
          : tone === 'green'
            ? c.positiveDark
            : tone === 'warm'
              ? c.warningDark
              : tone === 'critical'
                ? c.criticalDark
                : c.infoDark
}
