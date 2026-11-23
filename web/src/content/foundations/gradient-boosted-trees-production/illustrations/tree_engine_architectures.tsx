import {
    AxisPlot,
    BadgePill,
    Board,
    CanvasItem,
    Column,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const alt =
    "Three schematic tree shapes compare growth rules. XGBoost depthwise expands eligible nodes by depth and can stop branches at different depths. LightGBM's highlighted internal node shows the split chosen from the leaf with the highest gain. CatBoost SymmetricTree applies the same predicate across each level, giving a full depth-d tree 2 to the power d leaves; Plain and Ordered boosting are separate choices."
export const width = 860
export const height = 520

type TreeKind = 'depthwise' | 'leafwise' | 'symmetric'

function treeGraphic(c: ThemeColors, kind: TreeKind) {
    const w = 246
    const h = 180
    const root = { x: 123, y: 154 }
    const left = { x: 64, y: 96 }
    const right = { x: 182, y: 96 }
    const leftLeaf = { x: 34, y: 34 }
    const middleLeaf = { x: 94, y: 34 }
    const rightLeaves =
        kind === 'symmetric'
            ? [
                  { x: 152, y: 34 },
                  { x: 212, y: 34 },
              ]
            : []
    const links =
        kind === 'symmetric'
            ? [
                  [root, left],
                  [root, right],
                  [left, leftLeaf],
                  [left, middleLeaf],
                  [right, rightLeaves[0]],
                  [right, rightLeaves[1]],
              ]
            : [
                  [root, left],
                  [root, right],
                  [left, leftLeaf],
                  [left, middleLeaf],
              ]
    const splitNodes =
        kind === 'symmetric'
            ? [
                  { ...root, tone: 'purple' as const, r: 9 },
                  { ...left, tone: 'cyan' as const, r: 9 },
                  { ...right, tone: 'cyan' as const, r: 9 },
              ]
            : [
                  { ...root, tone: 'purple' as const, r: 9 },
                  {
                      ...left,
                      tone: kind === 'leafwise' ? ('warm' as const) : ('cyan' as const),
                      r: kind === 'leafwise' ? 11 : 9,
                  },
              ]
    const leaves =
        kind === 'symmetric'
            ? [leftLeaf, middleLeaf, ...rightLeaves]
            : [leftLeaf, middleLeaf, right]

    return Board({
        c,
        width: w,
        height: h,
        children: [
            CanvasItem({
                x: 0,
                y: 0,
                width: w,
                height: h,
                children: AxisPlot({
                    c,
                    width: w,
                    height: h,
                    xMin: 0,
                    xMax: w,
                    yMin: 0,
                    yMax: h,
                    padding: 0,
                    showFrame: false,
                    showAxes: false,
                    showGrid: false,
                    paths: links.map(([from, to]) => ({
                        points: [from, to],
                        color: c.borderLight,
                        strokeWidth: 2,
                    })),
                    points: [
                        ...splitNodes,
                        ...leaves.map((point) => ({
                            ...point,
                            tone: 'neutral' as const,
                            r: 7,
                            stroke: c.bgCard,
                            strokeWidth: 2,
                        })),
                    ],
                }),
            }),
            ...(kind === 'leafwise'
                ? [
                      CanvasItem({
                          x: 10,
                          y: 112,
                          width: 80,
                          height: 22,
                          children: TextLabel({
                              c,
                              text: 'max gain',
                              width: 80,
                              fontSize: 13,
                              color: c.warningDark,
                              align: 'center',
                          }),
                      }),
                  ]
                : []),
        ],
    })
}

function engineCard(
    c: ThemeColors,
    engine: string,
    policy: string,
    kind: TreeKind,
    note: string,
    tone: 'purple' | 'cyan' | 'green',
) {
    return Panel({
        c,
        width: 260,
        padding: 10,
        gap: 8,
        tone,
        title: engine,
        titleFontSize: 18,
        children: Column({
            gap: 8,
            align: 'center',
            children: [
                BadgePill({ c, text: policy, tone, fontSize: 14, height: 25 }),
                treeGraphic(c, kind),
                TextLabel({
                    c,
                    text: note,
                    width: 240,
                    fontSize: 14,
                    color: c.textSecondary,
                    align: 'center',
                }),
            ],
        }),
    })
}

const illustration = defineIllustration((c: ThemeColors) =>
    Scene({
        c,
        padding: 18,
        gap: 12,
        align: 'center',
        contentWidth: 824,
        title: 'Tree Engine Growth Policies Compared',
        subtitle:
            'The tree construction rule sets search geometry, memory locality, and hardware efficiency.',
        children: Column({
            width: 824,
            gap: 12,
            align: 'stretch',
            children: [
                Row({
                    gap: 12,
                    justify: 'center',
                    children: [
                        BadgePill({
                            c,
                            text: 'Split node',
                            tone: 'purple',
                            fontSize: 14,
                            height: 25,
                        }),
                        BadgePill({
                            c,
                            text: 'Leaf node',
                            tone: 'neutral',
                            fontSize: 14,
                            height: 25,
                        }),
                    ],
                }),
                Row({
                    width: 824,
                    gap: 16,
                    align: 'stretch',
                    justify: 'space-between',
                    children: [
                        engineCard(
                            c,
                            'XGBoost',
                            'depthwise default',
                            'depthwise',
                            'Expands eligible nodes level-by-level; stops branches when gain drops.',
                            'purple',
                        ),
                        engineCard(
                            c,
                            'LightGBM',
                            'leafwise default',
                            'leafwise',
                            'Splits the leaf with highest gain anywhere in the tree; faster loss decay.',
                            'cyan',
                        ),
                        engineCard(
                            c,
                            'CatBoost',
                            'symmetric default',
                            'symmetric',
                            'Shares the same split predicate across depth d, producing 2ᵈ leaves as lookup tables.',
                            'green',
                        ),
                    ],
                }),
                TextLabel({
                    c,
                    text: 'Growth and boosting are distinct choices: CatBoost CPU defaults to Plain; Ordered is a separate mode.',
                    width: 824,
                    fontSize: 14,
                    color: c.textSecondary,
                    align: 'center',
                }),
            ],
        }),
    }),
)

export const create = illustration.create
export default illustration.default
