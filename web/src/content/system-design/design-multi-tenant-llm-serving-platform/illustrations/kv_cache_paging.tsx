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
    'PagedAttention virtual-to-physical block table mapping in multi-tenant serving. Tenant A (47 tokens) maps virtual blocks 0, 1, 2 to physical pages P0, P2, P4. Tenant B (31 tokens) maps virtual blocks 0, 1 to physical pages P1, P3. Across five 16-token pages, 78 of 80 slots are occupied (97.5% memory efficiency), eliminating internal fragmentation and enforcing memory isolation.'

export const numericAnchors = {
    slotsPerPage: 16,
    tokensA: 47,
    tokensB: 31,
    occupiedSlots: 78,
    reservedSlots: 80,
    efficiencyPct: 97.5,
    pagesA: ['P0', 'P2', 'P4'],
    pagesB: ['P1', 'P3'],
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const blueTone = getReadableToneColor('blue', c, c.bg)
    const purpleTone = getReadableToneColor('purple', c, c.bg)
    const greenTone = getReadableToneColor('green', c, c.bg)

    const label = (
        x: number,
        y: number,
        w: number,
        text: string,
        fontSize = 12,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
        weight = 500,
    ) => (
        <CanvasItem
            x={x}
            y={y}
            width={w}
            height={Math.min(
                height - y,
                Math.ceil(
                    fontSize *
                        1.4 *
                        Math.max(1, Math.ceil((text.length * fontSize * 0.55) / Math.max(w, 1))),
                ),
            )}
        >
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

    const physicalPages = [
        { id: 'P0', owner: 'Tenant A', used: 16, total: 16, tone: blueTone },
        { id: 'P1', owner: 'Tenant B', used: 16, total: 16, tone: purpleTone },
        { id: 'P2', owner: 'Tenant A', used: 16, total: 16, tone: blueTone },
        { id: 'P3', owner: 'Tenant B', used: 15, total: 16, tone: purpleTone },
        { id: 'P4', owner: 'Tenant A', used: 15, total: 16, tone: blueTone },
    ]

    return (
        <Board c={c} width={width} height={height} background="transparent">
            {/* SVG Visual Elements */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <defs>
                        <marker
                            id="page-arr"
                            viewBox="0 0 10 10"
                            refX="6"
                            refY="5"
                            markerWidth="6"
                            markerHeight="6"
                            orient="auto-start-reverse"
                        >
                            <path d="M 0 1 L 8 5 L 0 9 z" fill={c.textMuted} />
                        </marker>
                    </defs>

                    {/* Column 1 Box (Logical Sequences) */}
                    <rect
                        x={40}
                        y={76}
                        width={230}
                        height={280}
                        rx={10}
                        fill={theme === 'dark' ? '#121824' : '#f0f9ff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    <rect
                        x={48}
                        y={106}
                        width={214}
                        height={96}
                        rx={6}
                        fill={theme === 'dark' ? '#1a2436' : '#ffffff'}
                        stroke={blueTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={48}
                        y={214}
                        width={214}
                        height={96}
                        rx={6}
                        fill={theme === 'dark' ? '#241a36' : '#ffffff'}
                        stroke={purpleTone}
                        strokeWidth={1}
                    />

                    {/* Column 2 Box (Block Tables) */}
                    <rect
                        x={290}
                        y={76}
                        width={240}
                        height={280}
                        rx={10}
                        fill={theme === 'dark' ? '#141722' : '#f8fafc'}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    <rect
                        x={298}
                        y={106}
                        width={224}
                        height={96}
                        rx={6}
                        fill={theme === 'dark' ? '#1a2436' : '#ffffff'}
                        stroke={blueTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={298}
                        y={214}
                        width={224}
                        height={96}
                        rx={6}
                        fill={theme === 'dark' ? '#241a36' : '#ffffff'}
                        stroke={purpleTone}
                        strokeWidth={1}
                    />

                    {/* Connector lines from Col 1 to Col 2 */}
                    <line
                        x1={262}
                        y1={154}
                        x2={298}
                        y2={154}
                        stroke={blueTone}
                        strokeWidth={1.5}
                        markerEnd="url(#page-arr)"
                    />
                    <line
                        x1={262}
                        y1={262}
                        x2={298}
                        y2={262}
                        stroke={purpleTone}
                        strokeWidth={1.5}
                        markerEnd="url(#page-arr)"
                    />

                    {/* Column 3 Box (Physical Pool) */}
                    <rect
                        x={550}
                        y={76}
                        width={270}
                        height={280}
                        rx={10}
                        fill={theme === 'dark' ? '#101d16' : '#f0fdf4'}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Physical Page Rows */}
                    {physicalPages.map((p, i) => {
                        const py = 104 + i * 48
                        return (
                            <rect
                                key={`row-phys-${i}`}
                                x={558}
                                y={py}
                                width={254}
                                height={40}
                                rx={6}
                                fill={theme === 'dark' ? '#162b1f' : '#ffffff'}
                                stroke={p.tone}
                                strokeWidth={1}
                            />
                        )
                    })}

                    {/* Connector lines from Col 2 to Col 3 */}
                    <line
                        x1={522}
                        y1={154}
                        x2={558}
                        y2={124}
                        stroke={blueTone}
                        strokeWidth={1.5}
                        markerEnd="url(#page-arr)"
                    />
                    <line
                        x1={522}
                        y1={262}
                        x2={558}
                        y2={172}
                        stroke={purpleTone}
                        strokeWidth={1.5}
                        markerEnd="url(#page-arr)"
                    />

                    {/* Bottom Guardrail Box */}
                    <rect
                        x={40}
                        y={372}
                        width={780}
                        height={90}
                        rx={8}
                        fill={theme === 'dark' ? '#111e2e' : '#eff6ff'}
                        stroke={blueTone}
                        strokeWidth={1}
                    />
                </svg>
            </CanvasItem>

            {/* Header */}
            {label(
                40,
                20,
                780,
                'PagedAttention Block Management & Multi-Tenant VRAM Isolation',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Virtual block tables map logical sequences to non-contiguous physical pages; 97.5% memory occupancy',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Column 1: Logical Sequences */}
            {label(40, 84, 230, '1. LOGICAL SEQUENCES', 11, blueTone, 'left', 700)}

            {/* Tenant A sequence */}
            {label(52, 114, 210, 'Tenant A: 47 Tokens', 12, blueTone, 'left', 700)}
            {label(
                52,
                134,
                210,
                'Block 0: Tok 1-16 (Full) · Block 1: Tok 17-32 (Full) · Block 2: Tok 33-47 (15 tok)',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Tenant B sequence */}
            {label(52, 224, 210, 'Tenant B: 31 Tokens', 12, purpleTone, 'left', 700)}
            {label(
                52,
                244,
                210,
                'Block 0: Tok 1-16 (Full) · Block 1: Tok 17-31 (15 tok)',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Column 2: Block Tables */}
            {label(290, 84, 240, '2. VIRTUAL-TO-PHYSICAL MAP', 11, c.textMuted, 'left', 700)}

            {label(302, 114, 220, 'Tenant A Block Table', 12, blueTone, 'left', 600)}
            {label(
                302,
                134,
                220,
                '• Virtual 0 → Physical P0 · • Virtual 1 → Physical P2 · • Virtual 2 → Physical P4',
                11,
                c.textPrimary,
                'left',
                500,
            )}

            {label(302, 224, 220, 'Tenant B Block Table', 12, purpleTone, 'left', 600)}
            {label(
                302,
                244,
                220,
                '• Virtual 0 → Physical P1 · • Virtual 1 → Physical P3',
                11,
                c.textPrimary,
                'left',
                500,
            )}

            {/* Column 3: Physical Memory Pool */}
            {label(
                550,
                84,
                270,
                '3. PHYSICAL VRAM PAGES (NON-CONTIGUOUS)',
                11,
                greenTone,
                'left',
                700,
            )}

            {physicalPages.map((p, i) => {
                const py = 108 + i * 48
                return (
                    <React.Fragment key={`phys-page-${i}`}>
                        {label(562, py + 4, 80, p.id, 12, p.tone, 'left', 700)}
                        {label(620, py + 4, 110, p.owner, 11, c.textPrimary, 'left', 500)}
                        {label(
                            720,
                            py + 4,
                            90,
                            `${p.used}/${p.total} slots`,
                            11,
                            p.used === 16 ? greenTone : c.textMuted,
                            'right',
                            600,
                        )}
                    </React.Fragment>
                )
            })}

            {/* Bottom Guardrail Box */}
            {label(
                52,
                386,
                756,
                'Memory Efficiency & Hardware Security Invariants',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                406,
                756,
                "1. Near-Zero Internal Fragmentation: 78 of 80 allocated slots are occupied (97.5% efficiency vs ~30% in contiguous pre-allocation). · 2. Memory Isolation: Attention kernels look up keys/values exclusively through each tenant's private block table; Tenant A cannot access P1 or P3. · 3. Dynamic Deallocation: On generation completion, physical pages return immediately to the free page pool.",
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
