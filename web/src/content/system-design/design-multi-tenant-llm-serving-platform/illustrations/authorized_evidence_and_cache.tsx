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
    'Multi-tenant authorization and prefix cache isolation. In retrieval, tenant and principal predicates filter candidates before top-1 selection, retaining only authorized document A-public (score 0.80) while rejecting unauthorized higher-scoring documents. In prefix caching, the cache key binds tenant, principal, ACL epoch, model version, and adapter revision, preventing cross-tenant KV reuse.'

export const numericAnchors = {
    documents: [
        { id: 'B-secret', score: 0.99, tenant: 'Tenant B', status: 'Tenant Mismatch' },
        { id: 'A-private', score: 0.95, tenant: 'Tenant A', status: 'Principal Mismatch' },
        { id: 'A-public', score: 0.8, tenant: 'Tenant A', status: 'Authorized' },
    ],
    selected: 'A-public',
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const blueTone = getReadableToneColor('blue', c, c.bg)
    const greenTone = getReadableToneColor('green', c, c.bg)
    const redTone = getReadableToneColor('critical', c, c.bg)
    const purpleTone = getReadableToneColor('purple', c, c.bg)

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

    const cacheKeyElements = [
        'tenant: "tenant-a"',
        'user: "alice"',
        'acl_epoch: 1',
        'base: "llama-3-70b"',
        'adapter: "docs-v2"',
        'tokenizer: "v3"',
        'kv_layout: "fp16-gqa"',
        'prefix_ids: [1, 5, 9...]',
    ]

    return (
        <Board c={c} width={width} height={height} background="transparent">
            {/* SVG Elements */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Left Retrieval Container */}
                    <rect
                        x={40}
                        y={76}
                        width={370}
                        height={280}
                        rx={10}
                        fill={theme === 'dark' ? '#121824' : '#f0f9ff'}
                        stroke={blueTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={48}
                        y={106}
                        width={354}
                        height={50}
                        rx={6}
                        fill={theme === 'dark' ? '#241417' : '#fff5f5'}
                        stroke={redTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={48}
                        y={164}
                        width={354}
                        height={50}
                        rx={6}
                        fill={theme === 'dark' ? '#241417' : '#fff5f5'}
                        stroke={redTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={48}
                        y={222}
                        width={354}
                        height={50}
                        rx={6}
                        fill={theme === 'dark' ? '#102218' : '#f0fdf4'}
                        stroke={greenTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={48}
                        y={282}
                        width={354}
                        height={60}
                        rx={6}
                        fill={theme === 'dark' ? '#143020' : '#dcfce7'}
                        stroke={greenTone}
                        strokeWidth={1}
                    />

                    {/* Right Cache Container */}
                    <rect
                        x={450}
                        y={76}
                        width={370}
                        height={280}
                        rx={10}
                        fill={theme === 'dark' ? '#1a1324' : '#faf5ff'}
                        stroke={purpleTone}
                        strokeWidth={1}
                    />
                    {/* Cache key grid box */}
                    <rect
                        x={458}
                        y={126}
                        width={354}
                        height={148}
                        rx={6}
                        fill={theme === 'dark' ? '#221833' : '#f3e8ff'}
                        stroke={purpleTone}
                        strokeWidth={1}
                    />

                    {/* Bottom Guardrail Box */}
                    <rect
                        x={40}
                        y={382}
                        width={780}
                        height={78}
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
                'Multi-Tenant Security: Retrieval Predicates & Cache Key Isolation',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Pre-filtering stops cross-tenant data leaks in retrieval; cryptographically bound keys isolate prefix KV caches',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Left Column: Retrieval Authorization */}
            {label(
                40,
                84,
                370,
                '1. RETRIEVAL: TENANT & PRINCIPAL PRE-FILTERING',
                11,
                blueTone,
                'left',
                700,
            )}

            {/* Doc 1: B-secret */}
            {label(
                52,
                114,
                350,
                'Doc 1: B-secret (Score: 0.99 · Reader: Bob)',
                12,
                c.textPrimary,
                'left',
                600,
            )}
            {label(52, 132, 350, 'STATUS: REJECT (Foreign Tenant B)', 11, redTone, 'left', 700)}

            {/* Doc 2: A-private */}
            {label(
                52,
                172,
                350,
                'Doc 2: A-private (Score: 0.95 · Reader: Carol)',
                12,
                c.textPrimary,
                'left',
                600,
            )}
            {label(
                52,
                190,
                350,
                'STATUS: REJECT (Principal Mismatch in Tenant A)',
                11,
                redTone,
                'left',
                700,
            )}

            {/* Doc 3: A-public */}
            {label(
                52,
                230,
                350,
                'Doc 3: A-public (Score: 0.80 · Reader: Alice)',
                12,
                c.textPrimary,
                'left',
                600,
            )}
            {label(
                52,
                248,
                350,
                'STATUS: ALLOWED (Matches Tenant A & Alice)',
                11,
                greenTone,
                'left',
                700,
            )}

            {/* Selected Ingress */}
            {label(52, 292, 350, 'Top-1 Selected for Prompt: A-public', 12, greenTone, 'left', 700)}
            {label(
                52,
                312,
                350,
                'Pre-filtering guarantees zero unauthorized text reaches prompt context.',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Right Column: Prefix Cache Key Isolation */}
            {label(
                450,
                84,
                370,
                '2. KV-CACHE: MULTI-TENANT ISOLATION KEY',
                11,
                purpleTone,
                'left',
                700,
            )}
            {label(
                462,
                108,
                350,
                'Canonical Prefix Cache Key Tuple:',
                12,
                c.textPrimary,
                'left',
                600,
            )}

            {/* Key elements grid */}
            {cacheKeyElements.map((el, i) => {
                const col = i % 2
                const row = Math.floor(i / 2)
                const kx = 462 + col * 180
                const ky = 132 + row * 44
                return (
                    <React.Fragment key={`key-el-${i}`}>
                        {label(kx, ky, 170, el, 11, purpleTone, 'left', 600)}
                    </React.Fragment>
                )
            })}

            {/* Cache Invalidation Rules */}
            {label(462, 292, 350, 'Strict Cache Miss Guarantees:', 12, c.textPrimary, 'left', 600)}
            {label(
                462,
                312,
                350,
                'Different user ("bob"), tenant ("tenant-b"), or updated adapter ("docs-v3") causes a clean miss. Zero cross-tenant cache hits.',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Bottom Guardrail Box */}
            {label(
                52,
                396,
                756,
                'Architecture Principle: Two-Tier Defense in Depth',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                416,
                756,
                '1. Ingestion & Retrieval Gate: Tenant and user ACL predicates are pushed into vector/lexical index scans. · 2. Runtime Inference Gate: PagedAttention prefix hash includes tenant identity and ACL revision. Even if two tenants submit identical system prompts, they receive separate, isolated KV blocks.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
