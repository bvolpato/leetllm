import React from 'react'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import {
    Board,
    Canvas,
    CanvasItem,
    Card,
    Panel,
    Scene,
    TextLabel,
    getThemeColors,
    renderToPngWithOutput,
} from 'vizmatic'
import {
    localImportClosure,
    prepareBookFigure,
    resolveBookIllustration,
    retainedBookIllustrationNames,
} from './book'
import { minimumBookLabelPixels, preparePrintTypography } from './lib/print-typography'
import { filterContentForAudience } from '../../src/lib/content-audience'

describe('book illustration preparation', () => {
    const c = getThemeColors('light')

    it('tracks shared kits that a figure reaches through another chapter folder and a re-export', async () => {
        const root = await mkdtemp(join(tmpdir(), 'leetllm-closure-'))
        try {
            await mkdir(join(root, 'one'))
            await mkdir(join(root, 'two'))
            await writeFile(
                join(root, 'one/figure.tsx'),
                "import React from 'react'\nimport { kit } from './shared'\nimport missing from './missing'\n",
            )
            await writeFile(join(root, 'one/shared.tsx'), "export * from '../two/print-kit'\n")
            await writeFile(join(root, 'two/print-kit.tsx'), 'export const kit = 1\n')
            await writeFile(join(root, 'two/unrelated.tsx'), 'export const other = 2\n')
            expect(await localImportClosure([join(root, 'one/figure.tsx')])).toEqual([
                join(root, 'one/figure.tsx'),
                join(root, 'one/shared.tsx'),
                join(root, 'two/print-kit.tsx'),
            ])
        } finally {
            await rm(root, { recursive: true, force: true })
        }
    })

    it('selects retained book images while excluding website-only assets and literal examples', () => {
        const source = `<!-- leetllm: audience:website:start -->
<img src="illustrations/_generated/resume_checkpoint_stack_dark.png" />
<!-- leetllm: audience:website:end -->
<img src="illustrations/_generated/update_flow_light.png" />
![Step](illustrations/_generated/cache_scene2_dark.png)
\`\`\`html
<img src="illustrations/_generated/literal_example_dark.png" />
\`\`\``
        expect([
            ...retainedBookIllustrationNames(filterContentForAudience(source, 'book')),
        ]).toEqual(['update_flow', 'cache_scene2'])
    })

    it('omits presentation titles and moves explanatory prose to caption notes', () => {
        const caveat =
            'Expected results remain outside the worker process, but repeated feedback can still disclose information about hidden test cases.'
        const source = Scene({
            c,
            title: 'Trusted grading',
            subtitle: 'Keep the verdict outside candidate memory',
            children: [
                <Panel key="diagram" c={c} title="Worker → validator">
                    <TextLabel c={c} text="compare y with y*" />
                    <svg width={80} height={20}>
                        <line x1={0} y1={10} x2={80} y2={10} stroke="black" />
                    </svg>
                </Panel>,
                <TextLabel key="note" c={c} text={caveat} />,
            ],
        })
        const prepared = prepareBookFigure(source)
        const html = renderToStaticMarkup(prepared.element)

        expect(prepared.notes).toEqual(['Keep the verdict outside candidate memory', caveat])
        expect(html).toContain('Worker → validator')
        expect(html).toContain('compare y with y*')
        expect(html).toContain('<line')
        expect(html).toContain('border:')
        expect(html).not.toContain('Trusted grading')
        expect(html).not.toContain(caveat)
        expect(html).not.toContain('box-shadow')
        // Website elements are immutable inputs to the print transformation.
        expect(renderToStaticMarkup(source)).toContain(caveat)
    })

    it('removes only the outer frame and preserves formulas and internal grouping', () => {
        const formula = 'Batch 8 × 32 heads × 8192² entries × 2 bytes = 34.4 GB (32.0 GiB)'
        const source = (
            <div style={{ border: '4px solid red', boxShadow: '1px 1px black', padding: 60 }}>
                <div style={{ border: '1px solid blue' }}>
                    <TextLabel c={c} text={formula} mono />
                </div>
            </div>
        )
        const prepared = prepareBookFigure(source)
        const html = renderToStaticMarkup(prepared.element)
        expect(html).not.toContain('4px solid red')
        expect(html).toContain('1px solid blue')
        expect(html).toContain(formula)
        expect(prepared.notes).toEqual([])
    })

    it('preserves authored zero padding and the same full-canvas raster through print preparation', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'leetllm-book-root-padding-'))
        try {
            const width = 320
            const height = 180
            const source = (
                <Scene c={c} padding={0} gap={0} contentWidth={width} background="transparent">
                    <Board c={c} width={width} height={height} background="transparent">
                        <CanvasItem x={0} y={0} width={width} height={height}>
                            <svg
                                width={width}
                                height={height}
                                viewBox={`0 0 ${width} ${height}`}
                                aria-hidden="true"
                            >
                                <rect x={6} y={6} width={12} height={12} fill={c.criticalLight} />
                                <rect
                                    x={width - 18}
                                    y={6}
                                    width={12}
                                    height={12}
                                    fill={c.infoLight}
                                />
                                <rect
                                    x={6}
                                    y={height - 18}
                                    width={12}
                                    height={12}
                                    fill={c.warningLight}
                                />
                                <rect
                                    x={width - 18}
                                    y={height - 18}
                                    width={12}
                                    height={12}
                                    fill={c.positiveLight}
                                />
                            </svg>
                        </CanvasItem>
                        {[
                            { x: 22, y: 7, text: 'NW' },
                            { x: width - 58, y: 7, text: 'NE' },
                            { x: 22, y: height - 27, text: 'SW' },
                            { x: width - 58, y: height - 27, text: 'SE' },
                        ].map(({ x, y, text }) => (
                            <CanvasItem key={text} x={x} y={y} width={40} height={18}>
                                <TextLabel
                                    c={c}
                                    text={text}
                                    width={40}
                                    fontSize={14}
                                    fontWeight={700}
                                    color={c.textPrimary}
                                />
                            </CanvasItem>
                        ))}
                    </Board>
                </Scene>
            )
            const prepared = prepareBookFigure(source).element as React.ReactElement
            const preparedEight = prepareBookFigure(
                <Scene c={c} padding={8}>
                    <TextLabel c={c} text="Inset" />
                </Scene>,
            ).element as React.ReactElement
            const preparedDefault = prepareBookFigure(
                <Scene c={c}>
                    <TextLabel c={c} text="Default inset" />
                </Scene>,
            ).element as React.ReactElement
            const preparedString = prepareBookFigure(
                <div style={{ padding: '8px' }}>
                    <TextLabel c={c} text="String inset" />
                </div>,
            ).element as React.ReactElement
            const directPath = join(directory, 'direct.png')
            const preparedPath = join(directory, 'prepared.png')
            const printPath = join(directory, 'print.png')
            const options = (outputPath: string) => ({
                width,
                height,
                outputPath,
                background: 'transparent' as const,
                theme: 'light' as const,
                watermark: false,
                crop: 'both' as const,
                scale: 2,
            })

            const direct = await renderToPngWithOutput(source, options(directPath))
            const transformed = await renderToPngWithOutput(prepared, options(preparedPath))
            const printElement = preparePrintTypography(
                prepared,
                minimumBookLabelPixels(width, height),
            )
            const print = await renderToPngWithOutput(printElement, options(printPath))

            expect(prepared.props.style?.padding).toBe(0)
            expect(preparedEight.props.style?.padding).toBe(8)
            expect(preparedDefault.props.style?.padding).toBe(16)
            expect(preparedString.props.style?.padding).toBe(16)
            expect(transformed.width).toBe(direct.width)
            expect(transformed.height).toBe(direct.height)
            expect(transformed.contentBounds).toEqual(direct.contentBounds)
            expect(print.width).toBe(direct.width)
            expect(print.height).toBe(direct.height)
            expect(print.contentBounds).toEqual(direct.contentBounds)
            expect(await readFile(preparedPath)).toEqual(await readFile(directPath))
            expect(await readFile(printPath)).toEqual(await readFile(directPath))
        } finally {
            await rm(directory, { recursive: true, force: true })
        }
    })

    it('handles JSX scene wrappers as well as direct primitive calls', () => {
        function AnimationFrame() {
            return (
                <Canvas c={c}>
                    <Scene c={c} title="Cache layout">
                        <TextLabel c={c} text="K → V" />
                    </Scene>
                </Canvas>
            )
        }
        const source = <AnimationFrame />
        const prepared = prepareBookFigure(source)
        expect(renderToStaticMarkup(prepared.element)).toContain('K → V')
        expect(renderToStaticMarkup(prepared.element)).not.toContain('Cache layout')
        expect(prepared.notes).toEqual([])
    })

    it('normalizes nested legacy Satori elements before applying print transforms', () => {
        const caveat =
            'A feature must contain only information available before the model makes its opening prediction.'
        const legacy = {
            type: 'section',
            key: 'request-feature',
            props: {
                'data-feature': 'approval-time',
                style: { display: 'flex', boxShadow: '1px 1px black' },
                children: [
                    <div key="header">
                        {
                            [
                                { type: 'span', key: 'name', props: { children: 'approval_time' } },
                                <TextLabel key="time" c={c} text="10:22:15" mono />,
                            ] as React.ReactNode
                        }
                    </div>,
                    { type: TextLabel, key: 'caveat', props: { c, text: caveat } },
                    <svg key="mark" width={80} height={20}>
                        <line x1={0} y1={10} x2={80} y2={10} stroke="black" />
                    </svg>,
                ],
            },
        } as unknown as React.ReactElement
        function LegacyFeature() {
            return legacy
        }
        for (const source of [<div key="outer">{legacy}</div>, <LegacyFeature key="component" />]) {
            const prepared = prepareBookFigure(source)
            const html = renderToStaticMarkup(prepared.element)
            expect(prepared.notes).toEqual([caveat])
            expect(html).toContain('data-feature="approval-time"')
            expect(html).toContain('approval_time')
            expect(html).toContain('10:22:15')
            expect(html).toContain('<line')
            expect(html).not.toContain(caveat)
            expect(html).not.toContain('box-shadow')
        }
        const prepared = prepareBookFigure(legacy).element as React.ReactElement
        expect(prepared.key).toBe('request-feature')
        expect(legacy.props).toMatchObject({ style: { boxShadow: '1px 1px black' } })
    })

    it('removes an empty annotation card after moving its prose to the caption', () => {
        const note =
            'A receipt needs trusted origin, recorded artifact identity, and an enforced comparison.'
        const prepared = prepareBookFigure(
            <Canvas c={c}>
                <TextLabel c={c} text="Input → worker → validator" />
                <Card c={c}>
                    <TextLabel c={c} text={note} />
                </Card>
            </Canvas>,
        )
        const html = renderToStaticMarkup(prepared.element)
        expect(prepared.notes).toEqual([note])
        expect(html).toContain('Input → worker → validator')
        expect(html).not.toContain('border:')
    })

    it('retains complete labels attached to positioned diagram nodes', () => {
        const label =
            'Expected output remains outside the worker and is compared against the candidate result.'
        const prepared = prepareBookFigure(
            <Canvas c={c}>
                <div style={{ position: 'absolute', width: 200, height: 80, display: 'flex' }}>
                    {label}
                </div>
            </Canvas>,
        )
        expect(renderToStaticMarkup(prepared.element)).toContain(label)
        expect(prepared.notes).toEqual([])
    })

    it('moves reviewed monospace takeaway bands without stripping ordinary monospace labels', () => {
        const caveat =
            'Small slice counts need broader testing. False refusal is one utility failure; a baseline is needed to attribute loss to alignment.'
        const source = (
            <Canvas c={c}>
                <TextLabel c={c} text="ASR = violations / attacks" mono />
                <Panel
                    c={c}
                    title="Audit Principle: Slices Reveal What Aggregate Metrics Obscure"
                    subtitle={caveat}
                />
            </Canvas>
        )
        const prepared = prepareBookFigure(
            source,
            'training/constitutional-ai-automated-red-teaming/safety_metric_dashboard',
        )
        const html = renderToStaticMarkup(prepared.element)
        expect(prepared.notes).toEqual([caveat])
        expect(html).toContain('ASR = violations / attacks')
        expect(html).not.toContain('Audit Principle')
        expect(html).not.toContain('border:')
    })

    it('moves only the reviewed positioned footer while retaining graph-node labels', () => {
        const caveat =
            "Prefixes shown; verification compares full hashes. A protected anchor exposes rewrites, but doesn't prove the events were true."
        const nodeLabel =
            'Expected output remains outside the worker and is compared against the candidate result.'
        const prepared = prepareBookFigure(
            <Canvas c={c}>
                <div style={{ position: 'absolute', width: 200, display: 'flex' }}>{nodeLabel}</div>
                <div style={{ position: 'absolute', width: 1060, display: 'flex' }}>{caveat}</div>
            </Canvas>,
            'llmops/responsible-ai-governance-ethics-compliance/agent_audit_evidence_chain',
        )
        const html = renderToStaticMarkup(prepared.element)
        expect(prepared.notes).toEqual([caveat])
        expect(html).toContain(nodeLabel)
        expect(html).not.toContain(caveat)
    })

    it('rejects paths outside the content tree', () => {
        expect(() => resolveBookIllustration('../../../../etc/passwd')).toThrow(
            'Invalid book content path',
        )
    })
})
