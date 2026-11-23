import React from 'react'
import {
    Column,
    FlowArrow,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 672
export const height = 760
export const preset = 'engineering'
export const alt =
    'The same lookup_deploy_status tool and operation-42 key return scan:v17 three times, advancing the repeat counter to its limit and stopping for review. When the third marker changes to scan:v18, the counter resets to one and polling can continue within its separate elapsed-time deadline.'

type Colors = ReturnType<typeof getThemeColors>

const label = (
    c: Colors,
    text: string,
    size = 22,
    color = c.textPrimary,
    weight = 600,
    width: number | string = '100%',
) => TextLabel({ c, text, fontSize: size, color, fontWeight: weight, width })

function Poll({
    c,
    number,
    marker,
    count,
    changed = false,
}: {
    c: Colors
    number: string
    marker: string
    count: string
    changed?: boolean
}) {
    const tone = changed ? 'green' : 'blue'
    const accent = getReadableToneColor(tone, c, c.bg, c.bg)
    return React.createElement(
        'div',
        {
            style: {
                display: 'flex',
                flex: '1 1 0',
                minWidth: 0,
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 3,
                padding: '8px 10px',
                borderTop: `4px solid ${accent}`,
                borderBottom: `1px solid ${c.borderSubtle}`,
                backgroundColor: c.bgCard,
                boxSizing: 'border-box',
            },
        },
        label(c, number, 22, c.textMuted, 650),
        label(c, marker, 24, accent, 750),
        label(c, count, 22, changed ? accent : c.textSecondary, 650),
    )
}

function Result({ c, stop }: { c: Colors; stop: boolean }) {
    const tone = stop ? 'critical' : 'green'
    const accent = getReadableToneColor(tone, c, c.bg, c.bg)
    return React.createElement(
        'div',
        {
            style: {
                display: 'flex',
                width: 116,
                minHeight: 92,
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 4,
                padding: '8px 9px',
                borderLeft: `4px solid ${accent}`,
                backgroundColor: c.bgSubtle,
                boxSizing: 'border-box',
            },
        },
        label(c, stop ? 'STOP' : 'Continue', stop ? 24 : 22, accent, 800),
        label(c, stop ? 'review' : 'deadline applies', 22, c.textSecondary, 500),
    )
}

function PollPath({
    c,
    title,
    markers,
    stop,
}: {
    c: Colors
    title: string
    markers: [string, string, string]
    stop: boolean
}) {
    return Column({
        width: '100%',
        gap: 6,
        justify: 'start',
        children: [
            label(
                c,
                title,
                26,
                stop
                    ? getReadableToneColor('critical', c, c.bg, c.bg)
                    : getReadableToneColor('green', c, c.bg, c.bg),
                750,
            ),
            Row({
                width: '100%',
                gap: 7,
                align: 'stretch',
                justify: 'start',
                children: [
                    Poll({ c, number: 'POLL 1', marker: markers[0], count: 'count 1' }),
                    FlowArrow({ c, direction: 'right', tone: 'neutral', length: 18 }),
                    Poll({ c, number: 'POLL 2', marker: markers[1], count: 'count 2' }),
                    FlowArrow({ c, direction: 'right', tone: 'neutral', length: 18 }),
                    Poll({
                        c,
                        number: 'POLL 3',
                        marker: markers[2],
                        count: stop ? 'count 3 · limit' : 'count 1 · reset',
                        changed: !stop,
                    }),
                    FlowArrow({
                        c,
                        direction: 'right',
                        tone: stop ? 'critical' : 'green',
                        length: 18,
                    }),
                    Result({ c, stop }),
                ],
            }),
        ],
    })
}

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    return Scene({
        c,
        padding: 20,
        contentWidth: 632,
        align: 'center',
        children: Column({
            width: '100%',
            gap: 12,
            justify: 'start',
            children: [
                label(c, 'Count repeated state in the runtime', 32, c.textPrimary, 750),
                label(
                    c,
                    'The tool and operation key stay fixed across both polling paths.',
                    22,
                    c.textSecondary,
                    500,
                ),
                Column({
                    width: '100%',
                    gap: 3,
                    justify: 'start',
                    children: [
                        label(c, 'TOOL + OPERATION KEY', 22, c.textMuted, 700),
                        label(c, 'lookup_deploy_status · operation-42', 24, c.textPrimary, 700),
                    ],
                }),
                PollPath({
                    c,
                    title: 'No progress: the same marker reaches the bound',
                    markers: ['scan:v17', 'scan:v17', 'scan:v17'],
                    stop: true,
                }),
                React.createElement('div', {
                    style: {
                        display: 'flex',
                        width: '100%',
                        height: 1,
                        margin: '2px 0',
                        backgroundColor: c.borderSubtle,
                    },
                }),
                PollPath({
                    c,
                    title: 'Progress: a new marker resets the counter',
                    markers: ['scan:v17', 'scan:v17', 'scan:v18'],
                    stop: false,
                }),
                label(
                    c,
                    'The elapsed-time deadline is enforced separately, even when a marker advances.',
                    22,
                    c.textSecondary,
                    600,
                ),
            ],
        }),
    })
}

export default create('dark')
