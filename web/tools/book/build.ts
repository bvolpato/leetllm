/** Compile the curriculum into a validated, paginated print book. */
import { createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from "fs"
import { basename, join, resolve } from "path"
import { createHash } from "node:crypto"
import { parseArgs } from "node:util"
import { execFileSync } from "child_process"
import puppeteer, { type Browser } from "puppeteer-core"
import { getQuestions, type Question } from "../../src/lib/questions"
import { getQuestionRoute } from "../../src/lib/content-route-index"
import { loadContentBundle } from "../../src/lib/content-bundle"
import type { ContentEdition } from "../../src/lib/content-audience"
import { resolveContent } from "../../src/lib/content-utils"
import { bookTrim, getBookStylesheet, textBlockPixels } from "./styles"
import { bookFontCss, bookFontPaths } from "./fonts"
import { planRectoPads, REFLOW_SOURCE } from "./reflow"
import { renderCoverArt, renderPartArt } from "./cover-art"
import { ensureBookIllustrations } from "../illustrations/book"
import { closeBookDiagramBrowser, ensureBookDiagrams, resolveBookDiagram, resolveBookDiagramMarkdown } from "../diagrams/book"
import { planBook, type PlannedPart } from "./planner"
import { loadChapterIntroduction } from "./introductions"
import {
  type BookConfig,
  type ChapterSection,
  type IndexEntry,
  type TocPartEntry,
  chapterSections,
  citedReferences,
  renderBibliography,
  renderChapter,
  renderCoverPage,
  renderCopyrightPage,
  renderFrontEssays,
  renderIndex,
  renderPartDivider,
  renderTableOfContents,
} from "./renderer"

const ROOT_DIR = resolve(process.cwd(), "..")
const CONFIG_PATH = join(process.cwd(), "tools", "book", "book-config.json")
const MERGE_SCRIPT = join(ROOT_DIR, "scripts", "merge-book.py")
const MASTER_FILENAME = "The-AI-and-LLM-Systems-Engineering-Handbook.pdf"

interface RawBookConfig extends Partial<BookConfig> {
  presets?: Record<string, Partial<BookConfig>>
  activePreset?: string
}

interface BookOffsets {
  fingerprint: string
  /** Pages before the first arabic folio. Offsets below are physical page numbers. */
  frontmatterPages: number
  totalPages: number
  tocPage: number
  parts: Record<string, number>
  chapters: Record<string, number>
  backMatter?: Record<string, number>
}

interface BuildManifest {
  fingerprint: string
  preset: string
  config: BookConfig
  parts: Array<{
    partNumber: number
    title: string
    chapters: Array<{ chapterNumber: number; slug: string; title: string; sections?: ChapterSection[] }>
  }>
  artifacts: Record<string, { sha256: string }>
  backMatter?: string[]
}

function findChromium(): string {
  const candidates = [
    process.env.CHROMIUM_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome-stable", "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser", "/usr/bin/chromium",
  ]
  for (const path of candidates) if (path && existsSync(path)) return path
  throw new Error("Chromium not found. Set CHROMIUM_PATH or install Google Chrome.")
}

function resolveBookConfig(raw: RawBookConfig, requestedPreset?: string): { config: BookConfig; preset: string } {
  const preset = requestedPreset || raw.activePreset || "curated"
  if (!/^[a-z0-9][a-z0-9-]*$/.test(preset) || (raw.presets && !Object.hasOwn(raw.presets, preset))) {
    throw new Error(`Unknown book preset: ${preset}. Available: ${Object.keys(raw.presets || {}).join(", ")}`)
  }
  const selected = { ...raw, ...raw.presets?.[preset] }
  const config: BookConfig = {
    title: selected.title!, coverTitleLines: selected.coverTitleLines, subtitle: selected.subtitle!, author: selected.author!,
    edition: selected.edition!, publisher: selected.publisher!, copyright: selected.copyright!,
    trimSize: selected.trimSize || "7.5x9.25in", parts: selected.parts || [],
    excludeSections: selected.excludeSections || [], excludeSlugs: selected.excludeSlugs || [],
    cleanWebContent: selected.cleanWebContent ?? true,
    readingEdition: selected.readingEdition ?? false,
    chapterIntroductions: selected.chapterIntroductions ?? false,
  }
  bookTrim(config.trimSize)
  if (!config.parts?.length) throw new Error(`Preset ${preset} has no parts.`)
  return { config, preset }
}

/** Printed folio for a physical page. Arabic numbering starts after the front matter. */
function folio(offsets: BookOffsets | null, physical: number | undefined): number | undefined {
  return offsets && physical !== undefined ? physical - offsets.frontmatterPages : undefined
}

function createTocParts(parts: PlannedPart[], offsets: BookOffsets | null): TocPartEntry[] {
  return parts.map((part) => ({
    partNumber: part.partNumber,
    title: part.title,
    pageNumber: folio(offsets, offsets?.parts[String(part.partNumber)]),
    chapters: part.chapters.map(({ chapterNumber, question }) => ({
      chapterNumber, title: question.title, slug: question.slug, section: question.section,
      pageNumber: folio(offsets, offsets?.chapters[String(chapterNumber)]),
    })),
  }))
}

/** The index is curated, because a reader needs terms a person chose, with subentries and cross-references. */
function indexTerms(): unknown[] {
  return readJson<unknown[]>(join(process.cwd(), "tools", "book", "index-terms.json")) ?? []
}

async function prepareDiagramAssets(questions: Question[], renderMissing: boolean, minimumLabelPt: number, edition: ContentEdition): Promise<void> {
  try {
    for (const question of questions) {
      const route = getQuestionRoute(question.slug)
      if (!route) throw new Error(`Content directory missing from route index: ${question.slug}`)
      const directory = join(process.cwd(), "src", "content", route.directory)
      const bundle = loadContentBundle(directory, "book", edition)
      if (!bundle) throw new Error(`Content bundle missing: ${question.slug}`)
      if (!/^```mermaid\n/m.test(bundle.body)) continue
      const displayWidths = await ensureBookDiagrams(route.directory, renderMissing, minimumLabelPt, edition, true)
      const body = resolveBookDiagramMarkdown(bundle.body, route.directory, bundle.sourceBody, displayWidths, edition)
      question.content = resolveContent(body, directory, question.references, "content.md", bundle.sourceBody)
    }
  } finally {
    await closeBookDiagramBrowser()
  }
}

function fingerprintBuild(config: BookConfig, parts: PlannedPart[]): string {
  const hash = createHash("sha256")
  const hashSourceDirectory = (directory: string) => {
    if (!existsSync(directory)) return
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name === "_generated" || entry.name.startsWith(".book-")) continue
      const path = join(directory, entry.name)
      if (entry.isDirectory()) hashSourceDirectory(path)
      else if (/\.(?:tsx?|json|md)$/.test(entry.name)) hash.update(path).update(readFileSync(path))
    }
  }
  hash.update(JSON.stringify(config))
  hash.update(readFileSync(join(process.cwd(), "pnpm-lock.yaml")))
  for (const file of ["build.ts", "planner.ts", "renderer.tsx", "styles.ts", "introductions.ts", "fonts.ts", "reflow.ts", "cover-art.ts", "index-terms.json"]) {
    hash.update(readFileSync(join(process.cwd(), "tools", "book", file)))
  }
  for (const font of bookFontPaths()) hash.update(readFileSync(font))
  for (const file of [MERGE_SCRIPT, join(process.cwd(), "tools", "illustrations", "book.ts"), join(process.cwd(), "tools", "diagrams", "book.ts"), join(process.cwd(), "node_modules", "vizmatic", "package.json"), join(process.cwd(), "node_modules", "vizmatic", "dist", "index.js"), join(process.cwd(), "node_modules", "vizmatic", "dist", "index.cjs")]) {
    if (existsSync(file)) hash.update(readFileSync(file))
  }
  // Print figures live here and share kits across chapter folders.
  hashSourceDirectory(join(process.cwd(), "tools", "book", "figures"))
  hashSourceDirectory(join(process.cwd(), "tools", "illustrations", "lib"))
  hashSourceDirectory(join(process.cwd(), "tools", "diagrams", "lib"))
  const illustrationFonts = join(process.cwd(), "tools", "illustrations", "fonts")
  if (existsSync(illustrationFonts)) {
    for (const entry of readdirSync(illustrationFonts, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.isFile() && /\.(?:ttf|otf|woff2?)$/i.test(entry.name)) {
        const path = join(illustrationFonts, entry.name)
        hash.update(path).update(readFileSync(path))
      }
    }
  }
  if (config.chapterIntroductions) hashSourceDirectory(join(process.cwd(), "tools", "book", "introductions"))
  for (const part of parts) {
    for (const chapter of part.chapters) {
      hash.update(JSON.stringify(chapter))
      const route = getQuestionRoute(chapter.question.slug)
      if (route) {
        const directory = join(process.cwd(), "src", "content", route.directory)
        hashSourceDirectory(directory)
      }
      for (const match of chapter.question.content.matchAll(/\/cdn\/content-image\/([^\s"'<>?)]+)/g)) {
        const path = join(process.cwd(), "src", "content", decodeURIComponent(match[1]))
        const printDiagram = resolveBookDiagram(decodeURIComponent(match[1]), false)
        for (const variant of new Set(printDiagram ? [printDiagram] : [path, path.replace(/_dark\.png$/, "_light.png")])) {
          if (existsSync(variant)) {
            const stat = statSync(variant)
            hash.update(`${variant}:${stat.size}:${stat.mtimeMs}`)
          }
        }
      }
    }
  }
  return hash.digest("hex")
}

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null
  return JSON.parse(readFileSync(path, "utf8")) as T
}

async function hashFile(path: string): Promise<string> {
  const hash = createHash("sha256")
  for await (const chunk of createReadStream(path)) hash.update(chunk)
  return hash.digest("hex")
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

// Inline local KaTeX fonts so file-less Chromium documents retain correct math metrics.
const katexDirectory = join(process.cwd(), "node_modules", "katex", "dist")
const KATEX_CSS = readFileSync(join(katexDirectory, "katex.min.css"), "utf8").replace(
  /url\((fonts\/[^)]+)\)/g,
  (_match, file: string) => {
    const mime = file.endsWith(".woff2") ? "font/woff2" : file.endsWith(".woff") ? "font/woff" : "font/ttf"
    return `url(data:${mime};base64,${readFileSync(join(katexDirectory, file)).toString("base64")})`
  },
)

function wrapHtmlDocument(body: string, title: string, trimSize: string, bleed = false): string {
  // The cover prints to every edge, so its document has no page margins.
  const page = bleed ? "@page { margin: 0; } @page :left { margin: 0; } @page :right { margin: 0; }" : ""
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
    <style>${bookFontCss()}\n${KATEX_CSS}\n${getBookStylesheet(trimSize)}\n${page}</style></head><body>${body}</body></html>`
}

async function renderHtmlToPdf(browser: Browser, html: string, outputPath: string, config: BookConfig, runningTitle = "", cover = false, localFolios = false, pads?: readonly boolean[]): Promise<boolean[]> {
  const page = await browser.newPage()
  let padded: boolean[] = []
  try {
    await page.emulateMediaType("print")
    await page.setContent(html, { waitUntil: "load", timeout: 180_000 })
    await page.evaluate(async () => {
      await document.fonts.ready
      await Promise.all(Array.from(document.images, async (image) => {
        if (!image.complete) await new Promise<void>((resolve, reject) => {
          image.addEventListener("load", () => resolve(), { once: true })
          image.addEventListener("error", () => reject(new Error(`Image could not be loaded: ${image.src.slice(0, 160)}`)), { once: true })
        })
        if (!image.naturalWidth) throw new Error(`Image could not be loaded: ${image.src.slice(0, 160)}`)
      }))
    })
    if (!cover) {
      const report = await page.evaluate(`${REFLOW_SOURCE}(${JSON.stringify({ pageHeight: textBlockPixels(config.trimSize).height, width: textBlockPixels(config.trimSize).width, pads })})`) as { moved: number; shrunk: number; padded: boolean[] }
      if (!pads && (report.moved || report.shrunk)) console.log(`  Reflow: moved ${report.moved} and scaled ${report.shrunk} figure(s) to close page gaps`)
      padded = report.padded
    }
    const pdf = await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
      displayHeaderFooter: !cover && localFolios,
      headerTemplate: `<div style="font-family:Arial,sans-serif;font-size:6.5pt;color:#7a7f86;width:100%;text-align:right;padding:0 0.85in;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(runningTitle)}</div>`,
      // Physical page numbers are added once by the merger, after pagination stabilizes.
      footerTemplate: localFolios
        ? `<div style="font-family:Arial,sans-serif;font-size:7pt;color:#7a7f86;width:100%;text-align:right;padding:0 0.85in;"><span class="pageNumber"></span></div>`
        : "<span></span>",
      timeout: 300_000,
      tagged: true,
    })
    writeFileSync(`${outputPath}.tmp`, pdf)
    renameSync(`${outputPath}.tmp`, outputPath)
    return padded
  } finally {
    await page.close()
  }
}

// Reflow can only estimate a chapter's page count, and one wrong estimate puts every later chapter
// in the part on a left-hand page. So read the real pages from the PDF and render again if needed.
async function renderPartPdf(browser: Browser, html: string, outputPath: string, config: BookConfig, title: string): Promise<void> {
  let pads: boolean[] | undefined
  for (let attempt = 0; attempt < 3; attempt++) {
    const padded = await renderHtmlToPdf(browser, html, outputPath, config, title, false, false, pads)
    const { pages, chapters } = JSON.parse(execFileSync("uv", ["run", MERGE_SCRIPT, "--chapter-pages", outputPath], { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] })) as { pages: number; chapters: number[] }
    if (chapters.length !== padded.length) throw new Error(`Found ${chapters.length} chapter openings in ${outputPath}, and expected ${padded.length}`)
    if (chapters.every((page) => page % 2 === 1)) return
    pads = planRectoPads(chapters, padded, pages)
  }
  throw new Error(`Chapters in ${outputPath} still open on left-hand pages after three renders`)
}

async function main() {
  const { values: args } = parseArgs({ options: {
    estimate: { type: "boolean" }, frontmatter: { type: "boolean" }, merge: { type: "boolean" },
    slug: { type: "string" }, part: { type: "string" }, all: { type: "boolean" }, preset: { type: "string" },
    help: { type: "boolean", short: "h" },
  } })
  const modes = [args.estimate, args.frontmatter, args.merge, args.slug !== undefined, args.part !== undefined, args.all].filter(Boolean).length
  if (args.help || !modes) {
    console.log("LeetLLM Book Builder\n\n./build-book.sh [--preset <name>] <command>\n  --estimate       Chapter, word, and rough text-page statistics\n  --slug <slug>    Render a chapter proof\n  --part <number>  Render one configured part\n  --frontmatter    Render cover, copyright, and TOC\n  --all            Render, converge TOC pagination, validate, and merge\n  --merge          Merge the complete, unchanged current build")
    return
  }
  if (modes !== 1) throw new Error("Choose exactly one book command.")
  const { config, preset } = resolveBookConfig(readJson<RawBookConfig>(CONFIG_PATH)!, args.preset)
  const edition: ContentEdition = config.readingEdition ? "reader" : "reference"
  const bookQuestions = getQuestions("book", edition)
  const plannedParts = planBook(config, bookQuestions)
  const chapterNumbers = new Map(plannedParts.flatMap((part) => part.chapters.map(({ chapterNumber, question }) => [question.slug, chapterNumber] as const)))
  if (args.estimate) {
    console.log(`${config.title}\nPreset: ${preset} | Trim: ${config.trimSize.toUpperCase()}\n`)
    let totalWords = 0
    for (const part of plannedParts) {
      const words = part.chapters.reduce((sum, chapter) => sum + chapter.question.content.split(/\s+/).length, 0)
      totalWords += words
      console.log(`Part ${part.partNumber}: ${part.title}\n  ${part.chapters.length} chapters | ${words.toLocaleString()} source words | ~${Math.round(words / 430)} text pages`)
    }
    console.log(`\nTotal: ${chapterNumbers.size} chapters | ${totalWords.toLocaleString()} source words | ~${Math.round(totalWords / 430)} text pages`)
    console.log("Estimates exclude figure, code, table, and frontmatter space. Use --all for exact pagination.")
    return
  }

  const selectedQuestion = args.slug === undefined ? undefined : bookQuestions.find((question) => question.slug === args.slug)
  if (args.slug !== undefined && !selectedQuestion) throw new Error(`Chapter slug not found: ${args.slug}`)
  const selectedPart = args.part === undefined ? undefined : plannedParts.find((part) => /^\d+$/.test(args.part!) && part.partNumber === Number(args.part))
  if (args.part !== undefined && !selectedPart) throw new Error(`Part not found: ${args.part}. Available: ${plannedParts.map((part) => part.partNumber).join(", ")}`)
  const allQuestions = plannedParts.flatMap((part) => part.chapters.map((chapter) => chapter.question))
  if (config.chapterIntroductions) {
    const questions = selectedQuestion ? [selectedQuestion] : selectedPart ? selectedPart.chapters.map(chapter => chapter.question) : allQuestions
    if (!args.frontmatter) for (const question of questions) loadChapterIntroduction(question.slug)
  }
  const minimumDiagramLabelPt = config.readingEdition ? 8 : 0
  if (args.merge) await prepareDiagramAssets(allQuestions, false, minimumDiagramLabelPt, edition)
  else if (selectedQuestion) await prepareDiagramAssets([selectedQuestion], true, minimumDiagramLabelPt, edition)
  else if (selectedPart) await prepareDiagramAssets(selectedPart.chapters.map((chapter) => chapter.question), true, minimumDiagramLabelPt, edition)
  else if (args.all) await prepareDiagramAssets(allQuestions, true, minimumDiagramLabelPt, edition)

  const outputDirectory = join(ROOT_DIR, "build", "book", preset)
  const partsDirectory = join(outputDirectory, "parts")
  const chaptersDirectory = join(outputDirectory, "chapters")
  const manifestPath = join(outputDirectory, "manifest.json")
  const offsetsPath = join(outputDirectory, "offsets.json")
  const masterPath = join(outputDirectory, MASTER_FILENAME)
  mkdirSync(partsDirectory, { recursive: true })
  mkdirSync(chaptersDirectory, { recursive: true })
  const fingerprint = fingerprintBuild(config, plannedParts)
  const existingManifest = readJson<BuildManifest>(manifestPath)
  const previousChapters = new Map(existingManifest?.fingerprint === fingerprint ? existingManifest.parts.flatMap((part) => part.chapters.map((chapter) => [chapter.slug, chapter] as const)) : [])
  const manifest: BuildManifest = {
    fingerprint, preset, config,
    parts: plannedParts.map((part) => ({ partNumber: part.partNumber, title: part.title, chapters: part.chapters.map(({ chapterNumber, question }) => ({ chapterNumber, slug: question.slug, title: question.title, sections: previousChapters.get(question.slug)?.sections })) })),
    artifacts: existingManifest?.fingerprint === fingerprint ? existingManifest.artifacts : {},
    backMatter: ["part-zb-bibliography.pdf", "part-zi-index.pdf"],
  }
  const saveArtifact = async (path: string) => {
    manifest.artifacts[basename(path)] = { sha256: await hashFile(path) }
    writeFileSync(`${manifestPath}.tmp`, JSON.stringify(manifest, null, 2))
    renameSync(`${manifestPath}.tmp`, manifestPath)
  }
  const coverPath = join(partsDirectory, "part-0a-cover.pdf")
  const tocPath = join(partsDirectory, "part-0b-toc.pdf")
  const partPaths = plannedParts.map((part) => join(partsDirectory, `part-${part.partNumber}.pdf`))
  const bibliographyPath = join(partsDirectory, "part-zb-bibliography.pdf")
  const indexPath = join(partsDirectory, "part-zi-index.pdf")
  const allPaths = [coverPath, tocPath, ...partPaths, bibliographyPath, indexPath]
  const loadOffsets = () => {
    const offsets = readJson<BookOffsets>(offsetsPath)
    return offsets?.fingerprint === fingerprint ? offsets : null
  }
  const merge = () => {
    if (!existingManifest || existingManifest.fingerprint !== fingerprint || !loadOffsets()) {
      throw new Error("No complete current build is available. Run --all before --merge.")
    }
    execFileSync("uv", ["run", MERGE_SCRIPT, "--manifest", manifestPath, "--offsets", offsetsPath, "--output", masterPath, ...allPaths], { stdio: "inherit" })
    console.log(`Book ready: ${masterPath}`)
  }
  if (args.merge) { merge(); return }

  const browser = await puppeteer.launch({ executablePath: findChromium(), headless: true, args: ["--no-sandbox", "--disable-gpu"] })
  try {
    const wrap = (body: string, title: string) => wrapHtmlDocument(body, title, config.trimSize)
    const prepareChapter = async (question: Question) => {
      const route = getQuestionRoute(question.slug)
      if (!route) throw new Error(`Content directory missing from route index: ${question.slug}`)
      await ensureBookIllustrations(route.directory, config.readingEdition ? undefined : 0, edition)
    }
    const chapterHtml = (question: Question, chapterNumber: number) => renderChapter(question, chapterNumber, {
      chapterNumbers,
      cleanWebContent: config.cleanWebContent,
      introduction: config.chapterIntroductions ? loadChapterIntroduction(question.slug) : undefined,
    })
    const renderCover = async () => {
      await renderHtmlToPdf(browser, wrapHtmlDocument(renderCoverPage(config, await renderCoverArt()), "Cover", config.trimSize, true), coverPath, config, "", true)
      await saveArtifact(coverPath)
    }
    const renderToc = async (offsets: BookOffsets | null) => {
      const backMatter = [
        { title: "Bibliography", pageNumber: folio(offsets, offsets?.backMatter?.bibliography) },
        { title: "Index", pageNumber: folio(offsets, offsets?.backMatter?.index) },
      ]
      const body = renderCopyrightPage(config)
        + renderTableOfContents(createTocParts(plannedParts, offsets), backMatter)
        + renderFrontEssays(config, plannedParts.map((part) => ({ partNumber: part.partNumber, title: part.title })))
      await renderHtmlToPdf(browser, wrap(body, "Table of Contents"), tocPath, config, config.title, true)
      await saveArtifact(tocPath)
    }
    const renderBibliographyPdf = async () => {
      await renderHtmlToPdf(browser, wrap(renderBibliography(allQuestions.flatMap(citedReferences)), "Bibliography"), bibliographyPath, config, "Bibliography", true)
      await saveArtifact(bibliographyPath)
    }
    const renderIndexPdf = async (entries: IndexEntry[]) => {
      await renderHtmlToPdf(browser, wrap(renderIndex(entries), "Index"), indexPath, config, "Index", true)
      await saveArtifact(indexPath)
    }
    const renderPart = async (part: PlannedPart) => {
      console.log(`Rendering Part ${part.partNumber}: ${part.title} (${part.chapters.length} chapters)`)
      const chapterEntries = part.chapters.map(({ chapterNumber, question }) => ({ chapterNumber, title: question.title, slug: question.slug }))
      const art = config.readingEdition ? await renderPartArt(chapterEntries.map((chapter) => chapter.title), part.partNumber) : undefined
      let body = renderPartDivider(part.partNumber, part.title, part.description, config.readingEdition ? chapterEntries : [], art)
      const recorded = manifest.parts.find((entry) => entry.partNumber === part.partNumber)
      for (const chapter of part.chapters) {
        console.log(`  Chapter ${chapter.chapterNumber}: ${chapter.question.title}`)
        await prepareChapter(chapter.question)
        const html = chapterHtml(chapter.question, chapter.chapterNumber)
        const entry = recorded?.chapters.find((candidate) => candidate.slug === chapter.question.slug)
        if (entry) entry.sections = chapterSections(html)
        body += html
      }
      const path = join(partsDirectory, `part-${part.partNumber}.pdf`)
      await renderPartPdf(browser, wrap(body, part.title), path, config, part.title)
      await saveArtifact(path)
      console.log(`Rendered ${path}`)
    }
    if (selectedQuestion) {
      const question = selectedQuestion
      await prepareChapter(question)
      const path = join(chaptersDirectory, `${question.slug}.pdf`)
      await renderHtmlToPdf(browser, wrap(chapterHtml(question, chapterNumbers.get(question.slug) || 1), question.title), path, config, question.title, false, true)
      console.log(`Chapter proof: ${path}`)
      return
    }
    if (selectedPart) {
      await renderPart(selectedPart)
      return
    }
    if (args.frontmatter) {
      await renderCover()
      await renderToc(loadOffsets())
      console.log(`Frontmatter ready in ${partsDirectory}. Run --all to finalize pagination.`)
      return
    }
    await renderCover()
    await renderToc(null)
    for (const part of plannedParts) await renderPart(part)
    await renderBibliographyPdf()
    // The index needs final body pages. Its own length changes only what follows it.
    await renderIndexPdf([])
    execFileSync("uv", ["run", MERGE_SCRIPT, "--scan", "--manifest", manifestPath, "--output", offsetsPath, ...allPaths], { stdio: "inherit" })
    const termsPath = join(outputDirectory, "index-terms.json")
    const indexPathJson = join(outputDirectory, "index-entries.json")
    writeFileSync(termsPath, JSON.stringify(indexTerms()))
    execFileSync("uv", ["run", MERGE_SCRIPT, "--index-terms", termsPath, "--offsets", offsetsPath, "--manifest", manifestPath, "--output", indexPathJson, ...allPaths], { stdio: "inherit" })
    await renderIndexPdf(readJson<IndexEntry[]>(indexPathJson) ?? [])
    execFileSync("uv", ["run", MERGE_SCRIPT, "--scan", "--manifest", manifestPath, "--output", offsetsPath, ...allPaths], { stdio: "inherit" })
    let current = loadOffsets()!
    let converged = false
    for (let pass = 0; pass < 4; pass++) {
      await renderToc(current)
      execFileSync("uv", ["run", MERGE_SCRIPT, "--scan", "--manifest", manifestPath, "--output", offsetsPath, ...allPaths], { stdio: "inherit" })
      const next = loadOffsets()!
      if (JSON.stringify(current) === JSON.stringify(next)) { converged = true; break }
      current = next
    }
    if (!converged) throw new Error("TOC pagination did not converge after four passes.")
    execFileSync("uv", ["run", MERGE_SCRIPT, "--manifest", manifestPath, "--offsets", offsetsPath, "--output", masterPath, ...allPaths], { stdio: "inherit" })
    console.log(`Book ready: ${masterPath}`)
  } finally {
    await browser.close()
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
