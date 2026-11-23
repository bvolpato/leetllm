import {
    BadgePill,
    Column,
    FlowArrow,
    Grid,
    Panel,
    Row,
    Scene,
    TextLabel,
    TiledMatrix,
    getReadableToneColor,
    getThemeColors,
    withDensity,
} from 'vizmatic'
import type { ThemeMode, ToneName } from 'vizmatic'

export const width = 920
export const height = 700
export const alt =
    'Diagram of edge block (1,0) for N=33. Three matrices connected by arrows trace input column A[r,32] (tx=0 active) into shared column tile[r,0] and out to output row B[32,r] (32 lanes at ty=0). Below, a 4x8 grid shows shared rows r=0 through 31 with r=1 highlighted, paired with producer (tx=0, ty=1, Warp 1), the 256-thread __syncthreads() barrier, and consumer (tx=1, ty=0, Warp 0).'

function tileStage(
    c: ReturnType<typeof getThemeColors>,
    label: string,
    sub: string,
    region: { rowStart: number; rowEnd: number; colStart: number; colEnd: number; tone: ToneName },
) {
    return Column({
        gap: 4,
        align: 'center',
        children: [
            TextLabel({
                c,
                text: label,
                fontSize: 28,
                fontWeight: 700,
                color: c.textPrimary,
                mono: true,
            }),
            TiledMatrix({ c, rows: 4, cols: 4, cellSize: 22, gap: 3, regions: [region] }),
            TextLabel({ c, text: sub, fontSize: 28, color: getReadableToneColor(region.tone, c) }),
        ],
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(theme), 2.75)

    const rows = Array.from({ length: 4 }, (_, grp) =>
        Array.from({ length: 8 }, (_, ty) => {
            const idx = grp * 8 + ty
            const tone: ToneName = idx === 1 ? 'warm' : grp % 2 === 0 ? 'cyan' : 'blue'
            return { label: String(idx), tone }
        }),
    )

    return Scene({
        c,
        padding: 16,
        gap: 12,
        contentWidth: 888,
        children: Column({
            gap: 12,
            children: [
                Panel({
                    c,
                    title: 'Edge-Tile Coordinate Flow (N = 33 · block (1, 0))',
                    tone: 'blue',
                    width: 888,
                    padding: 14,
                    gap: 10,
                    titleFontSize: 31,
                    children: Row({
                        gap: 14,
                        align: 'center',
                        justify: 'center',
                        children: [
                            tileStage(c, 'A[r, 32]', 'tx=0 active', {
                                rowStart: 0,
                                rowEnd: 4,
                                colStart: 0,
                                colEnd: 1,
                                tone: 'cyan',
                            }),
                            FlowArrow({ c, direction: 'right', length: 56, tone: 'cyan' }),
                            tileStage(c, 'tile[r, 0]', 'r = 0..31', {
                                rowStart: 0,
                                rowEnd: 4,
                                colStart: 0,
                                colEnd: 1,
                                tone: 'warm',
                            }),
                            FlowArrow({ c, direction: 'right', length: 56, tone: 'green' }),
                            tileStage(c, 'B[32, r]', 'ty=0, 32 tx', {
                                rowStart: 0,
                                rowEnd: 1,
                                colStart: 0,
                                colEnd: 4,
                                tone: 'green',
                            }),
                        ],
                    }),
                }),
                Row({
                    gap: 14,
                    align: 'stretch',
                    children: [
                        Panel({
                            c,
                            title: 'Shared Rows r = 0..31',
                            subtitle: '4 offsets x 8 ty · r=1 in amber',
                            tone: 'cyan',
                            width: 448,
                            padding: 14,
                            gap: 10,
                            titleFontSize: 29,
                            children: [
                                Grid({
                                    c,
                                    rows,
                                    cellWidth: 46,
                                    cellHeight: 38,
                                    gap: 4,
                                    radius: 6,
                                    fontSize: 28,
                                }),
                            ],
                        }),
                        Panel({
                            c,
                            title: 'Warp Handoff (r = 1)',
                            tone: 'purple',
                            width: 426,
                            padding: 14,
                            gap: 10,
                            titleFontSize: 29,
                            children: [
                                Column({
                                    gap: 8,
                                    align: 'center',
                                    children: [
                                        BadgePill({
                                            c,
                                            text: 'Producer (0,1): Warp 1',
                                            tone: 'warm',
                                            fontSize: 28,
                                            height: 44,
                                            padding: '4px 12px',
                                        }),
                                        FlowArrow({
                                            c,
                                            direction: 'down',
                                            length: 24,
                                            tone: 'blue',
                                        }),
                                        BadgePill({
                                            c,
                                            text: 'Barrier: 256 threads',
                                            tone: 'blue',
                                            fontSize: 28,
                                            height: 44,
                                            padding: '4px 12px',
                                        }),
                                        FlowArrow({
                                            c,
                                            direction: 'down',
                                            length: 24,
                                            tone: 'green',
                                        }),
                                        BadgePill({
                                            c,
                                            text: 'Consumer (1,0): Warp 0',
                                            tone: 'green',
                                            fontSize: 28,
                                            height: 44,
                                            padding: '4px 12px',
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        }),
    })
}

export default create()
