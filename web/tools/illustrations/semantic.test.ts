import { describe, expect, it } from 'vitest'
import { assertFormattingEquivalent } from './semantic'

describe('formatting semantic guard', () => {
    it('accepts layout trivia and redundant parentheses', () => {
        expect(() =>
            assertFormattingEquivalent('const n=(2 + 3)', 'const n = 2 + 3;\n', 'f.tsx'),
        ).not.toThrow()
        expect(() =>
            assertFormattingEquivalent(
                'const x={a:1,b:2}',
                'const x = {\n a: 1,\n b: 2,\n}',
                'f.tsx',
            ),
        ).not.toThrow()
    })

    it('rejects changed operands, operators and escaped formula values', () => {
        for (const after of ['const n=2+4', 'const n=2*3']) {
            expect(() => assertFormattingEquivalent('const n=2+3', after, 'f.tsx')).toThrow(
                'changes',
            )
        }
        expect(() =>
            assertFormattingEquivalent('const t="\\\\sqrt{2}"', 'const t="sqrt{2}"', 'f.tsx'),
        ).toThrow('changes')
    })

    it('retains declaration kinds, TypeScript types, bigint values and raw template text', () => {
        const cases = [
            ['let x=1', 'const x=1'],
            ['const x: string = 1 as any', 'const x: number = 1 as any'],
            ['interface X { x: string }', 'interface X { x: number }'],
            ['const n=1n', 'const n=2n'],
            ['const s=String.raw`\\x41`', 'const s=String.raw`A`'],
        ]
        for (const [before, after] of cases) {
            expect(() => assertFormattingEquivalent(before, after, 'f.tsx')).toThrow('changes')
        }
    })

    it('normalizes JSX text locally while retaining the number of children', () => {
        expect(() =>
            assertFormattingEquivalent('<Label>hi</Label>', '<Label>\n hi\n</Label>', 'f.tsx'),
        ).not.toThrow()
        const before = '<Label>{n}% abuse · {count}</Label>'
        const after = "<Label>{n}% abuse ·{' '}{count}</Label>"
        expect(() => assertFormattingEquivalent(before, after, 'f.tsx')).toThrow('JSX children')
    })
})
