import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { format } from 'prettier'
import { findIllustrationEntries } from './discovery'
import { assertFormattingEquivalent } from './semantic'

const toolsRoot = path.dirname(fileURLToPath(import.meta.url))
const contentRoot = path.resolve(toolsRoot, '../../src/content')

export const illustrationFormat = {
    printWidth: 100,
    tabWidth: 4,
    useTabs: false,
    semi: false,
    singleQuote: true,
    quoteProps: 'preserve',
    trailingComma: 'all',
    endOfLine: 'lf',
} as const

/** Prettier can need a second pass when a wrapped method chain becomes short. */
export async function formatIllustration(source: string, file: string): Promise<string> {
    let current = source
    for (let pass = 0; pass < 5; pass++) {
        const next = await format(current, { ...illustrationFormat, filepath: file })
        if (next === current) return current
        current = next
    }
    throw new Error('Formatter did not converge: ' + file)
}

async function toolingFiles(directory: string): Promise<string[]> {
    const files: string[] = []
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name)
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'fonts') {
            files.push(...(await toolingFiles(file)))
        } else if (entry.isFile() && /\.[cm]?[jt]sx?$/.test(entry.name)) files.push(file)
    }
    return files
}

async function partFiles(directory: string): Promise<string[]> {
    const files: string[] = []
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        if (!entry.isDirectory() || ['_generated', 'node_modules'].includes(entry.name)) continue
        const file = path.join(directory, entry.name)
        if (entry.name === '_parts' && file.split(path.sep).includes('illustrations')) {
            files.push(...(await toolingFiles(file)))
        } else files.push(...(await partFiles(file)))
    }
    return files
}

async function main(): Promise<void> {
    const { values } = parseArgs({
        options: {
            write: { type: 'boolean', default: false },
            check: { type: 'boolean', default: false },
            help: { type: 'boolean', default: false },
        },
    })
    if (values.help) {
        console.log(
            'illustrations:format writes standalone figure TSX and illustration tools. illustrations:format:check checks the same scope. Markdown fences, generated files and unrelated web code are excluded.',
        )
        return
    }
    if (values.write === values.check) throw new Error('Choose exactly one of --write or --check.')
    const files = [
        ...(await findIllustrationEntries(contentRoot)),
        ...(await partFiles(contentRoot)),
        ...(await toolingFiles(toolsRoot)),
    ].sort()
    const changes: { file: string; source: string }[] = []
    let changed = 0
    for (const file of files) {
        const before = await readFile(file, 'utf8')
        const after = await formatIllustration(before, file)
        if (before === after) continue
        assertFormattingEquivalent(before, after, file)
        changed++
        changes.push({ file, source: after })
        if (!values.write) console.error(path.relative(path.resolve(toolsRoot, '../..'), file))
    }
    if (values.write) {
        for (const change of changes) await writeFile(change.file, change.source)
    }
    console.log(
        `${files.length} illustration sources/tools checked; ${changed} ${values.write ? 'formatted' : 'need formatting'}.`,
    )
    if (changed && values.check) process.exitCode = 1
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main().catch((error) => {
        console.error(error)
        process.exitCode = 1
    })
}
