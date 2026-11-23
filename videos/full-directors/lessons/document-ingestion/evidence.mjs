import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { sourcePdf, PATCH_SCORES, OLD_VERSION, NEW_VERSION, freshBase } from '../../../films/document-ingestion/fixtures.mjs';
import { versionDiff } from '../../../films/document-ingestion/model.mjs';

export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export const rows = [
  ['Rollback failure', 'page on-call', '15 minutes', 'deploy ID'],
  ['Routine deploy notes', 'archive', '14 days', 'none'],
];
export function assemble(cells) {
  const [event, action, window, id] = cells;
  return event + ': ' + action + ' within ' + window + (id === 'none' ? '' : ' with ' + id) + '.';
}
export const [rule, archive] = rows.map(assemble);
export const crossed = rows[0].map((v, i) => i === 2 ? rows[1][2] : v);
export const columns = [
  ['Rollback failure:', 'page on-call within', '15 minutes with deploy ID.'],
  ['Routine deploy notes:', 'archive within', '14 days.'],
];
export const scrambled = columns[0].map((v, i) => v + ' ' + columns[1][i]);
export const comparison = [rule, '', scrambled.join('\n')];
export const compact = text => text.trim().replace(/\s+/g, ' ');
export const reviewed = (candidate, expected) => compact(candidate) === compact(expected);
export const suspect = rule.replace('15', '1S');
export const prefixed = 'Obsolete rule. ' + rule;

export const html = [
  '<nav>Archive in 14 days.</nav>', '<main><p>Rollback failure.</p>',
  '<p>Page within 1<strong>5</strong> minutes.</p></main>',
].join('');
// The drawing exercises only the well-formed, static prose fixtures shown in the lesson.
export function mainText(source) {
  const main = source.match(/<main>([\s\S]*?)<\/main>/)?.[1];
  if (main === undefined) return null;
  return compact(main.replace(/<(script|style)>[\s\S]*?<\/\1>/g, '')
    .replace(/<\/?p>|<br>/g, ' ').replace(/<[^>]+>/g, '')) || null;
}
export const htmlCases = [
  '<main><p>Page within 1<strong>5</strong> minutes.</p></main>',
  '<main><p>Rollback failure.</p><p>Include deploy ID.</p></main>',
  '<nav>Archive in 14 days.</nav><main><p>Page now.</p></main>',
  '<p>No main.</p>', '<main><script>hidden()</script></main>',
];
export const quickstart = ['## Agent command', '~~~bash', 'echo pay-742', '~~~'];
export const mdLines = [
  'Incident response handbook.', '## Rollback failure', 'Page within 15 minutes with deploy ID.', '',
  '## Agent command', '~~~bash', '    # Keep the deploy ID', 'incidentctl rollback --service payments-api', '~~~', '',
  '## Agent command', 'Include the deploy ID in the incident report.  ',
];
// Source maps from the top-level heading tokens of this example.
export const sections = [0, 1, 4, 10].map((start, index, starts) => {
  const end = starts[index + 1] ?? mdLines.length;
  return {start, end, heading: start ? mdLines[start].slice(3) : 'Preamble',
    text: mdLines.slice(start, end).join('\n') + '\n'};
});
const files = new Map([6, 7].map(rev => {
  const sentence = rule.replace('15', rev === 6 ? '30' : '15');
  const passage = sentence + '\n' + archive;
  return [rev, {file: 'runbook.pdf', rev, page: 7, heading: rows[0][0], text: sentence, passage,
    rawHash: hash(sourcePdf('Release runbook / revision '+rev+'\n'+passage))}];
}));
export function citation(rev) {
  const opened = files.get(rev);
  return {recordRev: 7, text: rule, textHash: hash(rule), opened,
    matches: opened.rev === 7 && reviewed(opened.text, rule)};
}
export const shortRule = rule.replace(' with deploy ID', '');
export const sources = [['paging-card.pdf', 'page 7'], ['scan.png', 'page 1'], ['runbook.html', '#rollback']];
export const chunkPage = citation(7).opened;
const passage = chunkPage.passage;
export const chunks = [[0, passage.indexOf('\n')], [passage.indexOf('with deploy ID.'), passage.length]]
  .map(([start, end]) => ({start, end, text: passage.slice(start, end), source: chunkPage}));
export const overlapText = passage.slice(chunks[1].start, chunks[0].end);
export const sectionDiff = versionDiff(OLD_VERSION, NEW_VERSION);
export function followingRelease(grantMoved) {
  const next=NEW_VERSION.map(r=>r.id==='rollback'?
    {...r,text:hash(rule.replace('15','10')),access:grantMoved?['incident commanders']:r.access}:r);
  return versionDiff(NEW_VERSION,next);
}
export const editions = [
  {7:'30 minutes',8:'14 days',9:'Deploy ID'},
  {7:'15 minutes',8:'14 days',10:'Commander review'},
];
const pageRecords = edition => Object.entries(edition).map(([id,text]) => ({id,text,access:['ops']}));
export const pageDiff = versionDiff(...editions.map(pageRecords));
export const patchPages = [
  {title:'Release runbook', regions:['Release runbook', 'Page within 15 minutes.', 'Operations handbook'], scores:PATCH_SCORES},
  {title:'Time log', regions:['Section 15', 'Log time spent in minutes.', 'Operations handbook'],
    scores:[[PATCH_SCORES[0][1],PATCH_SCORES[0][0],PATCH_SCORES[0][2]],PATCH_SCORES[1]]},
].map(page => {
  const winners = page.scores.map(row => row.indexOf(Math.max(...row)));
  const maxima = page.scores.map((row,i) => row[winners[i]]);
  return {...page, winners, maxima, score:maxima.reduce((a,b)=>a+b)};
});
export const vectorPack = {side:32, text:6, dims:128, bytes:2};
vectorPack.vectors = vectorPack.side ** 2 + vectorPack.text;
vectorPack.kib = vectorPack.vectors * vectorPack.dims * vectorPack.bytes / 1024;
export function manifest(quarantine) {
  return ['Native PDF', 'OCR scan', 'HTML main', 'Markdown'].map((name,i) => {
    const quality = i === 1 ? 'review · 1S' : 'ready';
    const trust = i === 2 && quarantine ? 'quarantine' : 'untrusted source';
    return {name, quality, trust, index:quality === 'ready' && trust === 'untrusted source'};
  });
}
export const budget = {packed:4, potential:1024, cap:128};
export const expand = requested => Math.min(requested, budget.cap);
export const restore = {
  source:freshBase.reviewedText, candidate:freshBase.text, id:'B41', minute:3*60+12,
  window:Number(freshBase.reviewedText.match(/within (\d+) minutes/)[1]),
};
export const time = minute => Math.floor(minute/60) + ':' + String(minute%60).padStart(2,'0');
export function restoreRecord(corrected, restricted, reader) {
  const text = corrected ? restore.source : restore.candidate;
  const access = restricted ? 'incident commander' : 'ops';
  const ready = corrected && reviewed(text, restore.source);
  return {text, hash:hash(text), ready, access, readable:ready && access === reader};
}
export function check() {
  assert.equal(rule,'Rollback failure: page on-call within 15 minutes with deploy ID.');
  assert.equal(assemble(crossed),'Rollback failure: page on-call within 14 days with deploy ID.');
  assert.deepEqual(comparison.map(s=>s.length),[64,0,110]);
  assert(!reviewed(compact(comparison[2]),rule));
  assert(reviewed('  '+rule.replaceAll(' ', '   '),rule));
  for (const text of [suspect,prefixed,rule+' '+rule.replace('15','30')]) assert(!reviewed(text,rule));
  assert.equal(mainText(html),'Rollback failure. Page within 15 minutes.');
  assert.deepEqual(htmlCases.map(mainText),['Page within 15 minutes.','Rollback failure. Include deploy ID.','Page now.',null,null]);
  assert.deepEqual(sections.map(s=>s.start+1),[1,2,5,11]);
  assert.equal(sections[2].heading,sections[3].heading);
  assert.equal(sections.map(s=>s.text).join(''),mdLines.join('\n')+'\n');
  assert(sections[2].text.includes('~~~bash\n    #') && sections[3].text.endsWith('  \n'));
  const stale = citation(6), fixed = citation(7);
  assert.equal(stale.textHash,fixed.textHash);
  assert(!stale.matches && fixed.matches && stale.opened.text.includes('30 minutes'));
  assert.notEqual(stale.opened.rawHash,fixed.opened.rawHash);
  assert.equal(hash(shortRule).slice(0,10),'698f1d0be3');
  assert.equal(hash(chunks[0].text), fixed.textHash);
  assert.equal(chunks[0].text, fixed.opened.text);
  assert.equal(overlapText, 'with deploy ID.');
  assert(chunks[0].text.endsWith(overlapText) && chunks[1].text.startsWith(overlapText));
  assert.equal(chunks[0].text + chunks[1].text.slice(overlapText.length), fixed.opened.passage);
  for (const chunk of chunks) {
    assert.equal(chunk.source, fixed.opened);
    assert.equal(chunk.text, fixed.opened.passage.slice(chunk.start, chunk.end));
  }
  assert.deepEqual(pageDiff,{added:['10'],removed:['9'],changed:['7'],access:[]});
  assert.deepEqual(sectionDiff,{added:['freeze'],removed:['pager-test'],changed:['archive'],access:['rollback']});
  assert.deepEqual(followingRelease(false),{added:[],removed:[],changed:['rollback'],access:[]});
  assert.deepEqual(followingRelease(true),{added:[],removed:[],changed:['rollback'],access:['rollback']});
  assert.deepEqual(patchPages.map(p=>p.winners),[[1,1],[0,1]]);
  assert.deepEqual(patchPages.map(p=>p.score.toFixed(2)),['1.79','1.79']);
  assert.equal(vectorPack.kib,257.5);
  assert.deepEqual(manifest(false).map(r=>r.index),[true,false,true,true]);
  assert.deepEqual(manifest(true).map(r=>r.index),[true,false,false,true]);
  assert.equal(expand(48),48);
  assert.equal(expand(budget.potential),budget.cap);
  const access = [restoreRecord(false,false,'ops'),restoreRecord(true,false,'ops'),
    restoreRecord(true,true,'ops'),restoreRecord(true,true,'incident commander')];
  assert.deepEqual(access.map(r=>r.readable),[false,true,false,true]);
  assert.equal(access[1].hash, access[2].hash);
  assert.notEqual(access[0].hash, access[1].hash);
  assert.equal(time(restore.minute + restore.window),'3:37');
  assert.equal(restore.id,'B41');
  return true;
}
