import { compileFilm, dot, film, mixColor, parseColor, shape, text, arcPath, type Rgba } from "vizmatic/stage"

/**
 * Cover and part-opener art: an arc diagram of real attention weights.
 *
 * Each token asks a question of the tokens before it, and each arc is the
 * softmax(QK^T / sqrt(d)) weight of one answer. It is the operation at the
 * center of the book, computed from the sentences the book opens with.
 */
const OPENING_TEXT = "Write rain falls softly on a page. A person sees three words. A language model receives integers, each selecting a learned row of numbers. The tokenizer builds that integer sequence. Its choices determine which fragments the model can recognize directly, how many positions a sentence occupies, and which distinctions survive."
const DIMENSIONS = 24

function hash(value: string, seed: number): number {
  let state = 2166136261 ^ seed
  for (let index = 0; index < value.length; index++) {
    state ^= value.charCodeAt(index)
    state = Math.imul(state, 16777619)
  }
  return state >>> 0
}

function random(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state)
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

function gaussian(next: () => number): number {
  return Math.sqrt(-2 * Math.log(Math.max(next(), 1e-9))) * Math.cos(2 * Math.PI * next())
}

function tokenize(source: string): string[] {
  return source.match(/[\p{L}\p{N}'&-]+|[.,]/gu) ?? []
}

/** Masked self-attention weights: row i holds the weights i gives to tokens before it. */
export function attentionWeights(tokens: readonly string[], seed: number): number[][] {
  const matrix = (salt: number) => {
    const next = random(seed + salt)
    return Array.from({ length: DIMENSIONS }, () => Array.from({ length: DIMENSIONS }, () => gaussian(next) / Math.sqrt(DIMENSIONS)))
  }
  const queryMatrix = matrix(1), keyMatrix = matrix(2)
  const multiply = (row: readonly number[], weights: readonly number[][]) => weights[0].map((_, j) => row.reduce((sum, value, k) => sum + value * weights[k][j], 0))
  const embeddings = tokens.map((token, position) => {
    const next = random(hash(token.toLowerCase(), seed))
    return Array.from({ length: DIMENSIONS }, (_, dimension) => {
      const frequency = 1 / Math.pow(40, (dimension - dimension % 2) / DIMENSIONS)
      const encoding = dimension % 2 ? Math.cos(position * frequency) : Math.sin(position * frequency)
      return gaussian(next) + 0.9 * encoding
    })
  })
  const queries = embeddings.map((row) => multiply(row, queryMatrix))
  const keys = embeddings.map((row) => multiply(row, keyMatrix))
  return queries.map((query, i) => {
    if (i === 0) return []
    const scores = keys.slice(0, i).map((key) => query.reduce((sum, value, d) => sum + value * key[d], 0) / Math.sqrt(DIMENSIONS))
    const largest = Math.max(...scores)
    const exponentials = scores.map((score) => Math.exp(score - largest))
    const total = exponentials.reduce((sum, value) => sum + value, 0)
    return exponentials.map((value) => value / total)
  })
}

interface ArcOptions {
  width: number
  height: number
  baseline: number
  span: number
  look: "midnight" | "paper"
  background: string | null
  tokens: readonly string[]
  seed: number
  rise: number
  threshold: number
  strokeScale: number
  labels: boolean
  glow: boolean
}

async function renderArcs(options: ArcOptions): Promise<string> {
  const { tokens, span, baseline } = options
  const weights = attentionWeights(tokens, options.seed)
  const definition = film({ width: options.width, height: options.height, fps: 1, look: options.look, background: options.background, bloom: 0 }, (s) => {
    const x = (index: number) => -span / 2 + (span * index) / (tokens.length - 1)
    const from = parseColor("blue"), middle = parseColor("teal"), to = parseColor("yellow")
    const ramp = (at: number): Rgba => at < 0.5 ? mixColor(from, middle, at * 2) : mixColor(middle, to, (at - 0.5) * 2)
    const arcs: { i: number; j: number; weight: number }[] = []
    weights.forEach((row, i) => row.forEach((weight, j) => {
      if (weight >= options.threshold) arcs.push({ i, j, weight })
    }))
    // Faint arcs first, so the strongest answers sit on top.
    arcs.sort((a, b) => a.weight - b.weight)
    const strongest = arcs.at(-1)?.weight ?? 1
    for (const { i, j, weight } of arcs) {
      const center = (x(i) + x(j)) / 2, radius = (x(i) - x(j)) / 2
      const strength = Math.pow(weight / strongest, 0.62)
      const color = ramp((i + j) / 2 / (tokens.length - 1))
      const arc = shape(arcPath(center, baseline, radius, radius * options.rise, Math.PI, Math.PI * 2), { stroke: color, width: (0.75 + 3.4 * strength * strength) * options.strokeScale })
      arc.set("strokeOpacity", 0.13 + 0.87 * strength)
      if (options.glow && strength > 0.58) arc.glow(7)
      s.add(arc)
    }
    tokens.forEach((token, index) => {
      s.add(dot(token.length > 5 ? 3.4 * options.strokeScale : 2.4 * options.strokeScale, ramp(index / (tokens.length - 1))).at(x(index), baseline))
      if (options.labels) {
        // Read top to bottom, like the labels on a chart axis. Every token gets its own column.
        const label = text(token, { font: "mono", size: 13.5, color: "dim" })
        const bounds = label.bounds()
        label.at(x(index) - bounds.width / 2 + bounds.width / 2, baseline + 18 + bounds.width / 2)
        label.rotate(Math.PI / 2, [x(index), baseline + 18 + bounds.width / 2])
        s.add(label)
      }
    })
    s.wait(1)
  })
  const compiled = await compileFilm(definition)
  return compiled.svg(0)
}

/** Full-page vector art for the cover: dark ground, with room above for the title. */
export function renderCoverArt(): Promise<string> {
  const tokens = tokenize(OPENING_TEXT)
  return renderArcs({ width: 1500, height: 1850, baseline: 540, span: 1300, look: "midnight", background: "#0b0c10", tokens, seed: 2026, rise: 1, threshold: 0.03, strokeScale: 1, labels: true, glow: true })
}

/** A quiet band of the same art for a part opener, computed from that part's own chapter titles. */
export function renderPartArt(titles: readonly string[], partNumber: number): Promise<string> {
  const tokens = tokenize(titles.join(" ")).filter((token) => !/^[.,]$/.test(token)).slice(0, 56)
  return renderArcs({ width: 1500, height: 520, baseline: 240, span: 1470, look: "paper", background: null, tokens, seed: 100 + partNumber, rise: 0.62, threshold: 0.05, strokeScale: 1.4, labels: false, glow: false })
}
