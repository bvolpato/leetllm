import { describe, expect, it } from 'vitest'
import { filterContentForAudience } from '../../src/lib/content-audience'
import { resolveBookDiagram, resolveBookDiagramMarkdown } from './book'

describe('book Mermaid assets', () => {
    it('uses the reader diagram source ordinal when identical reference material is omitted', () => {
        const block = '```mermaid\nflowchart TB\nA["Input"] --> B["Output"]\n```'
        const source = `<!-- leetllm: edition:reference:start -->\n${block}\n<!-- leetllm: edition:reference:end -->\n<!-- leetllm: edition:reader:start -->\n${block}\n<!-- leetllm: edition:reader:end -->`
        const selected = filterContentForAudience(source, 'book', 'fixture.md', 'reader')
        const html = resolveBookDiagramMarkdown(selected, 'retrieval/print-fixture', source, {}, 'reader')
        const document = new DOMParser().parseFromString(html, 'text/html')
        expect(document.querySelector('img')?.getAttribute('src')).toBe('/cdn/content-image/retrieval/print-fixture/diagrams/_generated/content_diagram_1_light.png')
    })
    it('keeps original asset indices when website-only diagrams are omitted', () => {
        const omitted = '```mermaid\ngraph LR\nA["Website control"] --> B["Button"]\n```'
        const retained = '```mermaid\ngraph LR\nA["Read & authorize"] --> B["Allowed evidence"]\n```'
        const source = `${omitted}\n\n${retained}`
        const html = resolveBookDiagramMarkdown(retained, 'retrieval/print-fixture', source)
        const document = new DOMParser().parseFromString(html, 'text/html')
        expect(document.querySelector('img')?.getAttribute('src')).toBe('/cdn/content-image/retrieval/print-fixture/diagrams/_generated/content_diagram_1_light.png')
        expect(document.querySelector('img')?.getAttribute('alt')).toContain('Read & authorize')
        expect(document.body.textContent).not.toContain('Website control')
    })

    it('rejects a retained diagram that no longer matches the source inventory', () => {
        expect(() => resolveBookDiagramMarkdown('```mermaid\ngraph LR\nA --> C\n```', 'retrieval/print-fixture', '```mermaid\ngraph LR\nA --> B\n```')).toThrow(/does not match its full source/)
    })

    it('uses the measured display width without losing the source diagram index', () => {
        const source = '```mermaid\nflowchart TB\nA["Request"] --> B["Result"]\n```'
        const html = resolveBookDiagramMarkdown(source, 'retrieval/print-fixture', source, { 'content_diagram_0_light.png': 240 })
        const document = new DOMParser().parseFromString(html, 'text/html')
        expect(document.querySelector('img')?.style.width).toBe('240pt')
        expect(document.querySelector('img')?.style.maxWidth).toBe('100%')
    })

    it('keeps original indices, captions, widths, and repeated visible fences distinct', () => {
        const identical = '```mermaid\nflowchart TB\nChild["Indexed child"] --> Parent["Cited parent"]\n```'
        const source = [
            '<!-- leetllm: audience:website:start -->',
            identical,
            '<!-- leetllm: audience:website:end -->',
            '<!-- leetllm: audience:book:start -->',
            identical,
            identical,
            '<!-- leetllm: audience:book:end -->',
        ].join('\n')
        const bookMarkdown = filterContentForAudience(source, 'book')
        const widths = {
            'content_diagram_1_light.png': 291.375,
            'content_diagram_2_light.png': 233.25,
        }
        const html = resolveBookDiagramMarkdown(
            bookMarkdown,
            'retrieval/chunking-strategies-document-processing',
            source,
            widths,
        )
        const document = new DOMParser().parseFromString(html, 'text/html')
        const figures = [...document.querySelectorAll('figure')]

        expect(figures).toHaveLength(2)
        expect([...document.querySelectorAll('img')].map(image => image.getAttribute('src'))).toEqual([
            '/cdn/content-image/retrieval/chunking-strategies-document-processing/diagrams/_generated/content_diagram_1_light.png',
            '/cdn/content-image/retrieval/chunking-strategies-document-processing/diagrams/_generated/content_diagram_2_light.png',
        ])
        expect([...document.querySelectorAll('img')].map(image => image.style.width)).toEqual(['291.38pt', '233.25pt'])
        expect(figures[0].querySelector('figcaption')?.textContent).toBe(
            'Search the small indexed child, then follow its parent pointer to recover the larger section as cited context.',
        )
        expect(figures[1].querySelector('figcaption')).toBeNull()
    })

    it('requires a print diagram instead of using the framed website asset', () => {
        expect(() => resolveBookDiagram('retrieval/print-fixture/diagrams/_generated/content_diagram_0_dark.png')).toThrow(/Missing print diagram/)
        expect(resolveBookDiagram('retrieval/print-fixture/illustrations/_generated/evidence_light.png')).toBeNull()
    })
})
