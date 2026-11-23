import {
    BadgePill,
    Column,
    FlowArrow,
    Panel,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    withDensity,
} from 'vizmatic'
import type { ThemeMode, ToneName } from 'vizmatic'

export const width = 920
export const height = 680
export const alt =
    'Side-by-side timelines compare block synchronization on shared tile[1,0]. With __syncthreads(), Warp 1 writes 65 from A[1,32], all 256 threads wait at the barrier, and Warp 0 reads 65 and stores it at B[32,1]. Without the barrier, one schedule lets Warp 0 read an unwritten stale value before Warp 1 writes 65, storing corrupted data at B[32,1].'

function traceStep(
    c: ReturnType<typeof getThemeColors>,
    step: string,
    actor: string,
    slotVal: string,
    tone: ToneName,
) {
    return Row({
        gap: 6,
        align: 'center',
        justify: 'space-between',
        width: 404,
        children: [
            BadgePill({
                c,
                text: step,
                tone,
                fontSize: 28,
                height: 42,
                padding: '4px 8px',
                mono: true,
            }),
            TextLabel({
                c,
                text: actor,
                fontSize: 28,
                fontWeight: 700,
                color: c.textPrimary,
                align: 'left',
            }),
            BadgePill({
                c,
                text: slotVal,
                tone,
                fontSize: 28,
                height: 42,
                padding: '4px 8px',
                mono: true,
            }),
        ],
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(theme), 2.75)

    return Scene({
        c,
        padding: 16,
        gap: 12,
        contentWidth: 888,
        children: Row({
            gap: 14,
            align: 'stretch',
            children: [
                Panel({
                    c,
                    title: 'With __syncthreads()',
                    subtitle: 'Warp 1 writes before Warp 0 reads',
                    tone: 'green',
                    width: 437,
                    padding: 14,
                    gap: 10,
                    titleFontSize: 31,
                    children: Column({
                        gap: 8,
                        align: 'center',
                        children: [
                            traceStep(c, '01', 'W1 writes', 'tile=65', 'blue'),
                            FlowArrow({ c, direction: 'down', length: 24, tone: 'purple' }),
                            BadgePill({
                                c,
                                text: '__syncthreads() · 256 threads',
                                tone: 'purple',
                                fontSize: 28,
                                height: 46,
                                padding: '4px 12px',
                            }),
                            FlowArrow({ c, direction: 'down', length: 24, tone: 'green' }),
                            traceStep(c, '02', 'W0 loads', 'B[32,1]=65', 'green'),
                            TextLabel({
                                c,
                                text: 'Cross-warp visibility ordered',
                                fontSize: 28,
                                fontWeight: 600,
                                color: getReadableToneColor('green', c),
                            }),
                        ],
                    }),
                }),
                Panel({
                    c,
                    title: 'No Barrier: Data Race',
                    subtitle: 'Warp 0 can read early',
                    tone: 'critical',
                    width: 437,
                    padding: 14,
                    gap: 10,
                    titleFontSize: 31,
                    children: Column({
                        gap: 8,
                        align: 'center',
                        children: [
                            traceStep(c, '01', 'W0 reads', 'tile=?', 'critical'),
                            FlowArrow({ c, direction: 'down', length: 24, tone: 'warm' }),
                            traceStep(c, '02', 'W1 writes', 'tile=65', 'warm'),
                            FlowArrow({ c, direction: 'down', length: 24, tone: 'critical' }),
                            traceStep(c, '03', 'W0 stores', 'B[32,1]=?', 'critical'),
                            TextLabel({
                                c,
                                text: 'racecheck fails (exit 2)',
                                fontSize: 28,
                                fontWeight: 600,
                                color: getReadableToneColor('critical', c),
                            }),
                        ],
                    }),
                }),
            ],
        }),
    })
}

export default create()
