import React from 'react'
import {
    Arrow,
    Board,
    CanvasItem,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableTextColor,
    getToneColor,
    getToneFill,
    type ThemeColors,
    type ToneName,
} from 'vizmatic'

export const width = 672
export const height = 860
export const autoSize = false
export const alt =
    'Four connected training paths distinguish their supervision and update: SFT maps a prompt and target to token cross-entropy; reward-model RL learns from chosen/rejected pairs and then uses policy RL; DPO fits the pairwise objective directly; RLVR checks a candidate and gives the resulting reward to policy RL, with PPO or GRPO as optimizer choices.'

type Line = { text: string; size?: number }

function node(
    c: ThemeColors,
    x: number,
    y: number,
    w: number,
    h: number,
    tone: ToneName,
    lines: Line[],
) {
    const fill = getToneFill(tone, c)
    const ink = getReadableTextColor(fill, c, fill)
    return (
        <CanvasItem key={`node-${x}-${y}`} x={x} y={y} width={w} height={h}>
            <div
                style={{
                    boxSizing: 'border-box',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    padding: 6,
                    border: `1px solid ${getToneColor(tone, c)}`,
                    borderRadius: 12,
                    backgroundColor: fill,
                }}
            >
                {lines.map((line, index) => (
                    <TextLabel
                        key={`${x}-${y}-${index}`}
                        c={c}
                        text={line.text}
                        width={w - 16}
                        fontSize={line.size ?? 24}
                        fontWeight={index === 0 ? 800 : 650}
                        color={ink}
                        align="center"
                    />
                ))}
            </div>
        </CanvasItem>
    )
}

function heading(c: ThemeColors, text: string, x: number, w: number) {
    return (
        <CanvasItem key={`heading-${x}`} x={x} y={112} width={w} height={28}>
            <TextLabel
                c={c}
                text={text}
                width={w}
                fontSize={24}
                fontWeight={800}
                color={c.textMuted}
                align="center"
            />
        </CanvasItem>
    )
}

function connector(c: ThemeColors, x: number, y: number, tone: ToneName) {
    return (
        <CanvasItem key={`connector-${x}-${y}`} x={x} y={y} width={24} height={20}>
            <Arrow direction="right" length={24} c={c} color={getToneColor(tone, c)} />
        </CanvasItem>
    )
}

function separator(c: ThemeColors, y: number) {
    return (
        <CanvasItem key={`separator-${y}`} x={28} y={y} width={616} height={1}>
            <div style={{ width: '100%', height: 1, backgroundColor: c.borderSubtle }} />
        </CanvasItem>
    )
}

function createFigure(theme: ThemeColors) {
    const c = { ...theme, preset: 'engineering' as const, shadow: 'transparent' }
    const cols = [28, 248, 468]
    const widths = [176, 176, 176]
    const rows: Array<{ tone: ToneName; cells: Line[][] }> = [
        {
            tone: 'blue',
            cells: [
                [{ text: 'SFT · demos' }, { text: 'prompt → target y*' }],
                [{ text: 'token cross-entropy' }, { text: 'fit target y*' }],
                [{ text: 'policy θ' }, { text: 'raise pθ(y*)' }],
            ],
        },
        {
            tone: 'purple',
            cells: [
                [{ text: 'RLHF · RM' }, { text: 'chosen / rejected' }],
                [{ text: 'fit reward model' }, { text: 'then policy RL' }],
                [{ text: 'PPO policy RL' }, { text: 'RM score sφ' }],
            ],
        },
        {
            tone: 'cyan',
            cells: [
                [{ text: 'DPO · pair' }, { text: 'chosen / rejected' }],
                [{ text: 'DPO pair loss' }, { text: 'policy objective' }],
                [{ text: 'update θ' }, { text: 'from pairs' }],
            ],
        },
        {
            tone: 'green',
            cells: [
                [{ text: 'RLVR · check' }, { text: 'candidate y' }],
                [{ text: 'reward r(x,y)' }, { text: 'declared check' }],
                [{ text: 'policy RL' }, { text: 'PPO or GRPO' }],
            ],
        },
    ]
    const children: React.ReactNode[] = [
        <CanvasItem key="title" x={28} y={18} width={616} height={42}>
            <TextLabel
                c={c}
                text="Four training paths, four learning signals"
                width={616}
                fontSize={30}
                fontWeight={850}
                color={c.textPrimary}
            />
        </CanvasItem>,
        <CanvasItem key="subtitle" x={28} y={65} width={616} height={32}>
            <TextLabel
                c={c}
                text="Prompt: 14 workers × 12 slots · target: 168"
                width={616}
                fontSize={24}
                fontWeight={600}
                color={c.textSecondary}
            />
        </CanvasItem>,
        heading(c, 'METHOD', cols[0], widths[0]),
        heading(c, 'OBJECTIVE', cols[1], widths[1]),
        heading(c, 'UPDATE', cols[2], widths[2]),
    ]

    rows.forEach((row, rowIndex) => {
        const y = 150 + rowIndex * 150
        row.cells.forEach((lines, columnIndex) => {
            children.push(node(c, cols[columnIndex], y, widths[columnIndex], 140, row.tone, lines))
            if (columnIndex < 2)
                children.push(
                    connector(c, cols[columnIndex] + widths[columnIndex] + 10, y + 52, row.tone),
                )
        })
        if (rowIndex < rows.length - 1) children.push(separator(c, y + 145))
    })

    children.push(
        <CanvasItem key="footer" x={28} y={750} width={616} height={104}>
            <div
                style={{
                    boxSizing: 'border-box',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '6px 14px',
                    gap: 2,
                    borderLeft: `4px solid ${getToneColor('green', c)}`,
                    backgroundColor: c.bgCard,
                }}
            >
                <TextLabel
                    c={c}
                    text="RLVR specifies the reward."
                    width={580}
                    fontSize={24}
                    fontWeight={700}
                    color={c.textPrimary}
                />
                <TextLabel
                    c={c}
                    text="PPO / GRPO are policy optimizers."
                    width={580}
                    fontSize={24}
                    fontWeight={650}
                    color={c.textPrimary}
                />
                <TextLabel
                    c={c}
                    text="DPO fits chosen / rejected pairs directly."
                    width={580}
                    fontSize={24}
                    fontWeight={650}
                    color={c.textPrimary}
                />
            </div>
        </CanvasItem>,
    )

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        background: 'transparent',
        children: Board({ c, width, height, background: 'transparent', children }),
    })
}

const illustration = defineIllustration(createFigure)
export const create = illustration.create
export default illustration.default
