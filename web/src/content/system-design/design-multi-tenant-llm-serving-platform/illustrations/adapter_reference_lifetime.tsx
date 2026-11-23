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
    'Dynamic LoRA adapter lifecycle with reference counting. Tenant permission and base compatibility are validated before cache lookup. An in-flight request pins adapter A (reference count 1), preventing eviction by competing tenant requests. Only when execution completes and reference count drops to 0 does the cache manager permit eviction and hot-swap of adapter B.'

export const numericAnchors = {
    pinnedRefCount: 1,
    retiredRefCount: 0,
    stages: 4,
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const blueTone = getReadableToneColor('blue', c, c.bg)
    const purpleTone = getReadableToneColor('purple', c, c.bg)
    const greenTone = getReadableToneColor('green', c, c.bg)
    const warmTone = getReadableToneColor('warm', c, c.bg)

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

    return (
        <Board c={c} width={width} height={height} background="transparent">
            {/* SVG Elements */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <defs>
                        <marker
                            id="lora-arr"
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

                    {/* Top Ingress Banner */}
                    <rect
                        x={40}
                        y={74}
                        width={780}
                        height={58}
                        rx={8}
                        fill={theme === 'dark' ? '#141d2e' : '#eff6ff'}
                        stroke={blueTone}
                        strokeWidth={1}
                    />

                    {/* 4 Phase Cards */}
                    <rect
                        x={40}
                        y={148}
                        width={186}
                        height={210}
                        rx={8}
                        fill={theme === 'dark' ? '#121824' : '#f0f9ff'}
                        stroke={blueTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={236}
                        y={148}
                        width={186}
                        height={210}
                        rx={8}
                        fill={theme === 'dark' ? '#221c12' : '#fffbeb'}
                        stroke={warmTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={432}
                        y={148}
                        width={186}
                        height={210}
                        rx={8}
                        fill={theme === 'dark' ? '#102218' : '#f0fdf4'}
                        stroke={greenTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={628}
                        y={148}
                        width={192}
                        height={210}
                        rx={8}
                        fill={theme === 'dark' ? '#1c1328' : '#faf5ff'}
                        stroke={purpleTone}
                        strokeWidth={1}
                    />

                    {/* Horizontal Connector arrows between cards */}
                    <line
                        x1={226}
                        y1={250}
                        x2={236}
                        y2={250}
                        stroke={c.textMuted}
                        strokeWidth={1.5}
                        markerEnd="url(#lora-arr)"
                    />
                    <line
                        x1={422}
                        y1={250}
                        x2={432}
                        y2={250}
                        stroke={c.textMuted}
                        strokeWidth={1.5}
                        markerEnd="url(#lora-arr)"
                    />
                    <line
                        x1={618}
                        y1={250}
                        x2={628}
                        y2={250}
                        stroke={c.textMuted}
                        strokeWidth={1.5}
                        markerEnd="url(#lora-arr)"
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
                'Dynamic LoRA Swapping: Reference Counting & Eviction Safety',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Active execution pins adapter weights in GPU VRAM; eviction is deferred until all batch references retire',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Ingress Validation Bar */}
            {label(
                52,
                82,
                756,
                'GATEWAY INGRESS: RBAC PERMISSION & ARCHITECTURE COMPATIBILITY CHECK',
                11,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                102,
                756,
                'Verified: Tenant A authorized for "docs-v2" | Base compatibility: Llama-3-70B (Base architecture match)',
                12,
                c.textPrimary,
                'left',
                500,
            )}

            {/* 4 Lifecycle Phase Columns */}
            {/* Phase 1: Pinned */}
            {label(48, 156, 180, '1. PINNED (RUNNING)', 11, blueTone, 'left', 700)}
            {label(48, 178, 180, 'Adapter A (docs-v2)', 12, c.textPrimary, 'left', 600)}
            {label(48, 198, 180, 'ref_count = 1', 13, blueTone, 'left', 700)}
            {label(
                48,
                222,
                180,
                'Batch executing forward passes. Eviction locked.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Phase 2: Contention */}
            {label(244, 156, 180, '2. CONTENTION (WAIT)', 11, warmTone, 'left', 700)}
            {label(244, 178, 180, 'Tenant B Requests Slot', 12, c.textPrimary, 'left', 600)}
            {label(244, 198, 180, 'A ref_count = 1 (Pinned)', 13, warmTone, 'left', 700)}
            {label(
                244,
                222,
                180,
                'Tenant B waits in queue; cannot overwrite active weights.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Phase 3: Retirement */}
            {label(440, 156, 180, '3. UNPINNED (RETIRED)', 11, greenTone, 'left', 700)}
            {label(440, 178, 180, 'Batch Execution Done', 12, c.textPrimary, 'left', 600)}
            {label(440, 198, 180, 'ref_count = 0', 13, greenTone, 'left', 700)}
            {label(
                440,
                222,
                180,
                'Tokens emitted. Adapter unpinned; eligible for eviction.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Phase 4: Hot-Swap */}
            {label(636, 156, 180, '4. HOT-SWAP (EVICT)', 11, purpleTone, 'left', 700)}
            {label(636, 178, 180, 'Adapter B Loaded', 12, c.textPrimary, 'left', 600)}
            {label(636, 198, 180, 'B ref_count = 1', 13, purpleTone, 'left', 700)}
            {label(
                636,
                222,
                180,
                'VRAM reclaimed; PCIe DMA transfers Adapter B weights.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Bottom Guardrail Box */}
            {label(
                52,
                386,
                756,
                'Multi-Tenant LoRA Serving Invariants (S-LoRA / Punica)',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                406,
                756,
                '1. Pin active adapters via ref_count > 0. · 2. Resolve version aliases at request start. · 3. Evict idle adapters via LRU.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
