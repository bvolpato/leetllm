import { describe, expect, test } from 'vitest'
import { parseEmbeddedIllustrationBlocks } from './embedded'

describe('parseEmbeddedIllustrationBlocks', () => {
    test('extracts renderable TypeScript illustration fences', () => {
        const markdown = [
            'Intro',
            '',
            '```typescript render="illustration" name="tiny_batch_loss" alt="Tiny batch loss diagram" caption="Loss caption"',
            'export default function Figure() { return null }',
            '```',
        ].join('\n')

        expect(parseEmbeddedIllustrationBlocks(markdown, 'content.md')).toEqual([
            {
                name: 'tiny_batch_loss',
                alt: 'Tiny batch loss diagram',
                caption: 'Loss caption',
                source: 'export default function Figure() { return null }',
            },
        ])
    })

    test('uses fence alt as source of truth and strips legacy alt export', () => {
        const markdown = [
            '```typescript render="illustration" name="memory_tiers" alt="Fence alt"',
            "export const alt = 'Legacy source alt'",
            'export default function Figure() { return null }',
            '```',
        ].join('\n')

        expect(parseEmbeddedIllustrationBlocks(markdown, 'content.md')).toEqual([
            {
                name: 'memory_tiers',
                alt: 'Fence alt',
                caption: undefined,
                source: 'export default function Figure() { return null }',
            },
        ])
    })

    test('falls back to legacy alt export while stripping it from render source', () => {
        const markdown = [
            '```typescript render="illustration" name="memory_tiers"',
            "export const alt = 'Legacy source alt'",
            'export default function Figure() { return null }',
            '```',
        ].join('\n')

        expect(parseEmbeddedIllustrationBlocks(markdown, 'content.md')).toEqual([
            {
                name: 'memory_tiers',
                alt: 'Legacy source alt',
                caption: undefined,
                source: 'export default function Figure() { return null }',
            },
        ])
    })

    test('ignores regular TypeScript code examples', () => {
        const markdown = [
            '```typescript title="example.ts"',
            "console.log('not an illustration')",
            '```',
        ].join('\n')

        expect(parseEmbeddedIllustrationBlocks(markdown, 'content.md')).toEqual([])
    })

    test('requires safe explicit names', () => {
        const markdown = [
            '```tsx render="illustration" name="../bad"',
            'export default function Figure() { return null }',
            '```',
        ].join('\n')

        expect(() => parseEmbeddedIllustrationBlocks(markdown, 'content.md')).toThrow(
            'content.md: invalid embedded illustration name "../bad"',
        )
    })
})
