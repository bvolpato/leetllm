import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { loadImage } from '@napi-rs/canvas'
import { boundDecision } from '../../../films/design-real-time-content-moderation-system/model.mjs'

const title = 'Which bird did the reviewer approve?'
const beats = [
  {
    id: 'send-the-portrait',
    say: "There goes the kingfisher. The club sent its new profile picture for review. Visitors still see the initials down below.",
    hold: 0.6,
  },
  {
    id: 'change-the-upload',
    say: "The club changes its picture while the review is still open. Look at the long neck on the new bird. Which picture will the next decision cover?",
    hold: 1.6,
  },
  {
    id: 'the-old-approval',
    say: "An approval comes back. Follow the check mark. It belongs to the blue kingfisher, revision seven.",
    hold: 0.8,
  },
  {
    id: 'hold-the-egret',
    say: "The white egret is revision eight. Both uploads belong to the same club. If the service checked only the profile name, the egret could go public on the kingfisher's approval. Comparing the revisions keeps it pending.",
    hold: 1,
  },
  {
    id: 'review-the-edit',
    say: "Now the reviewer gets the egret itself. This approval names revision eight. The service checks that the revision is current, the same policy applies to this profile, and the upload is still pending.",
    hold: 0.7,
  },
  {
    id: 'commit-the-decision',
    say: "The service checks those conditions and saves both the decision and its publication event in one database transaction. That keeps a second edit from slipping between the check and the write.",
    hold: 0.5,
  },
  {
    id: 'public-portrait',
    say: "Watch the initials. Now visitors see the egret.",
    hold: 2.7,
  },
]

// The profile selects one item. Both results arrive at that same item's conditional write.
const profile = { revision: 7, scope: 'profile-eu', policy: 'v44', state: 'PENDING', applied: {} }
const edited = { ...profile, revision: profile.revision + 1 }
const oldApproval = { id: 'K', revision: profile.revision, scope: profile.scope, policy: profile.policy, action: 'ALLOW' }
const newApproval = { ...oldApproval, id: 'E', revision: edited.revision }

function commit(item, decision, outbox) {
  const result = boundDecision(item, decision)
  if (result.status !== 'APPLIED') return { ...result, outbox }
  return {
    ...result,
    outbox: [...outbox, { decision: decision.id, revision: item.revision, state: result.item.state }],
  }
}

const oldAttempt = commit(edited, oldApproval, [])
const freshAttempt = commit(oldAttempt.item, newApproval, oldAttempt.outbox)
const publishedRevision = freshAttempt.outbox.find(event => event.state === 'PUBLISHED')?.revision

function check() {
  assert.equal(oldAttempt.status, 'STALE')
  assert.equal(oldAttempt.item.state, 'PENDING')
  assert.deepEqual(oldAttempt.outbox, [])
  assert.equal(freshAttempt.status, 'APPLIED')
  assert.equal(freshAttempt.item.state, 'PUBLISHED')
  assert.deepEqual(freshAttempt.outbox, [{ decision: 'E', revision: 8, state: 'PUBLISHED' }])
  assert.equal(publishedRevision, newApproval.revision)
  const replay = commit(freshAttempt.item, newApproval, freshAttempt.outbox)
  assert.equal(replay.status, 'DUPLICATE')
  assert.deepEqual(replay.outbox, freshAttempt.outbox)
  for (const different of [{ policy: 'v45' }, { scope: 'profile-us' }, { state: 'CLOSED' }]) {
    const skipped = commit({ ...edited, ...different }, newApproval, [])
    assert.deepEqual(skipped.outbox, [])
  }
}

async function artwork(file) {
  return loadImage(await readFile(new URL(file, import.meta.url)))
}
const [kingfisher, egret, marsh] = await Promise.all([
  artwork('./kingfisher.svg'), artwork('./egret.svg'), artwork('./marsh.svg'),
])
const portraits = new Map([[profile.revision, kingfisher], [edited.revision, egret]])
const ink = '#243747'
const paper = '#faf6eb'
const pond = '#176650'
const currentX = 568
const reviewerX = 1352
const eyeLine = 334
const radius = 208

function clamp(n) { return Math.max(0, Math.min(1, n)) }
function ease(n) { n = clamp(n); return n * n * (3 - 2 * n) }
function mix(a, b, t) { return a + (b - a) * t }

function circle(ctx, x, y, r) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
}
function type(ctx, value, x, y, size, { color = ink, face = 'Sans', weight = 500, align = 'center' } = {}) {
  ctx.font = weight + ' ' + size + 'px "Lesson ' + face + '"'
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(value, x, y)
}
function line(ctx, x, y, xx, yy, color, width) {
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(xx, yy)
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.stroke()
}

// All crops use the same framing, from the private upload through the public avatar.
function portrait(ctx, revision, x, y, r, border = true) {
  ctx.save()
  if (border) {
    circle(ctx, x, y + 3, r + 6)
    ctx.fillStyle = '#d3cdbd'
    ctx.fill()
    circle(ctx, x, y, r + 5)
    ctx.fillStyle = '#fffcf4'
    ctx.fill()
  }
  circle(ctx, x, y, r)
  ctx.clip()
  ctx.drawImage(portraits.get(revision), x - r, y - r, 2 * r, 2 * r)
  ctx.restore()
}

// A single crop window stays in place while its owner chooses another image.
function changePortrait(ctx, blend) {
  portrait(ctx, blend === 1 ? edited.revision : profile.revision, currentX, eyeLine, radius)
  if (blend === 0 || blend === 1) return
  ctx.save()
  circle(ctx, currentX, eyeLine, radius)
  ctx.clip()
  const edge = currentX + radius - 2 * radius * blend
  ctx.beginPath()
  ctx.rect(edge, eyeLine - radius, 2 * radius, 2 * radius)
  ctx.clip()
  portrait(ctx, edited.revision, currentX, eyeLine, radius, false)
  line(ctx, edge + 1.5, eyeLine - radius, edge + 1.5, eyeLine + radius, '#fff7d9', 3)
  ctx.restore()
}

function checkMark(ctx, x, y, size, color) {
  ctx.beginPath()
  ctx.moveTo(x - size * 0.48, y)
  ctx.lineTo(x - size * 0.12, y + size * 0.36)
  ctx.lineTo(x + size * 0.54, y - size * 0.35)
  ctx.lineWidth = size * 0.17
  ctx.lineCap = ctx.lineJoin = 'round'
  ctx.strokeStyle = color
  ctx.stroke()
}
function approvalMark(ctx, x, y, t) {
  if (!t) return
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(-0.065)
  const scale = 0.96 + 0.24 * t
  ctx.scale(scale, scale)
  ctx.globalAlpha *= t
  ctx.beginPath()
  ctx.roundRect(-88, -32, 176, 65, 33)
  ctx.fillStyle = pond
  ctx.fill()
  ctx.strokeStyle = paper
  ctx.lineWidth = 5
  ctx.stroke()
  checkMark(ctx, -53, 1, 26, '#fffaf0')
  type(ctx, 'Allow', 19, 13, 35, { color: '#fffaf0', weight: 600 })
  ctx.restore()
}

function revisionLabel(ctx, revision, x, alpha = 1) {
  ctx.save()
  ctx.globalAlpha *= alpha
  type(ctx, 'Revision ' + revision, x, 610, 48, { weight: 600 })
  ctx.restore()
}
function comparison(ctx, matched, t) {
  if (!t) return
  ctx.save()
  ctx.globalAlpha = t
  const color = matched ? pond : '#974a3a'
  for (const side of [-1, 1]) {
    line(ctx, 960 + side * 58, 594, 960 + side * mix(58, 242, t), 594, '#bcafa1', 2.5)
  }
  line(ctx, 940, 587, 980, 587, color, 5)
  line(ctx, 940, 601, 980, 601, color, 5)
  if (!matched) line(ctx, 972, 571, 948, 617, color, 5)
  ctx.restore()
}

function publicProfile(ctx, camera, delivered) {
  const top = mix(714, 0, camera)
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, top, 1920, 1080 - top)
  ctx.clip()
  // Uncrop the river below the same sunset as the visitor's view fills the frame.
  ctx.drawImage(marsh, 0, top - mix(132, 0, camera), 1920, 1080)
  const x = mix(275, 428, camera)
  const y = top + mix(150, 403, camera)
  const r = mix(95, 195, camera)
  const tx = x + r + mix(53, 71, camera)
  ctx.save()
  circle(ctx, x, y, r + 6)
  ctx.fillStyle = '#fcf2df'
  ctx.fill()
  circle(ctx, x, y, r)
  ctx.clip()
  ctx.fillStyle = '#354157'
  ctx.fillRect(x - r, y - r, 2 * r, 2 * r)
  type(ctx, 'RB', x, y + r * 0.33, r * 0.93, { color: '#f3e7d3', face: 'Serif' })
  if (delivered && publishedRevision !== undefined) {
    ctx.globalAlpha *= delivered
    portrait(ctx, publishedRevision, x, y, r, false)
  }
  ctx.restore()
  type(ctx, 'Public profile', tx + 4, y - mix(14, 24, camera), mix(39, 44, camera), { color: '#fff2d9', align: 'left' })
  type(ctx, 'Reedbank Birders', tx, y + mix(62, 77, camera), mix(71, 95, camera), { face: 'Serif', color: '#fff9ea', align: 'left' })
  ctx.restore()
}

function draw(ctx, clock) {
  const { index, elapsed, reveal } = clock
  const gradient = ctx.createLinearGradient(0, 0, 1920, 680)
  gradient.addColorStop(0, '#faf3e1')
  gradient.addColorStop(0.55, '#faf7ef')
  gradient.addColorStop(1, '#e7eae4')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1920, 1080)

  ctx.save()
  const opening = index === 0 ? 1 - ease(elapsed / 2.3) : 0
  const zoom = mix(1, 2.05, opening)
  ctx.translate(960, 540)
  ctx.scale(zoom, zoom)
  ctx.translate(-mix(960, 605, opening), -mix(540, eyeLine, opening))

  const firstSend = index === 0 ? ease((elapsed + 0.10) / 1.35) : 1
  const edit = index < 1 ? 0 : index === 1 ? ease(reveal('The club changes', 0.92)) : 1
  const freshSend = index < 4 ? 0 : index === 4 ? ease(elapsed / 1.45) : 1
  const fresh = freshSend === 1
  const approved = index === 2 ? ease((elapsed + 0.06) / 0.42)
    : index === 3 ? 1
    : index === 4 ? ease(reveal('This approval', 0.42))
    : index > 4 ? 1 : 0
  const recorded = index > 5 || (index === 5 && reveal('in one database transaction') === 1)
  const currentState = recorded ? freshAttempt.item.state : oldAttempt.item.state

  const labelOpacity = index === 0 ? ease((elapsed - 1.64) / 0.66) : 1
  ctx.save()
  ctx.globalAlpha = labelOpacity
  type(ctx, 'Current upload', currentX, 81, 48, { face: 'Serif' })
  type(ctx, 'Moderation review', reviewerX, 81, 48, { face: 'Serif' })
  ctx.restore()
  changePortrait(ctx, edit)
  ctx.save()
  ctx.globalAlpha = labelOpacity
  revisionLabel(ctx, edit < 0.5 ? profile.revision : edited.revision, currentX)
  type(ctx, currentState === 'PUBLISHED' ? 'Approved' : 'Pending', currentX, 663, 40, {
    color: currentState === 'PUBLISHED' ? pond : '#74592f',
  })

  ctx.restore()

  const send = index < 4 ? firstSend : freshSend
  const sentRevision = index < 4 ? profile.revision : edited.revision
  if (index === 4 && !fresh) {
    ctx.save()
    ctx.globalAlpha = 1 - freshSend
    portrait(ctx, oldApproval.revision, reviewerX, eyeLine, radius)
    approvalMark(ctx, reviewerX + 133, eyeLine + 160, 1)
    ctx.restore()
  }
  const arc = Math.sin(send * Math.PI)
  portrait(ctx, sentRevision, mix(currentX, reviewerX, send), eyeLine - 48 * arc, radius * (1 - 0.22 * arc))
  const approval = fresh ? newApproval : oldApproval
  revisionLabel(ctx, approval.revision, reviewerX, index === 4 && !fresh ? 1 - freshSend : firstSend * labelOpacity)
  approvalMark(ctx, reviewerX + 133, eyeLine + 160, approved)
  if (index === 3) comparison(ctx, oldApproval.revision === edited.revision, ease(elapsed / 0.6))
  if (index === 4 && fresh) comparison(ctx, newApproval.revision === edited.revision, approved)
  if (index > 4) comparison(ctx, newApproval.revision === edited.revision, 1)

  const camera = index === 6 ? 1 : index === 5 ? ease(reveal('That keeps a second edit', 2.15)) : 0
  const delivery = index === 6 ? ease(reveal('the initials', 0.82)) : 0
  publicProfile(ctx, camera, delivery)
  ctx.restore()
}

export default { title, beats, draw, check }
