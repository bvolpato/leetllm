import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    VectorArrow,
    getThemeColors,
    getReadableToneColor,
    getToneFill,
    type ThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 860
export const height = 500
export const alt =
    'Legal async counter trace with mini-batch B=1 and lag budget S=2. Long group L starts at step 1 and is consumed at step 4. Its lag is 3, while outstanding groups are 3,3,2,1 and never exceed the headroom of 3.'

interface StepRecord {
    step: number
    x: number
    train: string
    accepted: number
    running: number
    trained: number
    outstanding: number
    lag: number
    lStatus: string
    tone: 'blue' | 'warm' | 'critical'
}

export function create(mode: ThemeMode = 'dark') {
    const c = getThemeColors(mode)
    const tone = (name: 'blue' | 'purple' | 'green' | 'cyan' | 'warm' | 'critical') =>
        getReadableToneColor(name, c)
    const fill = (name: 'blue' | 'purple' | 'green' | 'cyan' | 'warm' | 'critical') =>
        getToneFill(name, c)

    const steps: StepRecord[] = [
        {
            step: 1,
            x: 25,
            train: 'Train A',
            accepted: 2,
            running: 1,
            trained: 0,
            outstanding: 3,
            lag: 0,
            lStatus: 'L running',
            tone: 'warm',
        },
        {
            step: 2,
            x: 235,
            train: 'Train B',
            accepted: 3,
            running: 1,
            trained: 1,
            outstanding: 3,
            lag: 1,
            lStatus: 'L running',
            tone: 'warm',
        },
        {
            step: 3,
            x: 445,
            train: 'Train C',
            accepted: 3,
            running: 1,
            trained: 2,
            outstanding: 2,
            lag: 1,
            lStatus: 'L running',
            tone: 'warm',
        },
        {
            step: 4,
            x: 655,
            train: 'Train L',
            accepted: 4,
            running: 0,
            trained: 3,
            outstanding: 1,
            lag: 3,
            lStatus: 'L consumed',
            tone: 'critical',
        },
    ]

    return Board({
        c,
        width,
        height,
        children: [
            // Background SVG elements and connector arrows
            CanvasItem({
                x: 0,
                y: 0,
                width,
                height,
                children: (
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                        <VectorArrow
                            x1={215}
                            y1={250}
                            x2={235}
                            y2={250}
                            color={tone('blue')}
                            strokeWidth={2}
                            arrowSize={4}
                        />
                        <VectorArrow
                            x1={425}
                            y1={250}
                            x2={445}
                            y2={250}
                            color={tone('blue')}
                            strokeWidth={2}
                            arrowSize={4}
                        />
                        <VectorArrow
                            x1={635}
                            y1={250}
                            x2={655}
                            y2={250}
                            color={tone('critical')}
                            strokeWidth={2}
                            arrowSize={4}
                        />

                        {steps.map((s) => (
                            <rect
                                key={s.step}
                                x={s.x}
                                y={115}
                                width={190}
                                height={320}
                                rx="8"
                                fill={fill(s.tone)}
                                stroke={tone(s.tone)}
                                strokeWidth="1.5"
                            />
                        ))}
                    </svg>
                ),
            }),

            // Header titles
            CanvasItem({
                x: 25,
                y: 20,
                width: 810,
                height: 32,
                children: (
                    <TextLabel
                        c={c}
                        text="SkyRL Asynchronous Training Timeline and Lag Accounting"
                        width={810}
                        fontSize={22}
                        fontWeight={700}
                        color={c.textPrimary}
                    />
                ),
            }),
            CanvasItem({
                x: 25,
                y: 55,
                width: 810,
                height: 24,
                children: (
                    <TextLabel
                        c={c}
                        text="Mini-batch size B=1, lag budget S=2. Outstanding groups = accepted + running - trained <= 3"
                        width={810}
                        fontSize={14}
                        fontWeight={400}
                        color={c.textSecondary}
                    />
                ),
            }),

            // Step cards
            ...steps.flatMap((s) => [
                CanvasItem({
                    x: s.x + 8,
                    y: 130,
                    width: 174,
                    height: 24,
                    children: (
                        <TextLabel
                            c={c}
                            text={`Step ${s.step}`}
                            width={174}
                            fontSize={16}
                            fontWeight={700}
                            color={tone(s.tone)}
                            align="center"
                        />
                    ),
                }),
                CanvasItem({
                    x: s.x + 8,
                    y: 160,
                    width: 174,
                    height: 22,
                    children: (
                        <TextLabel
                            c={c}
                            text={s.train}
                            width={174}
                            fontSize={14}
                            fontWeight={600}
                            color={c.textPrimary}
                            align="center"
                        />
                    ),
                }),
                CanvasItem({
                    x: s.x + 8,
                    y: 190,
                    width: 174,
                    height: 20,
                    children: (
                        <TextLabel
                            c={c}
                            text={s.lStatus}
                            width={174}
                            fontSize={12}
                            color={c.textSecondary}
                            align="center"
                        />
                    ),
                }),

                // Outstanding equation box
                CanvasItem({
                    x: s.x + 12,
                    y: 235,
                    width: 166,
                    height: 30,
                    children: (
                        <TextLabel
                            c={c}
                            text={`${s.accepted} + ${s.running} - ${s.trained} = ${s.outstanding}`}
                            width={166}
                            fontSize={14}
                            fontWeight={700}
                            mono
                            color={tone('green')}
                            align="center"
                        />
                    ),
                }),
                CanvasItem({
                    x: s.x + 8,
                    y: 270,
                    width: 174,
                    height: 18,
                    children: (
                        <TextLabel
                            c={c}
                            text="outstanding <= 3"
                            width={174}
                            fontSize={11}
                            color={c.textSecondary}
                            align="center"
                        />
                    ),
                }),

                // Lag indicator
                CanvasItem({
                    x: s.x + 8,
                    y: 320,
                    width: 174,
                    height: 24,
                    children: (
                        <TextLabel
                            c={c}
                            text={`Lag: ${s.lag}${s.lag > 2 ? ' > S=2' : ''}`}
                            width={174}
                            fontSize={13}
                            fontWeight={700}
                            color={s.lag > 2 ? tone('critical') : tone('blue')}
                            align="center"
                        />
                    ),
                }),
                CanvasItem({
                    x: s.x + 8,
                    y: 350,
                    width: 174,
                    height: 50,
                    children: (
                        <TextLabel
                            c={c}
                            text={
                                s.lag > 2
                                    ? 'Stale policy rollout exceeds lag budget; gradient update skewed'
                                    : 'Within allowable staleness bound for off-policy correction'
                            }
                            width={174}
                            fontSize={11}
                            color={c.textSecondary}
                            align="center"
                        />
                    ),
                }),
            ]),

            // Footer note
            CanvasItem({
                x: 25,
                y: 455,
                width: 810,
                height: 24,
                children: (
                    <TextLabel
                        c={c}
                        text="Queue admission checks headroom before scheduling; long-delayed tasks must be detected and bounded."
                        width={810}
                        fontSize={12}
                        color={c.textMuted}
                        align="center"
                    />
                ),
            }),
        ],
    })
}

export default create()
