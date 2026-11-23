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

export const opaqueBackground = true
export const width = 860
export const height = 500
export const alt =
    'Three feature tasks produce ObjectRefs. Passing refs as top-level arguments auto-resolves the tuples before the actor method runs. Passing a nested list delivers raw ObjectRef handles.'

export function create(mode: ThemeMode = 'dark') {
    const c = getThemeColors(mode)
    const tone = (name: 'blue' | 'purple' | 'green' | 'cyan' | 'warm' | 'critical') =>
        getReadableToneColor(name, c)
    const fill = (name: 'blue' | 'purple' | 'green' | 'cyan' | 'warm' | 'critical') =>
        getToneFill(name, c)

    const tasks = [
        { y: 110, name: 'cache.remote()', tuple: '(5, 96)', ref: 'ref0' },
        { y: 225, name: 'router.remote()', tuple: '(6, 67)', ref: 'ref1' },
        { y: 340, name: 'trace.remote()', tuple: '(5, 22)', ref: 'ref2' },
    ]

    return Board({
        c,
        width,
        height,
        background: c.bg,
        children: [
            // Background SVG elements and arrows
            CanvasItem({
                x: 0,
                y: 0,
                width,
                height,
                children: (
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                        {/* Tasks -> Unpacked Actor */}
                        <VectorArrow
                            x1={255}
                            y1={155}
                            x2={295}
                            y2={185}
                            color={tone('purple')}
                            strokeWidth={2}
                            arrowSize={4}
                        />
                        <VectorArrow
                            x1={255}
                            y1={270}
                            x2={295}
                            y2={200}
                            color={tone('purple')}
                            strokeWidth={2}
                            arrowSize={4}
                        />
                        <VectorArrow
                            x1={255}
                            y1={385}
                            x2={295}
                            y2={215}
                            color={tone('purple')}
                            strokeWidth={2}
                            arrowSize={4}
                        />

                        {/* Tasks -> Nested Actor */}
                        <VectorArrow
                            x1={255}
                            y1={270}
                            x2={295}
                            y2={370}
                            color={tone('warm')}
                            strokeWidth={2}
                            arrowSize={4}
                        />

                        {/* Actor -> Driver */}
                        <VectorArrow
                            x1={565}
                            y1={190}
                            x2={605}
                            y2={270}
                            color={tone('green')}
                            strokeWidth={2}
                            arrowSize={4}
                        />

                        {/* Task boxes */}
                        {tasks.map((t) => (
                            <rect
                                key={t.name}
                                x={25}
                                y={t.y}
                                width={230}
                                height={95}
                                rx="8"
                                fill={fill('blue')}
                                stroke={tone('blue')}
                                strokeWidth="1.5"
                            />
                        ))}

                        {/* Top actor box: Unpacked */}
                        <rect
                            x={295}
                            y={110}
                            width={270}
                            height={165}
                            rx="8"
                            fill={fill('purple')}
                            stroke={tone('purple')}
                            strokeWidth="1.5"
                        />

                        {/* Bottom actor box: Nested */}
                        <rect
                            x={295}
                            y={295}
                            width={270}
                            height={165}
                            rx="8"
                            fill={fill('warm')}
                            stroke={tone('warm')}
                            strokeWidth="1.5"
                        />

                        {/* Driver box */}
                        <rect
                            x={605}
                            y={110}
                            width={230}
                            height={350}
                            rx="8"
                            fill={fill('green')}
                            stroke={tone('green')}
                            strokeWidth="1.5"
                        />
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
                        text="Ray Core ObjectRef Resolution Architecture"
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
                        text="Top-level arguments resolve automatically in Plasma store; nested containers preserve raw ObjectRef handles"
                        width={810}
                        fontSize={14}
                        fontWeight={400}
                        color={c.textSecondary}
                    />
                ),
            }),

            // Task cards
            ...tasks.flatMap((t) => [
                CanvasItem({
                    x: 35,
                    y: t.y + 12,
                    width: 210,
                    height: 22,
                    children: (
                        <TextLabel
                            c={c}
                            text={t.name}
                            width={210}
                            fontSize={14}
                            fontWeight={700}
                            color={tone('blue')}
                        />
                    ),
                }),
                CanvasItem({
                    x: 35,
                    y: t.y + 38,
                    width: 210,
                    height: 20,
                    children: (
                        <TextLabel
                            c={c}
                            text={`Yields ${t.tuple}`}
                            width={210}
                            fontSize={12}
                            color={c.textPrimary}
                        />
                    ),
                }),
                CanvasItem({
                    x: 35,
                    y: t.y + 62,
                    width: 210,
                    height: 20,
                    children: (
                        <TextLabel
                            c={c}
                            text={`Handle: ${t.ref}`}
                            width={210}
                            fontSize={11}
                            mono
                            color={tone('blue')}
                        />
                    ),
                }),
            ]),

            // Unpacked actor card
            CanvasItem({
                x: 305,
                y: 122,
                width: 250,
                height: 24,
                children: (
                    <TextLabel
                        c={c}
                        text="record.remote(*refs)"
                        width={250}
                        fontSize={15}
                        fontWeight={700}
                        mono
                        color={tone('purple')}
                    />
                ),
            }),
            CanvasItem({
                x: 305,
                y: 152,
                width: 250,
                height: 20,
                children: (
                    <TextLabel
                        c={c}
                        text="Top-level argument unpacking"
                        width={250}
                        fontSize={12}
                        fontWeight={600}
                        color={c.textPrimary}
                    />
                ),
            }),
            CanvasItem({
                x: 305,
                y: 178,
                width: 250,
                height: 48,
                children: (
                    <TextLabel
                        c={c}
                        text="Plasma resolves ObjectRefs before execution; actor method receives three concrete tuples directly"
                        width={250}
                        fontSize={11}
                        color={c.textSecondary}
                    />
                ),
            }),
            CanvasItem({
                x: 305,
                y: 236,
                width: 250,
                height: 22,
                children: (
                    <TextLabel
                        c={c}
                        text="Auto-resolved in Plasma"
                        width={250}
                        fontSize={11}
                        fontWeight={600}
                        color={tone('purple')}
                    />
                ),
            }),

            // Nested actor card
            CanvasItem({
                x: 305,
                y: 307,
                width: 250,
                height: 24,
                children: (
                    <TextLabel
                        c={c}
                        text="inspect_nested.remote(refs)"
                        width={250}
                        fontSize={14}
                        fontWeight={700}
                        mono
                        color={tone('warm')}
                    />
                ),
            }),
            CanvasItem({
                x: 305,
                y: 337,
                width: 250,
                height: 20,
                children: (
                    <TextLabel
                        c={c}
                        text="Nested container argument"
                        width={250}
                        fontSize={12}
                        fontWeight={600}
                        color={c.textPrimary}
                    />
                ),
            }),
            CanvasItem({
                x: 305,
                y: 363,
                width: 250,
                height: 48,
                children: (
                    <TextLabel
                        c={c}
                        text="Nested lists bypass Ray argument resolution; actor receives list containing raw ObjectRef handles"
                        width={250}
                        fontSize={11}
                        color={c.textSecondary}
                    />
                ),
            }),
            CanvasItem({
                x: 305,
                y: 421,
                width: 250,
                height: 22,
                children: (
                    <TextLabel
                        c={c}
                        text="Requires ray.get() inside actor"
                        width={250}
                        fontSize={11}
                        fontWeight={600}
                        color={tone('warm')}
                    />
                ),
            }),

            // Driver card
            CanvasItem({
                x: 615,
                y: 125,
                width: 210,
                height: 26,
                children: (
                    <TextLabel
                        c={c}
                        text="Driver Process"
                        width={210}
                        fontSize={16}
                        fontWeight={700}
                        color={tone('green')}
                    />
                ),
            }),
            CanvasItem({
                x: 615,
                y: 160,
                width: 210,
                height: 24,
                children: (
                    <TextLabel
                        c={c}
                        text="ray.get(result) -> 3"
                        width={210}
                        fontSize={13}
                        fontWeight={600}
                        mono
                        color={c.textPrimary}
                    />
                ),
            }),
            CanvasItem({
                x: 615,
                y: 200,
                width: 210,
                height: 120,
                children: (
                    <TextLabel
                        c={c}
                        text="Only lightweight scalar count is returned across network to driver. Heavy intermediate data resides in node shared-memory object stores without serialization overhead."
                        width={210}
                        fontSize={12}
                        color={c.textSecondary}
                    />
                ),
            }),
            CanvasItem({
                x: 615,
                y: 390,
                width: 210,
                height: 45,
                children: (
                    <TextLabel
                        c={c}
                        text="Zero-copy deserialization via Apache Arrow"
                        width={210}
                        fontSize={11}
                        fontWeight={600}
                        color={tone('green')}
                    />
                ),
            }),
        ],
    })
}

export default create()
