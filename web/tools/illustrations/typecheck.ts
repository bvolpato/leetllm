import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import ts from 'typescript'
import { isIllustrationEntry } from './discovery'

type Selection =
    | { mode: 'files'; files: string[] }
    | { mode: 'base' | 'before'; revision: string }
    | { mode: 'all' }

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const contentRoot = path.join(webRoot, 'src/content')
const repoRoot = path.resolve(webRoot, '..')

function usage(): string {
    return [
        'Strictly typecheck selected article illustration TSX files using web/tsconfig.json.',
        '',
        'Usage:',
        '  pnpm illustrations:typecheck -- --file <path> [--file <path> ...]',
        '  pnpm illustrations:typecheck -- --base <revision>      # PR-style <base>...HEAD',
        '  pnpm illustrations:typecheck -- --before <revision>    # push-style <before> HEAD',
        '  pnpm illustrations:typecheck -- --all                 # explicit full inventory',
        '  --file paths must exist; Git selections skip deleted and non-illustration paths.',
    ].join('\n')
}

function parseSelection(args: string[]): Selection {
    const { values } = parseArgs({
        args: args[0] === '--' ? args.slice(1) : args,
        options: {
            file: { type: 'string', multiple: true },
            base: { type: 'string' },
            before: { type: 'string' },
            all: { type: 'boolean' },
            help: { type: 'boolean', short: 'h' },
        },
        allowPositionals: false,
        strict: true,
    })

    if (values.help) {
        process.stdout.write(`${usage()}\n`)
        process.exit(0)
    }

    const files = values.file ?? []
    const base = values.base
    const before = values.before
    const all = values.all ?? false
    if (base === '' || before === '') throw new Error('--base and --before require a Git revision')

    const modeCount =
        Number(files.length > 0) +
        Number(base !== undefined) +
        Number(before !== undefined) +
        Number(all)
    if (modeCount !== 1) throw new Error(`Choose exactly one selection mode.\n${usage()}`)
    if (base !== undefined) return { mode: 'base', revision: base }
    if (before !== undefined) return { mode: 'before', revision: before }
    if (all) return { mode: 'all' }
    return { mode: 'files', files }
}

function isIllustrationSource(file: string): boolean {
    const relativePath = path.relative(webRoot, file)
    if (relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) return false
    const parts = relativePath.split(path.sep)
    return (
        parts[0] === 'src' &&
        parts[1] === 'content' &&
        parts.includes('illustrations') &&
        isIllustrationEntry(file)
    )
}

function resolveInputPath(input: string): string {
    if (path.isAbsolute(input)) return path.resolve(input)
    if (input === 'web' || input.startsWith(`web${path.sep}`) || input.startsWith('web/')) {
        return path.resolve(repoRoot, input)
    }
    return path.resolve(webRoot, input)
}

function gitChangedFiles(mode: 'base' | 'before', revision: string): string[] {
    try {
        const resolved = execFileSync(
            'git',
            ['rev-parse', '--verify', '--quiet', '--end-of-options', `${revision}^{commit}`],
            { cwd: repoRoot, encoding: 'utf8' },
        ).trim()
        if (!resolved) throw new Error('empty revision')
    } catch {
        throw new Error(`Git revision "${revision}" does not resolve to a commit`)
    }

    const range = mode === 'base' ? `${revision}...HEAD` : revision
    const args =
        mode === 'base'
            ? ['diff', '--name-only', '-z', '--diff-filter=ACMRTD', range]
            : ['diff', '--name-only', '-z', '--diff-filter=ACMRTD', range, 'HEAD']
    return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
        .split('\0')
        .filter(Boolean)
}

function allIllustrationFiles(): string[] {
    return readdirSync(contentRoot, { withFileTypes: true, recursive: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.tsx'))
        .map((entry) => path.join(entry.parentPath, entry.name))
        .filter(isIllustrationSource)
}

function selectedFiles(selection: Selection): { files: string[]; skipped: number } {
    const inputs =
        selection.mode === 'all'
            ? allIllustrationFiles()
            : selection.mode === 'files'
              ? selection.files
              : gitChangedFiles(selection.mode, selection.revision)
    const uniqueInputs = [...new Set(inputs)]
    const resolved = uniqueInputs.map((input) => ({ input, file: resolveInputPath(input) }))
    const isExistingIllustration = ({ file }: { input: string; file: string }) =>
        isIllustrationSource(file) && existsSync(file) && statSync(file).isFile()

    if (selection.mode === 'files') {
        const invalid = resolved
            .filter((item) => !isExistingIllustration(item))
            .map((item) => item.input)
        if (invalid.length > 0) {
            throw new Error(
                `--file must name an existing article illustration TSX file:\n${invalid.join('\n')}`,
            )
        }
    }

    const files = resolved
        .filter(isExistingIllustration)
        .map(({ file }) => file)
        .sort()
    return { files, skipped: uniqueInputs.length - files.length }
}

function main(): void {
    let selection: Selection
    try {
        selection = parseSelection(process.argv.slice(2))
    } catch (error) {
        process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
        process.exitCode = 2
        return
    }

    let chosen: ReturnType<typeof selectedFiles>
    try {
        chosen = selectedFiles(selection)
    } catch (error) {
        process.stderr.write(
            `Could not select illustration sources: ${error instanceof Error ? error.message : String(error)}\n`,
        )
        process.exitCode = 2
        return
    }

    if (chosen.files.length === 0) {
        process.stdout.write(
            `No existing article illustration TSX files selected; typecheck skipped (${chosen.skipped} deleted or non-illustration path(s) skipped).\n`,
        )
        return
    }

    const configPath = path.join(webRoot, 'tsconfig.json')
    const config = ts.readConfigFile(configPath, ts.sys.readFile)
    if (config.error) {
        process.stderr.write(ts.flattenDiagnosticMessageText(config.error.messageText, '\n') + '\n')
        process.exitCode = 2
        return
    }
    const parsed = ts.parseJsonConfigFileContent(
        config.config,
        ts.sys,
        webRoot,
        { noEmit: true, incremental: false },
        configPath,
    )
    const configErrors = parsed.errors.filter(
        (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
    )
    if (configErrors.length > 0) {
        process.stderr.write(
            ts.formatDiagnosticsWithColorAndContext(configErrors, {
                getCanonicalFileName: (file) => file,
                getCurrentDirectory: () => webRoot,
                getNewLine: () => ts.sys.newLine,
            }),
        )
        process.exitCode = 2
        return
    }

    const declarationFiles = parsed.fileNames.filter((file) => file.endsWith('.d.ts'))
    const ambientTypes = [...new Set([...(parsed.options.types ?? []), 'node', 'react'])]
    const program = ts.createProgram({
        rootNames: [...new Set([...declarationFiles, ...chosen.files])],
        options: { ...parsed.options, types: ambientTypes, noEmit: true, incremental: false },
    })
    const diagnostics = ts.getPreEmitDiagnostics(program)
    const errors = diagnostics.filter(
        (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
    )
    const warnings = diagnostics.length - errors.length
    if (errors.length > 0) {
        process.stderr.write(
            ts.formatDiagnosticsWithColorAndContext(errors, {
                getCanonicalFileName: (file) => file,
                getCurrentDirectory: () => webRoot,
                getNewLine: () => ts.sys.newLine,
            }),
        )
        process.stderr.write(
            `\nStrict illustration typecheck failed: ${errors.length} TypeScript error(s) in ${chosen.files.length} source file(s); ${chosen.skipped} deleted or non-illustration path(s) skipped.\n`,
        )
        process.exitCode = 1
        return
    }

    process.stdout.write(
        `Strict illustration typecheck passed: ${chosen.files.length} source file(s); ${chosen.skipped} deleted or non-illustration path(s) skipped${warnings ? `; ${warnings} non-error diagnostic(s)` : ''}.\n`,
    )
}

main()
