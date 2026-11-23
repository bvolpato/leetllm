import { describe, expect, it } from 'vitest'
import { prepareSvgForPrint } from './svg-print'

describe('prepareSvgForPrint', () => {
    it('inlines a nested SVG image and keeps its placement', () => {
        const inner = encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><rect width="10" height="10" fill="red"/></svg>',
        )
        const output = prepareSvgForPrint(
            `<svg width="100" height="100"><image x="5" y="6" width="20" height="30" href="data:image/svg+xml;utf8,${inner}"/></svg>`,
            100,
            100,
        )
        expect(output).not.toContain('<image')
        expect(output).toContain('<svg viewBox="0 0 10 10" x="5" y="6" width="20" height="30">')
    })

    it('drops a mask that covers the whole canvas', () => {
        const output = prepareSvgForPrint(
            '<svg><mask id="a"><rect x="0" y="0" width="100" height="100" fill="#fff"/></mask><path mask="url(#a)" d="M0 0"/></svg>',
            100,
            100,
        )
        expect(output).not.toContain('mask')
        expect(output).toContain('<path d="M0 0"/>')
    })

    it('turns a mask that cuts to a shape into a clip path', () => {
        const output = prepareSvgForPrint(
            '<svg><mask id="a"><rect x="5" y="5" width="10" height="10" rx="2" fill="#fff"/></mask><path mask="url(#a)" d="M0 0"/></svg>',
            100,
            100,
        )
        expect(output).toContain(
            '<clipPath id="a"><rect x="5" y="5" width="10" height="10" rx="2"/></clipPath>',
        )
        expect(output).toContain('<path clip-path="url(#a)" d="M0 0"/>')
    })

    it('combines a mask with an existing clip, so no attribute appears twice', () => {
        const output = prepareSvgForPrint(
            '<svg><clipPath id="c"><rect width="9" height="9"/></clipPath><mask id="a"><rect x="5" y="5" width="10" height="10" fill="#fff"/></mask><g clip-path="url(#c)" mask="url(#a)"></g></svg>',
            100,
            100,
        )
        expect(output).toContain('<g clip-path="url(#a__c)">')
        expect(output).toContain(
            '<clipPath id="a__c" clip-path="url(#c)"><use href="#a__shape"/></clipPath>',
        )
        expect(output).toContain('<rect id="a__shape"')
    })

    it('leaves a mask that blends instead of cutting', () => {
        const svg =
            '<svg><mask id="a"><rect x="5" y="5" width="10" height="10" fill="#888"/></mask><path mask="url(#a)" d="M0 0"/></svg>'
        expect(prepareSvgForPrint(svg, 100, 100)).toBe(svg)
    })
})
