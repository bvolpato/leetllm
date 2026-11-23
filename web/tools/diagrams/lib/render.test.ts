import mermaid from 'mermaid'
import { describe, expect, it } from 'vitest'
import { injectClassDefs } from './render'

describe('Mermaid semantic palettes', () => {
    it('preserves an initialization directive before the diagram declaration', async () => {
        const source = `%%{init: {'flowchart': {'rankSpacing': 12}}}%%
flowchart TD
    A["Unscale gradients"]:::primary --> B{"Finite?"}:::warning`
        mermaid.initialize({ startOnLoad: false })
        const parsed = await mermaid.parse(injectClassDefs(source, 'light'))
        expect(parsed).toMatchObject({ diagramType: 'flowchart-v2' })
    })
})
