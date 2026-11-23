import React from 'react'
import {
    Board,
    Box,
    CanvasItem,
    FlowArrow,
    Grid,
    Scene,
    TextLabel,
    TiledMatrix,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 860
export const height = 520
export const preset = 'engineering'
export const alt =
    'Product quantization splits a 768-dimensional float32 vector into 96 eight-dimensional subvectors. Each subvector maps to one of 256 centroids in its own codebook and contributes one byte, reducing 3,072 bytes to 96 bytes (32x compression). At query time, an uncompressed query builds a 96 by 256 float32 distance table. Asymmetric Distance Computation sums 96 precomputed centroid distances without reconstructing the full vector.'

function label(
    c: ThemeColors,
    text: string,
    x: number,
    y: number,
    labelWidth: number,
    fontSize = 14,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
    weight = 650,
    mono = false,
) {
    return (
        <CanvasItem x={x} y={y} width={labelWidth} height={Math.ceil(fontSize * 1.45)}>
            <TextLabel
                c={c}
                text={text}
                width="100%"
                fontSize={fontSize}
                fontWeight={weight}
                color={color}
                align={align}
                mono={mono}
            />
        </CanvasItem>
    )
}

const illustration = defineIllustration((colors) => {
    const c = { ...colors, shadow: 'transparent' }
    const encode = getReadableToneColor('blue', c)
    const select = getReadableToneColor('purple', c)
    const code = getReadableToneColor('green', c)
    const lookup = getReadableToneColor('cyan', c)

    return (
        <Scene c={c} padding={0} gap={0} contentWidth={width}>
            <Board c={c} width={width} height={height}>
                {/* Header */}
                {label(
                    c,
                    'Product Quantization & Asymmetric Distance Computation',
                    24,
                    14,
                    810,
                    18,
                    c.textPrimary,
                    'left',
                    800,
                )}
                {label(
                    c,
                    'Split 768D float32 vector into 96 subspaces · Score uncompressed query against 96-byte codes',
                    24,
                    38,
                    810,
                    13,
                    c.textSecondary,
                    'left',
                    500,
                )}

                {/* Central vertical divider */}
                <CanvasItem x={425} y={65} width={1} height={435}>
                    <div
                        style={{
                            width: 1,
                            height: '100%',
                            borderLeft: `1px dashed ${c.borderLight}`,
                        }}
                    />
                </CanvasItem>

                {/* LEFT PANEL: ENCODE */}
                {label(
                    c,
                    'ENCODE · Vector Compression (Offline)',
                    24,
                    70,
                    380,
                    15,
                    encode,
                    'left',
                    800,
                )}
                {label(
                    c,
                    'Raw vector x: 768 float32 coordinates = 3,072 bytes',
                    24,
                    92,
                    380,
                    12,
                    c.textSecondary,
                    'left',
                    600,
                )}

                {/* Subspaces Tiled Matrix */}
                <CanvasItem x={24} y={118} width={86} height={58}>
                    <TiledMatrix
                        c={c}
                        rows={8}
                        cols={12}
                        cellSize={6}
                        gap={1}
                        tone="blue"
                        ariaLabel="Ninety-six subspaces, each containing eight coordinates; the first is highlighted."
                        regions={[
                            { rowStart: 0, rowEnd: 1, colStart: 0, colEnd: 1, tone: 'green' },
                        ]}
                    />
                </CanvasItem>
                {label(
                    c,
                    '96 Subspaces (8 coordinates each)',
                    120,
                    120,
                    280,
                    13,
                    c.textPrimary,
                    'left',
                    750,
                )}
                {label(
                    c,
                    'Green tile represents subvector u₀ (coords 0..7).',
                    120,
                    140,
                    280,
                    12,
                    c.textSecondary,
                    'left',
                    500,
                )}

                {/* Mapping subvector u0 to centroid */}
                {label(c, 'Subvector u₀ (8D)', 24, 188, 120, 12, encode, 'center', 700)}
                <CanvasItem x={24} y={208} width={120} height={24}>
                    <TiledMatrix
                        c={c}
                        rows={1}
                        cols={8}
                        cellSize={11}
                        gap={2}
                        tone="blue"
                        ariaLabel="Eight coordinate positions in subvector u zero."
                    />
                </CanvasItem>

                <CanvasItem x={148} y={204} width={28} height={28}>
                    <FlowArrow c={c} direction="right" length={24} tone="neutral" />
                </CanvasItem>

                {label(c, 'Codebook C₀ (256 centroids)', 180, 188, 130, 12, select, 'center', 700)}
                <CanvasItem x={195} y={208} width={96} height={96}>
                    <TiledMatrix
                        c={c}
                        rows={16}
                        cols={16}
                        cellSize={5}
                        gap={1}
                        tone="purple"
                        ariaLabel="A codebook with 256 centroid slots; slot 42 is highlighted as an illustrative assignment."
                        regions={[
                            { rowStart: 2, rowEnd: 3, colStart: 10, colEnd: 11, tone: 'green' },
                        ]}
                    />
                </CanvasItem>
                {label(c, 'Nearest: ID 42', 195, 308, 96, 11, code, 'center', 600)}

                <CanvasItem x={298} y={204} width={28} height={28}>
                    <FlowArrow c={c} direction="right" length={24} tone="neutral" />
                </CanvasItem>

                <CanvasItem x={330} y={196} width={80} height={44}>
                    <Box
                        c={c}
                        width={80}
                        height={44}
                        color="positive"
                        label="Byte: 42"
                        fontSize={14}
                        outlined
                    />
                </CanvasItem>

                {/* Code Representation */}
                {label(
                    c,
                    'Compact Code: 96 bytes (1 byte per subspace)',
                    24,
                    345,
                    380,
                    13,
                    c.textPrimary,
                    'left',
                    750,
                )}
                <CanvasItem x={24} y={370} width={380} height={38}>
                    <Grid
                        c={c}
                        rows={[
                            [
                                {
                                    label: '42',
                                    color: c.textPrimary,
                                    backgroundColor: c.bgSubtle,
                                    borderColor: code,
                                },
                                'c₁',
                                'c₂',
                                'c₃',
                                '…',
                                'c₉₅',
                            ],
                        ]}
                        cellWidth={56}
                        cellHeight={34}
                        gap={4}
                        fontSize={14}
                    />
                </CanvasItem>

                {label(
                    c,
                    'Compression: 3,072 B → 96 B (32× memory reduction)',
                    24,
                    424,
                    380,
                    13,
                    code,
                    'left',
                    800,
                )}
                {label(
                    c,
                    'Codebooks: 96 × 256 × 8 float32 = 768 KiB shared globally.',
                    24,
                    446,
                    380,
                    12,
                    c.textSecondary,
                    'left',
                    500,
                )}

                {/* RIGHT PANEL: SEARCH */}
                {label(
                    c,
                    'SEARCH · Asymmetric Distance (Online)',
                    445,
                    70,
                    390,
                    15,
                    lookup,
                    'left',
                    800,
                )}
                {label(
                    c,
                    'Query q remains uncompressed (768 float32 values)',
                    445,
                    92,
                    390,
                    12,
                    c.textSecondary,
                    'left',
                    600,
                )}

                {/* Precomputed Distance Table */}
                {label(
                    c,
                    'Step 1: Compute 96 × 256 Distance Table T (once per query)',
                    445,
                    120,
                    390,
                    13,
                    c.textPrimary,
                    'left',
                    750,
                )}
                <CanvasItem x={445} y={145} width={80} height={80}>
                    <TiledMatrix
                        c={c}
                        rows={16}
                        cols={16}
                        cellSize={4}
                        gap={1}
                        tone="cyan"
                        ariaLabel="One 256-entry lookup-table row with entry 42 highlighted."
                        regions={[
                            { rowStart: 2, rowEnd: 3, colStart: 10, colEnd: 11, tone: 'green' },
                        ]}
                    />
                </CanvasItem>
                {label(
                    c,
                    'T[m, k] = ||q_m - C_m[k]||²',
                    535,
                    150,
                    300,
                    13,
                    lookup,
                    'left',
                    700,
                    true,
                )}
                {label(
                    c,
                    'Row m: 256 squared distances to centroids in subspace m.',
                    535,
                    172,
                    300,
                    12,
                    c.textSecondary,
                    'left',
                    500,
                )}
                {label(
                    c,
                    'Table size: 96 × 256 × 4 B = 96 KiB in L2 CPU cache.',
                    535,
                    194,
                    300,
                    12,
                    c.textSecondary,
                    'left',
                    500,
                )}

                {/* Scoring candidate code */}
                {label(
                    c,
                    'Step 2: Score stored candidate vectors via table lookups',
                    445,
                    245,
                    390,
                    13,
                    c.textPrimary,
                    'left',
                    750,
                )}
                {label(
                    c,
                    'For candidate code (c₀, c₁, ..., c₉₅):',
                    445,
                    270,
                    390,
                    12,
                    c.textMuted,
                    'left',
                    600,
                )}
                {label(
                    c,
                    'ADC Score = T[0, c₀] + T[1, c₁] + ... + T[95, c₉₅]',
                    445,
                    292,
                    390,
                    14,
                    code,
                    'left',
                    800,
                    true,
                )}

                {/* Concrete example with c0 = 42 */}
                <CanvasItem x={445} y={328} width={390} height={80}>
                    <div
                        style={{
                            padding: '10px 14px',
                            borderRadius: 6,
                            border: `1px solid ${c.borderLight}`,
                            backgroundColor: c.bgSubtle,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                        }}
                    >
                        <div style={{ fontSize: 13, fontWeight: 700, color: c.textPrimary }}>
                            Example with code byte c₀ = 42:
                        </div>
                        <div style={{ fontSize: 12, color: c.textSecondary }}>
                            Lookup T[0, 42] directly · No vector decompression required!
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: lookup }}>
                            96 table lookups + 95 additions per candidate vector.
                        </div>
                    </div>
                </CanvasItem>

                {label(c, 'Performance Advantage:', 445, 424, 390, 13, c.textPrimary, 'left', 750)}
                {label(
                    c,
                    'Enables high-throughput vector scanning completely in fast RAM/cache.',
                    445,
                    446,
                    390,
                    12,
                    c.textSecondary,
                    'left',
                    500,
                )}
            </Board>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
