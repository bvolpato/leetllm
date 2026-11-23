const response = await fetch('gallery-data.json', { cache: 'no-cache' });
if (!response.ok) throw new Error(`Could not load gallery data: ${response.status}`);
const data = await response.json();
const lessons = data.lessons;
const counts = { keep: lessons.filter(item => item.decision === 'keep').length, skip: lessons.filter(item => item.decision === 'skip').length };
const params = new URLSearchParams(location.search);
const state = { decision: location.hash === '#skipped' ? 'skip' : 'keep', query: params.get('q') ?? '', group: params.get('group') ?? '', sort: params.get('sort') ?? 'order' };
const grid = document.querySelector('#lesson-grid');
const empty = document.querySelector('#empty-state');
const resultsLine = document.querySelector('#results-line');
const search = document.querySelector('#search');
const groupSelect = document.querySelector('#group');
const sortSelect = document.querySelector('#sort');
const tabs = [...document.querySelectorAll('[role=tab]')];
const durationText = value => { const seconds = Math.round(value); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; };

document.title = `${data.title} | LeetLLM`;
document.querySelector('#hero-stats').innerHTML = `<span><strong>${lessons.length}</strong> lessons reviewed</span><span><strong>${counts.keep}</strong> selected</span><span><strong>${counts.skip}</strong> skipped for now</span>`;
for (const button of tabs) button.querySelector('[data-count]')?.replaceChildren(`${counts[button.dataset.decision]}`);

const rubricRoot = document.querySelector('#rubric-content');
const rubricSummary = document.createElement('p');
rubricSummary.textContent = `${data.rubric.question} Keep requires at least ${data.rubric.minimumScore}/100 overall, at least ${data.rubric.minimumQualityScore}/100 on the separate production-quality review, and every category minimum below.`;
rubricRoot.append(rubricSummary);
const rubricGrid = document.createElement('div');
rubricGrid.className = 'rubric-list';
for (const dimension of data.rubric.dimensions) {
  const item = document.createElement('div'); item.className = 'rubric-item';
  const title = document.createElement('strong'); const label = document.createElement('span');
  title.append(document.createTextNode(dimension.title)); label.textContent = `${dimension.minimum}–${dimension.maximum}`; title.append(label);
  const description = document.createElement('p'); description.textContent = dimension.criteria;
  item.append(title, description); rubricGrid.append(item);
}
rubricRoot.append(rubricGrid);
const rubricScope = document.createElement('p'); rubricScope.textContent = data.scope; rubricRoot.append(rubricScope);

const groups = [...new Set(lessons.map(item => item.group))].sort((a, b) => a.localeCompare(b));
for (const group of groups) { const option = document.createElement('option'); option.value = group; option.textContent = group; groupSelect.append(option); }
search.value = state.query;
groupSelect.value = state.group;
sortSelect.value = ['order', 'title', 'score', 'duration'].includes(state.sort) ? state.sort : 'order';
state.sort = sortSelect.value;

function makeCard(lesson) {
  const card = document.createElement('article'); card.className = 'lesson-card'; card.id = `lesson-${lesson.id}`;
  const media = document.createElement('div'); media.className = 'card-media';
  const poster = document.createElement('img'); poster.src = lesson.posterUrl; poster.alt = `Scene from ${lesson.title}`; poster.loading = 'lazy'; poster.decoding = 'async';
  const watch = document.createElement('button'); watch.type = 'button'; watch.className = 'watch-button'; watch.setAttribute('aria-label', `Play ${lesson.title}`);
  const triangle = document.createElement('span'); triangle.className = 'play-icon'; triangle.setAttribute('aria-hidden', 'true'); watch.append(triangle);
  watch.addEventListener('click', async () => {
    for (const playing of document.querySelectorAll('video')) playing.pause();
    const video = document.createElement('video'); video.controls = true; video.preload = 'none'; video.playsInline = true; video.poster = lesson.posterUrl; video.setAttribute('aria-label', lesson.title);
    const source = document.createElement('source'); source.src = lesson.videoUrl; source.type = 'video/mp4'; video.append(source);
    const captions = document.createElement('track'); captions.kind = 'subtitles'; captions.label = 'English captions'; captions.srclang = 'en'; captions.src = lesson.vttUrl; captions.default = true; video.append(captions);
    const chapters = document.createElement('track'); chapters.kind = 'chapters'; chapters.label = 'Lesson chapters'; chapters.srclang = 'en';
    const chapterVtt = ['WEBVTT', '', ...lesson.scenes.map((scene, index) => {
      const end = lesson.scenes[index + 1]?.start ?? lesson.durationSeconds;
      return `${toVtt(scene.start)} --> ${toVtt(end)}\n${scene.title}\n`;
    })].join('\n');
    chapters.src = URL.createObjectURL(new Blob([chapterVtt], { type: 'text/vtt' })); video.dataset.chapterUrl = chapters.src; video.append(chapters);
    video.addEventListener('play', () => { for (const other of document.querySelectorAll('video')) if (other !== video) other.pause(); });
    video.addEventListener('loadstart', () => { poster.remove(); watch.remove(); }, { once: true });
    media.replaceChildren(video); video.load(); await video.play().catch(() => {});
  });
  const duration = document.createElement('span'); duration.className = 'card-duration'; duration.textContent = durationText(lesson.durationSeconds);
  media.append(poster, watch, duration);

  const body = document.createElement('div'); body.className = 'card-body';
  const meta = document.createElement('div'); meta.className = 'card-meta';
  const group = document.createElement('span'); group.className = 'group-name'; group.textContent = lesson.group;
  const decision = document.createElement('span'); decision.className = `decision-pill ${lesson.decision === 'skip' ? 'skip' : ''}`; decision.textContent = lesson.decision === 'keep' ? 'Selected' : 'Skipped for now';
  meta.append(group, decision);
  const title = document.createElement('h3'); title.className = 'card-title'; title.textContent = lesson.title;
  const scores = document.createElement('div'); scores.className = 'score-row';
  for (const [label, value, cls] of [['Video fit', lesson.selectionScore, 'selection'], ['Production quality', lesson.qualityScore, '']]) {
    const chip = document.createElement('span'); chip.className = `score-chip ${cls}`; chip.append(document.createTextNode(`${label} `)); const strong = document.createElement('strong'); strong.textContent = `${value}/100`; chip.append(strong); scores.append(chip);
  }
  const breakdown = document.createElement('details'); breakdown.className = 'score-breakdown';
  const breakdownSummary = document.createElement('summary'); breakdownSummary.textContent = 'Selection score by criterion'; breakdown.append(breakdownSummary);
  const breakdownList = document.createElement('ul');
  for (const dimension of data.rubric.dimensions) {
    const row = document.createElement('li');
    const label = document.createElement('span'); label.textContent = dimension.title;
    const value = Number(lesson.scores?.[dimension.id] ?? 0);
    const score = document.createElement('strong'); score.textContent = `${value}/${dimension.maximum}`;
    const track = document.createElement('span'); track.className = 'score-track'; track.setAttribute('aria-hidden', 'true');
    const fill = document.createElement('span'); fill.className = 'score-fill'; fill.style.width = `${Math.max(0, Math.min(100, value / dimension.maximum * 100))}%`; track.append(fill);
    const minimum = document.createElement('small'); minimum.textContent = `minimum ${dimension.minimum}`;
    row.append(label, score, track, minimum); breakdownList.append(row);
  }
  breakdown.append(breakdownList);
  const reason = document.createElement('p'); reason.className = 'reason'; reason.textContent = lesson.reason;
  const detail = document.createElement('details'); detail.className = 'evidence-details';
  const summary = document.createElement('summary'); summary.textContent = `Visual evidence · ${lesson.visualEvidence.length} moments`; detail.append(summary);
  const list = document.createElement('ul'); list.className = 'evidence-list';
  for (const evidence of lesson.visualEvidence) {
    const item = document.createElement('li'); const scene = lesson.scenes.find(candidate => candidate.id === evidence.scene);
    const name = document.createElement('strong'); name.textContent = scene?.title ?? evidence.scene;
    const text = document.createElement('span'); text.textContent = evidence.explanation; item.append(name, text); list.append(item);
  }
  detail.append(list);
  body.append(meta, title, scores, breakdown, reason, detail);
  if (lesson.blockers?.length) {
    const blockers = document.createElement('p'); blockers.className = 'revisit';
    const label = document.createElement('strong'); label.textContent = 'Review blocker: ';
    blockers.append(label, document.createTextNode(lesson.blockers.map(item => typeof item === 'string' ? item : item.description ?? item.reason ?? JSON.stringify(item)).join(' · ')));
    body.append(blockers);
  }
  if (lesson.revisitCondition) { const revisit = document.createElement('p'); revisit.className = 'revisit'; const label = document.createElement('strong'); label.textContent = 'What would change this decision: '; revisit.append(label, document.createTextNode(lesson.revisitCondition)); body.append(revisit); }
  const links = document.createElement('div'); links.className = 'card-links';
  for (const [label, url] of [['Download captions (SRT)', lesson.srtUrl], ['Chapter list', lesson.chaptersUrl]]) { const link = document.createElement('a'); link.href = url; link.download = ''; link.textContent = label; links.append(link); }
  body.append(links); card.append(media, body); return card;
}

const order = new Map(lessons.map((lesson, index) => [lesson.id, index]));
function visibleLessons() {
  const query = state.query.toLocaleLowerCase();
  return lessons.filter(lesson => lesson.decision === state.decision && (!state.group || lesson.group === state.group) && (!query || `${lesson.id} ${lesson.id.replaceAll('-', ' ')} ${lesson.title} ${lesson.group} ${lesson.reason} ${lesson.visualEvidence.map(e => e.explanation).join(' ')}`.toLocaleLowerCase().includes(query)))
    .sort((a, b) => state.sort === 'title' ? a.title.localeCompare(b.title) : state.sort === 'score' ? b.selectionScore - a.selectionScore : state.sort === 'duration' ? a.durationSeconds - b.durationSeconds : order.get(a.id) - order.get(b.id));
}
function render() {
  for (const video of grid.querySelectorAll('video')) { video.pause(); if (video.dataset.chapterUrl) URL.revokeObjectURL(video.dataset.chapterUrl); }
  const visible = visibleLessons();
  grid.replaceChildren(...visible.map(makeCard));
  empty.hidden = visible.length !== 0;
  grid.hidden = visible.length === 0;
  resultsLine.textContent = `${visible.length} ${state.decision === 'keep' ? 'selected' : 'skipped'} lesson${visible.length === 1 ? '' : 's'}${state.group ? ` · ${state.group}` : ''}${state.query ? ` · matching “${state.query}”` : ''}`;
  grid.setAttribute('aria-labelledby', `tab-${state.decision === 'keep' ? 'kept' : 'skipped'}`);
  const hash = state.decision === 'keep' ? '#kept' : '#skipped';
  const nextParams = new URLSearchParams();
  if (state.query) nextParams.set('q', state.query);
  if (state.group) nextParams.set('group', state.group);
  if (state.sort !== 'order') nextParams.set('sort', state.sort);
  const query = nextParams.size ? `?${nextParams}` : '';
  if (location.hash !== hash || location.search !== query) history.replaceState(null, '', `${location.pathname}${query}${hash}`);
}
function chooseTab(decision, focus = false) {
  state.decision = decision;
  for (const tab of tabs) { const selected = tab.dataset.decision === decision; tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1; if (selected && focus) tab.focus(); }
  render();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => chooseTab(tab.dataset.decision));
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length; chooseTab(tabs[next].dataset.decision, true);
  });
});
search.addEventListener('input', () => { state.query = search.value.trim(); render(); });
groupSelect.addEventListener('change', () => { state.group = groupSelect.value; render(); });
sortSelect.addEventListener('change', () => { state.sort = sortSelect.value; render(); });
window.addEventListener('hashchange', () => { if (location.hash === '#skipped' || location.hash === '#kept') chooseTab(location.hash === '#skipped' ? 'skip' : 'keep'); });

document.querySelector('#download-json').addEventListener('click', () => download('leetllm-video-selection.json', 'gallery-data.json'));
document.querySelector('#download-csv').addEventListener('click', () => download('leetllm-video-selection.csv', 'selection.csv'));
function download(name, url) { const link = document.createElement('a'); link.href = url; link.download = name; document.body.append(link); link.click(); link.remove(); }
function toVtt(seconds) { const milliseconds = Math.round(seconds * 1000); const hours = Math.floor(milliseconds / 3600000); const minutes = Math.floor(milliseconds % 3600000 / 60000); const secs = Math.floor(milliseconds % 60000 / 1000); const fraction = milliseconds % 1000; return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(fraction).padStart(3, '0')}`; }

render();
