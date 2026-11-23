import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import * as m from '../../../films/tokenization/model.mjs';
import rainbow from '../../../director-cuts/lessons/tokenization/film.mjs';
export { m, rainbow };

export const pieces = m.PIECES.map(([name]) => name);
export const ids = [m.IDS_A, m.IDS_B].map(v => pieces.map(k => v[k]));
export const firstMismatch = ids[0].findIndex((id, i) => id !== ids[1][i]);
export const decode = (id, vocab) => Object.keys(vocab).find(k => vocab[k] === id);
export const remap = table => {
  const result = table.slice();
  for (const piece of pieces) result[m.IDS_B[piece]] = table[m.IDS_A[piece]];
  return result;
};
export const fixedInput = remap(m.TABLE);
export const output = m.TABLE.map(([a, b, c]) => [c, a, b]);
export const fixedOutput = remap(output);
export const hidden = [0, 0, 1];
export function printNext(table, vocab) {
  const scores = table.map(row => m.dot(hidden, row));
  const id = scores.indexOf(Math.max(...scores));
  return { id, score: scores[id], piece: decode(id, vocab), scores };
}
export const stale = printNext(output, m.IDS_B);
export const fixed = printNext(fixedOutput, m.IDS_B);
export const otherMax = Math.max(...stale.scores.filter((_, i) => i !== stale.id && i !== fixed.id));
export const sparkleBytes = m.BYTE_CHARS[2].bytes;
function stream(bytes) {
  const decoder = new TextDecoder('utf-8', {fatal: true});
  let emitted = '';
  return ['', ...bytes.map(byte => {
    emitted += decoder.decode(Uint8Array.of(byte), {stream: true});
    return emitted;
  })];
}
export const sparkleStates = stream(sparkleBytes);
const competingRules = [['r','a'], ['a','i']];
export const ruleRuns = [competingRules, [...competingRules].reverse()].map(rules => ({
  rules, result: m.applyRules('rain', rules)
}));
export const lattice = [['▁rain'], ['▁', 'rain'], ['▁', 'ra', 'in']];
export function paths(whole = m.P.whole, removed) {
  return lattice.map(parts => {
    const factors = parts.map(part => part === '▁rain' ? whole : m.LATTICE_PROBS[part]);
    const live = !parts.includes(removed);
    return {parts, factors, live, score: live ? factors.reduce((a,b) => a*b,1) : 0};
  });
}
export const sum = xs => xs.reduce((a,b) => a+b,0);
export function sampling(exponent) {
  const weights = paths().map(p => p.score ** exponent);
  return weights.map(w => w / sum(weights));
}
export const langRatios = {English: 1, Italian: 1.6, Shan: 15};
export const langWindow = 30;
export const cellsPerEnglishPassage = 2;
export const windowParts = ['sys','sys','sys','role','rain','y','role','reply'];
export const special = '<|end|>';
export const ordinary = ['<','|','end','|','>'];
export const ordinaryIds = [40,12,63,12,41];
export const specialId = 7;
export const bracketed = [
  {parts:['<sys>', '…', '<user>', '…', '<asst>'], ids:[8,30,9,30,10]},
  {parts:['[','sys',']','…','[','user',']','…','[','asst',']'], ids:[51,72,52,30,51,73,52,30,51,74,52]}
];
export const rare = [
  ['rain',72,[.5,.6]], ['·falls',58,[.3,.5]], ['·the',100,[.6,.4]],
  ['ing',84,[.4,.3]], ['·SolidGoldMagikarp',1,[-.8,-.6]], ['·model',66,[.7,.6]]
];
export const raw = '  rain  falls ✨ ';
export const cleaned = raw.trim().replace(/ +/g, ' ');
export const marked = '▁' + cleaned.replaceAll(' ', '▁');
export const noFallback = marked.replace('✨', '�').slice(1).replaceAll('▁',' ');
export const snowball = m.wordpiece('snowball',['snow','##ball','snowb']);
export const snowPaths = [[.05],[.25,.4]].map(factors => factors.reduce((a,b)=>a*b,1));
export const stripWidths = [3,4].map(rate => 12/rate);
// Counts reported by the article's reader-tokenizer-code fixture with cl100k_base.
export const codeAudit = [
  {name:'Indentation', text:' '.repeat(16), tokens:1},
  {name:'Identifier', text:m.CAMEL.join(''), tokens:2},
  {name:'SHA-256 digest', text:createHash('sha256').update(m.SENTENCE).digest('hex'), tokens:38}
];
export const approx = (value, places=5) => Number(value.toFixed(places)).toString();

export function check() {
  rainbow.check();
  assert.deepEqual(ids, [[2,5,1,6],[2,1,5,6]]);
  assert.equal(pieces[firstMismatch], '·falls');
  assert.equal(decode(ids[1][firstMismatch],m.IDS_A), '·soft');
  for (const [n, vocab] of [m.IDS_A,m.IDS_B].entries()) {
    assert.equal(ids[n].map(id => decode(id,vocab)).join('').replaceAll('·',' '),m.SENTENCE);
  }
  assert.deepEqual(m.trainMerges(m.CORPUS,3).map(s=>s.positions),[30,23,16,11]);
  assert.deepEqual(m.applyRules('rainly',m.RULES),['rain','l','y']);
  assert.deepEqual(ruleRuns.map(run=>run.result),[m.ORDER_A,m.ORDER_B]);
  assert.equal(m.WHOLE.length,1);
  assert.equal(m.CHUNKS.flat().length,3);
  assert.equal(m.SPANS.join(''),m.SPAN_TEXT);
  assert.equal(m.MASKED,153);
  assert.deepEqual(sparkleBytes.map(m.hex),['E2','9C','A8']);
  assert.deepEqual(sparkleStates,['','','','✨']);
  assert.equal(m.BYTES.length,9);
  assert(m.TH.pair>m.BOW.pair && m.PROXY_RATIO>50);
  assert.deepEqual(m.TRAP_PASS.pieces,['[UNK]']);
  assert.equal(cleaned,'rain falls ✨');
  assert.equal(noFallback,'rain falls �');
  assert.deepEqual(paths().map(p=>p.score),m.PATHS);
  const best = p => p.reduce((a,b)=>a.score>b.score?a:b).parts;
  assert.deepEqual(best(paths(m.LOWERED)),['▁','rain']);
  assert.equal(sum(paths(undefined,'in').map(p=>p.score)).toFixed(5),'0.31500');
  assert.equal(sum(paths(undefined,'▁rain').map(p=>p.score)).toFixed(5),'0.01509');
  assert.deepEqual(m.PRUNE_ROUNDS.map(r=>r.size),[33,26,21]);
  assert(sampling(.25)[2]>sampling(1)[2]);
  assert.equal(m.DECOMPOSED.normalize('NFC'),m.COMPOSED);
  assert.equal(m.LIGATURE.normalize('NFKC'),m.SECOND_IDENTIFIER);
  assert.notEqual(m.LIGATURE.normalize('NFC'),m.SECOND_IDENTIFIER);
  for (const piece of pieces) assert.deepEqual(fixedInput[m.IDS_B[piece]],m.TABLE[m.IDS_A[piece]]);
  assert.equal(m.mebibytes(128000)-m.mebibytes(32000),1500);
  assert.equal(1-stripWidths[1]/stripWidths[0],.25);
  assert.equal(cellsPerEnglishPassage*langRatios.Shan,langWindow);
  assert.equal(m.GROUPS.join(''),m.NUMBER);
  assert.equal(m.CAMEL.join(''),'tokenCount');
  assert.deepEqual(codeAudit.map(r=>r.text.length),[16,10,64]);
  assert(codeAudit[2].tokens>sum(codeAudit.slice(0,2).map(r=>r.tokens)));
  assert.equal(sum(rare.map(([,n])=>n)),381);
  assert.equal(rare[4][1],1);
  assert.equal(windowParts.length,m.WINDOW+1);
  assert.equal(ordinary.join(''),special);
  assert(!ordinaryIds.includes(specialId));
  assert(bracketed.every(run=>run.parts.length===run.ids.length));
  assert.equal(m.SNOW[1].merged.count,9);
  assert.deepEqual(snowball.pieces,['[UNK]']);
  assert.equal(snowball.stuckAt,5);
  assert.equal(snowPaths[1],.1);
  assert.deepEqual([stale.id, stale.piece, fixed.id, fixed.piece],[5,'·soft',1,'·falls']);
  assert.equal(fixed.piece,printNext(output,m.IDS_A).piece);
  assert.equal(stale.score,fixed.score);
  assert.equal(stale.score,.7);
  assert.equal(otherMax,.5);
}

