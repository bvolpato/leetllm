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
    'Content moderation exact versus similarity caching architecture. The exact cache matches cryptographic SHA-256 hashes bound to tenant, policy version, and surface scope for sub-millisecond replay of definitive actions. The similarity cache computes 64-bit SimHash or perceptual image hashes to detect mutated duplicates within a bounded Hamming distance, forwarding candidate evidence to downstream classifiers rather than executing unverified blocks.'

export const numericAnchors = {
    exactLatencyMs: 1,
    simHashBits: 64,
    maxHammingDistance: 12,
    stages: 2,
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
            {/* SVG Visual Elements */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Left Box */}
                    <rect
                        x={40}
                        y={72}
                        width={375}
                        height={245}
                        rx={8}
                        fill={theme === 'dark' ? '#102216' : '#f0fdf4'}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Right Box */}
                    <rect
                        x={440}
                        y={72}
                        width={375}
                        height={245}
                        rx={8}
                        fill={theme === 'dark' ? '#181224' : '#faf5ff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Bottom Invariant Box */}
                    <rect
                        x={40}
                        y={330}
                        width={775}
                        height={138}
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
                'Exact vs Perceptual Similarity Moderation Caching',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Distinguishing deterministic action replay from near-duplicate candidate evidence gathering',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Left Panel: Exact Match Cache (Width: 375) */}
            {label(
                52,
                84,
                350,
                '1. EXACT CRYPTOGRAPHIC CACHE (SHA-256)',
                11,
                greenTone,
                'left',
                700,
            )}

            {label(
                52,
                110,
                350,
                'Canonical Namespace Key Formulation:',
                11,
                c.textPrimary,
                'left',
                600,
            )}
            {label(
                52,
                128,
                350,
                'SHA256(RawBytes : TenantID : PolicyRev : Surface : Lang)',
                10,
                greenTone,
                'left',
                600,
            )}

            {label(
                52,
                160,
                350,
                'Lookup Latency: < 1.0 ms (In-Memory Redis Cluster)',
                11,
                c.textSecondary,
                'left',
                500,
            )}
            {label(
                52,
                178,
                350,
                'Replay Action: Immediate ALLOW or BLOCK execution',
                12,
                greenTone,
                'left',
                700,
            )}

            {label(52, 212, 350, 'Scope Mismatch Safety Trap:', 11, warmTone, 'left', 700)}
            {label(
                52,
                230,
                350,
                'Identical violating text quoted within an "abuse_appeal" or "moderator_note" thread produces a distinct namespace key, preventing improper auto-blocking of legitimate appeal text.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Right Panel: Similarity Cache (Width: 375) */}
            {label(
                452,
                84,
                350,
                '2. PERCEPTUAL SIMILARITY CACHE (SIMHASH / PDQ)',
                11,
                purpleTone,
                'left',
                700,
            )}

            {label(
                452,
                110,
                350,
                'Fuzzy Fingerprint & Distance Metric:',
                11,
                c.textPrimary,
                'left',
                600,
            )}
            {label(
                452,
                128,
                350,
                '64-bit SimHash (Text) / PDQ (Images) · Hamming Distance <= 12',
                10,
                purpleTone,
                'left',
                600,
            )}

            {label(
                452,
                160,
                350,
                'Lookup Latency: 3 - 8 ms (Hamming Multi-Index Table)',
                11,
                c.textSecondary,
                'left',
                500,
            )}
            {label(
                452,
                178,
                350,
                'Action: Warm Candidate Evidence (No Auto-Block)',
                12,
                purpleTone,
                'left',
                700,
            )}

            {label(452, 212, 350, 'Near-Duplicate Mutation Handling:', 11, blueTone, 'left', 700)}
            {label(
                452,
                230,
                350,
                'Emoji insertions, spacing tricks, or minor image crops preserve fingerprint locality. Matches forward historical decision context to Stage 2 ML classifiers for accelerated verification.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Bottom Guardrail Panel */}
            {label(
                52,
                342,
                756,
                'Distributed Moderation Caching Invariants',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                366,
                756,
                '1. Namespace cache keys by policy version and tenant ID. · 2. Treat perceptual similarity hits as risk priors, not auto-bans.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
