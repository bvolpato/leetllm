import assert from 'node:assert/strict'
import {
  HEADS,
  QUERY_VECTORS,
  KV_KEYS,
  KV_VALUES,
} from '../../../films/grouped-query-attention/fixtures.mjs'
import { dot, softmax } from '../../../films/grouped-query-attention/arithmetic.mjs'
import {
  cacheBytes,
  kvGroupForQuery,
  physicalHeads,
} from '../../../films/grouped-query-attention/model.mjs'

const ink = '#182f38',
  paper = '#f6f2e8',
  quiet = '#4e6468',
  line = '#aebbb6'
const teal = '#116b72',
  pale = '#bfdfd9',
  rust = '#a74327',
  peach = '#f3cdb5'
const gold = '#edb653',
  wash = '#e7e7da',
  white = '#fffdf5'
const K = { fill: pale, edge: teal },
  V = { fill: peach, edge: rust }
const sum = (xs) => xs.reduce((s, x) => s + x, 0)
const range = (n) => Array.from({ length: n }, (_, i) => i)
const lerp = (a, b, t) => a + (b - a) * t
const fmt = (x, n = 0) => Number(x.toFixed(n)).toString()
const vec = (v, n = 0) => '[' + v.map((x) => fmt(x, n)).join(', ') + ']'
const mix = (scores, values) =>
  values[0].map((_, i) => sum(softmax(scores).map((w, j) => w * values[j][i])))
const heads = QUERY_VECTORS.map((q, i) => {
  const g = kvGroupForQuery(i),
    scores = KV_KEYS[g].map((k) => dot(q, k) / Math.sqrt(q.length))
  return { q, g, scores, weights: softmax(scores), out: mix(scores, KV_VALUES[g]) }
})
const schemes = [
  { name: 'MHA', n: 8 },
  { name: 'GQA', n: 2 },
  { name: 'MQA', n: 1 },
]
const shape = (n) => [HEADS.batch, n, HEADS.tokens, HEADS.width]
const toyCells = (g, type) =>
  range(HEADS.tokens).map((r) =>
    range(HEADS.width).map((col) => (r + col + g + (type === 'V' ? 1 : 0)) % HEADS.width),
  )
const raw = (n, s) => cacheBytes({ kvHeads: n, tokens: s })
const large = (n) =>
  cacheBytes({ layers: 80, batch: 1, tokens: 4096, kvHeads: n, width: 128, bytes: 2 })
const gib = 2 ** 30,
  mib = 2 ** 20
const scalarW = [
  { k: [1, -1], v: [10, 0] },
  { k: [-1, 1], v: [0, 10] },
]
const pooled = Object.fromEntries(
  ['k', 'v'].map((a) => [a, [0, 1].map((i) => sum(scalarW.map((w) => w[a][i])) / 2)]),
)
const basis = [
  [1, 0],
  [0, 1],
]
function probe(w) {
  const keys = basis.map((x) => dot(x, w.k)),
    vals = basis.map((x) => [dot(x, w.v)])
  return { keys, vals: vals.flat(), weights: softmax(keys), out: mix(keys, vals)[0] }
}
const W = [
    [1, 2],
    [0, 1],
  ],
  latent = [1, 2],
  q = [1, 0]
const mv = (m, x) => m.map((row) => dot(row, x))
const trans = (m) => m[0].map((_, c) => m.map((row) => row[c]))
const key = mv(W, latent),
  absorbed = mv(trans(W), q)
function rotated(t) {
  const a = (Math.PI * t) / 2
  const R = [
    [Math.cos(a), -Math.sin(a)],
    [Math.sin(a), Math.cos(a)],
  ]
  const k = mv(R, key),
    aQuery = mv(trans(W), mv(trans(R), q))
  return { key: k, aq: aQuery, score: dot(q, k) }
}
const tempBytes = (n) =>
  cacheBytes({ layers: 1, batch: 2, tokens: 1024, kvHeads: n, width: 64, bytes: 2 })
const maskValues = [1, 2, 9]
function visibleRow(qPos, keys) {
  return range(keys).filter((i) => i <= qPos)
}
function maskedOut(indices) {
  return sum(indices.map((i) => maskValues[i])) / indices.length
}
const ranks = physicalHeads(48, 6, 12)
const rankCost =
  cacheBytes({
    layers: 32,
    batch: 1,
    tokens: 1024,
    kvHeads: ranks.kvPerRank,
    width: 64,
    bytes: 2,
  }) / mib
const free = range(12).map((i) => (i === 5 ? 7 : 9))
const rankOf = (i) => Math.floor(i / ranks.queriesPerRank)
const groupOf = (i) => kvGroupForQuery(i, 48, 6)
const section = (clock) => clock.beat.beatIndex
function cue(clock, beat, phrase, duration = 0) {
  const b = section(clock)
  return b > beat ? 1 : b < beat ? 0 : clock.reveal(phrase, duration)
}
function clauseProgress(clock, beat, phrase, splitCaption = false) {
  const b = section(clock)
  if (b !== beat) return Number(b > beat)
  const { start, end } = clock.wordCue(phrase)
  return clock.reveal(phrase, end - start, { captionStart: splitCaption ? phrase : false })
}
function text(c, s, x, y, size = 40, color = ink, font = 'Sans', align = 'left', weight = 400) {
  c.fillStyle = color
  c.font = weight + ' ' + size + 'px "Lesson ' + font + '"'
  c.textAlign = align
  c.textBaseline = 'middle'
  c.fillText(String(s), x, y)
}
const mid = (c, s, x, y, z = 40, col = ink, f = 'Mono') => text(c, s, x, y, z, col, f, 'center')
function rect(c, x, y, w, h, fill, r = 0, edge = null, sw = 2) {
  c.beginPath()
  c.roundRect(x, y, w, h, r)
  if (fill) {
    c.fillStyle = fill
    c.fill()
  }
  if (edge) {
    c.lineWidth = sw
    c.strokeStyle = edge
    c.stroke()
  }
}
function stroke(c, x1, y1, x2, y2, col = line, w = 3) {
  c.beginPath()
  c.moveTo(x1, y1)
  c.lineTo(x2, y2)
  c.strokeStyle = col
  c.lineWidth = w
  c.stroke()
}
function circle(c, x, y, r, fill, edge = null) {
  c.beginPath()
  c.arc(x, y, r, 0, 2 * Math.PI)
  c.fillStyle = fill
  c.fill()
  if (edge) {
    c.strokeStyle = edge
    c.lineWidth = 3
    c.stroke()
  }
}
function frame(c, tag, title, sub) {
  c.fillStyle = paper
  c.fillRect(0, 0, 1920, 1080)
  rect(c, 0, 0, 1920, 13, teal)
  text(c, tag, 90, 69, 27, teal, 'Mono', 'left', 600)
  text(c, title, 86, 157, 74, ink, 'Serif')
  text(c, sub, 92, 239, 35, quiet)
}
function foot(c, formula, desc = '') {
  stroke(c, 92, 827, 1828, 827, line, 2)
  text(c, formula, 92, 884, 42, ink, 'Mono')
  if (desc) text(c, desc, 94, 948, 32, quiet)
}
function alpha(c, a, paint) {
  if (a <= 0) return
  c.save()
  c.globalAlpha *= a
  paint()
  c.restore()
}
function rivets(c, x, y, w, h) {
  for (const xx of [x + 13, x + w - 13])
    for (const yy of [y + 13, y + h - 13]) circle(c, xx, yy, 3.5, '#758789')
}
function tapePair(c, x, y, w, h, label = '') {
  rect(c, x, y, w, h, ink, 5)
  rect(c, x + 3, y + 3, w / 2 - 4, h - 6, pale, 3)
  rect(c, x + w / 2 + 2, y + 3, w / 2 - 5, h - 6, peach, 3)
  mid(c, 'K' + label, x + w * 0.25, y + h * 0.51, Math.min(w * 0.27, 45), teal)
  mid(c, 'V' + label, x + w * 0.75, y + h * 0.51, Math.min(w * 0.27, 45), rust)
}
function reader(c, n, x, y, active = false, w = 108) {
  rect(c, x - w / 2, y - 29, w, 58, active ? gold : white, 6, active ? ink : quiet, 2.5)
  mid(c, 'Q' + n, x, y, 34, ink)
}
function connection(c, x, y, xx, yy, color, width = 4) {
  const m = (yy + y) / 2
  c.beginPath()
  c.moveTo(x, y)
  c.bezierCurveTo(x, m, xx, m, xx, yy)
  c.lineWidth = width
  c.strokeStyle = color
  c.stroke()
}
function reel(c, x, y, angle) {
  circle(c, x, y, 55, '#dce5df', quiet)
  circle(c, x, y, 40, '#a7bbb6', quiet)
  range(3).forEach((i) => {
    const a = angle + (i * 2 * Math.PI) / 3
    circle(c, x + 22 * Math.cos(a), y + 22 * Math.sin(a), 8, ink)
  })
  circle(c, x, y, 6, white)
}
function opening(c, cl) {
  const b = section(cl),
    stamp = cue(cl, 2, 'Watch the write heads', 0.85)
  const feed = b === 0 ? Math.min(1, (cl.elapsed + 0.15) / 1.2) : 1
  const queued = cue(cl, 0, 'Watch what happens', 0.55)
  frame(
    c,
    'DECODE  /  ONE LAYER',
    'The tide rose',
    'One request     ·     two stored histories     ·     eight query readers',
  )
  const xs = [473, 712, 951],
    tw = 204
  ;['the', 'tide', 'rose'].forEach((s, i) => {
    alpha(c, i === 2 ? queued : 1, () => {
      mid(c, s, xs[i] + tw / 2, 342, 58, i === 2 && !stamp ? rust : ink, 'Serif')
      if (i === 2) stroke(c, xs[i] + 37, 384, xs[i] + tw - 37, 384, gold, 7)
    })
  })
  for (const group of [0, 1]) {
    const y = 424 + group * 198
    rect(c, 97, y, 1120, 150, '#dce3db', 17, quiet, 3)
    rivets(c, 97, y, 1120, 150)
    reel(c, 186, y + 75, stamp * 1.8 + feed * 1.8)
    text(c, 'KV ' + group, 270, y + 74, 41, ink, 'Mono')
    rect(c, 452, y + 26, 739, 98, ink, 5)
    xs.forEach((x, i) => {
      if (i === 2) {
        rect(c, x, y + 39, tw, 72, '#415055', 3)
        alpha(c, stamp, () => tapePair(c, x, y + 39, tw, 72))
      } else if (i === 1) alpha(c, feed, () => tapePair(c, x, y + 39 - 26 * (1 - feed), tw, 72))
      else tapePair(c, x, y + 39, tw, 72)
    })
    alpha(c, queued, () => {
      // The brass shoe contacts the tape at the write cue.
      const down = Math.sin(Math.PI * stamp) * 20
      rect(c, xs[2] + 8, y + 5 + down, tw - 16, 15, gold, 4, rust, 2)
      stroke(c, xs[2] + tw / 2, y + 1, xs[2] + tw / 2, y + 7 + down, quiet, 4)
    })
    for (let j = 0; j < 4; j++) {
      const xx = 1322 + j * 142
      connection(
        c,
        1195,
        y + 94,
        xx,
        y + 61,
        b === 3 && group === 0 ? teal : quiet,
        b === 3 && group === 0 ? 5 : 3,
      )
    }
    for (let j = 0; j < 4; j++)
      reader(c, 4 * group + j, 1322 + j * 142, y + 37, b === 3 && group === 0, 99)
  }
  if (b === 1 || (b === 2 && !stamp))
    foot(
      c,
      'How many new K/V pairs does “rose” add?',
      'Count the writes for one position in this layer.',
    )
  else if (stamp > 0 && stamp < 1)
    foot(
      c,
      'Writing the next position to both tracks',
      'The four readers on each track keep their connection.',
    )
  else if (stamp === 1)
    foot(
      c,
      '1 pair × 2 histories = 2 new pairs',
      'Earlier rows remain available to all eight readers.',
    )
  else
    foot(
      c,
      feed < 1 ? 'Writing position 1' : 'Cached positions   0   1',
      queued
        ? 'The next token is waiting at the write head.'
        : 'The request retains a separate key and value on each track.',
    )
}
function attention(c, cl) {
  const b = section(cl)
  const firstQuery = clauseProgress(cl, 0, 'Our first query is two, zero') === 1
  const firstDots =
    clauseProgress(cl, 0, 'Its dot products with these keys are two and zero') === 1
  const scaled = clauseProgress(cl, 1, 'here the square root of two') === 1
  const firstWeights =
    clauseProgress(cl, 1, 'The first position gets about eighty percent', true) === 1
  const firstOutput = clauseProgress(
    cl,
    1,
    'With these basis values, the two weights become the output coordinates',
  )
  const secondQuery = clauseProgress(cl, 2, 'turn the query from two, zero to zero, two') === 1
  const secondWeights = clauseProgress(cl, 3, 'The second value', true) === 1
  const secondOutput = cue(cl, 3, 'Look at the two output marks', 0.7)
  frame(
    c,
    'READ  /  GROUP ZERO',
    'One cache, two mixtures',
    'Both queries read the same two positions. Each query has its own softmax.',
  )
  const flow = [teal, rust]
  const cacheX = 96,
    cacheWidth = 412,
    cacheY = (pos) => 387 + pos * 204,
    queryX = 618,
    queryY = (i) => 367 + i * 224,
    bandWidth = 456
  const queries = [firstQuery, secondQuery],
    scores = [firstDots, secondWeights],
    weights = [firstWeights, secondWeights],
    output = [firstOutput, secondWeights ? secondOutput : 0]
  for (let pos = 0; pos < 2; pos++) {
    const y = cacheY(pos)
    rect(c, cacheX, y, cacheWidth, 113, white, 9, line, 3)
    rect(c, cacheX, y, 13, 113, flow[pos], 5)
    text(c, 'Position ' + pos, cacheX + 31, y + 29, 32, quiet)
    const subscript = ['₀', '₁'][pos]
    text(
      c,
      'K' + subscript + ' = V' + subscript + ' = ' + vec(KV_VALUES[0][pos]),
      cacheX + 31,
      y + 76,
      36,
      flow[pos],
      'Mono',
    )
  }
  for (const [i, h] of heads.slice(0, 2).entries()) {
    if (!queries[i]) continue
    const y = queryY(i)
    for (let pos = 0; pos < 2; pos++)
      connection(c, cacheX + cacheWidth, cacheY(pos) + 56, queryX - 19, y + 22, flow[pos], 3)
    text(c, 'Q' + i + '  ' + vec(h.q), queryX, y, 48, ink, 'Mono')
    if (scores[i]) {
      const values = scaled ? h.scores : KV_KEYS[0].map((k) => dot(h.q, k))
      text(
        c,
        (scaled ? 'Scaled  ' : 'Dots  ') + vec(values, 3),
        queryX,
        y + 58,
        36,
        ink,
        'Mono',
      )
    }
    if (weights[i]) {
      let left = queryX
      for (const [pos, weight] of h.weights.entries()) {
        const span = bandWidth * weight
        rect(c, left, y + 94, span, 48, flow[pos])
        mid(c, fmt(weight, 3), left + span / 2, y + 169, 33, flow[pos])
        left += span
      }
    } else if (i === 1) {
      rect(c, queryX, y + 94, bandWidth, 48, wash, 4, line)
      mid(c, '?', queryX + bandWidth / 2, y + 118, 33, quiet)
    }
  }

  const originX = 1264,
    originY = 744,
    unit = 367,
    px = (x) => originX + x * unit,
    py = (y) => originY - y * unit
  text(c, 'Output space', px(0.5), 320, 42, ink, 'Serif', 'center')
  for (const interval of [0.25, 0.5, 0.75, 1]) {
    stroke(c, px(interval), py(0), px(interval), py(1), line, 2)
    stroke(c, px(0), py(interval), px(1), py(interval), line, 2)
  }
  stroke(c, px(0), py(0), px(1), py(0), quiet, 3)
  stroke(c, px(0), py(0), px(0), py(1), quiet, 3)
  circle(c, px(1), py(0), 7, teal)
  circle(c, px(0), py(1), 7, rust)
  mid(c, '0', px(0) - 25, py(0) + 24, 32, quiet)
  mid(c, 'V₀ ' + vec(KV_VALUES[0][0]), px(1), py(0) + 45, 37, teal)
  mid(c, 'V₁ ' + vec(KV_VALUES[0][1]), px(0), py(1) - 27, 37, rust)
  for (const [i, progress] of output.entries()) {
    const h = heads[i]
    // Keep both endpoints legible when the two paths share the horizontal axis.
    alpha(c, i === 0 && output[1] > 0 ? 0.45 : 1, () => {
      let start = [0, 0]
      for (const [pos, value] of KV_VALUES[0].entries()) {
        const end = start.map((coord, dim) => coord + h.weights[pos] * value[dim])
        const step = Math.max(0, Math.min(1, 2 * progress - pos))
        if (step > 0)
          stroke(
            c,
            px(start[0]),
            py(start[1]),
            px(lerp(start[0], end[0], step)),
            py(lerp(start[1], end[1], step)),
            flow[pos],
            8,
          )
        start = end
      }
    })
    if (progress === 1) {
      const [x, y] = h.out
      circle(c, px(x), py(y), 11, ink, paper)
      text(c, 'Q' + i, px(x) + 23, py(y) - 12, 40, ink, 'Mono')
      text(c, vec(h.out, 3), px(x) + 23, py(y) + 30, 32, ink, 'Mono')
    }
  }
  foot(
    c,
    secondQuery && !secondWeights
      ? 'Which value gets more weight from Q1?'
      : firstWeights
        ? 'Output = weight₀ × V₀ + weight₁ × V₁'
        : b === 0
          ? 'Score both cached keys with the current query.'
          : 'Scaled scores = dot products / √' + heads[0].q.length,
  )
}

const qx = (i) => 218 + i * 211
function wiring(c, n, { active = -1, hideFrom = 8 } = {}) {
  const per = 8 / n
  for (let g = 0; g < n; g++) {
    const x = (qx(g * per) + qx((g + 1) * per - 1)) / 2
    for (let i = g * per; i < (g + 1) * per && i < hideFrom; i++)
      connection(c, qx(i), 429, x, 608, i === active ? rust : quiet, i === active ? 10 : 4)
    tapePair(c, x - 83, 605, 166, 88)
    mid(c, 'KV ' + g, x, 737, 34)
  }
  range(8).forEach((i) => reader(c, i, qx(i), 400, i === active, 128))
}
function mapScene(c, cl) {
  const b = section(cl),
    found = cue(cl, 2, 'Follow the wire') > 0
  frame(
    c,
    'ROUTING  /  CONTIGUOUS GROUPS',
    'Which history serves Q5?',
    'Eight query indices     ·     two stored heads     ·     start counting at zero',
  )
  wiring(c, 2, { active: b > 0 ? 5 : -1, hideFrom: found ? 8 : 4 })
  foot(
    c,
    found
      ? 'floor(5 / 4) = 1     →     KV 1'
      : b >= 1
        ? 'Q5 → floor(5 / 4) → ?'
        : '8 queries / 2 histories = 4 readers per history',
    found
      ? 'The same division gives 60 / 10 = 6 readers per history in a larger layout.'
      : 'Each query keeps its own scores and output.',
  )
}
function historyCenters(count) {
  const readersPerHistory = 8 / count
  return range(count).map((group) => {
    const first = group * readersPerHistory
    return (qx(first) + qx(first + readersPerHistory - 1)) / 2
  })
}

function routeColor(count, group) {
  if (count === 8) return quiet
  return group === 0 ? teal : rust
}

function rewire(c, from, to, progress) {
  const source = historyCenters(from)
  const target = historyCenters(to)
  for (let i = 0; i < 8; i++) {
    const group = kvGroupForQuery(i, 8, to)
    const oldGroup = kvGroupForQuery(i, 8, from)
    const x = lerp(source[oldGroup], target[group], progress)
    alpha(c, 1 - progress, () => connection(c, qx(i), 429, x, 605, routeColor(from, oldGroup), 5))
    alpha(c, progress, () => connection(c, qx(i), 429, x, 605, routeColor(to, group), 5))
    if (progress > 0 && progress < 1) circle(c, x, 598, 8, routeColor(to, group))
  }
  alpha(c, Math.max(0, 1 - 2 * progress), () => {
    source.forEach((x, i) => {
      tapePair(c, x - 83, 605, 166, 88)
      mid(c, 'KV ' + i, x, 737, 34)
    })
  })
  alpha(c, Math.max(0, 2 * progress - 1), () => {
    target.forEach((x, i) => {
      tapePair(c, x - 83, 605, 166, 88)
      mid(c, 'KV ' + i, x, 737, 34)
    })
  })
  range(8).forEach((i) => reader(c, i, qx(i), 400, false, 128))
}

function layouts(c, cl) {
  const b = section(cl)
  const gqa = cue(cl, 1, 'Follow the connections', 1.3)
  const mqa = cue(cl, 2, 'All eight readers', 1.3)
  const progress = b === 2 ? mqa : gqa
  const from = schemes[Math.max(0, b - 1)]
  const target = schemes[b]
  const shown = progress > 0 ? target : from
  const morph = progress * progress * (3 - 2 * progress)
  const f = [
    'eight key-value pairs',
    'one quarter as large',
    'one eighth of multi-head attention',
  ][b]
  const readout = clauseProgress(cl, b, f) === 1 && (b === 0 || progress === 1)
  frame(
    c,
    'ARCHITECTURE  /  ONE POSITION',
    shown.name + ' with eight query readers',
    'Same eight queries     ·     Fixed history length, head width, and precision',
  )
  const current = progress === 1 ? target.n : from.n
  rewire(c, from.n, target.n, morph)
  text(c, 'RAW K/V PAYLOAD', 94, 787, 28, quiet, 'Mono')
  const baseline = schemes[0].n
  for (let i = 0; i < baseline; i++) {
    rect(c, 94 + i * 62, 808, 48, 37, wash, 4, line, 2)
    if (progress === 0 || progress === 1) {
      if (i < current) rect(c, 94 + i * 62, 808, 48, 37, pale, 4, teal, 2)
    }
  }
  const count = current + (current === 1 ? ' pair' : ' pairs')
  const share = current === baseline ? 'Full MHA payload' : '1/' + baseline / current + ' of MHA payload'
  text(c, readout ? count + '  ·  ' + share : 'How much raw K/V remains?', 643, 840, 39, ink, 'Mono')
}
function matrixSheet(c, x, y, w, h, group, type, open = 1, numbered = true) {
  const palette = type === 'K' ? K : V,
    height = lerp(19, h, open)
  const yy = y + (h - height) / 2
  rect(c, x + 8, yy + 9, w, height, palette.edge, 4)
  rect(c, x, yy, w, height, palette.fill, 4, palette.edge, 2)
  const values = toyCells(group, type)
  const cellW = w / values[0].length,
    cellH = height / values.length
  for (let r = 0; r < values.length; r++)
    for (let col = 0; col < values[r].length; col++) {
      if (col) stroke(c, x + col * cellW, yy, x + col * cellW, yy + height, palette.edge, 1.5)
      if (r) stroke(c, x, yy + r * cellH, x + w, yy + r * cellH, palette.edge, 1.5)
      if (numbered && open > 0.7)
        alpha(c, (open - 0.7) / 0.3, () =>
          mid(c, values[r][col], x + (col + 0.5) * cellW, yy + (r + 0.5) * cellH, 30, palette.edge),
        )
    }
}
function shapes(c, cl) {
  const b = section(cl),
    n = cue(cl, 1, 'In multi-head attention') && !cue(cl, 2, 'The key shape') ? 8 : 2,
    per = 8 / n
  const open = cue(cl, 0, 'Open a track edge-on', 1.2)
  frame(
    c,
    'STORAGE  /  CROSS SECTION',
    'A position is one row of four',
    'One request     ·     three positions     ·     equal key and value widths',
  )
  range(8).forEach((i) => reader(c, i, qx(i), 330, false, 90))
  for (let g = 0; g < n; g++) {
    const xx = (qx(g * per) + qx((g + 1) * per - 1)) / 2,
      w = n === 2 ? 346 : 125
    for (let j = 0; j < per; j++) connection(c, qx(g * per + j), 360, xx, 427, line, 3)
    mid(c, 'KV ' + g, xx, 449, 30, ink)
    matrixSheet(c, xx - w / 2, 489, w, 119, g, 'K', open, n === 2)
    matrixSheet(c, xx - w / 2, 653, w, 119, g, 'V', open, n === 2)
  }
  text(c, 'K', 84, 551, 44, teal, 'Mono')
  text(c, 'V', 84, 715, 44, rust, 'Mono')
  foot(
    c,
    b === 3
      ? 'bytes = 2 × layers × batch × positions × KV heads × width × P'
      : 'K and V each   ' + vec(shape(n)) + '     ·     current Q   [1, 8, 1, 4]',
    b === 3
      ? 'P = bytes per number. Uniform full-attention layers, equal widths, no prefix sharing or overhead.'
      : 'Axes in order: batch, stored heads, positions, coordinates. Both arrays have the same axes.',
  )
}
function byteBars(c, cl) {
  const b = section(cl),
    add = cue(cl, 2, 'Append the segments') > 0,
    s = 3 + Number(add)
  frame(
    c,
    'CAPACITY  /  RAW BYTES',
    'Price one more cached position',
    'Two layers     ·     one request     ·     width 4     ·     two bytes per number',
  )
  const step = 1.12
  for (const [i, model] of schemes.entries()) {
    const y = 382 + i * 146,
      piece = raw(model.n, 1),
      x = 383,
      col = [ink, teal, rust][i]
    text(c, model.name, 99, y + 6, 42, ink, 'Mono')
    text(c, model.n + (model.n === 1 ? ' KV head' : ' KV heads'), 101, y + 53, 30, quiet)
    range(s).forEach((j) => {
      rect(c, x + piece * step * j, y, piece * step - 3, 65, j === 3 ? gold : col, 3)
    })
    text(c, raw(model.n, s) + ' B', x + raw(model.n, s) * step + 22, y + 34, 38, ink, 'Mono')
  }
  foot(
    c,
    b >= 1 && !add
      ? 'How many bytes does the fourth position add to GQA?'
      : add
        ? 'GQA    192 B + 64 B = 256 B'
        : 'GQA    2 arrays × 2 layers × 1 × 3 × 2 heads × 4 × 2 B = 192 B',
    'Each segment is one retained position across both layers. All three rows use the same scale.',
  )
}
function scaleScene(c, cl) {
  const b = section(cl),
    units = [64, 8, 1],
    names = ['MHA', 'GQA', 'MQA']
  if (b < 2) {
    frame(
      c,
      'CAPACITY  /  WHOLE REQUESTS',
      'Fill a dedicated 10 GiB cache pool',
      '80 layers   ·   64 query heads   ·   4,096 positions/request   ·   width 128   ·   2 B/number',
    )
    units.forEach((n, i) => {
      const y = 356 + i * 154,
        count = Math.floor((10 * gib) / large(n)),
        w = 1122 / count
      text(c, names[i] + ' / ' + n, 91, y + 30, 37, ink, 'Mono')
      text(c, fmt(large(n) / gib, 5) + ' GiB each', 91, y + 84, 29, quiet)
      rect(c, 480, y, 1122, 76, wash, 5, line)
      for (let j = 0; j < (b === 0 ? 1 : count); j++)
        rect(c, 480 + j * w, y, w - 2, 76, [ink, teal, rust][i], 2)
      if (b === 1) text(c, '× ' + count, 1632, y + 39, 45, ink, 'Mono')
    })
    foot(
      c,
      b === 0
        ? 'One rectangle = one request at 4,096 positions'
        : 'Capacity in whole requests = floor(pool / bytes per request)',
      'Dedicated logical payload only. Weights, workspace, allocation overhead and future output require space.',
    )
  } else if (b === 2) {
    const total = 32 * 4096
    frame(
      c,
      'CAPACITY  /  SAME TOTAL POSITIONS',
      'Pack the same cache two ways',
      '80 uniform layers   ·   8 KV heads   ·   width 128   ·   2 bytes/number',
    )
    const x = 102,
      w = 1616
    text(c, '32 requests × 4,096 positions', x, 352, 40, ink, 'Mono')
    for (let j = 0; j < 32; j++) rect(c, x + (j * w) / 32, 398, w / 32 - 3, 79, teal, 2)
    text(c, '1 request × ' + total.toLocaleString('en-US') + ' positions', x, 569, 40, ink, 'Mono')
    rect(c, x, 617, w, 79, teal, 3)
    foot(
      c,
      'Each layout  ' +
        fmt((large(8) * 32) / 1e9, 2) +
        ' GB raw K/V     ·     weights alone  144 GB',
      'Decimal GB. The separate weight estimate assumes 72 billion parameters at two bytes each.',
    )
  } else {
    frame(
      c,
      'CONFIGURATION  /  LLAMA 3.1',
      'Count heads in the checkpoint',
      'Published Llama 3.1 configurations     ·     eight learned K/V heads in each model',
    )
    ;[
      [32, '8B'],
      [64, '70B'],
      [128, '405B'],
    ].forEach(([n, name], r) => {
      const y = 355 + r * 154
      text(c, name, 96, y + 36, 48, ink, 'Mono')
      for (let g = 0; g < 8; g++) {
        const x = 339 + g * 142
        rect(c, x, y, 124, 82, pale, 6, teal)
        for (let j = 0; j < n / 8; j++)
          rect(c, x + 9 + j * (106 / (n / 8)), y + 21, Math.max(3, 106 / (n / 8) - 3), 40, teal)
      }
      text(c, n / 8 + ' : 1', 1504, y + 42, 46, ink, 'Mono')
    })
    foot(
      c,
      'Readers per stored history = query heads / KV heads',
      'Read the supported context and any sliding-window policy separately for the actual release.',
    )
  }
}
const intensity = (hq, hkv, bytes) => (2 * hq) / (hkv * bytes)
const timing = (kv) => ({ w: 56, kv, time: ((56 + kv) / 1000) * 1000 })
function reads(c, cl) {
  const b = section(cl)
  if (b < 4) {
    frame(
      c,
      'DECODE  /  IDEAL CACHE READS',
      'One fetch can serve several queries',
      'One layer   ·   one new row per request   ·   equal widths   ·   one read per distinct K/V coordinate',
    )
    text(c, 'Query–key dots', 100, 370, 45, ink, 'Serif')
    text(c, 'Weighted value sums', 100, 525, 45, ink, 'Serif')
    if (b >= 1) text(c, 'Distinct cache reads', 100, 680, 45, teal, 'Serif')
    const w = 940
    ;[0, 1, 2].forEach((i) => {
      const y = 338 + i * 154
      if (i === 2 && b === 0) return
      const symbolic = [
        '2 × B × S × d × Hq   FLOPs',
        '2 × B × S × d × Hq   FLOPs',
        '2 × B × S × d × Hkv × P   bytes',
      ][i]
      rect(c, 624, y, w, 89, i === 2 ? pale : white, 7, i === 2 ? teal : line)
      text(c, symbolic, 651, y + 44, 41, i === 2 ? teal : ink, 'Mono')
    })
    const cancel = cue(cl, 1, 'The common batch', 0.6)
    if (cancel > 0)
      alpha(c, cancel, () => {
        c.font = '400 41px "Lesson Mono"'
        const x = 651 + c.measureText('2 × ').width,
          span = c.measureText('B × S × d').width
        for (let i = 0; i < 3; i++) stroke(c, x, 382 + i * 154, x + span, 382 + i * 154, rust, 3)
      })
    foot(
      c,
      b === 0
        ? 'Compute = 4 × B × S × d × Hq    FLOPs'
        : b === 1
          ? 'Ideal FLOPs/byte = (2 / P) × (Hq / Hkv)'
          : !cue(cl, 3, 'Actual traffic')
            ? 'Hq = 24    Hkv = 6    P = 1 B    →    ideal FLOPs/byte?'
            : '2 × 24 / (1 × 6) = ' + intensity(24, 6, 1) + ' FLOPs/byte',
      'B requests, S visible positions, d coordinates, P bytes/number. Products and distinct K/V reads only.',
    )
  } else {
    const show = cue(cl, 5, 'The weights still take') > 0
    frame(
      c,
      'DECODE  /  READ-TIME LOWER BOUND',
      'How much step time can sharing save?',
      'Read-only model     ·     1 TB/s = 1,000 GB/s     ·     only K/V traffic changes',
    )
    ;[8, 1].forEach((kv, i) => {
      const v = timing(kv),
        x = 350,
        y = 383 + i * 210,
        px = 19
      text(c, i ? 'Grouped' : 'Before', 90, y + 58, 48, ink, 'Serif')
      rect(c, x, y, v.w * px, 107, ink, 5)
      mid(c, 'Weight reads   56 GB', x + (v.w * px) / 2, y + 55, 43, white)
      if (!i || show) {
        rect(c, x + v.w * px + 3, y, v.kv * px, 107, rust, 3)
        text(c, v.kv + ' GB K/V', x + v.w * px, y - 30, 32, rust, 'Mono')
        text(c, fmt(v.time) + ' ms', x + (v.w + v.kv) * px + 37, y + 54, 41, ink, 'Mono')
      } else text(c, 'K/V ÷ 8', 1437, y + 54, 37, rust, 'Mono')
    })
    foot(
      c,
      show
        ? '64 ms / 57 ms ≈ ' + fmt(timing(8).time / timing(1).time, 2) + '×'
        : 'If only the K/V reads fall eightfold, where does the bound land?',
      'Compute, other traffic, communication and queueing are outside this lower bound.',
    )
  }
}
function weightStrip(c, x, y, w, weights) {
  rect(c, x, y, w / 2 - 4, 72, pale, 5, teal)
  rect(c, x + w / 2 + 3, y, w / 2 - 4, 72, peach, 5, rust)
  mid(c, vec(weights.k), x + w / 4, y + 19, 32, teal)
  mid(c, vec(weights.v), x + (3 * w) / 4, y + 19, 32, rust)
  weightTrace(c, x, y, w, weights)
}
function weightTrace(c, x, y, w, weights, dashed = false) {
  c.save()
  if (dashed) c.setLineDash([10, 7])
  for (const [j, kind] of ['k', 'v'].entries()) {
    const xs = [x + (j * w) / 2 + 44, x + ((j + 1) * w) / 2 - 44]
    const ys = weights[kind].map((v) => y + 52 - (kind === 'k' ? v : (v - 5) / 5) * 13)
    stroke(c, xs[0], ys[0], xs[1], ys[1], kind === 'k' ? teal : rust, 4)
    xs.forEach((xx, i) => circle(c, xx, ys[i], 4.5, kind === 'k' ? teal : rust))
  }
  c.restore()
}
function pooling(c, cl) {
  const b = section(cl),
    stack = cue(cl, 1, 'Lay the slices', 1.4),
    pooledReady = cue(cl, 1, 'Keep the query') > 0
  const result = cue(cl, 2, 'Run the pooled weights', 0.8)
  frame(
    c,
    'CONVERSION  /  TWO SCALAR HEADS',
    'Run both checkpoints on the same input',
    'Held-out hidden rows [1, 0], [0, 1]     ·     both scalar queries = 1     ·     both positions visible',
  )
  const wx = 303,
    ww = 644,
    posX = (v) => 1130 + v * 65
  mid(c, 'Key weights', wx + ww / 4, 324, 34, teal, 'Sans')
  mid(c, 'Value weights', wx + (3 * ww) / 4, 324, 34, rust, 'Sans')
  text(c, 'Head output', 1118, 319, 36, ink, 'Serif')
  mid(c, '0', posX(0), 359, 26, quiet)
  mid(c, '10', posX(10), 363, 26, quiet)
  for (let i = 0; i < 3; i++) {
    const y = 384 + i * 153
    text(c, ['Head A', 'Head B', 'Pooled'][i], 92, y + 36, 40, i === 2 ? teal : ink, 'Serif')
    const weights = i < 2 ? scalarW[i] : pooled
    if (i < 2 || pooledReady) weightStrip(c, wx, y, ww, weights)
    else {
      rect(c, wx, y, ww, 72, wash, 4, line)
      if (stack > 0) {
        for (const j of [0, 1]) {
          const yy = lerp(y + (j === 0 ? -34 : 34), y, stack)
          weightTrace(c, wx, yy, ww, scalarW[j], j === 1)
        }
      }
    }
    stroke(c, posX(0), y + 44, posX(10), y + 44, line, 5)
    range(11).forEach((k) => stroke(c, posX(k), y + 37, posX(k), y + 54, line, 2))
    if (i < 2 || result > 0) {
      const v = probe(weights).out
      alpha(c, i < 2 ? 1 : result, () => {
        circle(c, posX(v), y + 44, 12, i === 2 ? rust : teal)
        mid(c, fmt(v, 3), posX(v), y + 4, 34, i === 2 ? rust : teal)
      })
    }
    if (i === 2 && !result) text(c, 'Same input → ?', 1130, y - 2, 34, quiet, 'Sans')
  }
  if (b >= 3)
    foot(
      c,
      '40 old heads / 5 groups = 8 K/V slices per group',
      'Pool compatible K/V biases. Retain Q and output initialization, adapt, then evaluate held-out quality.',
    )
  else if (result > 0)
    foot(
      c,
      'Same two inputs    ·    softmax([0, 0]) = [0.5, 0.5]    →    5',
      'The new projections change both head results before any cached decode comparison.',
    )
  else
    foot(
      c,
      pooledReady
        ? 'What will the pooled heads return on those same rows?'
        : 'Input 0 selects the first weight. Input 1 selects the second.',
      'The two original heads each assign about 0.881 of their attention to the position carrying value 10.',
    )
}
function latentScene(c, cl) {
  const b = section(cl)
  if (b === 0) {
    frame(
      c,
      'LATENT ATTENTION  /  ONE CACHED POSITION',
      'Store a learned content latent',
      'Illustrated absorbed decode layout     ·     stored numbers per token in one layer',
    )
    const x = 525,
      px = 0.59
    text(c, 'GQA • 8 heads', 94, 413, 42, ink, 'Serif')
    for (let j = 0; j < 8; j++) {
      const xx = x + j * 256 * px
      rect(c, xx, 360, 128 * px - 2, 121, pale, 3, teal)
      rect(c, xx + 128 * px, 360, 128 * px - 2, 121, peach, 3, rust)
      mid(c, 'K', xx + 64 * px, 422, 29, teal)
      mid(c, 'V', xx + 192 * px, 422, 29, rust)
    }
    text(c, '8 × (128 + 128) = 2,048', x, 529, 35, ink, 'Mono')
    text(c, 'DeepSeek-V2', 94, 675, 42, ink, 'Serif')
    rect(c, x, 621, 512 * px, 111, teal, 4)
    rect(c, x + 512 * px, 621, 64 * px, 111, gold, 3)
    mid(c, 'latent 512', x + 256 * px, 677, 37, white)
    text(c, '64 positional coordinates', x + 576 * px + 32, 685, 35, ink)
    foot(
      c,
      '512 + 64 = 576 stored numbers',
      'A learned down-projection compresses joint content. Each head still has a distinct query.',
    )
  } else {
    const show = cue(cl, 2, 'It gives one', 0.5),
      final = cue(cl, 2, 'This projected query') > 0
    frame(
      c,
      'LATENT ATTENTION  /  CONTENT TERM',
      'Two paths to the same dot product',
      'Up-projection W = [[1, 2], [0, 1]]     ·     current q = [1, 0]     ·     cached c = [1, 2]',
    )
    const xx = [300, 950, 1567],
      width = 404
    function pathRow(y, labels, values, a) {
      for (let i = 0; i < 3; i++) {
        if (i < 2) stroke(c, xx[i] + width / 2, y + 30, xx[i + 1] - width / 2, y + 30, line, 4)
        rect(
          c,
          xx[i] - width / 2,
          y - 15,
          width,
          92,
          i === 1 ? pale : white,
          8,
          i === 1 ? teal : line,
        )
        mid(c, labels[i], xx[i], y - 55, 34, quiet, 'Sans')
        if (i === 0 || a[i] > 0)
          alpha(c, i === 0 ? 1 : a[i], () => mid(c, values[i], xx[i], y + 33, 46, ink))
      }
    }
    pathRow(
      431,
      ['Cached latent', 'Expand   Wc', 'Score   q · Wc'],
      [vec(latent), vec(key), dot(q, key)],
      [1, 1, 1],
    )
    if (b === 2)
      pathRow(
        678,
        ['Current query', 'Absorb   W^Tq', 'Score   (W^Tq) · c'],
        [vec(q), vec(absorbed), dot(absorbed, latent)],
        [1, show, +final],
      )
    foot(
      c,
      b === 1 ? 'Wc = [1 × 1 + 2 × 2,  0 × 1 + 1 × 2]' : 'q · (Wc) = (W^Tq) · c',
      b === 2
        ? 'One projected query can read every latent. A linear value projection can follow the weighted sum.'
        : 'Expanding each historical content key repeats this operation for each position.',
    )
  }
}
function rotation(c, cl) {
  const b = section(cl),
    t = cue(cl, 1, 'Watch the rotation', 1.6),
    v = rotated(t)
  if (b === 2) {
    frame(
      c,
      'LATENT ATTENTION  /  DECOUPLED POSITION',
      'Give position its own score',
      'One reusable content query per head     ·     one position-dependent key per token',
    )
    const xx = 211,
      ww = 954
    for (let i = 0; i < 2; i++) {
      const y = 365 + i * 219
      rect(c, xx, y, ww, 127, i ? peach : pale, 12, i ? rust : teal)
      text(
        c,
        i ? 'Rotated positional query · positional key' : 'Absorbed content query · content latent',
        xx + 44,
        y + 64,
        42,
        ink,
        'Serif',
      )
      connection(c, xx + ww, y + 65, 1395, 538, i ? rust : teal, 5)
    }
    circle(c, 1424, 538, 57, white, quiet)
    mid(c, '+', 1424, 538, 65)
    text(c, 'scale', 1529, 523, 45, ink, 'Serif')
    text(c, 'then softmax', 1530, 584, 35, quiet)
    foot(
      c,
      'score = (content dot + position dot) / √(128 + 64)',
      'Illustrated 128-wide content score and 64-wide position score. Softmax runs over visible positions.',
    )
    return
  }
  frame(
    c,
    'LATENT ATTENTION  /  HISTORICAL POSITION',
    'Turn the key a quarter turn',
    'Same W, same latent [1, 2]     ·     fixed rotated query [1, 0] reads the horizontal coordinate',
  )
  const ox = 534,
    oy = 700,
    unit = 57
  stroke(c, 119, oy, 902, oy, line, 3)
  stroke(c, ox, 790, ox, 296, line, 3)
  range(13).forEach((i) =>
    stroke(c, ox + (i - 6) * unit, oy - 5, ox + (i - 6) * unit, oy + 5, quiet, 2),
  )
  const end = [ox + v.key[0] * unit, oy - v.key[1] * unit]
  stroke(c, ox, oy, ox + key[0] * unit, oy - key[1] * unit, line, 6)
  stroke(c, ox, oy, ...end, teal, 9)
  circle(c, ...end, 13, teal)
  stroke(c, end[0], end[1] + 16, end[0], oy, rust, 2.5)
  circle(c, end[0], oy, 10, rust)
  text(c, 'rotated key', 1042, 350, 33, quiet)
  text(c, vec(v.key, 2), 1042, 419, 64, teal, 'Mono')
  text(c, 'absorbed query   W^TR^Tq', 1042, 520, 35, quiet)
  text(c, vec(v.aq, 2), 1042, 589, 64, ink, 'Mono')
  text(c, 'horizontal score', 1042, 686, 35, quiet)
  text(c, fmt(v.score, 2), 1042, 753, 54, rust, 'Mono')
  foot(
    c,
    t === 1
      ? 'At 90°    [0, −1] · [1, 2] = −2'
      : t === 0
        ? 'At 0°    [1, 2] · [1, 2] = 5'
        : 'Rotating the expanded historical key',
    t === 0
      ? 'Test whether the absorbed query can be reused after a different position rotates the key.'
      : 'The gray ray preserves the identity-position key. The absorbed query changes with the key rotation.',
  )
}
function copies(c, cl) {
  const b = section(cl),
    expanded = cue(cl, 2, 'Place them beside', 0.85),
    total = cue(cl, 2, 'A native grouped kernel') > 0
  const kept = tempBytes(3) / mib,
    extra = tempBytes(24) / mib
  frame(
    c,
    'KERNEL  /  SIMULTANEOUS ALLOCATIONS',
    'Where does the memory go?',
    '1 layer   ·   2 requests   ·   1,024 positions   ·   width 64   ·   2 B/number   ·   24 queries',
  )
  const x = 531,
    w = 48
  function block(i, y, fill) {
    rect(c, x + i * w, y, w - 5, 81, fill, 3)
    stroke(c, x + i * w + 7, y + 40, x + i * w + w - 12, y + 40, paper, 2)
  }
  text(c, 'Retained cache', 94, 390, 46, ink, 'Serif')
  range(3).forEach((i) => block(i, 353, [teal, rust, ink][i]))
  text(c, kept + ' MiB   ·   3 heads', x + 3 * w + 25, 396, 39, teal, 'Mono')
  text(c, b === 0 ? 'Direct read' : 'Reference copies', 94, 615, 46, ink, 'Serif')
  if (b > 0) {
    rect(c, x, 574, 24 * w - 5, 81, null, 4, line)
    if (!expanded) mid(c, '8 copies per head   ·   materialized', x + 12 * w, 615, 36, quiet)
    alpha(c, expanded, () =>
      range(24).forEach((i) => block(i, 574, [teal, rust, ink][Math.floor(i / 8)])),
    )
    if (expanded > 0) text(c, extra + ' MiB   ·   24 expanded heads', x, 710, 39, ink, 'Mono')
  } else text(c, 'Query i reads KV floor(i / 8)', x, 615, 38, quiet)
  foot(
    c,
    total
      ? kept + ' MiB retained + ' + extra + ' MiB temporary = ' + (kept + extra) + ' MiB live'
      : b === 1
        ? 'What stays live while the repeated arrays are in use?'
        : 'Each block holds both K and V for one head.',
    'This reference path materializes copies. Native grouped dispatch can read compact K/V directly.',
  )
}
function mask(c, cl) {
  const b = section(cl)
  if (b === 0) {
    const written = cue(cl, 0, 'The latest query') > 0,
      advanced = cue(cl, 0, 'A stale write') > 0
    frame(
      c,
      'CACHE UPDATE  /  ONE REQUEST',
      'Append to the assigned position',
      'Logical positions in a dense example     ·     apply position rotation to Q and K     ·     V stays unrotated',
    )
    for (let pos = 0; pos < 3; pos++) {
      const x = 310 + pos * 514
      mid(c, 'Position ' + pos, x + 185, 358, 38, quiet)
      rect(c, x, 418, 370, 288, white, 9, line, 3)
      for (let g = 0; g < 2; g++) {
        const y = 460 + g * 117
        text(c, 'g' + g, x + 24, y + 33, 28, quiet, 'Mono')
        if (pos < 2 || written) tapePair(c, x + 95, y, 232, 66)
        else rect(c, x + 95, y, 232, 66, wash, 4, line)
      }
    }
    foot(
      c,
      advanced
        ? 'Length = 3    ·    retry at position 2 → reject'
        : written
          ? 'Read positions 0, 1, 2, including the newly stored pair per group.'
          : 'Next write position = 2',
      'Length belongs to this request. Physical locations come from the engine’s allocation.',
    )
  } else {
    const chunk = b === 3,
      fixed = cue(cl, 2, 'Use their absolute positions') > 0
    const count = chunk ? 5 : 3,
      xs = range(count).map((i) => 596 + i * (chunk ? 219 : 345))
    frame(
      c,
      'CACHE CORRECTNESS  /  CAUSAL MASK',
      chunk ? 'A chunk needs a boundary per row' : 'Which keys can position two see?',
      chunk
        ? 'Five valid key positions     ·     queries arrive together at absolute positions 3 and 4'
        : 'One latest query at position 2     ·     all scores zero     ·     comparison with full-prefix attention',
    )
    xs.forEach((x, i) => mid(c, 'key ' + i, x, 362, 34, quiet))
    const rows = chunk ? [3, 4] : [2]
    rows.forEach((qPos, r) => {
      const y = chunk ? 440 + 153 * r : 458,
        allowed = fixed ? visibleRow(qPos, count) : [0]
      text(c, 'Query at ' + qPos, 103, y + 49, 44, ink, 'Serif')
      range(count).forEach((i) => {
        const on = allowed.includes(i)
        rect(
          c,
          xs[i] - (chunk ? 89 : 126),
          y,
          chunk ? 178 : 252,
          105,
          on ? pale : wash,
          6,
          on ? teal : line,
          2,
        )
        mid(
          c,
          chunk ? (on ? 'read' : 'mask') : 'V = ' + maskValues[i],
          xs[i],
          y + 51,
          chunk ? 37 : 45,
          on ? teal : quiet,
        )
        if (!on && !chunk) stroke(c, xs[i] - 88, y + 75, xs[i] + 88, y + 28, quiet, 3)
      })
      if (!chunk)
        text(
          c,
          'Weights   [' +
            range(count)
              .map((i) => (allowed.includes(i) ? (allowed.length === 1 ? '1' : '1/3') : '0'))
              .join(', ') +
            ']',
          441,
          664,
          39,
          ink,
          'Mono',
        )
    })
    foot(
      c,
      chunk
        ? 'Read key j if j ≤ absolute query position and the key is valid.'
        : fixed
          ? 'Position-aware output = (1 + 2 + 9) / 3 = ' + maskedOut(visibleRow(2, 3))
          : 'Upper-left one-row mask → only key 0 → output ' + maskedOut([0]),
      chunk
        ? 'Check both chunk outputs against full-prefix recomputation in the same model.'
        : fixed
          ? 'With zero scores the visible values get equal weights.'
          : 'The upper-left triangle starts this single row at zero, despite the query’s absolute position.',
    )
  }
}
function transfer(c, cl) {
  const b = section(cl),
    owner = cue(cl, 1, 'Each history serves') > 0,
    priced = cue(cl, 2, 'The six logical histories') > 0
  const budget = b >= 3,
    verdict = cue(cl, 4, 'That rank needs') > 0
  frame(
    c,
    'ADMISSION  /  TENSOR PARALLEL',
    budget
      ? 'Can every rank admit this request?'
      : b === 2
        ? 'Price one copy on each rank'
        : 'Who keeps the history for Q19?',
    b >= 2
      ? '32 layers  ·  1 request  ·  1,024 positions  ·  width 64  ·  2 B/number  ·  one physical head per rank'
      : '48 query heads     ·     6 logical K/V histories     ·     12 tensor-parallel ranks     ·     contiguous assignment',
  )
  range(12).forEach((i) => {
    const col = i % 6,
      row = Math.floor(i / 6),
      x = 100 + col * 291,
      y = 320 + row * 238,
      w = 263,
      h = 206
    const first = i * ranks.queriesPerRank,
      last = first + ranks.queriesPerRank - 1,
      g = groupOf(first)
    const focus = cue(cl, 1, 'In this Llama') && g === groupOf(19) && !budget
    const blocked = verdict && free[i] < rankCost
    rect(c, x + 4, y + 6, w, h, line, 7)
    rect(
      c,
      x,
      y,
      w,
      h,
      blocked ? '#f5d6bd' : focus ? pale : white,
      7,
      blocked ? rust : focus ? teal : quiet,
      3,
    )
    rect(c, x, y, w, 45, blocked ? rust : ink, 6)
    text(c, 'Rank ' + i, x + 18, y + 22, 29, white, 'Mono')
    text(c, 'Q' + first + '–' + last, x + 16, y + 79, 35, ink, 'Mono')
    if (owner) text(c, 'KV ' + g, x + 16, y + 126, 31, teal, 'Mono')
    else if (first <= 19 && last >= 19) text(c, 'Q19 → ?', x + 16, y + 132, 29, rust, 'Mono')
    if (budget) {
      text(c, free[i] + ' MiB free', x + 16, y + 173, 27, blocked ? rust : quiet, 'Mono')
      rect(
        c,
        x + w - 40,
        y + 184 - free[i] * 12,
        23,
        free[i] * 12,
        free[i] < rankCost && verdict ? rust : teal,
      )
      stroke(c, x + w - 48, y + 184 - rankCost * 12, x + w - 9, y + 184 - rankCost * 12, ink, 3)
    } else if (priced) text(c, rankCost + ' MiB / copy', x + 16, y + 174, 26, quiet, 'Mono')
  })
  foot(
    c,
    verdict
      ? 'Rank 5:  7 MiB free < 8 MiB required    →    request does not fit'
      : budget
        ? sum(free) +
          ' MiB free across all ranks    ·    ' +
          rankCost * ranks.copies +
          ' MiB needed    ·    fits?'
        : b === 2 && !priced
          ? 'Per copy = 2 × 32 × 1,024 × 64 × 2 B'
          : priced
            ? '6 logical heads × 8 MiB = 48 MiB    ·    12 copies × 8 MiB = 96 MiB'
            : owner
              ? cue(cl, 1, 'In this Llama')
                ? 'floor(19 / 8) = 2    ·    ranks 4 and 5 each keep KV 2'
                : 'floor(19 / 8) = 2    ·    4 queries on each rank'
              : 'Q19 → which history?     Which ranks store it?',
    budget
      ? 'The black tick marks the eight-MiB local requirement. Spare capacity belongs to its rank.'
      : 'Illustrated Llama head-sharding layout. Each query retains its own weights and output.',
  )
}
const painters = {
  c01: opening,
  c02: attention,
  c03: mapScene,
  c04: layouts,
  c05: shapes,
  c06: byteBars,
  scale: scaleScene,
  reads,
  c07: pooling,
  latent: latentScene,
  rotation,
  copies,
  mask,
  c08: transfer,
}
function draw(c, clock) {
  painters[clock.beat.chapterId](c, clock)
}
function check() {
  assert.deepEqual(KV_KEYS[0], KV_VALUES[0])
  assert.deepEqual(KV_VALUES[0], basis)
  assert.deepEqual(
    heads.map((h) => h.g),
    [0, 0, 0, 0, 1, 1, 1, 1],
  )
  assert.deepEqual(shape(HEADS.gqaKV), [1, 2, 3, 4])
  assert.deepEqual(shape(HEADS.mhaKV), [1, 8, 3, 4])
  for (const g of [0, 1])
    for (const type of ['K', 'V'])
      assert.deepEqual(
        toyCells(g, type).map((row) => row.length),
        [4, 4, 4],
      )
  assert.deepEqual(
    heads.slice(0, 2).map((h) => h.out.map((v) => Number(v.toFixed(3)))),
    [
      [0.804, 0.196],
      [0.196, 0.804],
    ],
  )
  for (const h of heads) assert.ok(Math.abs(sum(h.weights) - 1) < 1e-12)
  assert.equal(HEADS.gqaKV * 3 - HEADS.gqaKV * 2, 2)
  assert.deepEqual(
    schemes.map((s) => raw(s.n, 3)),
    [768, 192, 96],
  )
  assert.deepEqual(
    schemes.map((s) => raw(s.n, 4)),
    [1024, 256, 128],
  )
  assert.deepEqual(
    [64, 8, 1].map((n) => (10 * gib) / large(n)),
    [1, 8, 64],
  )
  assert.equal(
    large(8) * 32,
    cacheBytes({ layers: 80, batch: 1, tokens: 131072, kvHeads: 8, width: 128, bytes: 2 }),
  )
  assert.equal(intensity(24, 6, 1), 8)
  assert.equal(timing(8).time, 64)
  assert.equal(timing(1).time, 57)
  assert.deepEqual(pooled, { k: [0, 0], v: [5, 5] })
  for (const w of scalarW) assert.equal(probe(w).out.toFixed(3), '8.808')
  assert.deepEqual(probe(pooled), { keys: [0, 0], vals: [5, 5], weights: [0.5, 0.5], out: 5 })
  assert.deepEqual(key, [5, 2])
  assert.deepEqual(absorbed, [1, 2])
  assert.equal(dot(q, key), dot(absorbed, latent))
  for (const t of [0, 0.25, 0.5, 0.75, 1])
    assert.ok(Math.abs(dot(rotated(t).aq, latent) - rotated(t).score) < 1e-12)
  assert.equal(fmt(rotated(1).score, 2), '-2')
  assert.deepEqual(
    [3, 24].map((n) => tempBytes(n) / mib),
    [1.5, 12],
  )
  assert.equal(maskedOut([0]), 1)
  assert.equal(maskedOut(visibleRow(2, 3)), 4)
  assert.deepEqual(visibleRow(3, 5), [0, 1, 2, 3])
  assert.deepEqual(visibleRow(4, 5), [0, 1, 2, 3, 4])
  assert.equal(groupOf(19), 2)
  assert.equal(rankOf(19), 4)
  assert.deepEqual(
    range(12).filter((i) => groupOf(i * ranks.queriesPerRank) === 2),
    [4, 5],
  )
  assert.deepEqual(ranks, { queriesPerRank: 4, kvPerRank: 1, copies: 12, replicas: 2 })
  assert.equal(rankCost, 8)
  assert.equal(sum(free), 106)
  assert.equal(rankCost * ranks.copies, 96)
  assert.deepEqual(
    range(12).filter((i) => free[i] < rankCost),
    [5],
  )
}
export default {
  title: 'Sharing Memory Across Attention Heads',
  preparePicture(schedule) {
    schedule.find(({ beat }) => beat.id === 'c04-b01')?.markCaption('for eight query heads')
  },
  draw,
  check,
}
