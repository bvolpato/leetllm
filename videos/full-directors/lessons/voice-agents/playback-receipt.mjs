import assert from 'node:assert/strict';
import {acknowledge, buildInterruptedReply, chunks, pendingText} from '../../../films/voice-agents/fixtures.mjs';
import {handset} from './handset.mjs';
import {drawReceiptPCM} from './receipt-pcm.mjs';
export {prepareReceiptPicture} from './receipt-pcm.mjs';

const {interrupt, activeReply} = buildInterruptedReply();
const prefix = interrupt.retained.split(' ');
const caller = 'Wait, page the owner.'.split(' ');
const opening = ['receipt-hotline', 'receipt-alex', 'receipt-recall', 'receipt-buffer', 'receipt-history'];
const ink = '#252031', blue = '#204f67', red = '#a53828', gray = '#726774';
const left = 478;
const face = '400 78px "Lesson Serif"';

function spokenWords(clock, words) {
  return words.filter(word => clock.reveal(word, 0) === 1);
}

export function receiptState(clock) {
  const beat = opening.indexOf(clock.beat.id);
  if (beat === -1) return null;
  const heard = beat === 0 ? spokenWords(clock, prefix) : prefix;
  const alex = beat === 1 ? spokenWords(clock, caller) : [];
  const cut = beat > 1 || alex.length > 0;
  const question = beat === 2 && clock.reveal('Which words', 0) === 1;
  const receipt = beat === 4 && clock.reveal('open', 0) === 1;
  const history = beat === 4 && clock.reveal('Those three words', 0) === 1;
  const hidden = question || beat === 3 || (beat === 4 && !receipt);
  return {heard, alex, cut, question, hidden, receipt, history, beat};
}

function text(g, value, x, y, font, color) {
  g.font = font;
  g.fillStyle = color;
  g.fillText(value, x, y);
}

function line(g, x1, y1, x2, y2, width, color) {
  g.strokeStyle = color;
  g.lineWidth = width;
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.stroke();
}

export function drawPlaybackReceipt(g, clock) {
  const s = receiptState(clock);
  if (!s) return false;
  const gradient = g.createLinearGradient(0, 0, 1830, 1070);
  gradient.addColorStop(0, '#e5d6df');
  gradient.addColorStop(.35, '#f6efe9');
  gradient.addColorStop(1, '#fff9ed');
  g.fillStyle = gradient;
  g.fillRect(0, 0, 1920, 1080);
  handset(g);
  const label = '600 47px "Lesson Sans"';
  text(g, 'Incident hotline   /   4219', left, 110, '400 42px "Lesson Mono"', gray);
  const title = s.history ? 'The next turn' : s.question || s.beat >= 3 ? 'What did Alex hear?' : 'Alex’s phone';
  text(g, title, left, 242, '400 88px "Lesson Serif"', ink);

  // The edge moves by the width of each heard word. It freezes at the last receipt.
  g.font = face;
  const phrase = s.heard.join(' ');
  const edge = left + g.measureText(interrupt.retained).width + 30;
  const cursor = left + (phrase ? g.measureText(phrase).width + 30 : 0);
  const queuedX = edge + 44;
  const pcm = clock.pictureData?.playbackReceipt;
  text(g, s.history ? 'Assistant history' : s.receipt ? 'Playback receipt' : 'Hotline',
    left, 378, label, blue);
  text(g, s.history ? 'Discarded' : pcm ? 'Queued · recorded fixture' : 'Queued', queuedX, 378, label, gray);
  if (s.hidden) {
    g.font = face;
    let x = left;
    for (const word of prefix) {
      const width = g.measureText(word).width;
      line(g, x, 500, x + width, 500, 5, '#857c83');
      x += width + g.measureText(' ').width;
    }
  } else {
    text(g, phrase, left, 511, face, ink);
  }
  // The two remaining chunks are the unplayed continuation from the incident fixture.
  for (const [i,chunk] of chunks.slice(2).entries()) {
    text(g, chunk.text.trimStart(), queuedX, 491 + i * 70, '400 57px "Lesson Serif"', gray);
  }
  line(g, cursor, 424, cursor, 554, 7, s.cut ? red : blue);
  if (pcm) drawReceiptPCM(g, pcm, s.beat === 0 ? clock.elapsed : Infinity, left, edge, 1844, 623);

  if (s.alex.length) {
    text(g, 'Alex', left, 699, label, red);
    text(g, '“' + s.alex.join(' ') + (s.alex.length === caller.length ? '”' : ''), left, 806,
      '400 85px "Lesson Serif"', red);
  } else if (s.history) {
    text(g, 'Last playback receipt', left, 716, label, blue);
    text(g, interrupt.acknowledgedThrough + ' ms', left, 809, '400 72px "Lesson Mono"', ink);
  }
  return true;
}

export function checkPlaybackReceipt() {
  assert.equal(chunks.map(chunk => chunk.text).join(''), pendingText);
  assert.deepEqual(chunks.map(chunk => [chunk.endMs, chunk.endChar]), [[240,11],[520,16],[860,37],[1120,64]]);
  assert.equal(pendingText.slice(0, chunks[1].endChar), interrupt.retained);
  assert.deepEqual(prefix, ['Incident', 'is', 'open']);
  assert.equal(chunks.slice(2).map(chunk => chunk.text).join('').trimStart(), interrupt.discarded);
  assert.deepEqual([interrupt.acknowledgedThrough, interrupt.replyElapsedMs, activeReply.receivedThrough], [520,650,1120]);
  const {activeReply: frozen} = buildInterruptedReply();
  assert.equal(acknowledge(frozen, {session: frozen.session, response: frozen.response, cursor: 1120}), false);
  assert.equal(frozen.frozenCursor, 520);
  return true;
}
