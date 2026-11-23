#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { currentSourceFingerprint } from './lib/source-fingerprint.mjs';
import { reviewDigest } from './lib/curation.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LeetLLM · Visual lecture review</title><link rel="icon" href="favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="gallery.css"></head><body>
<header><a href="#" class="logo">Leet<span>LLM</span></a><span>PRIVATE LOCAL REVIEW</span></header>
<main><section class="intro"><p class="eyebrow">A COLLECTION WORTH WATCHING</p><h1>Let the picture do the teaching.</h1><p>Each lecture receives a separate visual-publication decision. POST means the explanation earns its place on screen. QUARANTINE preserves lessons that need a stronger construction, clearer pacing or a more worthwhile visual idea.</p></section>
<p id="collection-version" class="fine"></p><div id="summary" class="summary" aria-label="Collection review status"></div>
<section class="workspace"><div class="viewer"><div class="player-top"><span id="decision" class="badge"></span><span id="position"></span></div><video controls playsinline preload="metadata" id="player" aria-label="Selected lecture"></video><div class="viewer-body"><p id="group" class="eyebrow"></p><h2 id="title"></h2><p id="reason"></p><div id="downloads" class="downloads"></div><details><summary>Scene judgments, scores and evidence</summary><div id="evidence"></div></details></div></div><aside><p class="eyebrow">THE CUTOFF</p><h2>90 is the starting point.</h2><p>POST also requires every rubric floor, no material visual or teaching blocker, a review of every authored scene and evidence bound to the exact movie.</p><p>A promising rework stays in QUARANTINE until its changed movie is rendered and reviewed. Earlier technical and editorial scores remain historical evidence.</p><p>Visual review uses all scene sheets and selected full-resolution encoded frames. Continuous viewing and listening are separate judgments. Automated frame checks protect layout and media integrity.</p><p><a href="scores.csv" download>Score table CSV</a> · <a href="scores.md">Table</a> · <a href="rubric.json">Rubric</a></p><a href="review-data.json">Full review data</a><p id="render-policy" class="fine"></p><p id="generated" class="fine"></p></aside></section>
<section class="library"><div class="library-heading"><h2>The lectures</h2><div class="view-switch"><button id="table-view" aria-pressed="true">Table</button><button id="card-view" aria-pressed="false">Cards</button></div></div><div class="toolbar"><nav aria-label="Publication decisions"><button data-filter="POST" aria-pressed="true">POST</button><button data-filter="QUARANTINE" aria-pressed="false">QUARANTINE</button><button data-filter="ALL" aria-pressed="false">All</button></nav><label><span>Search lectures</span><input type="search" id="search" placeholder="Search a topic or review finding"></label></div><p id="result-count" aria-live="polite"></p><div id="list"></div><p id="empty" hidden>No lessons match this view.</p></section><footer>Local review gallery. Publication decisions are recommendations; these videos have not been uploaded to YouTube.</footer></main><script src="gallery.js"></script></body></html>`;
const css = `:root{color-scheme:light;--ink:#1b302c;--muted:#5e6d65;--line:#d7ded5;--green:#187457;--paper:#f5f6ef}*{box-sizing:border-box}body{margin:0;font:16px/1.55 system-ui,sans-serif;background:var(--paper);color:var(--ink)}a{color:var(--green);overflow-wrap:anywhere;text-underline-offset:3px}button,input{font:inherit}button{cursor:pointer}a:focus-visible,button:focus-visible,input:focus-visible,summary:focus-visible{outline:3px solid #42ac85;outline-offset:3px}header,main{max-width:1480px;margin:auto;padding-left:36px;padding-right:36px}header{padding-top:22px;padding-bottom:22px;border-bottom:1px solid var(--line);display:flex;gap:22px;align-items:center}header>span{font-size:11px;font-weight:700;letter-spacing:.14em;color:var(--muted)}.logo{font-size:25px;font-weight:850;letter-spacing:-1px;text-decoration:none;color:var(--ink)}.logo span{color:var(--green)}.intro{max-width:850px;padding:30px 0 12px}.eyebrow{font-size:11px;letter-spacing:.13em;font-weight:750;color:var(--muted)}h1{font-size:clamp(32px,3.8vw,46px);line-height:1.1;letter-spacing:-.045em;margin:12px 0 20px}.intro>p:last-child{color:var(--muted)}.summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin:12px 0 34px}.summary>div{background:#ecf0e6;border:1px solid var(--line);padding:16px 19px;border-radius:12px}.summary strong{display:block;font-size:29px}.summary span{font-size:13px;color:var(--muted)}.workspace{display:grid;grid-template-columns:minmax(0,2.6fr) minmax(240px,1fr);gap:28px;align-items:start}.viewer{min-width:0;border:1px solid var(--line);border-radius:15px;overflow:hidden;background:white;box-shadow:0 12px 30px #21372a08}.player-top{padding:10px 16px;display:flex;gap:12px;justify-content:space-between;font-size:12px;color:var(--muted)}video{display:block;width:100%;aspect-ratio:16/9;background:#0b1222;object-fit:contain}.viewer-body{padding:20px 24px}.viewer-body h2{font-size:25px;line-height:1.25;letter-spacing:-.02em;margin:8px 0 12px}#reason{font-size:14px;color:var(--muted)}.badge{display:inline-flex;border:1px solid #bcd4c5;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:750;background:#e7f3e9;color:#226045}.badge.quarantine{color:#89581a;background:#fff3df;border-color:#e7d3ae}.badge.pending{color:#5e6d65;background:#f0f2ee;border-color:var(--line)}.downloads{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0}.downloads a{font-size:12px;border:1px solid var(--line);border-radius:7px;padding:6px 10px;text-decoration:none;background:#fafbf7}details{border-top:1px solid var(--line);padding-top:12px;margin-top:16px}summary{font-size:13px;font-weight:700;cursor:pointer}#evidence{min-width:0}#evidence p,#evidence li{font-size:13px;color:var(--muted)}#evidence h3{font-size:15px;margin:24px 0 8px}.dimensions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.dimensions>div{display:flex;justify-content:space-between;border:1px solid var(--line);border-radius:7px;padding:8px;font-size:12px}.dimensions dd{margin:0;font-weight:700}.scene-review{border-left:3px solid #ccd7c8;padding-left:12px;margin:16px 0}.scene-review p{margin:5px 0}.hashes{font:11px/1.6 ui-monospace,monospace;white-space:pre-wrap;overflow-wrap:anywhere;background:#f1f4ed;padding:12px;border-radius:7px}aside{padding:12px 2px}aside h2{font-size:25px;line-height:1.2;letter-spacing:-.02em}aside p{font-size:14px;color:var(--muted)}.fine{font-size:11px;color:var(--muted)}.library{margin-top:48px}.library-heading,.toolbar{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}.library-heading h2{font-size:28px;letter-spacing:-.025em}.view-switch,nav{display:flex;gap:4px;flex-wrap:wrap}.toolbar button,.view-switch button{border:1px solid var(--line);background:transparent;color:var(--muted);border-radius:7px;padding:8px 12px;font-size:13px}button[aria-pressed=true]{background:var(--ink);color:white;border-color:var(--ink)}label{font-size:12px;color:var(--muted);display:flex;align-items:center;gap:10px}input{border:1px solid var(--line);border-radius:8px;background:white;color:var(--ink);padding:9px 12px;font-size:13px;width:290px;max-width:100%}#result-count{font-size:12px;color:var(--muted);margin:18px 0 12px}.lesson-table{width:100%;table-layout:fixed;border-collapse:separate;border-spacing:0;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:white}.lesson-table th{text-align:left;background:#ecf0e6;color:var(--muted);padding:12px;font-size:11px}.lesson-table th:nth-child(1){width:27%}.lesson-table th:nth-child(2){width:17%}.lesson-table th:nth-child(3){width:46%}.lesson-table th:nth-child(4){width:10%}.lesson-table td{padding:15px 12px;border-top:1px solid #e5e9e2;vertical-align:top;font-size:12px;overflow-wrap:anywhere}.lesson-title{border:0;background:none;text-align:left;padding:0;color:var(--ink);font-size:14px;line-height:1.35;font-weight:720}.lesson-title:hover{text-decoration:underline;color:var(--green)}.lesson-group,.cell-note{display:block;font-size:11px;color:var(--muted);margin-top:6px}tr.selected,.lesson-card.selected{background:#eff6e9}.lesson-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}.lesson-card{background:white;border:1px solid var(--line);border-radius:12px;padding:18px;min-width:0}.lesson-card .lesson-title{font-size:17px;margin:12px 0}.lesson-card p{font-size:12px;color:var(--muted)}.lesson-card.selected{border-color:var(--green)}#empty{padding:30px;border:1px solid var(--line);background:white;border-radius:12px}footer{padding:35px 0;color:var(--muted);font-size:12px}@media(max-width:1000px){.workspace{grid-template-columns:minmax(0,1fr)}aside{display:none}.lesson-cards{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){header{padding:18px}main{padding:0 16px}header>span{font-size:9px}.summary{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:23px}.summary>div{padding:12px}.summary strong{font-size:25px}.summary span{font-size:11px}.viewer-body{padding:16px}.viewer-body h2{font-size:21px}.library{margin-top:30px}.toolbar nav{width:100%}.toolbar button{padding:7px 9px;font-size:12px}label{width:100%;display:block}label>span{display:none}input{width:100%}.lesson-table,.lesson-table tbody,.lesson-table tr,.lesson-table td{display:block;width:100%}.lesson-table thead{display:none}.lesson-table{background:transparent;border:0;overflow:visible}.lesson-table tr{background:white;border:1px solid var(--line);border-radius:10px;padding:13px;margin-bottom:10px}.lesson-table td{border:0;padding:5px 0}.lesson-table td[data-label]:before{content:attr(data-label)' ';color:var(--muted);font-weight:700;font-size:11px}.lesson-cards{grid-template-columns:minmax(0,1fr)}.dimensions{grid-template-columns:minmax(0,1fr)}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}`;
const browser = `const E=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));let data,selected,filter='POST',layout='table';const duration=s=>{const whole=Math.round(s);return Math.floor(whole/60)+':'+String(whole%60).padStart(2,'0')};const badge=r=>'<span class="badge '+(r.reviewStatus==='pending'?'pending':r.decision==='POST'?'':'quarantine')+'">'+esc(r.decision)+'</span>';const link=(url,label,download=false)=>url?'<a href="'+esc(url)+'"'+(download?' download':'')+'>'+esc(label)+'</a>':'';function shown(){const query=E('#search').value.trim().toLowerCase();return data.lessons.filter(r=>(filter==='ALL'||r.decision===filter)&&(!query||r.search.includes(query)))}function renderList(){const rows=shown();E('#result-count').textContent=rows.length+' of '+data.lessons.length+' lectures · '+filter;E('#empty').hidden=rows.length>0;E('#list').className=layout==='cards'?'lesson-cards':'';E('#list').innerHTML=layout==='cards'?rows.map(r=>'<article class="lesson-card '+(r.id===selected?'selected':'')+'">'+badge(r)+'<span class="lesson-group">'+esc(r.group)+' · '+duration(r.duration)+'</span><button class="lesson-title" data-open="'+r.id+'">'+esc(r.title)+'</button><p>'+esc(r.reason)+'</p><p><strong>'+esc(r.score===null?'Review pending':r.score+'/100 visual score')+'</strong> · '+esc(r.reviewStatus)+'</p></article>').join(''):'<table class="lesson-table"><thead><tr><th>Lecture</th><th>Publication decision</th><th>Editorial reason</th><th>Visual score</th></tr></thead><tbody>'+rows.map(r=>'<tr class="'+(r.id===selected?'selected':'')+'"><td><button class="lesson-title" data-open="'+r.id+'">'+esc(r.title)+'</button><span class="lesson-group">'+esc(r.group)+' · '+duration(r.duration)+'</span></td><td data-label="Decision">'+badge(r)+'<span class="cell-note">'+esc(r.reviewStatus)+'</span></td><td data-label="Reason">'+esc(r.reason)+'</td><td data-label="Score">'+esc(r.score===null?'Pending':r.score+'/100')+'</td></tr>').join('')+'</tbody></table>'}function details(r){const blockers=[...new Set([...(r.blockerText??[]),...r.gateIssues])];const dimensions=data.dimensions.map(d=>'<div><dt>'+esc(d.label)+'</dt><dd>'+esc(r.dimensionScores?.[d.id]??'pending')+'/'+d.maximum+'</dd></div>').join('');return '<h3>Visual-publication score</h3><dl class="dimensions">'+dimensions+'</dl>'+(blockers.length?'<h3>Verification or publication blockers</h3><ul>'+blockers.map(i=>'<li>'+esc(i)+'</li>').join('')+'</ul>':'')+'<h3>Scene-by-scene judgment</h3>'+(r.reviewedScenes??[]).map(s=>'<div class="scene-review"><strong>'+esc(s.id)+' · '+esc(s.visualGrade)+' · '+esc(s.density)+'</strong><p>'+esc(s.mechanism)+'</p><p>'+esc(s.deficiencyRemedy??[s.deficiency,s.remedy].filter(Boolean).join(' '))+'</p></div>').join('')+(r.rework?'<h3>Proposed visual rework</h3><pre class="hashes">'+esc(typeof r.rework==='string'?r.rework:JSON.stringify(r.rework,null,2))+'</pre>':'')+'<h3>Inspected transformations</h3><ul>'+(r.inspectedTransformations??[]).map(t=>'<li><strong>'+esc(t.sceneId)+':</strong> '+esc(t.mechanism)+'</li>').join('')+'</ul><h3>Evidence and limitations</h3><p>'+esc(Array.isArray(r.limitations)?r.limitations.join(' '):JSON.stringify(r.limitations))+'</p><p>'+link(r.media.encoded,'Encoded frame gallery')+' · '+link(r.media.receipt,'Delivery receipt')+'</p><pre class="hashes">'+esc(JSON.stringify({movieSha256:r.movieSha256,sourceFingerprint:r.sourceFingerprint,authoredSourceSha256:r.authoredSourceSha256,reviewer:r.reviewer,evidence:r.evidence,reviewRecord:r.provenance},null,2))+'</pre>'}function select(id,scroll=false){const r=data.lessons.find(r=>r.id===id);if(!r)return;selected=id;history.replaceState(null,'','#'+id);const player=E('#player');player.pause();player.innerHTML='';player.src=r.media.movie;player.poster=r.media.poster??'';if(r.media.vtt){const track=document.createElement('track');track.kind='captions';track.label='English';track.srclang='en';track.src=r.media.vtt;player.append(track)}player.load();E('#decision').className='badge '+(r.decision==='POST'?'':'quarantine');E('#decision').textContent=r.decision+(r.reviewStatus!=='reviewed'?' · '+r.reviewStatus:'');E('#position').textContent='Lecture '+(data.lessons.indexOf(r)+1)+' / '+data.lessons.length;E('#title').textContent=r.title;E('#group').textContent=r.group;E('#reason').textContent=r.reason;E('#downloads').innerHTML=link(r.media.movie,'Download MP4',true)+link(r.media.srt,'SRT captions',true)+link(r.media.script,'Narration shipped with movie',true)+link(r.media.markup,'Current scene markup',true)+link(r.media.animation,'Current animation source',true);E('#evidence').innerHTML=details(r);renderList();if(scroll)E('.workspace').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})}async function start(){const response=await fetch('review-data.json',{cache:'no-store'});if(!response.ok)throw Error('Review data unavailable');data=await response.json();window.reviewGalleryData=data;E('#summary').innerHTML=[[data.summary.post,'POST'],[data.summary.quarantine,'QUARANTINE'],[data.summary.reviewed,'individual reviews verified'],[data.summary.pending+data.summary.needsVerification,'reviews pending / need verification']].map(([n,label])=>'<div><strong>'+n+'</strong><span>'+label+'</span></div>').join('');E('#collection-version').textContent=data.renderPolicy==='current-regenerated-collection'?'Current regenerated collection.':'Baseline review. Full-collection regeneration is pending.';E('#render-policy').textContent=data.renderPolicy==='current-regenerated-collection'?'Current regenerated collection.':'Baseline review. Full-collection regeneration is pending.';E('#generated').textContent='Generated '+new Date(data.generatedAt).toLocaleString();const initial=data.lessons.find(r=>r.id===location.hash.slice(1));if(initial)filter=initial.decision;document.querySelectorAll('[data-filter]').forEach(button=>{const key=button.dataset.filter;button.textContent=key+' '+data.lessons.filter(r=>key==='ALL'||r.decision===key).length;button.setAttribute('aria-pressed',String(key===filter));button.onclick=()=>{filter=key;document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));renderList()}});E('#search').oninput=renderList;for(const[id,mode]of[['#table-view','table'],['#card-view','cards']])E(id).onclick=()=>{layout=mode;E('#table-view').setAttribute('aria-pressed',String(mode==='table'));E('#card-view').setAttribute('aria-pressed',String(mode==='cards'));renderList()};E('#list').onclick=event=>{const button=event.target.closest('[data-open]');if(button)select(button.dataset.open,true)};addEventListener('hashchange',()=>{if(location.hash.slice(1)!==selected)select(location.hash.slice(1))});select(initial?.id??data.lessons.find(r=>r.decision==='POST')?.id??data.lessons[0].id)}start().catch(error=>{E('#result-count').textContent=error.message;console.error(error)});`;

export async function buildGallery({ catalog, output }) {
  const directory = path.resolve(root, output),
    data = JSON.parse(await fs.readFile(path.resolve(root, catalog))),
    rubric = JSON.parse(await fs.readFile(path.join(root, 'videos/curation-rubric.json')));
  await fs.mkdir(path.join(directory, 'sources'), { recursive: true });
  const href = (file) =>
    path
      .relative(directory, path.resolve(root, file))
      .split(path.sep)
      .map(encodeURIComponent)
      .join('/');
  for (const row of data.lessons) {
    const source = path.resolve(root, row.sourceDirectory),
      receipt = JSON.parse(await fs.readFile(path.join(source, 'verification.json'))),
      poster = Object.keys(receipt.artifactSha256).find((name) => /^\d\d-.*\.png$/.test(name));
    if (row.decision === 'POST') {
      const current = {
        markup: reviewDigest(
          await fs.readFile(path.join(root, `videos/lessons/${row.id}.lesson.yaml`)),
        ),
        animation: reviewDigest(
          await fs.readFile(path.join(root, `videos/animations/${row.id}.mjs`)),
        ),
      };
      if (
        receipt.sha256 !== row.movieSha256 ||
        ['markup', 'animation'].some((key) => current[key] !== row.authoredSourceSha256?.[key])
      )
        throw Error('POST catalog is stale: ' + row.id);
      row.evidence.renderFingerprintCurrent =
        (await currentSourceFingerprint(root, row.id, receipt)) === row.sourceFingerprint;
      if (
        data.renderPolicy === 'current-regenerated-collection' &&
        !row.evidence.renderFingerprintCurrent
      )
        throw Error('Current-render POST catalog is stale: ' + row.id);
    }
    await fs.copyFile(
      path.join(root, `videos/animations/${row.id}.mjs`),
      path.join(directory, 'sources', `${row.id}.mjs`),
    );
    await fs.copyFile(
      path.join(root, `videos/lessons/${row.id}.lesson.yaml`),
      path.join(directory, 'sources', `${row.id}.lesson.yaml`),
    );
    row.duration = receipt.duration;
    row.media = {
      movie: href(path.join(source, `${row.id}.mp4`)),
      srt: href(path.join(source, `${row.id}.srt`)),
      vtt: href(path.join(source, `${row.id}.vtt`)),
      script: href(path.join(source, `${row.id}.script.md`)),
      markup: `sources/${row.id}.lesson.yaml`,
      animation: `sources/${row.id}.mjs`,
      encoded: href(path.join(source, 'encoded-review/index.html')),
      receipt: href(path.join(source, 'verification.json')),
      poster: poster ? href(path.join(source, poster)) : null,
    };
    row.blockerText = (row.blockers ?? []).map((value) =>
      typeof value === 'string'
        ? value
        : [value.reason, value.detail ?? value.description].filter(Boolean).join(': ') ||
          JSON.stringify(value),
    );
    row.search = [row.id, row.title, row.group, row.reason, ...row.blockerText]
      .join(' ')
      .toLowerCase();
  }
  const labels = {
    visualExplanation: 'Visual explanation',
    construction: 'Construction',
    density: 'Density',
    teachingArc: 'Teaching arc',
    narrationDirection: 'Narration direction',
    finish: 'Finish',
  };
  data.dimensions = rubric.dimensions.map((d) => ({ ...d, label: labels[d.id] }));
  const csv = (value) => '"' + String(value ?? '').replaceAll('"', '""') + '"',
    columns = ['id', 'title', 'decision', 'reviewStatus', 'score', 'reason'];
  const table =
    '| Lecture | Decision | Visual score | Reason |\n|---|---|---:|---|\n' +
    data.lessons
      .map(
        (r) =>
          `| ${r.title.replaceAll('|', '\\|')} | ${r.decision} | ${r.score ?? 'Pending'} | ${r.reason.replaceAll('|', '\\|').replaceAll('\n', ' ')} |`,
      )
      .join('\n') +
    '\n';
  await Promise.all([
    fs.writeFile(path.join(directory, 'index.html'), html),
    fs.writeFile(path.join(directory, 'gallery.css'), css),
    fs.writeFile(path.join(directory, 'gallery.js'), browser),
    fs.writeFile(path.join(directory, 'review-data.json'), JSON.stringify(data, null, 2) + '\n'),
    fs.writeFile(
      path.join(directory, 'scores.csv'),
      [columns, ...data.lessons.map((r) => columns.map((key) => r[key]))]
        .map((row) => row.map(csv).join(','))
        .join('\n') + '\n',
    ),
    fs.writeFile(path.join(directory, 'scores.md'), table),
    fs.writeFile(path.join(directory, 'rubric.json'), JSON.stringify(rubric, null, 2) + '\n'),
    fs.copyFile(
      path.join(root, 'videos/assets/leetllm-mark.svg'),
      path.join(directory, 'favicon.svg'),
    ),
  ]);
  console.log(JSON.stringify({ output, ...data.summary }, null, 2));
}
async function main(args) {
  if (args.includes('--help')) {
    console.log('node videos/curation-gallery.mjs [--catalog FILE] [--output DIR]');
    return;
  }
  const opts = {
    catalog: 'videos/reviews/curation.json',
    output: 'build/video-curation-review-20261027',
  };
  for (let i = 0; i < args.length; i++) {
    const key = { '--catalog': 'catalog', '--output': 'output' }[args[i]];
    if (!key || !args[i + 1] || args[i + 1].startsWith('--'))
      throw Error('Usage: node videos/curation-gallery.mjs [--catalog FILE] [--output DIR]');
    opts[key] = args[++i];
  }
  await buildGallery(opts);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main(process.argv.slice(2)).catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
