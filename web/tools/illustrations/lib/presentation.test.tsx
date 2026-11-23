import React from 'react'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
    Canvas,
    Panel,
    ProgressRow,
    Scene,
    TextLabel,
    getThemeColors,
    renderToPngWithOutput,
    renderToSvg,
} from 'vizmatic'
import { prepareArticleFigure } from './presentation'

describe('article figure presentation', () => {
    const c = getThemeColors('light')

    it('strips wrapped scene chrome and shadows while retaining the complete diagram', () => {
        function Frame() {
            return (
                <Canvas c={c}>
                    <Scene c={c} title="Repeated article heading" subtitle="Repeated introduction">
                        <Panel c={c} title="Token positions" width={320}>
                            <div style={{ boxShadow: '0 1px 2px black' }}>
                                <TextLabel c={c} text="100 → 80.5" mono />
                            </div>
                            <svg width={200} height={24}>
                                <rect x={0} y={0} width={161} height={24} fill="green" />
                            </svg>
                        </Panel>
                    </Scene>
                </Canvas>
            )
        }
        const source = <Frame />
        const before = renderToStaticMarkup(source)
        const after = renderToStaticMarkup(prepareArticleFigure(source, false) as React.ReactNode)

        expect(before).toContain('Repeated article heading')
        expect(before).toContain('box-shadow')
        expect(after).not.toContain('Repeated article heading')
        expect(after).not.toContain('Repeated introduction')
        expect(after).not.toContain('box-shadow')
        expect(after).toContain('background-color:transparent')
        expect(after).toContain('Token positions')
        expect(after).toContain('100 → 80.5')
        expect(after).toContain('width="161"')
        expect(after).toContain('border:')
        expect(renderToStaticMarkup(source)).toBe(before)
    })

    it('retains explicitly requested opaque backgrounds and titles', () => {
        const source = Scene({
            c,
            title: 'Standalone figure',
            background: '#123456',
            children: <TextLabel c={c} text="V × d" />,
        })
        const html = renderToStaticMarkup(
            prepareArticleFigure(source, true, false) as React.ReactNode,
        )
        expect(html).toContain('Standalone figure')
        expect(html).toContain('#123456')
        expect(html).toContain('V × d')
    })

    it('retains an intrinsic root surface that carries semantic color', () => {
        const source = <div style={{ display: 'flex', backgroundColor: '#b83232' }}>BLOCK</div>
        const html = renderToStaticMarkup(prepareArticleFigure(source, false) as React.ReactNode)
        expect(html).toContain('background-color:#b83232')
        expect(html).toContain('BLOCK')
    })

    it('strips a direct TitleBar from another module instance', () => {
        function TitleBar() {
            return <div>Duplicate module heading</div>
        }
        const source = (
            <Canvas c={c}>
                <TitleBar />
                <TextLabel c={c} text="Retained diagram label" />
            </Canvas>
        )
        const html = renderToStaticMarkup(prepareArticleFigure(source, false) as React.ReactNode)
        expect(html).not.toContain('Duplicate module heading')
        expect(html).toContain('Retained diagram label')
    })

    it('preserves positioned nodes, dimensions, borders, and connector geometry', () => {
        const source = (
            <div style={{ width: 600, height: 240, padding: 24 }}>
                <div
                    style={{
                        position: 'absolute',
                        left: 40,
                        top: 20,
                        width: 120,
                        height: 60,
                        border: '1px solid blue',
                        boxShadow: '2px 2px gray',
                    }}
                >
                    K → V
                </div>
                <svg width={400} height={100}>
                    <path d="M 160 50 L 320 50" stroke="blue" />
                </svg>
            </div>
        )
        const html = renderToStaticMarkup(prepareArticleFigure(source, false) as React.ReactNode)
        expect(html).toContain('width:600px;height:240px;padding:24px')
        expect(html).toContain(
            'position:absolute;left:40px;top:20px;width:120px;height:60px;border:1px solid blue',
        )
        expect(html).toContain('M 160 50 L 320 50')
        expect(html).not.toContain('box-shadow')
    })

    it.each(['light', 'dark'] as const)(
        'renders scalar labels through Satori in %s mode',
        async (theme) => {
            const colors = getThemeColors(theme)
            const source = (
                <Scene c={colors} title="Repeated heading" padding={20}>
                    <ProgressRow
                        c={colors}
                        label="Tokens"
                        value={0.805}
                        valueLabel="80.5%"
                        labelWidth={100}
                        valueWidth={70}
                        fontSize={14}
                    />
                    {
                        {
                            type: 'div',
                            props: { style: { display: 'flex' }, children: 'Legacy Satori label' },
                        } as unknown as React.ReactNode
                    }
                </Scene>
            )
            const labels: string[] = []
            const svg = await renderToSvg(
                prepareArticleFigure(source, false) as React.ReactNode,
                600,
                160,
                {
                    theme,
                    watermark: false,
                    onNodeDetected: (node) => {
                        if (node.textContent) labels.push(node.textContent)
                    },
                },
            )
            expect(svg).toContain('<svg')
            expect(labels.join(' ')).toContain('80.5%')
            expect(labels.join(' ')).toContain('Legacy Satori label')
        },
    )

    it('crops centered fixed canvases to balanced gutters while retaining their content', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'leetllm-figure-crop-'))
        try {
            const labels: string[] = []
            const source = (
                <Canvas c={c} justify="center">
                    <Panel c={c} title="Retained mechanism" width={320} height={100}>
                        <TextLabel c={c} text="K → V" />
                    </Panel>
                </Canvas>
            )
            const output = await renderToPngWithOutput(
                prepareArticleFigure(source, false) as React.ReactNode,
                {
                    width: 900,
                    height: 500,
                    outputPath: join(directory, 'figure.png'),
                    crop: 'both',
                    scale: 1,
                    watermark: false,
                    onNodeDetected: (node) => {
                        if (node.textContent) labels.push(node.textContent)
                    },
                },
            )
            expect(output.width).toBeLessThan(400)
            expect(output.height).toBeLessThan(200)
            expect(output.contentBounds.x).toBeGreaterThanOrEqual(20)
            expect(output.contentBounds.y).toBeGreaterThanOrEqual(20)
            expect(output.contentBounds.x).toBeLessThanOrEqual(28)
            expect(output.contentBounds.y).toBeLessThanOrEqual(28)
            expect(labels.join(' ')).toContain('K → V')
        } finally {
            await rm(directory, { recursive: true, force: true })
        }
    })

    it('balances modest gutters even when cropping saves less than ten percent', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'leetllm-small-crop-'))
        try {
            const source = (
                <div style={{ display: 'flex', position: 'relative', width: 500, height: 400 }}>
                    <div
                        style={{
                            display: 'flex',
                            position: 'absolute',
                            left: 24,
                            top: 56,
                            width: 452,
                            height: 320,
                            backgroundColor: 'blue',
                        }}
                    >
                        K → V
                    </div>
                </div>
            )
            const output = await renderToPngWithOutput(source, {
                width: 500,
                height: 400,
                outputPath: join(directory, 'figure.png'),
                crop: 'both',
                scale: 1,
                watermark: false,
            })
            expect(output.height).toBeLessThan(380)
            expect(output.contentBounds.y).toBeGreaterThanOrEqual(20)
            expect(output.contentBounds.y).toBeLessThanOrEqual(28)
        } finally {
            await rm(directory, { recursive: true, force: true })
        }
    })
})
