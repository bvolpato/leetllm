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
    'Before and after mapping diagrams use three immutable base pages, each modeled as 4 KiB, with page indices 0, 1, and 2 and values 10, 20, and 30. Before the write, A/generation 1 and B/generation 1 each map all three shared base entries. After A writes 99 to page 1, only A’s page 1 mapping points to a separate private page containing 99. A’s pages 0 and 2 and all B mappings still point to the original base. B and backing page 1 retain 20. Three shared base entries plus one private entry make four modeled pages, or 16 KiB. This counts model entries and does not assert physical residency.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const baseTone = getReadableToneColor('blue', c, c.bg)
    const cowTone = getReadableToneColor('purple', c, c.bg)
    const writeTone = getReadableToneColor('warm', c, c.bg)
    const okTone = getReadableToneColor('green', c, c.bg)

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
                    {/* Left: State 1 (Both Shared) */}
                    <rect
                        x={24}
                        y={60}
                        width={384}
                        height={350}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />

                    {/* Guest A table */}
                    <rect
                        x={36}
                        y={110}
                        width={100}
                        height={100}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    {/* Base memory */}
                    <rect
                        x={166}
                        y={110}
                        width={100}
                        height={100}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={baseTone}
                        strokeWidth={2}
                    />
                    {/* Guest B table */}
                    <rect
                        x={296}
                        y={110}
                        width={100}
                        height={100}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Shared mapping arrows */}
                    <line x1={136} y1={160} x2={166} y2={160} stroke={baseTone} strokeWidth={2} />
                    <line x1={296} y1={160} x2={266} y2={160} stroke={baseTone} strokeWidth={2} />

                    {/* State 1 notes */}
                    <rect
                        x={36}
                        y={235}
                        width={360}
                        height={160}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Right: State 2 (COW Write Fault) */}
                    <rect
                        x={432}
                        y={60}
                        width={404}
                        height={350}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />

                    {/* Guest A modified */}
                    <rect
                        x={444}
                        y={110}
                        width={100}
                        height={100}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={writeTone}
                        strokeWidth={1.5}
                    />
                    {/* Private Page A1 */}
                    <rect
                        x={444}
                        y={225}
                        width={100}
                        height={60}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={cowTone}
                        strokeWidth={2}
                    />
                    {/* Shared Base */}
                    <rect
                        x={584}
                        y={110}
                        width={100}
                        height={100}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={baseTone}
                        strokeWidth={2}
                    />
                    {/* Guest B unmodified */}
                    <rect
                        x={724}
                        y={110}
                        width={100}
                        height={100}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Pointers */}
                    <line x1={494} y1={210} x2={494} y2={225} stroke={cowTone} strokeWidth={2} />
                    <line x1={544} y1={160} x2={584} y2={160} stroke={baseTone} strokeWidth={1.5} />
                    <line x1={724} y1={160} x2={684} y2={160} stroke={baseTone} strokeWidth={2} />

                    {/* State 2 notes */}
                    <rect
                        x={564}
                        y={235}
                        width={260}
                        height={160}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Bottom Summary Ribbon */}
                    <rect
                        x={24}
                        y={426}
                        width={812}
                        height={54}
                        rx={8}
                        fill={c.bgCard}
                        stroke={okTone}
                        strokeWidth={2}
                    />
                </svg>
            </CanvasItem>

            {/* Title */}
            {label(
                24,
                20,
                812,
                'Copy-on-Write (COW) Memory Paging & Snapshot Isolation',
                22,
                c.textPrimary,
                'left',
                700,
            )}

            {/* Left Col */}
            {label(36, 75, 360, '1. Clean Restore · 100% Page Sharing', 16, baseTone, 'left', 700)}

            {label(36, 120, 100, 'Guest A', 13, c.textPrimary, 'center', 650)}
            {label(36, 142, 100, 'Page 0: RO', 11, c.textMuted, 'center')}
            {label(36, 160, 100, 'Page 1: RO', 11, c.textMuted, 'center')}
            {label(36, 178, 100, 'Page 2: RO', 11, c.textMuted, 'center')}

            {label(166, 120, 100, 'Shared Base', 13, baseTone, 'center', 700)}
            {label(166, 142, 100, 'P0 = 10 (4K)', 11, baseTone, 'center')}
            {label(166, 160, 100, 'P1 = 20 (4K)', 11, baseTone, 'center')}
            {label(166, 178, 100, 'P2 = 30 (4K)', 11, baseTone, 'center')}

            {label(296, 120, 100, 'Guest B', 13, c.textPrimary, 'center', 650)}
            {label(296, 142, 100, 'Page 0: RO', 11, c.textMuted, 'center')}
            {label(296, 160, 100, 'Page 1: RO', 11, c.textMuted, 'center')}
            {label(296, 178, 100, 'Page 2: RO', 11, c.textMuted, 'center')}

            {label(48, 248, 336, 'Snapshot Memory Multi-Tenancy:', 14, c.textPrimary, 'left', 650)}
            {label(
                48,
                272,
                336,
                '• Both sandboxes point to same physical template pages',
                12,
                c.textMuted,
            )}
            {label(
                48,
                292,
                336,
                '• Host memory: 3 pages (12 KiB) total for 2 microVMs',
                12,
                c.textMuted,
            )}
            {label(
                48,
                312,
                336,
                '• MAP_PRIVATE keeps all page mappings read-only initially',
                12,
                c.textMuted,
            )}
            {label(48, 332, 336, '• Instant boot with near-zero physical RAM overhead', 12, okTone)}

            {/* Right Col */}
            {label(
                444,
                75,
                380,
                '2. Tenant A Writes Page 1 · Copy-On-Write Fault',
                16,
                writeTone,
                'left',
                700,
            )}

            {label(444, 120, 100, 'Guest A', 13, writeTone, 'center', 650)}
            {label(444, 142, 100, 'P0 → Base', 11, c.textMuted, 'center')}
            {label(444, 160, 100, 'P1 → Private', 11, cowTone, 'center', 600)}
            {label(444, 178, 100, 'P2 → Base', 11, c.textMuted, 'center')}

            {label(444, 235, 100, 'Private A1', 12, cowTone, 'center', 700)}
            {label(444, 255, 100, 'val = 99 (4K)', 11, cowTone, 'center')}

            {label(584, 120, 100, 'Shared Base', 13, baseTone, 'center', 700)}
            {label(584, 142, 100, 'P0 = 10', 11, baseTone, 'center')}
            {label(584, 160, 100, 'P1 = 20', 11, baseTone, 'center')}
            {label(584, 178, 100, 'P2 = 30', 11, baseTone, 'center')}

            {label(724, 120, 100, 'Guest B', 13, c.textPrimary, 'center', 650)}
            {label(724, 142, 100, 'P0 → Base', 11, c.textMuted, 'center')}
            {label(724, 160, 100, 'P1 → Base', 11, baseTone, 'center')}
            {label(724, 178, 100, 'P2 → Base', 11, c.textMuted, 'center')}

            {label(576, 248, 236, 'Hardware COW Trap:', 14, writeTone, 'left', 650)}
            {label(576, 272, 236, '• EPT page fault traps write', 12, c.textMuted)}
            {label(576, 292, 236, '• Host allocates private 4K page', 12, c.textMuted)}
            {label(576, 312, 236, '• Guest A writes 99 privately', 12, c.textMuted)}
            {label(576, 332, 236, '• Guest B still reads base 20', 12, okTone)}
            {label(576, 355, 236, '• Zero cross-tenant data leak', 12, okTone)}

            {/* Bottom Summary */}
            {label(
                40,
                442,
                780,
                'Memory Usage: 3 Shared Pages (12 KiB) + 1 Private COW Page (4 KiB) = 16 KiB total (vs 24 KiB unshared)',
                15,
                okTone,
                'center',
                700,
            )}
        </Board>
    )
}

export default create('dark')
