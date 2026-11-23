import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { formatIllustration } from './format'

describe('illustration formatting', () => {
    it('converges while retaining computed data and formula escape values', async () => {
        const source = 'const model={"count":3};const formula="\\\\sqrt{2}"\n'
        const formatted = await formatIllustration(source, 'figure.tsx')
        const evaluate = (code: string) => {
            const output = ts.transpileModule(code, {
                compilerOptions: { target: ts.ScriptTarget.ESNext },
            }).outputText
            return new Function(output + '\nreturn { model, formula }')()
        }
        expect(await formatIllustration(formatted, 'figure.tsx')).toBe(formatted)
        expect(evaluate(formatted)).toEqual(evaluate(source))
        expect(evaluate(formatted)).toEqual({ model: { count: 3 }, formula: '\\sqrt{2}' })
    })
})
