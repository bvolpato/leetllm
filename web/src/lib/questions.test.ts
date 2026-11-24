import { describe, expect, test } from 'vitest'
import {
    getQuestions,
    getQuestionsForUser,
    getQuestionForUser,
    getQuestionBySlug,
    getCanonicalQuestionSlug,
    getFreeQuestions,
    getQuestionsByCategory,
    getQuestionsByDifficulty,
    sections,
} from './questions'
import { canonicalReferenceUrl } from './content-utils'
import { getPracticeProblems } from './practice'

// ═══════════════════════════════════════════════════════
//  Open Content Access
// ═══════════════════════════════════════════════════════

describe('Open Content Access', () => {
    const representativeSlug = 'mixture-of-experts-architecture'
    const freeSlug = 'scaled-dot-product-attention'
    const representativeQuestion = getQuestionBySlug(representativeSlug)
    const freeQuestion = getQuestionBySlug(freeSlug)

    test('lessons include content in the data source', () => {
        expect(representativeQuestion).toBeDefined()
        expect(representativeQuestion!.content.length).toBeGreaterThan(50)
    })

    test('free questions have content in the data source', () => {
        expect(freeQuestion).toBeDefined()
        expect(freeQuestion!.content.length).toBeGreaterThan(50)
    })

    test('getQuestionForUser preserves content for logged-out users', () => {
        const result = getQuestionForUser(representativeSlug, false)
        expect(result).toBeDefined()
        expect(result!.content).toBe(representativeQuestion!.content)
        expect(result!.rubricPoints).toEqual(representativeQuestion!.rubricPoints)
        expect(result!.followUpQuestions).toEqual(representativeQuestion!.followUpQuestions)
        expect(result!.commonPitfalls).toEqual(representativeQuestion!.commonPitfalls)
    })

    test('getQuestionForUser returns the same lesson regardless of legacy access flag', () => {
        const result = getQuestionForUser(representativeSlug, true)
        const loggedOutResult = getQuestionForUser(representativeSlug, false)
        expect(result).toBeDefined()
        expect(result).toEqual(loggedOutResult)
    })

    test('getQuestionForUser preserves content for free questions regardless of user status', () => {
        const forFree = getQuestionForUser('scaled-dot-product-attention', false)
        const forLegacyFlag = getQuestionForUser('scaled-dot-product-attention', true)
        expect(forFree).toBeDefined()
        expect(forLegacyFlag).toBeDefined()
        expect(forFree!.content).toEqual(forLegacyFlag!.content)
        expect(forFree!.rubricPoints).toEqual(forLegacyFlag!.rubricPoints)
    })

    test('getQuestionForUser returns undefined for unknown slug', () => {
        expect(getQuestionForUser('does-not-exist', false)).toBeUndefined()
        expect(getQuestionForUser('does-not-exist', true)).toBeUndefined()
    })

    test('core setup articles are included in public question lookup', () => {
        const setupSlugs = [
            'git-shell-linux-reproducible-ai',
            'docker-containerization-reproducible-ai',
            'python-for-ai-engineering',
        ]
        const publicSlugs = new Set(getQuestions().map(q => q.slug))

        for (const slug of setupSlugs) {
            expect(publicSlugs.has(slug)).toBe(true)
            expect(getQuestionForUser(slug, false)?.content.length).toBeGreaterThan(700)
        }
    })

    test('legacy lesson slugs resolve to canonical lessons', () => {
        const canonical = 'build-gpt-from-scratch-lab'
        const alias = 'decoder-only-lm-pretraining-lab'

        expect(getCanonicalQuestionSlug(alias)).toBe(canonical)
        expect(getQuestionForUser(alias, false)?.slug).toBe(canonical)
        expect(getQuestionBySlug(alias)?.slug).toBe(canonical)
    })

    test('getQuestionsForUser returns full content for logged-out users', () => {
        const questions = getQuestionsForUser(false)
        expect(questions.length).toBeGreaterThan(0)

        for (const q of questions) {
            expect(q.content.length).toBeGreaterThan(10)
        }
    })

    test('getQuestionsForUser ignores legacy access flag and returns identical lessons', () => {
        expect(getQuestionsForUser(false)).toEqual(getQuestionsForUser(true))
    })

    test('getQuestionsForUser preserves non-sensitive fields for all users', () => {
        const questionsForFree = getQuestionsForUser(false)
        const questionsForLegacyFlag = getQuestionsForUser(true)

        // Same count
        expect(questionsForFree.length).toBe(questionsForLegacyFlag.length)

        // Non-sensitive fields are preserved
        for (let i = 0; i < questionsForFree.length; i++) {
            expect(questionsForFree[i].id).toBe(questionsForLegacyFlag[i].id)
            expect(questionsForFree[i].title).toBe(questionsForLegacyFlag[i].title)
            expect(questionsForFree[i].slug).toBe(questionsForLegacyFlag[i].slug)
            expect(questionsForFree[i].category).toBe(questionsForLegacyFlag[i].category)
            expect(questionsForFree[i].difficulty).toBe(questionsForLegacyFlag[i].difficulty)
            expect(questionsForFree[i].shortDescription).toBe(questionsForLegacyFlag[i].shortDescription)
            expect(questionsForFree[i].companies).toEqual(questionsForLegacyFlag[i].companies)
            expect(questionsForFree[i].keyConceptsTested).toEqual(questionsForLegacyFlag[i].keyConceptsTested)
        }
    })
})

// ═══════════════════════════════════════════════════════
//  Question Data Integrity
// ═══════════════════════════════════════════════════════

describe('Question Data Integrity', () => {
    test('all questions have required fields', () => {
        const all = getQuestionsForUser(true) // Get full content
        expect(all.length).toBeGreaterThan(0)

        for (const q of all) {
            expect(q.id).toBeTruthy()
            expect(q.title).toBeTruthy()
            expect(q.slug).toBeTruthy()
            expect(q.category).toBeTruthy()
            expect(q.difficulty).toBeTruthy()
            expect(q.shortDescription).toBeTruthy()
            expect(q.content.length).toBeGreaterThan(10)
            expect(q.timeEstimate).toBeGreaterThan(0)
            expect(q.companies.length).toBeGreaterThan(0)
            expect(q.keyConceptsTested.length).toBeGreaterThan(0)
            expect(q.rubricPoints).toBeDefined()
            expect(q.followUpQuestions).toBeDefined()
            expect(q.commonPitfalls).toBeDefined()
        }
    })

    test('all visible learn articles expose at least one follow-up question', () => {
        const all = getQuestionsForUser(true)

        for (const q of all) {
            expect(q.followUpQuestions.length, q.slug).toBeGreaterThan(0)
        }
    })

    test('all visible learn articles expose at least one rubric point', () => {
        const all = getQuestionsForUser(true)

        for (const q of all) {
            expect(q.rubricPoints.length, q.slug).toBeGreaterThan(0)
        }
    })

    test('all visible learn articles expose at least one common pitfall', () => {
        const all = getQuestionsForUser(true)

        for (const q of all) {
            expect(q.commonPitfalls.length, q.slug).toBeGreaterThan(0)
        }
    })

    test('all slugs are unique', () => {
        const all = getQuestionsForUser(true)
        const slugs = all.map(q => q.slug)
        const uniqueSlugs = new Set(slugs)
        expect(uniqueSlugs.size).toBe(slugs.length)
    })

    test('all IDs are unique', () => {
        const all = getQuestionsForUser(true)
        const ids = all.map(q => q.id)
        const uniqueIds = new Set(ids)
        expect(uniqueIds.size).toBe(ids.length)
    })

    test('difficulty values are valid', () => {
        const all = getQuestionsForUser(true)
        const validDifficulties = ['Easy', 'Medium', 'Hard']
        for (const q of all) {
            expect(validDifficulties).toContain(q.difficulty)
        }
    })

    test('cover images use social-fetchable URLs after loading', async () => {
        const { getAllBlogPostsIncludingPrivate } = await import('./blog')
        const badImages = [
            ...getQuestionsForUser(true).flatMap(q => [
                [`learn/${q.slug}`, q.coverImage] as const,
                [`learn/${q.slug} social`, q.socialImage] as const,
            ]),
            ...getAllBlogPostsIncludingPrivate().flatMap(post => [
                [`blog/${post.slug}`, post.coverImage] as const,
                [`blog/${post.slug} social`, post.socialImage] as const,
            ]),
        ]
            .filter(([, image]) => image)
            .filter(([, image]) => {
                return !image!.startsWith('/cdn/content-image/')
                    && !image!.startsWith('/api/content-image/')
                    && !image!.startsWith('/')
                    && !/^https?:\/\//.test(image!)
            })
            .map(([source, image]) => `${source}: ${image}`)

        expect(badImages).toEqual([])
    })

    test('lesson cover images do not use social banners', () => {
        const socialBannerCovers = getQuestionsForUser(true)
            .filter(q => q.coverImage?.includes('/social_banner.png'))
            .map(q => `${q.slug}: ${q.coverImage}`)

        expect(socialBannerCovers).toEqual([])
    })
})

// ═══════════════════════════════════════════════════════
//  Legacy Helpers
// ═══════════════════════════════════════════════════════

describe('Legacy Helpers', () => {
    test('getFreeQuestions returns all open questions', () => {
        const free = getFreeQuestions()
        const all = getQuestionsForUser(true)

        expect(free).toHaveLength(all.length)
    })

    test('getQuestionsByCategory returns correct category', () => {
        const category = 'Transformer Architecture'
        const byCategory = getQuestionsByCategory(category)
        expect(byCategory.length).toBeGreaterThan(0)
        for (const q of byCategory) {
            expect(q.category).toBe(category)
        }
    })

    test('getQuestionsByDifficulty returns correct difficulty', () => {
        const difficulty = 'Medium'
        const byDiff = getQuestionsByDifficulty(difficulty)
        expect(byDiff.length).toBeGreaterThan(0)
        for (const q of byDiff) {
            expect(q.difficulty).toBe(difficulty)
        }
    })
})

// ═══════════════════════════════════════════════════════
//  Roadmap Ordering
// ═══════════════════════════════════════════════════════

describe('Roadmap Ordering', () => {
    const difficultyRank: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 }

    const expectedSectionOrder = [
        'Computing Foundations',
        'Math & Statistics',
        'Preparation & Prerequisites',
        'ML Algorithms & Evaluation',
        'Production ML Systems',
        'Core LLM Foundations',
        'Applied LLM Engineering',
        'Portfolio Capstones',
        'Transformer Deep Dives',
        'Advanced Training & Adaptation',
        'Advanced Agents & Retrieval',
        'Inference & Production Scale',
        'System Design Capstones',
        'AI Lab Interviewing',
        'Project Deep Dives',
    ]

    const preparationOrder = [
        'git-shell-linux-reproducible-ai',
        'docker-containerization-reproducible-ai',
        'python-for-ai-engineering',
        'numpy-and-tensor-shapes',
        'cuda-gpu-computing-for-ml',
        'mps-metal-mac-ml-training',
        'data-structures-for-ai-systems',
        'sql-databases-data-modeling-ai',
        'algorithms-complexity-ml-engineers',
        'calculus-gradients-backpropagation-optimization',
        'vectors-matrices-tensors',
        'linear-algebra-machine-learning-deeper',
        'optimization-algorithms-adam-schedulers',
        'probability-for-machine-learning',
        'bayesian-inference-priors-posteriors',
        'statistics-estimation-uncertainty',
        'distributions-sampling-simulation',
        'hypothesis-tests-confidence-intervals-passk',
        'neural-networks-from-scratch',
        'convolutional-neural-networks-from-scratch',
        'training-backpropagation-gradient-descent',
        'softmax-cross-entropy-optimization',
        'rnns-lstms-grus-sequence-modeling',
        'autoencoders-vaes-generative-modeling-basics',
        'transformer-architecture-end-to-end',
        'language-modeling-next-token-prediction',
        'gpt-to-modern-llms',
        'prompt-engineering-fundamentals',
        'calling-llm-apis-production',
        'first-ai-app-end-to-end',
        'llm-lifecycle-training-to-deployment',
    ]

    const minimumMustShipSlugs = [
        'git-shell-linux-reproducible-ai',
        'docker-containerization-reproducible-ai',
        'python-for-ai-engineering',
        'calculus-gradients-backpropagation-optimization',
        'numpy-and-tensor-shapes',
        'cuda-gpu-computing-for-ml',
        'data-structures-for-ai-systems',
        'probability-for-machine-learning',
        'bayesian-inference-priors-posteriors',
        'statistics-estimation-uncertainty',
        'distributions-sampling-simulation',
        'hypothesis-tests-confidence-intervals-passk',
        'linear-regression-from-scratch',
        'cross-validation-leakage-generalization',
        'clustering-pca-representation-learning',
        'core-retrieval-algorithms',
        'decoding-algorithms',
        'experiment-design-ab-testing',
        'pytorch-training-loops',
        'dataset-pipelines-data-quality',
        'calling-llm-apis-production',
        'first-ai-app-end-to-end',
        'file-ingestion-pdfs-html-ocr-markdown',
        'ai-coding-workflow-with-agents',
        'capstone-document-qa-product',
        'capstone-evaluation-dashboard',
        'capstone-fine-tuned-classifier',
        'capstone-production-llm-agent',
        'feature-engineering-production-ml',
        'monitoring-predictive-models',
        'capstone-delivery-eta-prediction',
        'capstone-damaged-package-vision-classifier',
        'capstone-production-ml-pipeline',
    ]

    test('sections follow the 0-to-1 learning path', () => {
        expect(sections).toEqual(expectedSectionOrder)
    })

    test('foundation articles are the first click-next sequence', () => {
        const all = getQuestionsForUser(true)
        expect(all.slice(0, preparationOrder.length).map(q => q.slug)).toEqual(preparationOrder)
    })

    test('preparation articles stay open and beginner-friendly', () => {
        const all = getQuestionsForUser(true)
        const prep = all.slice(0, preparationOrder.length)

        expect(prep.map(q => q.slug)).toEqual(preparationOrder)
        for (const question of prep) {
            expect(question.difficulty).toBe('Easy')
            expect(question.content.length).toBeGreaterThan(700)
        }
    })

    test('roadmap keeps dependency milestones in teaching order', () => {
        const slugs = getQuestionsForUser(true).map((q) => q.slug)

        expect(slugs.indexOf('vectors-matrices-tensors')).toBeLessThan(slugs.indexOf('linear-algebra-machine-learning-deeper'))
        expect(slugs.indexOf('linear-regression-from-scratch')).toBeLessThan(slugs.indexOf('bitter-lesson-compute-over-heuristics'))
        expect(slugs.indexOf('mcp-tool-protocol-standards')).toBeLessThan(slugs.indexOf('long-context-engineering-beyond-management'))
        expect(slugs.indexOf('long-context-engineering-beyond-management')).toBeLessThan(slugs.indexOf('prompt-injection-defense-strategies'))
        expect(slugs.indexOf('experiment-tracking-mlflow-wandb')).toBeLessThan(slugs.indexOf('programmatic-prompt-optimization-dspy'))
        expect(slugs.indexOf('programmatic-prompt-optimization-dspy')).toBeLessThan(slugs.indexOf('model-versioning-continuous-deployment'))
        expect(slugs.indexOf('supervised-fine-tuning-pipeline')).toBeLessThan(slugs.indexOf('mixed-precision-training-loss-scaling'))
        expect(slugs.indexOf('mixed-precision-training-loss-scaling')).toBeLessThan(slugs.indexOf('distributed-training-fsdp-deepspeed-zero'))
        expect(slugs.indexOf('agent-failure-states-retry-fallback')).toBeLessThan(slugs.indexOf('recursive-language-models-rlm'))
        expect(slugs.indexOf('recursive-language-models-rlm')).toBeLessThan(slugs.indexOf('multi-agent-dags-langgraph-orchestration'))
        expect(slugs.indexOf('multi-agent-dags-langgraph-orchestration')).toBeLessThan(slugs.indexOf('capstone-production-llm-agent'))
        expect(slugs.indexOf('capstone-production-llm-agent')).toBeLessThan(slugs.indexOf('inference-mechanics-ttft-tps-kv-cache'))
    })

    test('minimum degree-to-job chapters are published in the roadmap', () => {
        const all = getQuestionsForUser(true)
        const slugs = new Set(all.map(q => q.slug))

        for (const slug of minimumMustShipSlugs) {
            expect(slugs.has(slug), `${slug} is missing from /learn`).toBe(true)
        }
    })

    test('each section gets harder without difficulty backtracking', () => {
        const all = getQuestionsForUser(true)

        for (const section of sections) {
            const sectionQuestions = all.filter(q => q.section === section)
            for (let i = 1; i < sectionQuestions.length; i++) {
                const prev = sectionQuestions[i - 1]
                const current = sectionQuestions[i]
                expect(
                    difficultyRank[current.difficulty] >= difficultyRank[prev.difficulty],
                    `${section}: ${current.slug} (${current.difficulty}) follows ${prev.slug} (${prev.difficulty})`
                ).toBe(true)
            }
        }
    })

    test('click-next path progresses globally from easy to medium to hard', () => {
        const all = getQuestionsForUser(true)

        for (let i = 1; i < all.length; i++) {
            const prev = all[i - 1]
            const current = all[i]
            expect(
                difficultyRank[current.difficulty] >= difficultyRank[prev.difficulty],
                `${current.slug} (${current.difficulty}) follows ${prev.slug} (${prev.difficulty})`
            ).toBe(true)
        }
    })

    test('click-next path has one difficulty block per level', () => {
        const all = getQuestionsForUser(true)
        const transitions = all
            .map(q => q.difficulty)
            .filter((difficulty, index, difficulties) => index === 0 || difficulty !== difficulties[index - 1])

        expect(transitions).toEqual(['Easy', 'Medium', 'Hard'])
    })

    test('roadmap prerequisites never point forward', () => {
        const all = getQuestionsForUser(true)
        const slugIndex = new Map(all.map((question, index) => [question.slug, index]))

        for (const question of all) {
            for (const prerequisite of question.prerequisites ?? []) {
                const prerequisiteIndex = slugIndex.get(prerequisite)
                if (prerequisiteIndex == null) continue
                expect(
                    prerequisiteIndex,
                    `${question.slug} depends on ${prerequisite} but roadmap places it later`
                ).toBeLessThan(slugIndex.get(question.slug)!)
            }
        }
    })

    test('tool-use topics stay in applied engineering after shared ML and core foundations', () => {
        const all = getQuestionsForUser(true)
        const slugs = all.map(q => q.slug)
        const mlEnd = slugs.indexOf('dataset-pipelines-data-quality')
        const coreStart = slugs.indexOf('bitter-lesson-compute-over-heuristics')
        const coreEnd = slugs.indexOf('instruction-tuning-chat-templates')
        const toolUse = all.find(q => q.slug === 'function-calling-tool-use-llms')

        expect(mlEnd).toBeLessThan(coreStart)
        expect(coreStart).toBeLessThan(coreEnd)
        expect(toolUse?.section).toBe('Applied LLM Engineering')
        expect(slugs.indexOf('chain-of-thought-advanced-prompting')).toBeLessThan(slugs.indexOf('function-calling-tool-use-llms'))
        expect(slugs.indexOf('function-calling-tool-use-llms')).toBeLessThan(slugs.indexOf('mcp-tool-protocol-standards'))
    })

    test('every roadmap article ends with an explicit next callout', () => {
        const all = getQuestionsForUser(true)
        const issues: string[] = []

        for (let index = 0; index < all.length - 1; index++) {
            const current = all[index]
            const expectedNext = all[index + 1]
            const finalParagraphs = current.content
                .split(/\n{2,}/)
                .map(paragraph => paragraph.trim())
                .filter(Boolean)
                .slice(-6)
            const handoffParagraphs = finalParagraphs.filter(paragraph =>
                /^> \*\*Next:\*\*/i.test(paragraph)
            )
            const hasExpectedNext = handoffParagraphs.some(paragraph =>
                paragraph.includes(`](/learn/${expectedNext.slug})`)
            )

            if (!hasExpectedNext) {
                const linkedSlugs = handoffParagraphs.flatMap(paragraph =>
                    [...paragraph.matchAll(/\]\(\/learn\/([^)#]+)(?:#[^)]+)?\)/g)].map(match => match[1])
                )
                issues.push(
                    `${current.slug}: handoff links ${linkedSlugs.join(', ') || 'nothing'} but next is ${expectedNext.slug}`
                )
            }
            if (!current.content.trim().endsWith(handoffParagraphs.at(-1) ?? "")) {
                issues.push(`${current.slug}: next callout is not the final paragraph`)
            }
            if (/\(End of file(?: - total \d+ lines)?\)|<\/?content>/i.test(current.content)) {
                issues.push(`${current.slug}: editor artifact in content`)
            }
        }

        const finalArticle = all.at(-1)
        if (!finalArticle || !/> \*\*Course complete:\*\*[^\n]*\]\(\/learn\)\s*[^\n]*$/.test(finalArticle.content.trim())) {
            issues.push(`${finalArticle?.slug ?? "final article"}: missing course-complete callout`)
        }
        if (finalArticle && /\bnext (article|chapter|lesson)\b/i.test(finalArticle.content.slice(-1800))) {
            issues.push(`${finalArticle.slug}: final handoff implies another lesson`)
        }
        if (finalArticle && /\(End of file(?: - total \d+ lines)?\)|<\/?content>/i.test(finalArticle.content)) {
            issues.push(`${finalArticle.slug}: editor artifact in content`)
        }

        expect(issues).toEqual([])
    })

})

// ═══════════════════════════════════════════════════════
//  Renderability Safety — catch SSR "Objects are not
//  valid as a React child" errors at build time
// ═══════════════════════════════════════════════════════

describe('Renderability Safety', () => {
    const all = getQuestionsForUser(true)

    test('rubricPoints are all strings (not objects)', () => {
        for (const q of all) {
            for (const point of q.rubricPoints) {
                expect(typeof point).toBe('string')
            }
        }
    })

    test('commonPitfalls are all strings', () => {
        for (const q of all) {
            for (const pitfall of q.commonPitfalls) {
                expect(typeof pitfall).toBe('string')
            }
        }
    })

    test('keyConceptsTested are all strings', () => {
        for (const q of all) {
            for (const concept of q.keyConceptsTested) {
                expect(typeof concept).toBe('string')
            }
        }
    })

    test('followUpQuestions have string question and answer', () => {
        for (const q of all) {
            for (const fq of q.followUpQuestions) {
                expect(typeof fq.question).toBe('string')
                expect(typeof fq.answer).toBe('string')
            }
        }
    })

    test('companies are all strings', () => {
        for (const q of all) {
            for (const company of q.companies) {
                expect(typeof company).toBe('string')
            }
        }
    })

    test('no field rendered as React child is an object', () => {
        // Comprehensive check: every scalar field the page.tsx renders
        for (const q of all) {
            expect(typeof q.title).toBe('string')
            expect(typeof q.shortDescription).toBe('string')
            expect(typeof q.difficulty).toBe('string')
            expect(typeof q.category).toBe('string')
            expect(typeof q.section).toBe('string')
            expect(typeof q.timeEstimate).toBe('number')
        }
    })
})

// ═══════════════════════════════════════════════════════
//  Reference Resolution — catch [^key] left unresolved
// ═══════════════════════════════════════════════════════

describe('Reference Resolution', () => {
    test('canonicalizes reader mirror URLs before rendering', () => {
        expect(canonicalReferenceUrl('https://r.jina.ai/https://openai.com/index/gpt-4-1/')).toBe(
            'https://openai.com/index/gpt-4-1/'
        )
        expect(canonicalReferenceUrl('https://r.jina.ai/https://example.com/docs')).toBe(
            'https://example.com/docs'
        )
        expect(canonicalReferenceUrl('https://r.jina.ai/http://example.com/legacy')).toBe(
            'http://example.com/legacy'
        )
    })

    test('no user-facing references expose reader mirror URLs', async () => {
        const { getBlogPosts } = await import('./blog')
        const refs = [
            ...getQuestionsForUser(true).flatMap(q => Object.values(q.references ?? {})),
            ...getBlogPosts().flatMap(post => Object.values(post.references ?? {})),
        ]

        const mirrorRefs = refs.filter(ref => ref.url.includes('r.jina.ai'))
        expect(mirrorRefs).toEqual([])
    })

    test('all learn article citations are resolved (no raw [^key])', () => {
        const all = getQuestionsForUser(true)
        const issues: string[] = []

        for (const q of all) {
            const unresolved = q.content.match(/\[\^(\w+)\]/g)
            if (unresolved) {
                issues.push(`${q.slug}: ${unresolved.join(', ')}`)
            }
        }

        if (issues.length > 0) {
            throw new Error(
                `Unresolved footnote references found:\n${issues.map(i => `  • ${i}`).join('\n')}`
            )
        }
    })

    test('all blog post citations are resolved (no raw [^key])', async () => {
        const { getBlogPosts } = await import('./blog')
        const posts = getBlogPosts()
        const issues: string[] = []

        for (const post of posts) {
            const unresolved = post.content.match(/\[\^(\w+)\]/g)
            if (unresolved) {
                issues.push(`${post.slug}: ${unresolved.join(', ')}`)
            }
        }

        if (issues.length > 0) {
            throw new Error(
                `Unresolved footnote references in blog posts:\n${issues.map(i => `  • ${i}`).join('\n')}`
            )
        }
    })
})

// ═══════════════════════════════════════════════════════
//  Internal Cross-Links — catch broken /learn/ and /blog/ links
// ═══════════════════════════════════════════════════════

describe('Internal Cross-Links', () => {
    test('all internal links resolve to valid routes', async () => {
        const { getAllBlogPostsIncludingPrivate } = await import('./blog')

        // Build set of all valid internal paths
        const allArticles = getQuestionsForUser(true)
        const allPosts = getAllBlogPostsIncludingPrivate()

        const validPaths = new Set<string>()

        // Static pages
        validPaths.add('/')
        validPaths.add('/learn')
        validPaths.add('/blog')
        validPaths.add('/blog/all')
        validPaths.add('/practice')
        validPaths.add('/privacy')
        validPaths.add('/terms')

        // Dynamic article pages
        for (const q of allArticles) {
            validPaths.add(`/learn/${q.slug}`)
        }

        // Dynamic blog pages
        for (const post of allPosts) {
            validPaths.add(`/blog/${post.slug}`)
        }

        // Dynamic practice pages
        for (const problem of getPracticeProblems()) {
            validPaths.add(`/practice/${problem.slug}`)
        }

        // Regex: matches markdown links like [text](/some/path), [text](/some/path?edition=reference), or [text](/some/path#anchor)
        const INTERNAL_LINK_RE = /\]\(\/([^)?#\s]*?)(?:[?#][^)]*)?\)/g

        const issues: string[] = []

        // Check articles
        for (const q of allArticles) {
            let match: RegExpExecArray | null
            INTERNAL_LINK_RE.lastIndex = 0
            while ((match = INTERNAL_LINK_RE.exec(q.content)) !== null) {
                const path = `/${match[1]}`
                if (path.startsWith('/api/content-asset/')) {
                    continue
                }
                if (!validPaths.has(path)) {
                    issues.push(`learn/${q.slug}: broken link → ${path}`)
                }
            }
        }

        // Check blog posts
        for (const post of allPosts) {
            let match: RegExpExecArray | null
            INTERNAL_LINK_RE.lastIndex = 0
            while ((match = INTERNAL_LINK_RE.exec(post.content)) !== null) {
                const path = `/${match[1]}`
                if (path.startsWith('/api/content-asset/')) {
                    continue
                }
                if (!validPaths.has(path)) {
                    issues.push(`blog/${post.slug}: broken link → ${path}`)
                }
            }
        }

        if (issues.length > 0) {
            throw new Error(
                `Broken internal cross-links found:\n${issues.map(i => `  • ${i}`).join('\n')}`
            )
        }
    })

    test('article anchor links point to real supported targets', async () => {
        const { getAllBlogPostsIncludingPrivate } = await import('./blog')
        const sectionAnchors = new Set(sections.map(section => section.toLowerCase().replace(/ /g, '-')))
        const contentItems = [
            ...getQuestionsForUser(true).map(q => [`learn/${q.slug}`, q.content] as const),
            ...getAllBlogPostsIncludingPrivate().map(post => [`blog/${post.slug}`, post.content] as const),
        ]
        const anchorLinkRe = /\]\((#[^)]+|\/learn#[^)]+)\)/g
        const issues: string[] = []

        for (const [source, content] of contentItems) {
            let match: RegExpExecArray | null
            anchorLinkRe.lastIndex = 0
            while ((match = anchorLinkRe.exec(content)) !== null) {
                const href = match[1]
                if (href.startsWith('#')) {
                    issues.push(`${source}: same-page anchor is unsupported → ${href}`)
                    continue
                }

                const anchor = href.slice('/learn#'.length)
                if (!sectionAnchors.has(anchor)) {
                    issues.push(`${source}: stale /learn anchor → ${href}`)
                }
            }
        }

        expect(issues).toEqual([])
    })
})
