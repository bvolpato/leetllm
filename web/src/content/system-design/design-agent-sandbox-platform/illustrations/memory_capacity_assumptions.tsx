import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 860
export const height = 500
export const preset = 'engineering'
export const opaqueBackground = true
export const alt =
    'A declared 256 GiB host worksheet reserves 32 GiB and leaves 224 GiB, or 229376 MiB. A full 2 GiB per-session budget gives quotient 112. Assuming only 50 MiB private pages per session gives private-page-only quotient 4587. The two counts appear on one exact zero-to-5000 scale. This second quotient omits per-instance overhead, additional safety headroom, and private growth. An explicit arithmetic sensitivity at 100 MiB private pages gives quotient 2293. Configured guest RAM, private modified pages, and shared resident pages are separate accounting categories, and none of these quotients establishes an active-session limit.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const hostTone = getReadableToneColor('warm', c, c.bg)
    const memTone = getReadableToneColor('blue', c, c.bg)
    const cowTone = getReadableToneColor('purple', c, c.bg)
    const safeTone = getReadableToneColor('green', c, c.bg)

    const label = (
        x: number,
        y: number,
        w: number,
        text: string,
        fontSize = 18,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
        weight = 500,
    ) => (
        <CanvasItem x={x} y={y} width={w} height={Math.ceil(fontSize * 1.35)}>
            <TextLabel
                c={c}
                text={text}
                fontSize={fontSize}
                color={color}
                width="100%"
                align={align}
                fontWeight={weight}
            />
        </CanvasItem>
    )

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Top Ribbon: Host Memory Split */}
                    <rect
                        x={24}
                        y={60}
                        width={812}
                        height={80}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    {/* 32 GiB reserve = 101px, 224 GiB usable = 711px */}
                    <rect
                        x={36}
                        y={75}
                        width={100}
                        height={50}
                        rx={4}
                        fill={hostTone}
                        opacity={0.8}
                    />
                    <rect
                        x={142}
                        y={75}
                        width={682}
                        height={50}
                        rx={4}
                        fill={memTone}
                        opacity={0.8}
                    />

                    {/* Bottom Left: Density Scenarios */}
                    <rect
                        x={24}
                        y={155}
                        width={410}
                        height={325}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    {/* Case 1: Full 2 GiB */}
                    <rect
                        x={44}
                        y={235}
                        width={370}
                        height={26}
                        rx={4}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    <rect x={44} y={235} width={15} height={26} rx={4} fill={stroke} />

                    {/* Case 2: 100 MiB Sensitivity */}
                    <rect
                        x={44}
                        y={315}
                        width={370}
                        height={26}
                        rx={4}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    <rect
                        x={44}
                        y={315}
                        width={170}
                        height={26}
                        rx={4}
                        fill={memTone}
                        opacity={0.85}
                    />

                    {/* Case 3: 50 MiB Private COW */}
                    <rect
                        x={44}
                        y={395}
                        width={370}
                        height={26}
                        rx={4}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    <rect
                        x={44}
                        y={395}
                        width={340}
                        height={26}
                        rx={4}
                        fill={cowTone}
                        opacity={0.85}
                    />

                    {/* Bottom Right: Accounting Breakdown */}
                    <rect
                        x={450}
                        y={155}
                        width={386}
                        height={325}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={466}
                        y={205}
                        width={354}
                        height={70}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={hostTone}
                        strokeWidth={1.2}
                    />
                    <rect
                        x={466}
                        y={285}
                        width={354}
                        height={90}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={cowTone}
                        strokeWidth={1.2}
                    />
                    <rect
                        x={466}
                        y={385}
                        width={354}
                        height={80}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={safeTone}
                        strokeWidth={1.2}
                    />
                </svg>
            </CanvasItem>

            {/* Title */}
            {label(
                24,
                20,
                812,
                'Memory Capacity Assumptions & MicroVM Oversubscription',
                22,
                c.textPrimary,
                'left',
                700,
            )}

            {/* Top Ribbon Labels */}
            {label(36, 88, 100, '32 GiB Reserve', 13, c.textPrimary, 'center', 700)}
            {label(
                142,
                88,
                682,
                '224 GiB Usable for Guest Workloads (229,376 MiB)',
                15,
                c.textPrimary,
                'center',
                700,
            )}

            {/* Bottom Left Panel */}
            {label(
                36,
                170,
                386,
                'Theoretical Capacity by Private Memory Footprint',
                16,
                memTone,
                'left',
                700,
            )}

            {/* Case 1 */}
            {label(44, 212, 250, 'Full 2 GiB Configured (No Sharing)', 13, stroke, 'left', 650)}
            {label(300, 212, 114, '112 sessions', 13, stroke, 'right', 650)}

            {/* Case 2 */}
            {label(
                44,
                292,
                250,
                'Sensitivity: 100 MiB Private COW Pages',
                13,
                memTone,
                'left',
                650,
            )}
            {label(300, 292, 114, '2,293 sessions', 13, memTone, 'right', 650)}

            {/* Case 3 */}
            {label(44, 372, 250, 'Optimistic: 50 MiB Private COW Pages', 13, cowTone, 'left', 650)}
            {label(300, 372, 114, '4,587 sessions', 13, cowTone, 'right', 650)}

            {label(44, 442, 370, 'Scale: 0 to 5,000 potential microVMs', 12, c.textMuted, 'center')}

            {/* Bottom Right Panel */}
            {label(466, 170, 354, 'Memory Accounting Boundaries', 16, c.textPrimary, 'left', 700)}

            {label(476, 213, 334, 'Configured RAM ≠ Resident RAM', 14, hostTone, 'left', 650)}
            {label(
                476,
                235,
                334,
                '• 2 GiB is guest address space limit, not physical allocation',
                12,
                c.textMuted,
            )}
            {label(
                476,
                253,
                334,
                '• Linux kernel only maps pages upon first write/fault',
                12,
                c.textMuted,
            )}

            {label(476, 293, 334, 'Shared Template vs Private COW Pages', 14, cowTone, 'left', 650)}
            {label(
                476,
                315,
                334,
                '• Base kernel + runtime pages shared read-only across all VMs',
                12,
                c.textMuted,
            )}
            {label(
                476,
                333,
                334,
                '• Each VM allocates private memory only for modified dirty pages',
                12,
                c.textMuted,
            )}
            {label(
                476,
                351,
                334,
                '• 50 MiB is average; heavy workloads dirty more memory',
                12,
                c.textMuted,
            )}

            {label(
                476,
                393,
                334,
                'Per-Instance VMM Overhead & Headroom',
                14,
                safeTone,
                'left',
                650,
            )}
            {label(
                476,
                415,
                334,
                '• Firecracker process RSS: 5–15 MiB per microVM',
                12,
                c.textMuted,
            )}
            {label(
                476,
                433,
                334,
                '• Must reserve safety buffer against host OOM invocation',
                12,
                safeTone,
            )}
        </Board>
    )
}

export default create('dark')
