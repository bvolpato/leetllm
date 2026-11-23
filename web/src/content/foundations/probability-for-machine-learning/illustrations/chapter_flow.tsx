import React from 'react'
import {
    CanvasItem,
    Scene,
    defineIllustration,
    getReadableTextColor,
    getThemeColors,
} from 'vizmatic'

export const width = 640
export const height = 720
export const alt =
    'A population bar shows 100 abusive signups among 10,000. Two conditional bars use a shared 0-to-100-percent scale: 95 of 100 abusive signups are flagged, while 495 of 9,900 clean signups are false alarms. The 590 flagged signups are then shown as a count-scaled queue containing 95 abusive cases and 495 clean cases, so the posterior abuse probability is 16.1 percent.'

type TextOptions = {
    anchor?: 'start' | 'middle' | 'end'
    weight?: number
    width?: number
}
type CanvasItemElement = React.ReactElement<React.HTMLAttributes<HTMLDivElement>>

function text(
    value: string,
    x: number,
    centerY: number,
    size: number,
    color: string,
    options: TextOptions = {},
) {
    const anchor = options.anchor ?? 'start'
    const width = options.width ?? (anchor === 'start' ? 600 - x : size * value.length * 0.64)
    const left = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x
    const height = size * 1.4
    const item = CanvasItem({
        x: left,
        y: centerY - size * 0.7,
        width,
        height,
        children: value,
    }) as CanvasItemElement
    return React.cloneElement(item, {
        key: `${value}-${x}-${centerY}`,
        style: {
            ...item.props.style,
            width,
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent:
                anchor === 'middle' ? 'center' : anchor === 'end' ? 'flex-end' : 'flex-start',
            color,
            fontFamily: 'Inter',
            fontSize: size,
            fontWeight: options.weight ?? 500,
            lineHeight: 1,
            whiteSpace: 'nowrap',
        },
    })
}

function rect(
    x: number,
    y: number,
    w: number,
    h: number,
    fill: string,
    key: string,
    rx = 0,
    stroke?: string,
    strokeWidth = 1,
) {
    return React.createElement('rect', {
        key,
        x,
        y,
        width: w,
        height: h,
        fill,
        rx,
        ...(stroke ? { stroke, strokeWidth } : {}),
    })
}

function line(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    stroke: string,
    key: string,
    strokeWidth = 2,
) {
    return React.createElement('line', { key, x1, y1, x2, y2, stroke, strokeWidth })
}

function path(d: string, stroke: string, key: string) {
    return React.createElement('path', { key, d, fill: 'none', stroke, strokeWidth: 3 })
}

function arrowTip(x: number, y: number, fill: string, key: string) {
    return React.createElement('polygon', {
        key,
        points: `${x},${y} ${x - 8},${y - 12} ${x + 8},${y - 12}`,
        fill,
    })
}

function accessibleColors(c: ReturnType<typeof getThemeColors>) {
    return { ...c, shadow: 'transparent' }
}

const illustration = defineIllustration((theme) => {
    const c = accessibleColors(theme)
    const populationX = 24
    const populationWidth = 552
    const abuseWidth = populationWidth * 0.01
    const classBarWidth = 262
    const abusiveX = 24
    const cleanX = 314
    const abuseFlagWidth = classBarWidth * 0.95
    const cleanFalseFlagWidth = classBarWidth * 0.05
    const queueAbuseWidth = populationWidth * (95 / 590)
    const blueLabel = theme.bg === '#f5f7fa' ? c.secondaryDark : c.secondaryLight
    const warningLabel = theme.bg === '#f5f7fa' ? c.warningDark : c.warningLight
    const abuseNumber = getReadableTextColor(c.critical, c)
    const passNumber = getReadableTextColor(c.secondary, c)
    const alertNumber = getReadableTextColor(c.warning, c)

    const shapes = [
        rect(populationX, 98, abuseWidth, 34, c.critical, 'abusive-population'),
        rect(
            populationX + abuseWidth,
            98,
            populationWidth - abuseWidth,
            34,
            c.secondary,
            'clean-population',
        ),
        rect(
            populationX,
            98,
            populationWidth,
            34,
            'transparent',
            'population-outline',
            5,
            c.border,
            1.5,
        ),
        rect(abusiveX, 322, abuseFlagWidth, 30, c.critical, 'caught-abuse'),
        rect(
            abusiveX + abuseFlagWidth,
            322,
            classBarWidth - abuseFlagWidth,
            30,
            c.neutralLight,
            'missed-abuse',
        ),
        rect(cleanX, 322, cleanFalseFlagWidth, 30, c.warning, 'false-alerts'),
        rect(
            cleanX + cleanFalseFlagWidth,
            322,
            classBarWidth - cleanFalseFlagWidth,
            30,
            c.secondary,
            'clean-passed',
        ),
        path(
            `M ${abusiveX + abuseFlagWidth / 2} 352 C ${abusiveX + abuseFlagWidth / 2} 414 ${populationX + queueAbuseWidth / 2} 438 ${populationX + queueAbuseWidth / 2} 485`,
            c.critical,
            'abusive-flags-to-queue',
        ),
        path(
            `M ${cleanX + cleanFalseFlagWidth / 2} 352 C ${cleanX + cleanFalseFlagWidth / 2} 414 ${populationX + queueAbuseWidth + (populationWidth - queueAbuseWidth) / 2} 438 ${populationX + queueAbuseWidth + (populationWidth - queueAbuseWidth) / 2} 485`,
            c.warning,
            'false-flags-to-queue',
        ),
        arrowTip(populationX + queueAbuseWidth / 2, 497, c.critical, 'abuse-queue-tip'),
        arrowTip(
            populationX + queueAbuseWidth + (populationWidth - queueAbuseWidth) / 2,
            497,
            c.warning,
            'false-queue-tip',
        ),
        rect(populationX, 497, queueAbuseWidth, 44, c.critical, 'abuse-flags'),
        rect(
            populationX + queueAbuseWidth,
            497,
            populationWidth - queueAbuseWidth,
            44,
            c.warning,
            'clean-false-flags',
        ),
        line(
            populationX + queueAbuseWidth,
            499,
            populationX + queueAbuseWidth,
            539,
            c.bg,
            'queue-divider',
            2,
        ),
        rect(24, 585, 15, 15, c.critical, 'abuse-key'),
        rect(270, 585, 15, 15, c.warning, 'false-alarm-key'),
    ]

    const labels = [
        text('Base rates shape the flagged queue', 24, 31, 25, c.textPrimary, {
            weight: 700,
            width: 552,
        }),
        text('All 10,000 signups · population size shown to scale', 24, 76, 21, c.textSecondary),
        text('1% · 100 abusive', 24, 159, 22, c.critical, { weight: 700 }),
        text('99% · 9,900 clean', 292, 159, 22, blueLabel, { weight: 700 }),

        text('Detector outcomes within each class', 24, 208, 24, c.textPrimary, { weight: 700 }),
        text('Each bar uses the same 0–100% scale', 24, 237, 20, c.textSecondary),

        text('Abusive · n=100', abusiveX, 274, 22, c.textPrimary, {
            weight: 600,
            width: classBarWidth,
        }),
        text('5% missed', abusiveX, 302, 22, c.critical, { weight: 600, width: classBarWidth }),
        text('95% caught', abusiveX + abuseFlagWidth / 2, 337, 22, abuseNumber, {
            anchor: 'middle',
            width: abuseFlagWidth,
            weight: 700,
        }),
        text('Clean · n=9,900', cleanX, 274, 22, c.textPrimary, {
            weight: 600,
            width: classBarWidth,
        }),
        text('5% false alarms', cleanX, 302, 22, warningLabel, {
            weight: 600,
            width: classBarWidth,
        }),
        text(
            '95% pass',
            cleanX + cleanFalseFlagWidth + (classBarWidth - cleanFalseFlagWidth) / 2,
            337,
            22,
            passNumber,
            {
                anchor: 'middle',
                width: classBarWidth - cleanFalseFlagWidth,
                weight: 700,
            },
        ),

        text('590 flagged signups', 24, 568, 23, c.textPrimary, { weight: 700 }),
        text('95', populationX + queueAbuseWidth / 2, 519, 24, abuseNumber, {
            anchor: 'middle',
            width: queueAbuseWidth,
            weight: 700,
        }),
        text(
            '495',
            populationX + queueAbuseWidth + (populationWidth - queueAbuseWidth) / 2,
            519,
            24,
            alertNumber,
            { anchor: 'middle', width: populationWidth - queueAbuseWidth, weight: 700 },
        ),

        text('abuse flags', 49, 593, 21, c.textPrimary),
        text('false alarms', 295, 593, 21, c.textPrimary),
        text('P(abuse | flagged) = 95 / 590 = 16.1%', 24, 650, 25, c.textPrimary, {
            weight: 700,
            width: 552,
        }),
    ]

    const svg = CanvasItem({
        x: 0,
        y: 0,
        width: 600,
        height: 680,
        children: React.createElement(
            'svg',
            {
                width: 600,
                height: 680,
                viewBox: '0 0 600 680',
                role: 'img',
                'aria-label': 'Population, conditional flag rates, and flagged queue counts',
                style: { display: 'block', width: 600, height: 680 },
            },
            ...shapes,
        ),
    })
    const diagram = React.createElement(
        'div',
        {
            style: { position: 'relative', display: 'flex', width: 600, height: 680 },
        },
        svg,
        ...labels,
    )

    return Scene({ c, padding: 20, contentWidth: 600, children: diagram })
})

export const create = illustration.create
export default illustration.default
