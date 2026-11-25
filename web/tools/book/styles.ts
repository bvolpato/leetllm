import { FONT_FALLBACKS } from "./fonts"
export interface BookTrim {
  /** CSS page size. */
  size: string
  widthIn: number
  heightIn: number
  /** Margins in inches. Inner is the spine side. */
  top: number
  bottom: number
  inner: number
  outer: number
}

/** The reader's edition uses a standard technical-book trim, not a letter-size sheet. */
const TRIMS: Record<string, BookTrim> = {
  "7.5x9.25in": { size: "7.5in 9.25in", widthIn: 7.5, heightIn: 9.25, top: 0.92, bottom: 0.82, inner: 1, outer: 0.85 },
  letter: { size: "8.5in 11in", widthIn: 8.5, heightIn: 11, top: 1, bottom: 0.95, inner: 1.2, outer: 1.1 },
  a4: { size: "210mm 297mm", widthIn: 8.27, heightIn: 11.69, top: 1, bottom: 1, inner: 1.15, outer: 1 },
}

export function bookTrim(trimSize = "7.5x9.25in"): BookTrim {
  const trim = TRIMS[trimSize.toLowerCase()]
  if (!trim) throw new Error(`Unsupported book trim size: ${trimSize}. Use one of: ${Object.keys(TRIMS).join(", ")}.`)
  return trim
}

/** Text block size in CSS pixels, which the reflow pass uses to predict page breaks. */
export function textBlockPixels(trimSize?: string): { width: number; height: number } {
  const trim = bookTrim(trimSize)
  return { width: (trim.widthIn - trim.inner - trim.outer) * 96, height: (trim.heightIn - trim.top - trim.bottom) * 96 }
}

const ACCENT = "#0f4c5c"
const GOLD = "#b07d24"
const INK = "#14191f"
const SOFT = "#495057"
const FAINT = "#767d85"
const RULE = "#d4d2c9"
const TINT = "#f8f7f2"

const SERIF = `"Source Serif 4", Inter, ${FONT_FALLBACKS}, serif`
const DISPLAY = `"Source Serif 4 Display", "Source Serif 4", Inter, ${FONT_FALLBACKS}, serif`
const SANS = `Inter, ${FONT_FALLBACKS}, sans-serif`
const MONO = `"JetBrains Mono", Inter, ${FONT_FALLBACKS}, monospace`

/** Print layout shared by chapter proofs and the assembled book. */
export function getBookStylesheet(trimSize?: string): string {
  const trim = bookTrim(trimSize)
  const blockHeight = trim.heightIn - trim.top - trim.bottom
  return `
    @page { size: ${trim.size}; margin: ${trim.top}in ${trim.outer}in ${trim.bottom}in ${trim.inner}in; }
    @page :left { margin-left: ${trim.outer}in; margin-right: ${trim.inner}in; }
    @page :right { margin-left: ${trim.inner}in; margin-right: ${trim.outer}in; }
    :root { --block-height: ${blockHeight}in; --page-width: ${trim.widthIn}in; --page-height: ${trim.heightIn}in; }
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; font: 10.5pt/14.75pt ${SERIF}; color: ${INK}; background: white; text-rendering: geometricPrecision; font-kerning: normal; font-feature-settings: "liga", "kern", "onum" 0; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    p { margin: 0 0 7.5pt; text-align: justify; text-wrap: pretty; hyphens: auto; hyphenate-limit-chars: 6 3 2; orphans: 2; widows: 2; }
    h1, h2, h3, h4, h5, h6 { color: ${INK}; hyphens: none; text-align: left; break-after: avoid; break-inside: avoid; }
    h1 { font: 300 25pt/29pt ${DISPLAY}; margin: 0 0 14.5pt; }
    h2 { font: 400 16pt/20.5pt ${DISPLAY}; margin: 22pt 0 7.5pt; letter-spacing: -0.005em; color: ${INK}; }
    h3 { font: 600 10.75pt/14.5pt ${SANS}; margin: 14.5pt 0 4pt; letter-spacing: -0.006em; color: ${ACCENT}; }
    h4, h5, h6 { font: 600 9.5pt/14pt ${SANS}; margin: 10.9pt 0 3.6pt; color: ${SOFT}; }
    a { color: inherit; text-decoration: none; overflow-wrap: anywhere; }
    p a[href^="http"], li a[href^="http"] { color: ${ACCENT}; }
    strong { font-weight: 600; color: ${INK}; }
    hr { border: 0; border-top: 0.5pt solid ${RULE}; margin: 14.5pt 0; }
    blockquote { margin: 11pt 0 11pt 0.4em; padding: 5.5pt 10pt 5.5pt 11pt; border-left: 2pt solid ${ACCENT}; background: ${TINT}; border-radius: 0 2.5pt 2.5pt 0; color: ${INK}; }
    blockquote > p:last-child { margin-bottom: 0; }
    ul, ol { margin: 0 0 7.5pt; padding-left: 1.35em; }
    li { margin: 0 0 3.6pt; orphans: 2; widows: 2; hyphens: auto; }
    li > p { margin-bottom: 3.6pt; }
    li::marker { color: ${ACCENT}; font-feature-settings: "tnum"; }

    /* Part openers */
    .part-divider { break-before: right; height: var(--block-height); display: flex; flex-direction: column; }
    .part-number { font: 600 8.25pt/12pt ${SANS}; color: ${GOLD}; text-transform: uppercase; letter-spacing: 0.2em; margin: 12mm 0 3.5mm; padding-top: 3.5mm; border-top: 2pt solid ${ACCENT}; display: inline-block; align-self: flex-start; min-width: 24mm; }
    .part-title { font: 300 32pt/36pt ${DISPLAY}; letter-spacing: -0.014em; margin: 0 0 7mm; color: ${INK}; }
    .part-description { font-size: 10.5pt; line-height: 15pt; color: ${SOFT}; }
    .part-description p { margin-bottom: 7.5pt; text-align: left; hyphens: none; }
    .part-chapter-map { margin-top: 4mm; break-inside: avoid; }
    .part-chapter-map h2 { display: none; }
    .part-chapter-map ol { list-style: none; padding: 0; margin: 0; border-top: 0.75pt solid ${ACCENT}; }
    .part-chapter-map li { margin: 0; font: 400 8.75pt/12.5pt ${SANS}; border-bottom: 0.45pt solid ${RULE}; padding: 3.5pt 0; break-inside: avoid; }
    .part-chapter-map a { display: flex; gap: 0.9em; overflow-wrap: normal; color: ${INK} !important; }
    .part-chapter-number { flex: 0 0 1.7em; text-align: right; color: ${GOLD}; font-weight: 600; font-feature-settings: "tnum"; }
    /* The art takes whatever height the words leave, so that it never jumps to a page of its own. */
    .part-art { position: relative; flex: 1 1 0; min-height: 0; margin-top: 6mm; }
    .part-art img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; object-position: center bottom; }

    /* Chapter openers */
    .chapter { break-before: page; }
    .recto-pad { break-before: page; height: 1px; }
    /* Paragraphs split across pages, with widow and orphan control, as in any typeset book. Keeping short ones whole left large gaps. */
    .chapter-content > p:last-child:has(a[href*="view=online"]) { break-before: avoid; }
    .chapter-header { break-inside: avoid; margin: 0 0 5.5mm; padding-top: 3mm; }
    .chapter-kicker-row { display: flex; flex-direction: column; align-items: flex-start; border-bottom: 1.25pt solid ${ACCENT}; padding-bottom: 2.5mm; margin-bottom: 4.5mm; }
    .chapter-numeral { font: 300 32pt/30pt ${DISPLAY}; color: ${GOLD}; letter-spacing: -0.02em; font-feature-settings: "tnum"; margin-bottom: 1.5mm; }
    .chapter-number-label { font: 600 7.75pt/10.5pt ${SANS}; letter-spacing: 0.22em; text-transform: uppercase; color: ${ACCENT}; }
    .chapter-title { font: 300 28.5pt/32.5pt ${DISPLAY}; letter-spacing: -0.014em; margin: 0; color: ${INK}; }
    .chapter-summary { margin: 3.5mm 0 0; font: italic 300 13pt/17.5pt ${DISPLAY}; color: ${SOFT}; text-align: left; hyphens: none; }
    .chapter-opening { margin-bottom: 6mm; }
    .introduction-framing { margin: -1.5mm 0 3.5mm; font: italic 300 13.5pt/18pt ${DISPLAY}; color: ${SOFT}; }
    .chapter-introduction > p { margin-bottom: 5.5pt; }
    .introduction-outcomes { margin-top: 3mm; padding-top: 2.5mm; border-top: 0.5pt solid ${RULE}; break-inside: avoid; }
    .introduction-outcomes h3, .introduction-question h3 { margin: 0 0 1.5mm; font: 600 7pt/10pt ${SANS}; color: ${GOLD}; letter-spacing: 0.12em; text-transform: uppercase; }
    .introduction-outcomes ul { margin: 0; }
    .introduction-outcomes li { margin-bottom: 2.4pt; font: 400 8.75pt/12.5pt ${SANS}; color: ${INK}; hyphens: none; }
    .introduction-question { margin-top: 3mm; padding: 6.5pt 10pt 7pt 11pt; background: ${TINT}; border-left: 2pt solid ${GOLD}; border-radius: 0 2.5pt 2.5pt 0; break-inside: avoid; }
    .introduction-question p { margin-bottom: 0; font-size: 9.75pt; line-height: 14pt; font-style: italic; text-align: left; hyphens: none; color: ${INK}; }

    /* Code */
    pre, code { font-family: ${MONO}; font-variant-ligatures: none; }
    .inline-code { font-size: 0.83em; overflow-wrap: anywhere; hyphens: none; background: #f3f2ec; padding: 0.5pt 2.5pt; border-radius: 2pt; color: #1b313a; }
    .code-listing { margin: 10.5pt 0 12pt; break-inside: avoid; background: ${TINT}; border-top: 0.45pt solid ${RULE}; border-bottom: 0.45pt solid ${RULE}; border-left: 2pt solid ${ACCENT}; border-radius: 0 2.5pt 2.5pt 0; }
    .code-listing-long { break-inside: auto; }
    p:has(+ .code-listing:not(.code-listing-long)):not(:has(+ .code-listing + .code-output)) { break-after: avoid; }
    .code-listing:has(+ .code-output) { margin-bottom: 0; border-bottom: 0; border-bottom-right-radius: 0; }
    .code-listing:not(.code-listing-long):has(+ .code-output) { break-after: avoid; }
    .code-listing:has(+ .code-output) + .code-output { margin-top: 0; border-top: 0.45pt dashed ${RULE}; border-top-right-radius: 0; }
    .code-header { font: 500 7pt/10pt ${MONO}; padding: 4.5pt 8pt 2pt; color: ${FAINT}; break-after: avoid; overflow-wrap: anywhere; letter-spacing: 0.01em; }
    .code-output .code-header { font-family: ${SANS}; font-weight: 600; font-size: 6.75pt; text-transform: uppercase; letter-spacing: 0.1em; color: ${FAINT}; }
    .code-listing pre { margin: 0 !important; border: 0 !important; border-radius: 0 !important; white-space: pre-wrap !important; overflow: visible !important; tab-size: 4; }
    .code-listing pre code { font-size: inherit !important; line-height: inherit !important; text-shadow: none !important; white-space: pre-wrap !important; overflow-wrap: anywhere; font-family: ${MONO} !important; font-variant-ligatures: none; }
    .code-listing-long pre > code > span:nth-child(-n+3) { break-after: avoid; }
    .code-listing-long pre > code > span:nth-last-child(-n+3) { break-before: avoid; }
    .code-listing .linenumber { color: #b5b2a8 !important; font-weight: 400; }
    .code-output { background: #ffffff; border-left: 2pt solid #c8c5ba; }

    /* Callouts and checkpoints */
    .callout { margin: 12pt 0; padding: 7pt 10pt 7pt 11pt; background: #f4f8f9; border-left: 2.25pt solid ${ACCENT}; border-radius: 0 2.5pt 2.5pt 0; break-inside: avoid; }
    .callout-header { font: 600 7.25pt/10.5pt ${SANS}; text-transform: uppercase; letter-spacing: 0.1em; color: ${ACCENT}; margin-bottom: 2.5pt; }
    .callout-body { font-size: 9.6pt; line-height: 13.75pt; }
    .callout-body p { text-align: left; }
    .callout-body > :last-child { margin-bottom: 0; }
    .callout-warning { background: #fcf8ef; border-left-color: ${GOLD}; }
    .callout-warning .callout-header { color: #8c6114; }
    .callout-danger, .callout-pitfall { background: #fdf4f3; border-left-color: #a33b33; }
    .callout-danger .callout-header, .callout-pitfall .callout-header { color: #8f2f28; }
    .callout-tip { background: #f3f8f5; border-left-color: #276a49; }
    .callout-tip .callout-header { color: #215b3e; }
    .book-checkpoint { margin: 14pt 0; padding: 8pt 10.5pt 4pt; background: ${TINT}; border-top: 1.5pt solid ${ACCENT}; border-bottom: 0.45pt solid ${RULE}; border-radius: 0 0 2.5pt 2.5pt; break-inside: avoid; }
    .checkpoint-long { break-inside: auto; }
    .checkpoint-header { font: 600 7.25pt/10.5pt ${SANS}; color: ${ACCENT}; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 5pt; break-after: avoid; }
    .checkpoint-qa-row { position: relative; padding-left: 1.75em; margin-bottom: 5pt; }
    .checkpoint-qa-label { position: absolute; left: 0; top: 1pt; width: 13pt; height: 13pt; line-height: 13pt; text-align: center; border-radius: 2pt; font: 600 7.5pt/13pt ${SANS}; background: ${ACCENT}; color: white; }
    .checkpoint-answer-row .checkpoint-qa-label { background: #dfe3e6; color: ${INK}; }
    .checkpoint-qa-text { font-size: 9.6pt; line-height: 13.75pt; }
    .checkpoint-qa-text p { text-align: left; margin-bottom: 4pt; }
    .checkpoint-question-row { break-inside: avoid; break-after: avoid; }
    .checkpoint-question-row .checkpoint-qa-text { font-weight: 600; color: ${INK}; }
    .checkpoint-qa-text > :last-child { margin-bottom: 0; }

    /* Figures. Each image carries its own measured width, so labels print at one size across the book. */
    figure.book-figure { margin: 13pt 0 15pt; padding: 0; border: 0; background: transparent; break-inside: avoid; text-align: center; }
    .book-figure img { display: block; margin: 0 auto; max-width: 100%; height: auto; max-height: ${(blockHeight - 1.05).toFixed(2)}in; object-fit: contain; border: 0; border-radius: 0; box-shadow: none; }
    figcaption { margin: 6pt 0 0; padding-top: 4pt; border-top: 0.35pt solid #e5e3db; font: 400 8pt/11.5pt ${SANS}; text-align: left; color: ${SOFT}; orphans: 2; widows: 2; hyphens: none; }
    .fig-num { font-weight: 600; color: ${ACCENT}; }

    /* Tables (Booktabs editorial style) */
    table { width: 100%; margin: 11.5pt 0 13pt; border-collapse: collapse; font: 400 8pt/11.5pt ${SANS}; font-feature-settings: "tnum"; border-top: 1pt solid ${INK}; border-bottom: 1pt solid ${INK}; break-inside: auto; hyphens: none; }
    table.table-compact { break-inside: avoid; }
    thead { display: table-header-group; background: ${TINT}; }
    tfoot { display: table-footer-group; }
    tr { break-inside: avoid; }
    tbody tr:first-child, tbody tr:nth-last-child(2) { break-after: avoid; }
    th { font-weight: 600; text-align: left; color: ${INK}; border-bottom: 0.6pt solid ${INK}; }
    td, th { padding: 3.6pt 7pt 3.6pt 4pt; vertical-align: top; overflow-wrap: break-word; }
    td:first-child, th:first-child { padding-left: 3pt; min-width: 4.5em; }
    td:last-child, th:last-child { padding-right: 3pt; }
    th { overflow-wrap: normal; word-break: normal; }
    td { border-bottom: 0.35pt solid #e3e1da; }
    tr:last-child td { border-bottom: 0; }
    th .inline-code, td .inline-code { font-size: 0.9em; background: transparent; padding: 0; }

    /* Math */
    .katex { font-size: 1.02em; }
    .katex-display { margin: 9pt 0 10.9pt !important; padding: 0; break-inside: avoid; overflow: visible; }
    p:has(+ .katex-display), p:has(+ p > .katex-display) { break-after: avoid; }
    .katex-display > .katex { white-space: normal; }

    /* Sources */
    .chapter-references { margin-top: 14.5pt; padding-top: 3mm; border-top: 0.5pt solid ${RULE}; }
    .chapter-references h2 { font: 600 7.75pt/11pt ${SANS}; text-transform: uppercase; letter-spacing: 0.08em; color: ${ACCENT}; margin: 0 0 2.5mm; break-after: avoid; }
    .chapter-references ol { columns: 2; column-gap: 6mm; font: 400 7.25pt/10pt ${SANS}; color: ${SOFT}; padding-left: 1.6em; margin: 0; }
    .chapter-references li { padding-left: 0.15em; margin-bottom: 2.2pt; overflow-wrap: anywhere; break-inside: avoid; hyphens: none; }
    .chapter-references cite { font-style: normal; color: ${INK}; }
    sup { line-height: 0; }
    sup:has(> .book-citation) { font-size: 1em; vertical-align: baseline; }
    .book-citation { color: ${ACCENT}; font: 400 0.72em/0 ${SANS}; vertical-align: 0.34em; margin-left: 0.04em; }
    details { margin: 10.9pt 0; }
    summary { font: 600 9.5pt/14.5pt ${SANS}; break-after: avoid; }

    /* Cover */
    .book-cover { position: relative; width: var(--page-width); height: var(--page-height); overflow: hidden; background: #0b0c10; color: #f2efe6; break-after: page; }
    .cover-art { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
    .cover-top { position: absolute; top: 0.72in; left: 0.72in; right: 0.72in; }
    .cover-kicker { font: 600 8pt/11pt ${SANS}; text-transform: uppercase; letter-spacing: 0.22em; color: #a5a7ad; }
    .cover-title { font: 300 45pt/48pt ${DISPLAY}; letter-spacing: -0.016em; margin: 0.32in 0 0; color: #f2efe6; }
    .cover-title-line { display: block; }
    .cover-title-line:first-child { color: #ffd75e; }
    .cover-title-line:last-child { font-style: italic; }
    .cover-subtitle { margin: 0.2in 0 0; max-width: 4.8in; font: 400 10.5pt/15pt ${SANS}; color: #c9c9c6; text-align: left; hyphens: none; text-wrap: balance; }
    .cover-foot { position: absolute; left: 0.72in; right: 0.72in; bottom: 0.56in; display: flex; justify-content: space-between; align-items: baseline; }
    .cover-author { font: 400 15pt/18pt ${DISPLAY}; color: #f2efe6; }
    .cover-edition { font: 400 7.75pt/11pt ${SANS}; color: #a5a7ad; }

    /* Front matter */
    .title-page { height: var(--block-height); break-after: page; display: flex; flex-direction: column; padding-top: 18mm; }
    .title-page h1 { font: 300 33pt/37pt ${DISPLAY}; letter-spacing: -0.012em; margin: 0; }
    .title-page .title-subtitle { margin: 5mm 0 0; font: italic 300 13.5pt/18pt ${DISPLAY}; color: ${SOFT}; text-align: left; hyphens: none; text-wrap: balance; }
    .title-page .title-author { margin: 14mm 0 0; font: 400 13pt/17pt ${DISPLAY}; }
    .title-page .title-publisher { margin: auto 0 0; font: 600 7.75pt/11pt ${SANS}; letter-spacing: 0.16em; text-transform: uppercase; color: ${ACCENT}; }
    .copyright-page { height: var(--block-height); display: flex; flex-direction: column; justify-content: flex-end; break-after: page; font: 400 7.75pt/11.5pt ${SANS}; color: ${SOFT}; }
    .copyright-page p { margin-bottom: 5pt; text-align: left; hyphens: none; }
    .copyright-page .edition-note { color: ${INK}; }
    .front-essay { break-before: right; }
    .front-essay h1 { font: 300 25pt/29pt ${DISPLAY}; letter-spacing: -0.01em; margin: 15mm 0 8mm; }
    .front-essay h2 { font: 600 10.75pt/14.5pt ${SANS}; letter-spacing: -0.006em; margin: 14.5pt 0 3.6pt; }
    .front-essay .part-list { list-style: none; padding: 0; margin: 0 0 7.25pt; }
    .front-essay .part-list li { margin-bottom: 4pt; }
    .front-essay .part-list strong { font-family: ${SANS}; font-size: 8.75pt; }

    /* Contents */
    .toc-container { break-before: right; }
    .toc-title { font: 300 26pt/30pt ${DISPLAY}; letter-spacing: -0.012em; margin: 4mm 0 5mm; color: ${INK}; }
    .toc-part-group { break-inside: avoid; }
    .toc-part-entry { display: flex; align-items: baseline; gap: 0.8em; margin: 10pt 0 3pt; padding-bottom: 2.5pt; border-bottom: 0.75pt solid ${ACCENT}; font: 600 8.5pt/12pt ${SANS}; color: ${ACCENT}; break-inside: avoid; break-after: avoid; }
    .toc-part-title { flex: 1; }
    .toc-chapter-entry { display: flex; align-items: baseline; gap: 0.45em; margin: 0 0 1.6pt; font: 400 8.4pt/12pt ${SANS}; break-inside: avoid; }
    .toc-chapter-number { flex: 0 0 1.7em; text-align: right; font-feature-settings: "tnum"; color: ${GOLD}; font-weight: 600; }
    .toc-chapter-title { flex: 0 1 auto; max-width: 84%; min-width: 0; color: ${INK}; overflow-wrap: normal; }
    .toc-leader-dots { flex: 1 1 1em; min-width: 1em; border-bottom: 0.75pt dotted #c5c4bc; margin: 0 3pt 2.4pt; }
    .toc-page-num { flex: 0 0 2.4em; text-align: right; font-feature-settings: "tnum"; color: ${SOFT}; }
    .toc-matter-entry { margin-top: 9pt; }
    .toc-matter-entry .toc-chapter-title { font-weight: 600; color: ${ACCENT}; }

    /* Back matter */
    .back-matter h1 { font: 300 25pt/29pt ${DISPLAY}; letter-spacing: -0.01em; margin: 15mm 0 8mm; }
    .bibliography ol { list-style: none; padding: 0; margin: 0; font: 400 8pt/11.25pt ${SANS}; color: ${SOFT}; }
    .bibliography li { margin: 0 0 4.5pt; padding-left: 1.2em; text-indent: -1.2em; overflow-wrap: anywhere; break-inside: avoid; hyphens: none; }
    .bibliography cite { font-style: normal; color: ${INK}; }
    .index-columns { columns: 2; column-gap: 7mm; font: 400 8pt/11pt ${SANS}; }
    .index-letter { font: 600 8pt/11pt ${SANS}; color: ${ACCENT}; margin: 7pt 0 2pt; break-after: avoid-column; }
    .index-note { font: 400 8pt/11pt ${SANS}; color: ${SOFT}; margin: 0 0 4pt; }
    .index-group { break-inside: avoid-column; margin: 0 0 1.2pt; }
    .index-entry { padding-left: 1em; text-indent: -1em; }
    .index-sub { padding-left: 2em; text-indent: -1em; color: ${SOFT}; }
    .index-pages strong { color: ${INK}; font-weight: 600; }
    .index-pages { color: ${SOFT}; font-feature-settings: "tnum"; }
    .pdf-anchors { display: none; }
  `
}
