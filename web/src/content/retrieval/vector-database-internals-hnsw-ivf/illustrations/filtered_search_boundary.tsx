import React from 'react'
import {
    Board,
    Box,
    CanvasItem,
    FlowArrow,
    Panel,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 680
export const height = 720
export const preset = 'engineering'
export const alt =
    'Inside a trusted retrieval boundary, the first three candidates are eu-1, us-1, and us-2. Applying region=EU before returning k=2 leaves only eu-1, so the response is underfilled at 1/2. Scanning all five candidate records adds us-3 and eu-2; the same filter then returns eu-1 and eu-2 for 2/2. Only filtered eligible rows cross to the application.'

function label(c: ThemeColors, text: string, fontSize = 24, color = c.textPrimary, weight = 650) {
    return <TextLabel c={c} text={text} fontSize={fontSize} fontWeight={weight} color={color} />
}

function candidate(c: ThemeColors, id: string, eligible: boolean, width = 100) {
    return (
        <Box
            c={c}
            color={eligible ? 'positive' : 'neutral'}
            width={width}
            height={56}
            fontSize={24}
            label={id}
            outlined={false}
        />
    )
}

const illustration = defineIllustration((colors) => {
    const c = { ...colors, shadow: 'transparent' }
    const eligible = getReadableToneColor('green', c)
    const filterTone = getReadableToneColor('cyan', c)
    const muted = c.textSecondary

    const firstThree = [
        { id: 'eu-1', eligible: true },
        { id: 'us-1', eligible: false },
        { id: 'us-2', eligible: false },
    ]
    const allFive = [
        { id: 'eu-1', eligible: true },
        { id: 'us-1', eligible: false },
        { id: 'us-2', eligible: false },
        { id: 'us-3', eligible: false },
        { id: 'eu-2', eligible: true },
    ]

    return (
        <Scene
            c={c}
            padding={0}
            gap={0}
            contentWidth={width}
            title="Filtered search can underfill top-k"
        >
            <Board c={c} width={width} height={height}>
                <CanvasItem x={22} y={12} width={636} height={42}>
                    <TextLabel
                        c={c}
                        text="A selective filter can leave empty result slots."
                        width="100%"
                        fontSize={27}
                        fontWeight={800}
                        color={c.textPrimary}
                    />
                </CanvasItem>
                <CanvasItem x={22} y={52} width={636} height={34}>
                    <TextLabel
                        c={c}
                        text="Candidate search · request k = 2 · predicate region = EU"
                        width="100%"
                        fontSize={22}
                        fontWeight={650}
                        color={c.textSecondary}
                    />
                </CanvasItem>

                <CanvasItem x={22} y={94} width={636} height={518}>
                    <Panel
                        c={c}
                        width={636}
                        height={518}
                        padding={16}
                        gap={16}
                        shadow={false}
                        title="Trusted retrieval boundary"
                        titleFontSize={24}
                        borderColor={filterTone}
                        background={c.bgSubtle}
                        bodyStyle={{ gap: 18 }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 8,
                                }}
                            >
                                {label(c, 'Initial ANN window · first 3 IDs')}
                                {label(c, '3 scanned', 22, muted, 650)}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {firstThree.map((item) =>
                                    candidate(c, item.id, item.eligible, 112),
                                )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {label(c, 'Filter region = EU', 23, filterTone, 750)}
                                <FlowArrow c={c} direction="down" length={18} tone="cyan" />
                                {label(c, 'Return up to k = 2', 23, c.textPrimary, 700)}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {candidate(c, 'eu-1', true, 136)}
                                <Box
                                    c={c}
                                    color="neutral"
                                    width={136}
                                    height={56}
                                    fontSize={22}
                                    label="empty slot"
                                />
                                {label(c, '1 / 2 returned', 22, eligible, 750)}
                            </div>
                        </div>

                        <div style={{ height: 1, width: '100%', backgroundColor: c.border }} />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 8,
                                }}
                            >
                                {label(c, 'Expanded ANN window · all 5 IDs')}
                                {label(c, '5 scanned', 22, muted, 650)}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {allFive.map((item) => candidate(c, item.id, item.eligible, 108))}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {label(c, 'Filter region = EU', 23, filterTone, 750)}
                                <FlowArrow c={c} direction="down" length={18} tone="cyan" />
                                {label(c, 'Return up to k = 2', 23, c.textPrimary, 700)}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {candidate(c, 'eu-1', true, 136)}
                                {candidate(c, 'eu-2', true, 136)}
                                {label(c, '2 / 2 returned', 22, eligible, 750)}
                            </div>
                        </div>
                    </Panel>
                </CanvasItem>

                <CanvasItem x={22} y={622} width={636} height={34}>
                    <FlowArrow c={c} direction="down" length={22} tone="green" />
                </CanvasItem>
                <CanvasItem x={22} y={660} width={636} height={40}>
                    <TextLabel
                        c={c}
                        text="Only filtered eligible rows cross to the application."
                        width="100%"
                        fontSize={24}
                        fontWeight={750}
                        color={eligible}
                        align="center"
                    />
                </CanvasItem>
            </Board>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
