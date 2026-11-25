/* eslint-disable @next/next/no-img-element */
import React from "react"
import ReactDOMServer from "react-dom/server"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"
import { existsSync, readFileSync } from "fs"
import { extname, join, relative, resolve } from "path"
import type { Question } from "@/lib/questions"
import { getQuestionRoute } from "@/lib/content-route-index"
import { SyntaxHighlighter } from "@/components/content-syntax-highlighter"
import { resolvePrismLanguage } from "@/components/prism-language"
import { prepareCodeForPrint } from "@/lib/code-folding"
import { resolveBookIllustration } from "../illustrations/book"
import { resolveBookDiagram } from "../diagrams/book"
import { FONT_FALLBACKS } from "./fonts"
import type { ChapterIntroduction } from "./introductions"

const CONTENT_DIR = join(process.cwd(), "src", "content")

/** Code colors chosen for warm-ivory print: crisp contrast, distinct in grayscale, never bold. */
const BOOK_CODE_THEME: Record<string, React.CSSProperties> = {
  'code[class*="language-"]': { color: "#14191f", fontFamily: `"JetBrains Mono", Inter, ${FONT_FALLBACKS}, monospace` },
  'pre[class*="language-"]': { color: "#14191f", fontFamily: `"JetBrains Mono", Inter, ${FONT_FALLBACKS}, monospace` },
  comment: { color: "#767d85", fontStyle: "italic" }, prolog: { color: "#767d85" }, doctype: { color: "#767d85" }, cdata: { color: "#767d85" },
  keyword: { color: "#0f4c5c" }, atrule: { color: "#0f4c5c" }, "attr-name": { color: "#0f4c5c" }, selector: { color: "#0f4c5c" }, builtin: { color: "#0f4c5c" },
  string: { color: "#245c3c" }, char: { color: "#245c3c" }, "attr-value": { color: "#245c3c" }, regex: { color: "#245c3c" }, inserted: { color: "#245c3c" },
  number: { color: "#9a5b0c" }, boolean: { color: "#9a5b0c" }, constant: { color: "#9a5b0c" }, symbol: { color: "#9a5b0c" },
  function: { color: "#4e337a" }, "class-name": { color: "#4e337a" }, decorator: { color: "#4e337a" },
  operator: { color: "#495057" }, punctuation: { color: "#495057" }, deleted: { color: "#93332c" }, tag: { color: "#0f4c5c" }, property: { color: "#0f4c5c" }, variable: { color: "#14191f" },
}

export interface BookConfig {
  title: string
  coverTitleLines?: string[]
  subtitle: string
  author: string
  edition: string
  publisher: string
  copyright: string
  trimSize: string
  excludeSections: string[]
  excludeSlugs: string[]
  cleanWebContent: boolean
  readingEdition?: boolean
  chapterIntroductions?: boolean
  parts: Array<{ number: number; title: string; description: string | string[]; sections?: string[]; chapterSlugs?: string[] }>
}

export interface TocChapterEntry {
  chapterNumber: number
  title: string
  slug?: string
  section: string
  difficulty?: string
  pageNumber?: number
}

export interface TocPartEntry {
  partNumber: number
  title: string
  pageNumber?: number
  chapters: TocChapterEntry[]
}

export interface ChapterRenderOptions {
  chapterNumbers?: Map<string, number>
  cleanWebContent?: boolean
  introduction?: ChapterIntroduction
}

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;")
}

/** Strip web navigation and quizzes without changing literal code examples. */
export function cleanContentForBook(rawContent: string): string {
  const result: string[] = []
  let fence: { character: string; length: number; omit: boolean } | undefined
  let navigation = false
  let navigationDiv = false
  for (const line of rawContent.split("\n")) {
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line)
    if (fence) {
      if (!fence.omit) result.push(line)
      if (marker && marker[1][0] === fence.character && marker[1].length >= fence.length && !marker[2].trim()) fence = undefined
      continue
    }
    if (/^\s*<!--\s*leetllm:\s*mastery:(?:start|end)\s*-->\s*$/.test(line)) continue
    if (marker) {
      fence = { character: marker[1][0], length: marker[1].length, omit: marker[2].trim().split(/\s/)[0] === "mastery-quiz" }
      if (!fence.omit) result.push(line)
      continue
    }
    if (navigationDiv) {
      if (/<\/div>/i.test(line)) navigationDiv = false
      continue
    }
    if (/<div\b[^>]*data-next-callout/i.test(line)) {
      navigationDiv = !/<\/div>/i.test(line)
      continue
    }
    if (/^>\s*(?:\*\*)?(?:Next:|Course complete:|Course complete\b)/i.test(line)
      || /^\s*\*\*Next:\*\*\s+Continue\s+to/i.test(line)) navigation = true
    if (navigation) {
      if (!line.trim()) { navigation = false; result.push("") }
      continue
    }
    // Currency is prose. Math delimiters around an escaped dollar can be
    // misparsed as an empty formula, leaving a red KaTeX error in print.
    result.push(line.replace(/\$\\{1,2}\$(\d+(?:[.,]\d+)*)\$/g, (_match, amount: string) => `\\$${amount}`))
  }
  return result.join("\n").trim()
}

interface HtmlNode {
  type: string
  depth?: number
  tagName?: string
  value?: string
  properties?: Record<string, unknown>
  children?: HtmlNode[]
}

function textContent(node: HtmlNode): string {
  return node.value ?? node.children?.map(textContent).join("") ?? ""
}

const text = (value: string): HtmlNode => ({ type: "text", value })
const element = (tagName: string, children: HtmlNode[], properties: Record<string, unknown> = {}): HtmlNode => ({ type: "element", tagName, properties, children })

function resolveBookImageSource(src: string, chapterSlug: string): string {
  if (!/^(?:\.\/)?(?:illustrations|diagrams)\//.test(src)) return src
  const route = getQuestionRoute(chapterSlug)
  if (!route) throw new Error(`Content directory missing for book image in chapter ${chapterSlug}: ${src}`)
  return `/cdn/content-image/${route.directory}/${src.replace(/^\.\//, "")}`
}

function imageData(src: string): string {
  const prefix = "/cdn/content-image/"
  if (!src.includes(prefix)) return src.startsWith("/") ? `https://leetllm.com${src}` : src
  const pathPart = decodeURIComponent(src.slice(src.indexOf(prefix) + prefix.length).split("?")[0])
  const diskPath = resolve(CONTENT_DIR, pathPart)
  if (relative(CONTENT_DIR, diskPath).startsWith("..")) throw new Error(`Book image escapes the content directory: ${src}`)
  const lightVariant = diskPath.replace(/_dark\.png$/, "_light.png")
  const target = resolveBookDiagram(pathPart) ?? resolveBookIllustration(pathPart)?.path ?? (existsSync(lightVariant) ? lightVariant : diskPath)
  if (!existsSync(target)) throw new Error(`Missing book image: ${target}`)
  const mime = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".webp": "image/webp" }[extname(target)]
  if (!mime) throw new Error(`Unsupported book image format: ${target}`)
  return `data:${mime};base64,${readFileSync(target).toString("base64")}`
}

/** Printed size for a generated figure. The layout may shrink it down to the given fraction. */
function imageSizing(src: string): { widthPt?: number; shrink?: number } {
  const prefix = "/cdn/content-image/"
  if (!src.includes(prefix)) return {}
  const asset = resolveBookIllustration(decodeURIComponent(src.slice(src.indexOf(prefix) + prefix.length).split("?")[0]))
  return { widthPt: asset?.widthPt, shrink: asset?.shrink }
}

function bookHtml(chapter: Question, chapterNumber: number, options: ChapterRenderOptions, citations: Map<string, number>) {
  let figureCount = 0
  const headingCounts = new Map<string, number>()
  return () => (tree: HtmlNode) => {
    function resolveImages(node: HtmlNode) {
      if (node.tagName === "img") {
        const properties = node.properties ??= {}
        properties.src = resolveBookImageSource(String(properties.src ?? ""), chapter.slug)
      }
      node.children?.forEach(resolveImages)
    }
    resolveImages(tree)
    function normalize(parent: HtmlNode, insideFigure = false) {
      if (!parent.children) return
      parent.children = parent.children.flatMap((node) => {
        if (node.tagName === "p" && node.children?.some((child) => child.tagName === "img")) {
          const groups: HtmlNode[] = []
          let inline: HtmlNode[] = []
          const flush = () => { if (inline.some((child) => textContent(child).trim() || child.tagName)) groups.push(element("p", inline)); inline = [] }
          for (const child of node.children) {
            if (child.tagName === "img") { flush(); groups.push(insideFigure ? child : element("figure", [child])) }
            else inline.push(child)
          }
          flush()
          return groups
        }
        if (node.tagName === "img" && !insideFigure) return [element("figure", [node])]
        return [node]
      })
      for (const node of parent.children) {
        const properties = node.properties ??= {}
        if (node.tagName === "p" && !insideFigure && textContent(node).length <= 500) {
          properties.className = [...(Array.isArray(properties.className) ? properties.className : []), "book-prose-keep"]
        }
        if (node.tagName === "table") {
          const rows = node.children?.flatMap((child) => child.tagName === "tr" ? [child] : child.children?.filter((item) => item.tagName === "tr") ?? []) ?? []
          if (rows.length <= 6 && textContent(node).length < 1800) properties.className = ["table-compact"]
        }
        if (node.tagName === "figure") {
          figureCount++
          properties.className = ["book-figure"]
          let caption = node.children?.find((child) => child.tagName === "figcaption")
          if (!caption) {
            const image = node.children?.find((child) => child.tagName === "img")
            const alt = String(image?.properties?.alt ?? "")
            caption = element("figcaption", [text(alt)])
            node.children ??= []
            node.children.push(caption)
          }
          caption.children?.unshift(element("strong", [text(`Figure ${chapterNumber}.${figureCount}. `)], { className: ["fig-num"] }))
          const image = node.children?.find((child) => child.tagName === "img")
          const src = String(image?.properties?.src ?? "")
          const path = src.split("/cdn/content-image/")[1]?.split("?")[0]
          const notes = path && properties.dataBookCaption !== "complete" ? resolveBookIllustration(decodeURIComponent(path))?.notes ?? [] : []
          const normalizeText = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim()
          let existing = normalizeText(textContent(caption))
          for (const note of notes) {
            const normalized = normalizeText(note)
            if (!normalized || existing.includes(normalized)) continue
            caption.children?.push(text(` ${note}${/[.!?:]$/.test(note) ? "" : "."}`))
            existing += ` ${normalized}`
          }
        }
        if (/^h[1-6]$/.test(node.tagName ?? "")) {
          const slug = textContent(node).toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-")
          const count = headingCounts.get(slug) ?? 0
          headingCounts.set(slug, count + 1)
          properties.id = `ch-${chapter.slug}-${slug}${count ? `-${count}` : ""}`
        }
        if (node.tagName === "details") properties.open = true
        if (node.tagName === "a") {
          const key = String(properties.dataReferenceKey ?? "")
          if (key && citations.has(key)) {
            const number = citations.get(key)!
            properties.href = `#ref-${chapter.slug}-${number}`
            properties.className = ["book-citation"]
            // A word joiner keeps the citation on the same line as the word it follows.
            node.children = [text(`\u2060[${number}]`)]
          } else {
            const href = String(properties.href ?? "")
            const learn = /^(?:https:\/\/leetllm\.com)?\/learn\/([^/#?]+)(?:#([^?]+))?/.exec(href)
            const number = learn ? options.chapterNumbers?.get(learn[1]) : undefined
            const online = learn && new URL(href, "https://leetllm.com").searchParams.get("view") === "online"
            if (learn && number && !online) {
              // The merger resolves selected public lesson URLs to book pages.
              // Proof PDFs retain a working URL when the target is in another part.
              properties.href = `https://leetllm.com/learn/${learn[1]}${learn[2] ? `#${learn[2]}` : ""}`
              node.children?.push(text(` (Chapter ${number})`))
            } else if (href.startsWith("/")) properties.href = `https://leetllm.com${href}`
            else if (href.startsWith("#")) properties.href = `#ch-${chapter.slug}-${href.slice(1)}`
          }
          delete properties.target
          delete properties.dataReferenceTitle
          delete properties.dataReferenceUrl
        }
        normalize(node, insideFigure || node.tagName === "figure")
      }
    }
    normalize(tree)
  }
}

function listingMetadata() {
  return (tree: HtmlNode & { lang?: string; meta?: string; data?: { hProperties: Record<string, unknown> } }) => {
    function walk(node: typeof tree) {
      // Remove only sections made empty by print filtering. A substantive
      // "Next steps" section is retained, and fenced examples are untouched.
      if (node.children) {
        node.children = node.children.filter((child, index, children) => {
          if (child.type !== "heading") return true
          if (index === 0 && (child as typeof tree & { depth?: number }).depth === 1) return false
          const next = children.slice(index + 1).find((item) => item.type !== "html" || !/^\s*<!--/.test(item.value ?? ""))
          return next !== undefined && (next.type !== "heading" || (next.depth ?? 0) > (child.depth ?? 0))
        })
      }
      if (node.type === "code") {
        const title = /\btitle="([^"]+)"/.exec(node.meta ?? "")?.[1]
        node.data = { hProperties: { dataCodeBlock: true, dataCodeTitle: title, dataCodeOutput: /\boutput\b/.test(node.meta ?? "") } }
      }
      node.children?.forEach((child) => walk(child as typeof tree))
    }
    walk(tree)
  }
}

const TRIVIAL_OUTPUT_RE = /^(?:ok|true|passed|pass|done|all checks? pass(?:ed)?|all assertions? pass(?:ed)?|checks? pass(?:ed)?|verified|success)!?\.?$/i

function createPrintComponents(chapterNumber: number, renderMarkdown: (markdown: string, inline?: boolean) => React.ReactNode): Components {
  let checkpointCount = 0
  const seenPythonImports = new Set<string>()
  return {
    pre: ({ children }) => <>{children}</>,
    code({ node, className, children }) {
      const attributes = node?.properties ?? {}
      const isBlock = attributes.dataCodeBlock || Boolean(className) || String(children).includes("\n")
      if (!isBlock) return <code className="inline-code">{children}</code>
      const language = /language-([^\s]+)/.exec(className ?? "")?.[1] ?? ""
      const rawSource = String(children).replace(/\n$/, "")
      if (language === "mermaid") throw new Error(`Unrendered Mermaid diagram in chapter ${chapterNumber}. Build the chapter diagrams before printing.`)
      if (language === "checkpoint") {
        const separator = /^\s*---+\s*$/m.exec(rawSource)
        if (!separator) throw new Error(`Malformed checkpoint in chapter ${chapterNumber}: missing question/answer separator`)
        const question = rawSource.slice(0, separator.index).trim()
        const answer = rawSource.slice(separator.index + separator[0].length).trim()
        if (!question || !answer) throw new Error(`Malformed checkpoint in chapter ${chapterNumber}: empty question or answer`)
        checkpointCount++
        return <aside className={`book-checkpoint${rawSource.length > 1400 ? " checkpoint-long" : ""}`}>
          <div className="checkpoint-header">Checkpoint {chapterNumber}.{checkpointCount}</div>
          <div className="checkpoint-qa-row checkpoint-question-row"><div className="checkpoint-qa-label">Q</div><div className="checkpoint-qa-text">{renderMarkdown(question)}</div></div>
          <div className="checkpoint-qa-row checkpoint-answer-row"><div className="checkpoint-qa-label">A</div><div className="checkpoint-qa-text">{renderMarkdown(answer)}</div></div>
        </aside>
      }
      // Reader-edition listings carry a "Reader" prefix in their source. The reader does not need it.
      const rawTitle = String(attributes.dataCodeTitle ?? "").replace(/^reader[\s-]+/i, "")
      // A file name keeps its case, because that is how the reader would type it.
      const title = /^\S+\.[a-z0-9]+$/i.test(rawTitle) ? rawTitle : rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1)
      const output = (attributes.dataCodeOutput !== undefined && attributes.dataCodeOutput !== false)
        || ["console", "output"].includes(language)
        || (language === "text" && /\b(?:output|results?)\b/i.test(title))

      let source: string
      if (output) {
        source = rawSource.trim()
        // Omit trivial single-line assertion-only confirmations in print so outputs stay high-signal.
        if (!source || (!source.includes("\n") && TRIVIAL_OUTPUT_RE.test(source))) return null
      } else {
        const prepared = prepareCodeForPrint(rawSource, language, seenPythonImports)
        for (const imp of prepared.imports) seenPythonImports.add(imp)
        source = prepared.code
      }

      const lines = source.split("\n")
      const numbered = !output && language !== "text"
      // Longer listings may cross a page, because holding them together leaves large gaps.
      const long = lines.length > 10
      const keepWithNext = new Set<number>()
      if (language === "python") {
        for (const [index, line] of lines.entries()) {
          if (/:\s*(?:#.*)?$/.test(line)) keepWithNext.add(index + 1)
          if (!/^\s*(?:(?:async\s+)?def|class)\b/.test(line)) continue
          for (let cursor = index; cursor < Math.min(lines.length, index + 6); cursor++) {
            if (cursor > index && lines[cursor].trim() && !/^\s/.test(lines[cursor])) break
            keepWithNext.add(cursor + 1)
            if (/:\s*(?:#.*)?$/.test(lines[cursor])) break
          }
        }
      }
      const headerLabel = title || (output ? "Output" : "")
      return <div className={`code-listing${long ? " code-listing-long" : ""}${output ? " code-output" : ""}`}>
        {headerLabel ? <div className="code-header">{headerLabel}</div> : null}
        <SyntaxHighlighter language={resolvePrismLanguage(language) || "text"} style={BOOK_CODE_THEME}
          showLineNumbers={numbered} wrapLines wrapLongLines
          customStyle={{ margin: 0, padding: headerLabel ? "3pt 8pt 6pt" : "5.5pt 8pt 6pt", fontSize: "7.8pt", lineHeight: "11.35pt", background: "transparent", border: "none", borderRadius: 0, fontFamily: '"JetBrains Mono", Menlo, Consolas, monospace', whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
          lineNumberStyle={{ minWidth: "2.2em", paddingRight: "0.85em", color: "#b5b2a8", textAlign: "right", textIndent: 0, userSelect: "none", fontStyle: "normal" }}
          lineProps={(lineNumber) => ({ style: { display: "block", breakInside: "avoid", breakAfter: keepWithNext.has(lineNumber) ? "avoid-page" : undefined, overflowWrap: "anywhere", paddingLeft: numbered ? "2.2em" : 0, textIndent: numbered ? "-2.2em" : 0 } })}
        >{source}</SyntaxHighlighter>
      </div>
    },
    img({ src, alt, style }) {
      const source = String(src ?? "")
      const { widthPt, shrink } = imageSizing(source)
      const sizing = style ?? (widthPt ? { width: `${widthPt}pt` } : undefined)
      return <img src={imageData(source)} alt={alt ?? ""} style={sizing} data-shrink={shrink} />
    },
    figcaption({ children }) {
      return <figcaption>{React.Children.map(children, (child) => typeof child === "string"
        ? <>{/^\s/.test(child) ? " " : ""}{renderMarkdown(child.trim().replace(/\n[ \t]+/g, "\n"), true)}{/\s$/.test(child) ? " " : ""}</>
        : child)}</figcaption>
    },
    div({ node, children, ...props }) {
      const variant = String(node?.properties?.dataCallout ?? "")
      if (!variant) return <div {...props}>{children}</div>
      const title = String(node?.properties?.dataCalloutTitle ?? ({ warning: "Warning", tip: "Tip", danger: "Production pitfall" }[variant] ?? "Note"))
      return <aside className={`callout callout-${variant}`}><div className="callout-header">{title}</div><div className="callout-body">{children}</div></aside>
    },
  }
}

export function renderChapter(q: Question, chapterNumber: number, options: ChapterRenderOptions = {}): string {
  const markdown = options.cleanWebContent === false ? q.content : cleanContentForBook(q.content)
  const citations = new Map<string, number>()
  for (const match of markdown.matchAll(/data-reference-key="([^"]+)"/g)) {
    if (!q.references[match[1]]) throw new Error(`Missing reference ${match[1]} in book chapter ${q.slug}`)
    if (!citations.has(match[1])) citations.set(match[1], citations.size + 1)
  }
  const htmlPlugin = bookHtml(q, chapterNumber, options, citations)
  const renderMarkdown = (content: string, inline = false): React.ReactNode => <ReactMarkdown
    remarkPlugins={[remarkGfm, remarkMath, listingMetadata]}
    rehypePlugins={inline ? [rehypeKatex, htmlPlugin] : [rehypeRaw, rehypeKatex, htmlPlugin]}
    components={inline ? { ...components, p: ({ children }) => <>{children}</> } : components} urlTransform={(url) => url}
  >{content}</ReactMarkdown>
  const components = createPrintComponents(chapterNumber, renderMarkdown)
  const bodyHtml = ReactDOMServer.renderToStaticMarkup(renderMarkdown(markdown))
  const sources = Array.from(citations, ([key, number]) => {
    const ref = q.references[key]
    const titleMarkup = ref.url ? `<a href="${escapeHtml(ref.url)}">${citedTitle(ref.title)}</a>` : citedTitle(ref.title)
    return `<li id="ref-${escapeHtml(q.slug)}-${number}" value="${number}">${escapeHtml(ref.authors)} (${ref.year}). ${titleMarkup}${ref.venue ? ` ${escapeHtml(ref.venue)}.` : ""}</li>`
  }).join("\n")
  const introduction = options.introduction
  const chapterLabelNum = String(chapterNumber).padStart(2, "0")
  const header = `<header class="chapter-header"><div class="chapter-kicker-row"><div class="chapter-numeral" aria-hidden="true">${chapterLabelNum}</div><div class="chapter-number-label">Chapter ${chapterNumber}</div></div>
    <h1 class="chapter-title">${escapeHtml(q.title)}</h1>
    ${!introduction && q.shortDescription ? `<p class="chapter-summary">${escapeHtml(q.shortDescription)}</p>` : ""}
  </header>`
  const introductionHtml = introduction ? [
    introduction.framing ? `<h2 class="introduction-framing">${escapeHtml(introduction.framing)}</h2>` : "",
    ...introduction.paragraphs.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`),
    introduction.outcomes?.length ? `<div class="introduction-outcomes"><h3>What you will be able to do</h3>
        <ul>${introduction.outcomes.map(outcome => `<li>${escapeHtml(outcome)}</li>`).join("\n")}</ul>
      </div>` : "",
    introduction.question ? `<aside class="introduction-question"><h3>Key question</h3><p>${escapeHtml(introduction.question)}</p></aside>` : "",
  ].filter(Boolean).join("\n") : ""
  const opening = introductionHtml ? `<div class="chapter-opening">${header}
    <section class="chapter-introduction" aria-label="Chapter introduction">${introductionHtml}</section>
  </div>` : header
  // Chromium records a PDF destination only for link targets, and the merger reads
  // those destinations to learn which section each page belongs to.
  const anchors = chapterSections(bodyHtml).map((section) => `<a href="#${escapeHtml(section.id)}"></a>`).join("")
  return `<article class="chapter" id="ch-${escapeHtml(q.slug)}">
    <nav class="pdf-anchors" aria-hidden="true">${anchors}</nav>
    ${opening}<div class="chapter-content">${bodyHtml}</div>
    ${sources ? `<section class="chapter-references"><h2>Sources and further reading</h2><ol>${sources}</ol></section>` : ""}
  </article>`
}

export interface ChapterSection {
  id: string
  title: string
}

function texToPlainHeading(tex: string): string {
  return tex
    .replace(/\\sqrt\{([^}]+)\}/g, "√$1")
    .replace(/\\bar\{([^}]+)\}/g, "$1\u0304")
    .replace(/\\times\b/g, "×")
    .replace(/\\le\b/g, "≤")
    .replace(/\\ge\b/g, "≥")
    .replace(/\\neq\b/g, "≠")
    .replace(/\\(?:text|mathrm|mathbf)\{([^}]+)\}/g, "$1")
    .replace(/([_^])\{([^}]+)\}/g, "$1$2")
    .replace(/[{}]/g, "")
    .trim()
}

function stripKatexForHeading(fragment: string): string {
  let result = ""
  let cursor = 0
  const marker = '<span class="katex">'
  while (cursor < fragment.length) {
    const start = fragment.indexOf(marker, cursor)
    if (start < 0) {
      result += fragment.slice(cursor)
      break
    }
    result += fragment.slice(cursor, start)
    let depth = 0
    let pos = start
    const tagRe = /<\/?span\b[^>]*>/g
    tagRe.lastIndex = start
    let match: RegExpExecArray | null
    while ((match = tagRe.exec(fragment))) {
      depth += match[0].startsWith("</") ? -1 : 1
      pos = tagRe.lastIndex
      if (depth === 0) break
    }
    const block = fragment.slice(start, pos)
    const tex = /<annotation[^>]*encoding="application\/x-tex"[^>]*>([\s\S]*?)<\/annotation>/.exec(block)?.[1]
    result += tex ? texToPlainHeading(tex) : block.replace(/<span class="katex-mathml">[\s\S]*?<\/span>/g, "")
    cursor = pos
  }
  return result
}

/** Top-level sections of a rendered chapter, which become running heads. */
export function chapterSections(html: string): ChapterSection[] {
  return Array.from(html.matchAll(/<h2 id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g), (match) => ({
    id: match[1],
    title: stripKatexForHeading(match[2])
      .replace(/<[^>]+>/g, "")
      .replace(/\u200b/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&#x27;|&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim(),
  })).filter((section) => section.title)
}

function svgImage(svg: string, alt = ""): string {
  return `<img src="data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}" alt="${escapeHtml(alt)}" />`
}

export function renderPartDivider(partNumber: number, title: string, description: string | string[], chapters: Array<{ chapterNumber: number; title: string; slug: string }> = [], art?: string): string {
  const paragraphs = Array.isArray(description) ? description : [description]
  const chapterMap = chapters.length ? `<nav class="part-chapter-map${chapters.length <= 4 ? " part-chapter-map-short" : ""}" aria-label="Chapters in Part ${partNumber}"><h2>In this part</h2><ol>${chapters.map(chapter => `<li><a href="https://leetllm.com/learn/${escapeHtml(chapter.slug)}"><span class="part-chapter-number">${chapter.chapterNumber}</span><span>${escapeHtml(chapter.title)}</span></a></li>`).join("\n")}</ol></nav>` : ""
  const artwork = art ? `<div class="part-art">${svgImage(art)}</div>` : ""
  return `<section class="part-divider${chapters.length ? " part-opening" : ""}" id="part-${partNumber}"><div class="part-number">Part ${partNumber}</div><h1 class="part-title">${escapeHtml(title)}</h1><div class="part-description">${paragraphs.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join("\n")}</div>${chapterMap}${artwork}</section>`
}

export function renderCoverPage(config: BookConfig, art?: string): string {
  if (config.coverTitleLines && config.coverTitleLines.join(" ") !== config.title) {
    throw new Error("Cover title lines must preserve the complete book title.")
  }
  const title = config.coverTitleLines
    ? config.coverTitleLines.map(line => `<span class="cover-title-line">${escapeHtml(line)}</span>`).join(" ")
    : escapeHtml(config.title)
  const artwork = art ? `<img class="cover-art" src="data:image/svg+xml;base64,${Buffer.from(art).toString("base64")}" alt="An arc diagram of attention weights over the sentences that open the book" />` : ""
  return `<div class="book-cover">${artwork}<div class="cover-top"><div class="cover-kicker">${escapeHtml(config.publisher)}</div><h1 class="cover-title">${title}</h1><p class="cover-subtitle">${escapeHtml(config.subtitle)}</p></div><div class="cover-foot"><span class="cover-author">${escapeHtml(config.author)}</span><span class="cover-edition">${escapeHtml(config.edition)}</span></div></div>`
}

export function renderCopyrightPage(config: BookConfig): string {
  return `<div class="title-page"><h1>${escapeHtml(config.title)}</h1><p class="title-subtitle">${escapeHtml(config.subtitle)}</p><p class="title-author">${escapeHtml(config.author)}</p><p class="title-publisher">${escapeHtml(config.publisher)}</p></div>
  <div class="copyright-page"><p class="edition-note"><strong>${escapeHtml(config.title)}</strong><br>by ${escapeHtml(config.author)}</p><p>${escapeHtml(config.copyright)}</p><p>${escapeHtml(config.publisher)}<br>${escapeHtml(config.edition)}</p><p>The companion curriculum and runnable materials are at leetllm.com.</p><p>Product names and trademarks belong to their respective owners. Each chapter lists the research and documentation it cites.</p><p>Set in Source Serif 4, Inter, and JetBrains Mono. The figures and cover art were drawn with Vizmatic.</p></div>`
}

/** How to read the book, then the note that replaces disclaimers in each chapter. */
export function renderFrontEssays(config: BookConfig, parts: Array<{ partNumber: number; title: string }> = []): string {
  const hasFoundations = parts.some((part) => part.partNumber === 0)
  const start = hasFoundations
    ? "You do not need a machine-learning background. You need to be able to read code and to be curious about why a system behaves the way it does. Part 0 builds the mathematics and the model intuition that the rest of the book uses, so start there unless you already train neural networks for a living."
    : "You should be able to read Python and be comfortable with tensor shapes, gradients, and basic probability. The online curriculum covers those foundations if you want a refresher."
  const partList = parts.length ? `<ul class="part-list">${parts.map((part) => `<li><strong>Part ${part.partNumber}.</strong> ${escapeHtml(part.title)}</li>`).join("")}</ul>` : ""
  return `<section class="front-essay how-to-read"><h1>How to read this book</h1>
  <p>This book takes you from no machine-learning background to running language-model systems in production. By the end you will know how a model turns text into an answer, how to ground that answer in your own data, how to adapt a model, how to give it tools without losing control of it, and how to serve it to real users at a cost you can defend.</p>
  <h2>Where to start</h2><p>${start}</p>
  <h2>The path</h2>${partList}<p>Each part builds on the last. If you already know a part, skim its opening page and move on. Later chapters point back to the earlier ones they rely on.</p>
  <h2>Read with a keyboard nearby</h2><p>Run the examples as you read, then change an input and explain the result. Printed listings focus on the core algorithm and condense repetitive setup scaffolding; every complete runnable script, output check, and interactive visualization lives at leetllm.com. Work through a small calculation on paper whenever the code moves too quickly.</p>
  <h2>Stop at the checkpoints</h2><p>When you reach a checkpoint, cover the answer and work it out. Answering a question, even wrongly, teaches you more than rereading the explanation does.</p>
  <h2>Go further online</h2><p>The companion platform at leetllm.com includes interactive mastery quizzes, animated visualizations, coding drills, and additional deep dives on production codebases. Software versions, hardware, and pricing change quickly, so check current documentation before acting on version-specific details.</p></section>
  <section class="front-essay about-numbers"><h1>About the numbers</h1>
  <p>This book teaches with small examples that you can check by hand. We choose token IDs, embedding weights, and datasets that make the computation easy to follow. You can change those inputs and use the same method to work out the result.</p>
  <p>Published measurements have citations, and recorded model runs include their inputs and outputs. The references at the end of each chapter lead to the underlying research and documentation. Assumptions appear where they help explain a calculation or guide a practical decision.</p></section>`
}

export function renderTableOfContents(tocParts: TocPartEntry[], backMatter: Array<{ title: string; pageNumber?: number }> = []): string {
  const back = backMatter.map((entry) => `<div class="toc-chapter-entry toc-matter-entry"><span class="toc-chapter-title">${escapeHtml(entry.title)}</span><span class="toc-leader-dots"></span><span class="toc-page-num">${entry.pageNumber ?? ""}</span></div>`).join("")
  return `<nav class="toc-container" aria-label="Contents"><h1 class="toc-title">Contents</h1>${tocParts.map((part) => `<div class="toc-part-group"><div class="toc-part-entry"><span class="toc-part-title">Part ${part.partNumber}. ${escapeHtml(part.title)}</span><span class="toc-page-num">${part.pageNumber ?? ""}</span></div>${part.chapters.map((ch) => `<div class="toc-chapter-entry"><span class="toc-chapter-number">${ch.chapterNumber}</span>${ch.slug ? `<a class="toc-chapter-title" href="https://leetllm.com/learn/${escapeHtml(ch.slug)}">${escapeHtml(ch.title)}</a>` : `<span class="toc-chapter-title">${escapeHtml(ch.title)}</span>`}<span class="toc-leader-dots"></span><span class="toc-page-num">${ch.pageNumber ?? ""}</span></div>`).join("")}</div>`).join("")}${back}</nav>`
}

export interface BibliographyEntry {
  authors: string
  year: string | number
  title: string
  venue?: string
  url: string
}

/** Sources cited by a chapter, in the order the chapter's reference list uses. */
export function citedReferences(q: Question): BibliographyEntry[] {
  const seen = new Set<string>()
  const entries: BibliographyEntry[] = []
  for (const match of cleanContentForBook(q.content).matchAll(/data-reference-key="([^"]+)"/g)) {
    if (seen.has(match[1])) continue
    seen.add(match[1])
    const reference = q.references[match[1]]
    if (reference) entries.push({ authors: reference.authors, year: reference.year, title: reference.title, venue: reference.venue, url: reference.url })
  }
  return entries
}

/** Every source in the book once, ordered by author. */
/** A cited title ends with one mark. Many source titles already end with a period. */
function citedTitle(title: string): string {
  const clean = title.trim().replace(/\.+$/, "")
  return `<cite>${escapeHtml(clean)}</cite>${/[?!]$/.test(clean) ? "" : "."}`
}

export function renderBibliography(entries: readonly BibliographyEntry[]): string {
  const unique = new Map<string, BibliographyEntry>()
  // Two sources can share a title, and one source can be cited under two keys, so the address decides.
  for (const entry of entries) unique.set(entry.url ? entry.url.toLowerCase().replace(/\/+$/, "") : entry.title.toLowerCase().replace(/\W+/g, " ").trim(), entry)
  const sorted = [...unique.values()].sort((a, b) => a.authors.localeCompare(b.authors, "en") || String(a.year).localeCompare(String(b.year)))
  return `<section class="back-matter bibliography" id="bibliography"><h1>Bibliography</h1><ol>${sorted.map((entry) => `<li>${escapeHtml(entry.authors)} (${escapeHtml(String(entry.year))}). ${citedTitle(entry.title)}${entry.venue ? ` ${escapeHtml(entry.venue)}.` : ""} <a href="${escapeHtml(entry.url)}">${escapeHtml(entry.url)}</a></li>`).join("\n")}</ol></section>`
}

export interface IndexEntry {
  title: string
  pages?: number[]
  /** The page that defines the term. It prints in bold. */
  defined?: number[]
  see?: string
  seeAlso?: string[]
  sub?: Array<{ title: string; pages: number[] }>
}

/** Consecutive pages read as ranges: 12, 14-16, 40. A defined page stands alone in bold. */
export function formatPageList(pages: readonly number[], defined: readonly number[] = []): string {
  const sorted = [...new Set(pages)].sort((a, b) => a - b)
  const bold = new Set(defined)
  const parts: string[] = []
  for (let start = 0; start < sorted.length;) {
    if (bold.has(sorted[start])) {
      parts.push(`<strong>${sorted[start]}</strong>`)
      start++
      continue
    }
    let end = start
    while (end + 1 < sorted.length && sorted[end + 1] === sorted[end] + 1 && !bold.has(sorted[end + 1])) end++
    parts.push(end === start ? String(sorted[start]) : `${sorted[start]}-${sorted[end]}`)
    start = end + 1
  }
  return parts.join(", ")
}

export function renderIndex(entries: readonly IndexEntry[]): string {
  const sorted = [...entries].sort((a, b) => a.title.localeCompare(b.title, "en", { sensitivity: "base" }))
  let letter = ""
  const body = sorted.map((entry) => {
    const initial = /^[a-z]/i.test(entry.title) ? entry.title[0].toUpperCase() : "#"
    const heading = initial === letter ? "" : `<div class="index-letter">${initial}</div>`
    letter = initial
    const title = escapeHtml(entry.title)
    if (entry.see) return `${heading}<div class="index-group"><div class="index-entry">${title}. <em>See</em> ${escapeHtml(entry.see)}</div></div>`
    const pages = `<span class="index-pages">${formatPageList(entry.pages ?? [], entry.defined)}</span>`
    const sub = (entry.sub ?? []).map((item) => `<div class="index-sub">${escapeHtml(item.title)}, <span class="index-pages">${formatPageList(item.pages)}</span></div>`).join("")
    const seeAlso = entry.seeAlso?.length ? `<div class="index-sub"><em>See also</em> ${entry.seeAlso.map(escapeHtml).join("; ")}</div>` : ""
    return `${heading}<div class="index-group"><div class="index-entry">${title}, ${pages}</div>${sub}${seeAlso}</div>`
  }).join("")
  return `<section class="back-matter book-index" id="index"><h1>Index</h1><p class="index-note">A page in bold defines the term.</p><div class="index-columns">${body}</div></section>`
}
