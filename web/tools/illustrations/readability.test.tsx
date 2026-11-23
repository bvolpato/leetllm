import { describe, expect, it } from 'vitest'
import { createElement, type ReactElement } from 'react'
import { assessLabels, markLabelFonts, measuredLabel } from './audit-readability'

describe('article label readability', () => {
    it('rejects a wide diagram whose nominal labels become tiny on a phone', () => {
        const labels = [{ text: 'Query', sourceFontPx: 26, script: false }]
        expect(assessLabels(labels, 1180, 343, 10).passed).toBe(false)
        expect(assessLabels(labels, 560, 343, 12).passed).toBe(true)
    })

    it('uses the cropped rendered width and permits smaller mathematical scripts', () => {
        const labels = [
            { text: 'W', sourceFontPx: 20, script: false },
            { text: 'Q', sourceFontPx: 14, script: true },
        ]
        expect(assessLabels(labels, 560, 343, 12).passed).toBe(true)
        expect(assessLabels(labels, 1100, 343, 12).passed).toBe(false)
        expect(assessLabels([], 560, 343, 10).passed).toBe(false)
    })

    it('rejects tall figures whose height cap shrinks otherwise readable labels', () => {
        const labels = [{ text: 'Class probability', sourceFontPx: 23, script: false }]
        expect(assessLabels(labels, 560, 343, 12).passed).toBe(true)
        const capped = assessLabels(labels, 560, 343, 12, {
            renderedHeight: 1540,
            maxDisplayHeight: 800,
        })
        expect(capped.passed).toBe(false)
        expect(capped.displayWidth).toBeCloseTo(290.909)
        expect(capped.labels[0].displayFontPx).toBeCloseTo(11.948)
    })

    it('retains the requested width when a figure fits below the height cap', () => {
        const labels = [{ text: 'Query', sourceFontPx: 24, script: false }]
        expect(
            assessLabels(labels, 560, 343, 12, { renderedHeight: 800, maxDisplayHeight: 800 }),
        ).toEqual(assessLabels(labels, 560, 343, 12))
    })

    it('rejects invalid height bounds rather than reporting misleading font sizes', () => {
        for (const height of [Infinity, NaN, 0, -1]) {
            expect(() =>
                assessLabels([], 560, 343, 12, { renderedHeight: height, maxDisplayHeight: 800 }),
            ).toThrow('Rendered height and maximum display height must be positive numbers.')
            expect(() =>
                assessLabels([], 560, 343, 12, { renderedHeight: 800, maxDisplayHeight: height }),
            ).toThrow('Rendered height and maximum display height must be positive numbers.')
        }
    })

    it('tracks inherited relative font sizes without changing the original tree', () => {
        const tree = createElement(
            'div',
            { style: { fontSize: 20 } },
            createElement('sub', { style: { fontSize: '0.8em' } }, 'Q'),
        )
        const marked = markLabelFonts(tree) as ReactElement<Record<string, unknown>>
        const sub = marked.props.children as ReactElement<Record<string, unknown>>
        expect(sub.props['data-readability-font']).toBe(16)
        expect(sub.props['data-readability-script']).toBe(true)
        expect(tree.props).not.toHaveProperty('data-readability-font')
    })

    it('rejects invalid font metrics instead of approving non-finite JSON values', () => {
        for (const sourceFontPx of [Infinity, NaN, 0, -1]) {
            expect(() =>
                assessLabels([{ text: 'bad', sourceFontPx, script: false }], 560, 343, 10),
            ).toThrow('Source font sizes must be positive finite numbers.')
        }
    })

    it('rejects a zero-size source label that the rendered layout observer omits', () => {
        for (const hiddenText of ['Missing value', [['Nested missing value']]]) {
            const tree = createElement(
                'div',
                null,
                createElement('span', { style: { fontSize: 0 } }, hiddenText),
                createElement('span', { style: { fontSize: 20 } }, 'Visible sibling'),
            )
            expect(() => markLabelFonts(tree)).toThrow(
                'Source font sizes must be positive finite numbers.',
            )
        }
    })

    it('measures numeric Satori text and retains zero as visible content', () => {
        const node = { props: { 'data-readability-font': 24 }, width: 20, height: 32 }
        expect(measuredLabel({ ...node, textContent: 0 })).toEqual({
            text: '0',
            sourceFontPx: 24,
            script: false,
        })
        expect(measuredLabel({ ...node, textContent: 16 })).toHaveProperty('text', '16')
        expect(measuredLabel({ ...node, textContent: false })).toBeNull()
        expect(measuredLabel(node)).toBeNull()
    })
})
