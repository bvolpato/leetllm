import React from 'react'
import { describe, expect, it } from 'vitest'
import { renderToSvg } from 'vizmatic'
import {
    bookDisplayScale,
    figureLabelStats,
    minimumBookLabelPixels,
    preparePrintTypography,
    printedFigureScale,
    textCollisions,
    type LayoutNode,
} from './print-typography'

describe('print figure typography', () => {
    const label = (
        textContent: string,
        left: number,
        top: number,
        width: number,
        height: number,
        style: React.CSSProperties = { fontSize: 18 },
    ) => ({ textContent, left, top, width, height, props: { style } })

    it('finds raised labels that land on each other, wrap out of their line, or spill out of a box', () => {
        expect(
            textCollisions([
                label('first label', 0, 0, 100, 22),
                label('second label', 0, 8, 100, 22),
            ]),
        ).toHaveLength(1)
        // Monospace text that needs two lines in a one-line slot falls on whatever is below.
        expect(
            textCollisions([
                label('Alice can_promote', 0, 0, 180, 21, {
                    fontSize: 19,
                    fontFamily: 'JetBrains Mono',
                }),
            ]),
        ).toEqual(['"Alice can_promote" wraps out of its line'])
        const box = {
            textContent: '',
            left: 0,
            top: 0,
            width: 200,
            height: 40,
            props: { style: { height: 40, border: '1px solid' } },
        }
        expect(textCollisions([box, label('three lines of text', 10, 10, 180, 60)])).toEqual([
            '"three lines of text" spills out of its box',
        ])
    })

    it('accepts neighbors whose ink does not touch, even when their layout boxes overlap', () => {
        // Fixed columns are wider than the words they hold, so these node boxes overlap and the words do not.
        expect(
            textCollisions([label('Model', 0, 0, 200, 25), label('Role', 175, 0, 190, 25)]),
        ).toEqual([])
        expect(
            textCollisions([
                label('fail', 0, 0, 30, 21),
                label('a long label', 0, 40, 40, 21, { fontSize: 18, whiteSpace: 'nowrap' }),
            ]),
        ).toEqual([])
        // A cell centered by its flex parent may not touch the row label that shares its box edge.
        expect(
            textCollisions([label('Offered RPS', 0, 0, 120, 22), label('0.5', 100, 0, 100, 22)]),
        ).toEqual([])
    })

    it('scales its label minimum for both wide and tall figures', () => {
        expect(minimumBookLabelPixels(800, 600)).toBe(17)
        expect(minimumBookLabelPixels(1200, 600)).toBe(26)
        expect(minimumBookLabelPixels(600, 1200)).toBe(22)
        expect(minimumBookLabelPixels(100, 100)).toBe(6)
        expect(17 * printedFigureScale(800, 600)).toBeGreaterThanOrEqual(8.5)
        expect(17 * printedFigureScale(800, 1600)).toBeLessThan(8)
        expect(printedFigureScale(100, 100)).toBe(1.5)
    })

    it('prints ordinary labels at one size, whatever canvas the figure was drawn on', () => {
        const small = bookDisplayScale(560, 700, { dominantPx: 24, smallestPx: 22 })
        const large = bookDisplayScale(1100, 700, { dominantPx: 26, smallestPx: 24 })
        expect(24 * small).toBeCloseTo(26 * large, 1)
        expect(24 * small).toBeCloseTo(8.75, 1)
    })

    it('keeps the smallest label readable and the figure inside the page', () => {
        const spread = bookDisplayScale(500, 400, { dominantPx: 30, smallestPx: 12 })
        expect(12 * spread).toBeGreaterThanOrEqual(8)
        expect(bookDisplayScale(3000, 500, { dominantPx: 24 }) * 3000).toBeLessThanOrEqual(406.8)
        expect(bookDisplayScale(500, 3000, { dominantPx: 24 }) * 3000).toBeLessThanOrEqual(465)
    })

    it('finds the size most text uses and ignores stray subscripts for the smallest', () => {
        const stats = figureLabelStats([
            { textContent: 'A long ordinary label', props: { style: { fontSize: 14 } } },
            { textContent: 'Title', props: { style: { fontSize: 28 } } },
            { textContent: 'k', props: { style: { fontSize: 7 } } },
            { textContent: '', props: { style: { fontSize: 2 } } },
        ])
        expect(stats).toEqual({ dominantPx: 14, smallestPx: 14 })
    })

    it('measures numeric labels and their collisions while ignoring hidden conditional labels', async () => {
        const nodes: LayoutNode[] = []
        await renderToSvg(
            <div style={{ display: 'flex', position: 'relative', fontSize: 20 }}>
                <div style={{ position: 'absolute', left: 0, top: 0, fontSize: 20 }}>{0}</div>
                <div style={{ position: 'absolute', left: 0, top: 0, fontSize: 20 }}>{0.618}</div>
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: 100,
                        height: 60,
                        fontSize: 60,
                    }}
                >
                    {false}
                </div>
            </div>,
            200,
            80,
            {
                theme: 'light',
                watermark: false,
                onNodeDetected: (node) => nodes.push(node),
            },
        )
        expect(figureLabelStats(nodes)).toEqual({ dominantPx: 20, smallestPx: 20 })
        expect(textCollisions(nodes)).toEqual(['"0" on "0.618"'])
    })

    it('renders readable inherited labels and expands a fixed line height without mutating the source', async () => {
        const source = (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    fontSize: 11,
                    lineHeight: '13px',
                }}
            >
                <div style={{ display: 'flex' }}>Token count</div>
                <div style={{ display: 'flex', fontSize: 24 }}>4096</div>
            </div>
        )
        const nodes: Array<{
            textContent?: string
            props: Record<string, unknown>
            height: number
        }> = []
        await renderToSvg(preparePrintTypography(source, 18), 300, 160, {
            theme: 'light',
            watermark: false,
            onNodeDetected: (node) => nodes.push(node),
        })
        const label = nodes.find((node) => node.textContent === 'Token count')!
        expect(label).toBeDefined()
        expect((label.props.style as React.CSSProperties).fontSize).toBe(18)
        expect(label.height).toBeGreaterThanOrEqual(18)
        expect(source.props.style.fontSize).toBe(11)
        const value = nodes.find((node) => node.textContent === '4096')!
        expect((value.props.style as React.CSSProperties).fontSize).toBe(24)
    })

    it('preserves mathematical script proportions and literal numeric labels', () => {
        const source = (
            <div style={{ fontSize: 12 }}>
                <sub style={{ fontSize: '0.75em' }}>k</sub>
                <span>0</span>
            </div>
        )
        const printed = preparePrintTypography(source, 20) as React.ReactElement<{
            style: React.CSSProperties
            children: React.ReactElement<{
                style: React.CSSProperties
                children: React.ReactNode
            }>[]
        }>
        expect(printed.props.style.fontSize).toBe(20)
        expect(printed.props.children[0].props.style.fontSize).toBe(15)
        expect(printed.props.children[1].props.style.fontSize).toBe(20)
        expect(printed.props.children[1].props.children).toBe('0')
    })
})
