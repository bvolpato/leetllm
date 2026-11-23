import { join } from 'path'
import { afterEach, describe, expect, test, vi } from 'vitest'

afterEach(() => {
    vi.doUnmock('./content-bundle')
    vi.resetModules()
})

describe('single-question cold lookup', () => {
    test('reuses the already loaded website corpus for canonical and alias lookups', async () => {
        const original = await vi.importActual<typeof import('./content-bundle')>('./content-bundle')
        const loadContentBundle = vi.fn(original.loadContentBundle)
        vi.doMock('./content-bundle', () => ({ ...original, loadContentBundle }))

        const { getQuestionForUser, getQuestions } = await import('./questions')
        const question = getQuestions().find(({ slug }) => slug === 'build-gpt-from-scratch-lab')
        expect(question).toBeDefined()
        loadContentBundle.mockClear()

        expect(getQuestionForUser('build-gpt-from-scratch-lab', false)).toBe(question)
        expect(getQuestionForUser('decoder-only-lm-pretraining-lab', false)).toBe(question)
        expect(loadContentBundle).not.toHaveBeenCalled()
    })

    test('loads only the requested canonical content bundle', async () => {
        const original = await vi.importActual<typeof import('./content-bundle')>('./content-bundle')
        const loadContentBundle = vi.fn(original.loadContentBundle)
        vi.doMock('./content-bundle', () => ({ ...original, loadContentBundle }))

        const { getQuestionForUser, getQuestions } = await import('./questions')
        const question = getQuestionForUser('numpy-and-tensor-shapes', false)

        expect(question?.slug).toBe('numpy-and-tensor-shapes')
        expect(question?.content.length).toBeGreaterThan(700)
        expect(loadContentBundle).toHaveBeenCalledTimes(1)

        expect(getQuestionForUser('numpy-and-tensor-shapes', true)).toBe(question)
        expect(loadContentBundle).toHaveBeenCalledTimes(1)

        const fullCorpusQuestion = getQuestions().find(({ slug }) => slug === question?.slug)
        expect(question).toEqual(fullCorpusQuestion)
    })

    test('loads an indexed alias without scanning the corpus', async () => {
        const original = await vi.importActual<typeof import('./content-bundle')>('./content-bundle')
        const loadContentBundle = vi.fn(original.loadContentBundle)
        vi.doMock('./content-bundle', () => ({ ...original, loadContentBundle }))

        const { getQuestionForUser } = await import('./questions')
        const question = getQuestionForUser('decoder-only-lm-pretraining-lab', false)

        expect(question?.slug).toBe('build-gpt-from-scratch-lab')
        expect(loadContentBundle).toHaveBeenCalledTimes(1)
    })

    test('returns an unknown slug without loading a content bundle', async () => {
        const original = await vi.importActual<typeof import('./content-bundle')>('./content-bundle')
        const loadContentBundle = vi.fn(original.loadContentBundle)
        vi.doMock('./content-bundle', () => ({ ...original, loadContentBundle }))

        const { getQuestionForUser } = await import('./questions')
        expect(getQuestionForUser('does-not-exist', false)).toBeUndefined()
        expect(loadContentBundle).not.toHaveBeenCalled()
    })

    test.each([
        {
            name: 'mismatched metadata',
            metadata: { slug: 'numpy-and-tensor-shapes' },
        },
        {
            name: 'hidden content',
            metadata: { hidden: true },
        },
    ])('rejects indexed $name instead of serving the wrong lesson', async ({ metadata }) => {
        const original = await vi.importActual<typeof import('./content-bundle')>('./content-bundle')
        const alias = 'decoder-only-lm-pretraining-lab'
        const indexedPath = join(process.cwd(), 'src', 'content', 'training', 'build-gpt-from-scratch-lab')
        const sourceBundle = original.loadContentBundle(
            indexedPath
        )
        expect(sourceBundle).not.toBeNull()

        const loadContentBundle = vi.fn((articleDir: string) => {
            if (articleDir !== indexedPath) return original.loadContentBundle(articleDir)
            return {
                ...sourceBundle!,
                metadata: {
                    ...sourceBundle!.metadata,
                    ...metadata,
                },
            }
        })
        vi.doMock('./content-bundle', () => ({ ...original, loadContentBundle }))

        const { getQuestionForUser } = await import('./questions')
        expect(getQuestionForUser(alias, false)).toBeUndefined()
        expect(loadContentBundle).toHaveBeenCalledTimes(1)
    })
})
