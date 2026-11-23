/* This page displays recorded evidence. It never changes a review or score. */
const $ = (id) => document.getElementById(id);
const text = (value) => String(value ?? '');
const escape = (value) =>
  text(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
  );
let dataset;
let selected;

function badge(value, warning = false, pending = false) {
  return `<span class="badge ${warning ? 'warn' : pending ? 'pending' : ''}">${escape(value)}</span>`;
}

function fact(label, value) {
  return `<div class="fact"><strong>${escape(label)}</strong><span>${escape(value)}</span></div>`;
}

function choose(id) {
  const row = dataset.lessons.find((lesson) => lesson.id === id);
  if (!row) return;
  selected = id;
  const player = $('player');
  player.pause();
  player.removeAttribute('src');
  player.replaceChildren();
  player.poster = row.playback.poster;
  player.src = row.playback.url;
  const track = document.createElement('track');
  track.kind = 'captions';
  track.srclang = 'en';
  track.label = 'English';
  track.src = row.playback.captions;
  player.append(track);
  player.load();
  $('movie-kind').className = `badge ${row.playback.kind === 'historical-published' ? 'warn' : ''}`;
  $('movie-kind').textContent =
    row.playback.kind === 'historical-published'
      ? 'HISTORICAL PUBLISHED FALLBACK'
      : row.playback.cohort === 'prior-export'
        ? 'PRIOR CANDIDATE EXPORT'
        : 'EXACT CANDIDATE';
  $('movie-review').textContent = row.exactCandidateReview
    ? `Encoded ${row.exactCandidateReview.recommendation}`
    : row.candidate
      ? 'Encoded review missing'
      : 'Replacement render pending';
  $('selected-group').textContent = `${row.order.toString().padStart(3, '0')} · ${row.group}`;
  $('selected-title').textContent = row.title;
  $('selected-status').textContent =
    row.playback.kind === 'historical-published'
      ? 'This plays the older published recording. A new movie for the selected source is not available in this snapshot.'
      : row.playback.cohort === 'prior-export'
        ? `The new inspection run is ${row.currentInspection.state}. This plays a separate earlier export, with its own historical review.`
        : row.candidate.changedSinceFreeze.length
          ? 'The exact candidate is available, but current source has changed since its frozen job. Review this export as its own historical candidate.'
          : 'This candidate matches the selected lesson/module source at generation time. Other delivery gates remain separate.';
  $('selected-facts').innerHTML = [
    fact(
      'Manuscript inspection',
      row.inspected.scriptReviewRecorded
        ? 'Recorded full source/script peer; inspect exact scope below'
        : row.prospectiveFullSourcePeers.length
          ? 'Prospective complete manuscript/source peer recorded; original full peer remains missing'
          : 'Original full peer not located; inspect supplemental scope below',
    ),
    fact(
      'Encoded visual inspection',
      row.inspected.encodedVisualReviewRecorded
        ? `${row.historicalEncodedReview.length} located movie review record(s)`
        : 'No encoded review located',
    ),
    fact(
      'Mechanical organization',
      row.mechanical.recorded
        ? 'Recorded separately; creates no visual review'
        : 'No migration proof recorded in inventory',
    ),
    fact(
      'Prepared paper figure',
      row.paperUse.sourceIntegrated
        ? 'Integrated source call detected; rendering scope below'
        : 'No prepared figure call detected; citations are a separate matter',
    ),
  ].join('');
  $('downloads').innerHTML =
    `<a href="${escape(row.playback.url)}">Open exact displayed movie ↗</a><a href="${escape(row.playback.captions)}">Captions ↗</a><a href="status-index.json">Evidence JSON ↗</a>`;
  const scope = row.exactCandidateReview
    ? `Selected candidate: ${row.exactCandidateReview.recommendation}`
    : row.findingsScope;
  $('evidence').innerHTML =
    `<h3>Movie identity</h3><div class="identity">SHA-256 ${escape(row.playback.movieSha256)}\n${escape(row.candidate?.directory ?? 'Historical public manifest')}\n${escape(row.candidate?.runtimeVersion ?? 'Published historical runtime')}\n${escape(scope)}</div><h3>Known findings for the named movie</h3><p>${escape(row.findingsScope)}</p>${row.findings.length ? `<ul>${row.findings.map((finding) => `<li><strong>${escape(finding.id)}</strong>: ${escape(finding.summary)}${finding.remedy ? `<p>${escape(finding.remedy)}</p>` : ''}</li>`).join('')}</ul>` : '<p>No unresolved finding is listed for this selected scope. Missing review is not acceptance.</p>'}<h3>Original full source inspection</h3><p>${escape(row.originalFullScriptPeer?.path ?? 'Original full peer not located')}</p>${row.prospectiveFullSourcePeers.map((peer) => `<h3>Prospective complete source/manuscript peer</h3><p>${escape(peer.record.path)}</p><p>${escape(peer.scope)}</p><p>${escape(JSON.stringify(peer.decisions))}</p>`).join('')}${row.inspected.supplementalSourceReviews.map((review) => `<p><strong>${escape(review.record.path)}</strong><br>${escape(typeof review.scope === 'string' ? review.scope : JSON.stringify(review.scope))}</p>`).join('')}<h3>Snapshot and source changes</h3><p>${row.sourceDriftSinceInventory.length} file(s) differ from the original inventory; ${row.candidate?.changedSinceFreeze.length ?? 0} selected lesson/module file(s) differ from the candidate freeze.</p><h3>Pending gates from the inventory snapshot</h3><ul>${row.pendingGates.map((gate) => `<li>${escape(gate)}</li>`).join('')}</ul><h3>Paper-use scope</h3><p>${escape(row.paperUse.scope)}</p>${row.paperUse.sourceRecords.map((record) => `<p>${escape(record.path)}<br>${escape(record.sha256)}</p>`).join('')}`;
  if (row.sourceCorrection)
    $('evidence').innerHTML +=
      `<h3>Source layout correction</h3><p>${escape(row.sourceCorrection.status)}</p><p>${escape(row.sourceCorrection.record.path)}</p><p>This source-level diagnostic and correction request creates no encoded or manual approval.</p>`;
  history.replaceState(null, '', `#${encodeURIComponent(id)}`);
  renderTable();
  renderLatest();
}

function matches(row) {
  const query = $('search').value.trim().toLowerCase();
  if (
    query &&
    !`${row.id} ${row.title} ${row.group} ${row.findings.map((finding) => finding.summary).join(' ')}`
      .toLowerCase()
      .includes(query)
  )
    return false;
  const render = $('render-filter').value;
  const currentMovieAvailable =
    Boolean(row.correctionInspection?.media) ||
    (row.currentInspection ? row.currentInspection.state === 'complete' : Boolean(row.candidate));
  if (
    (render === 'available' && !currentMovieAvailable) ||
    (render === 'pending' && currentMovieAvailable)
  )
    return false;
  const inspection = $('inspection-filter').value;
  if (
    inspection.startsWith('candidate-') &&
    dataset.sharedInspectionRun &&
    !row.candidate?.inspectionRun
  )
    return false;
  if (inspection === 'new-unrevisited' && row.currentInspection?.directionReview !== 'unrevisited')
    return false;
  if (
    inspection === 'new-revisited' &&
    (!row.currentInspection || row.currentInspection.directionReview === 'unrevisited')
  )
    return false;
  if (inspection === 'script-recorded' && !row.inspected.scriptReviewRecorded) return false;
  if (inspection === 'script-missing' && row.inspected.scriptReviewRecorded) return false;
  if (
    (inspection === 'recorded' && !row.inspected.encodedVisualReviewRecorded) ||
    (inspection === 'missing' && row.inspected.encodedVisualReviewRecorded)
  )
    return false;
  if (inspection === 'candidate-post' && row.exactCandidateReview?.recommendation !== 'POST')
    return false;
  if (inspection === 'candidate-rework' && row.exactCandidateReview?.recommendation !== 'REWORK')
    return false;
  if (
    inspection === 'candidate-scoped' &&
    row.exactCandidateReview?.recommendation !== 'ACCEPTED_SCOPED_ENCODED'
  )
    return false;
  if (inspection === 'candidate-missing' && (!row.candidate || row.exactCandidateReview))
    return false;
  const evidence = $('evidence-filter').value;
  if (
    (evidence === 'findings' && !row.findings.length) ||
    (evidence === 'drift' && !row.sourceDriftSinceInventory.length) ||
    (evidence === 'paper' && !row.paperUse.sourceIntegrated) ||
    (evidence === 'mechanical-only' &&
      (!row.mechanical.recorded || row.inspected.encodedVisualReviewRecorded))
  )
    return false;
  return true;
}

function renderTable() {
  const rows = dataset.lessons.filter(matches);
  $('result-count').textContent = `${rows.length} of ${dataset.lessons.length} lectures`;
  $('empty').hidden = rows.length !== 0;
  $('lessons').innerHTML = rows
    .map(
      (row) =>
        `<tr class="${row.id === selected ? 'selected' : ''}"><td><span class="number">${String(row.order).padStart(3, '0')}</span><button data-lesson="${escape(row.id)}">${escape(row.title)}</button><p>${escape(row.group)}</p><p>${escape(row.id)}</p></td><td>${row.currentInspection ? badge(`New run: ${row.currentInspection.directionReview}`, row.currentInspection.directionReview === 'unrevisited') + `<p>${row.inspected.encodedVisualReviewRecorded ? 'Earlier encoded inspection recorded' : 'No earlier encoded review located'}</p>` : badge(row.inspected.encodedVisualReviewRecorded ? 'Visual inspection recorded' : 'No encoded review located', !row.inspected.encodedVisualReviewRecorded)}<p>${row.inspected.scriptReviewRecorded ? 'Original script review recorded' : row.prospectiveFullSourcePeers.length ? 'Prospective full source/script peer recorded; original missing' : 'Original full script peer not located'}</p><p>${row.mechanical.recorded ? 'File organization / parity recorded separately' : 'No mechanical proof in snapshot'}</p></td><td>${badge(row.playback.cohort === 'prior-export' ? 'Prior candidate available' : row.candidate ? 'Candidate available' : 'Render pending', false, !row.candidate)}<p>${escape(row.renderStatus)}</p>${row.currentInspection ? `<p>New run: ${escape(row.currentInspection.state)} · manual ${escape(row.currentInspection.directionReview)}</p>` : ''}<p>${row.candidate ? `Runtime ${escape(row.candidate.runtimeVersion)}${row.candidate.changedSinceFreeze.length ? ' · source changed since freeze' : ''}` : 'Historical published fallback available'}</p></td><td>${row.findings.length ? badge(`${row.findings.length} known finding(s)`, true) : '<span class="muted">No listed finding in selected scope</span>'}<p>${escape(row.findings[0]?.summary ?? (row.exactCandidateReview ? 'See exact review evidence.' : 'Missing review does not mean acceptance.'))}</p><p>${row.paperUse.sourceIntegrated ? 'Prepared paper figure integrated in source' : 'No prepared paper figure detected'}</p>${row.sourceDriftSinceInventory.length ? `<p>Source changed since inventory (${row.sourceDriftSinceInventory.length} files)</p>` : ''}</td></tr>`,
    )
    .join('');
}

function renderLatest() {
  $('latest').innerHTML = dataset.latestCompleted
    .map((id) => {
      const row = dataset.lessons.find((item) => item.id === id);
      return `<button data-lesson="${escape(id)}" aria-current="${id === selected}">${escape(row.title)}<span>${row.playback.cohort === 'prior-export' ? 'PRIOR · ' : ''}${escape(row.exactCandidateReview?.recommendation ?? 'REVIEW MISSING')} · ${escape(row.candidate.runtimeVersion)}${dataset.firstEightInventoryExports.some((item) => item.movieSha256 === row.candidate.media.video.sha256) ? ' · first 8' : ' · later export'}</span></button>`;
    })
    .join('');
}

async function start() {
  const response = await fetch('status-index.json');
  if (!response.ok) throw new Error(`Evidence request failed: ${response.status}`);
  dataset = await response.json();
  const s = dataset.summary;
  $('summary').innerHTML = [
    [s.lessons, 'Lessons indexed'],
    [
      s.encodedVisualReviewsRecorded,
      dataset.sharedInspectionRun
        ? 'Earlier encoded inspections recorded'
        : 'Encoded inspections recorded',
    ],
    [
      s.verifiedCurrentCollectionMoviesAvailable ?? s.newRunComplete ?? s.completedCandidateMovies,
      dataset.sharedInspectionRun
        ? 'Current inspection movies available'
        : 'Exact candidates available',
    ],
    [
      s.currentCollectionMoviesPending ?? s.newRunPending ?? s.renderPending,
      dataset.sharedInspectionRun
        ? 'Current inspection renders pending'
        : 'Replacement renders pending',
    ],
    [
      s.newRunManualUnrevisited ?? s.noEncodedVisualReviewLocated,
      dataset.sharedInspectionRun
        ? 'New run: manually unrevisited'
        : 'No encoded inspection located',
    ],
  ]
    .map(
      ([value, label]) => `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`,
    )
    .join('');
  $('snapshot').textContent =
    `Snapshot ${new Date(dataset.generatedAt).toLocaleString()} · ${s.sourceChangedSinceInventory} lessons changed since the source inventory · ${s.inputsChangedWhileGenerating} inputs changed during generation. ${s.inputsChangedWhileGenerating ? 'The snapshot retains exact bindings; regenerate to refresh.' : 'See each movie’s separate source match.'}`;
  $('snapshot').classList.toggle(
    'warning',
    s.sourceChangedSinceInventory > 0 || s.inputsChangedWhileGenerating > 0,
  );
  $('footer').textContent =
    `${dataset.sharedInspectionRun ? `Primary inspection run: ${s.newRunComplete} complete; ${s.newRunEncodedPOST} POST, ${s.newRunEncodedREWORK} REWORK, ${s.newRunEncodedReviewMissing} completed movies awaiting exact review; ${s.newRunManualUnrevisited} manually unrevisited. ` : ''}Evidence index only. ${s.exactCandidatePOST} selected candidates POST, ${s.exactCandidateScopedAccepted} scoped encoded acceptances, ${s.exactCandidateREWORK} REWORK, ${s.candidateReviewMissing} awaiting review. ${s.sourceOnlyEndingApplications} source-only closing patches recorded (${s.appliedEndingSpeechMatchesCurrent} ending scalars match current speech); audio and movie renewal remain separate. No new review, upload or publication is implied. Inventory ${dataset.inventory.sha256.slice(0, 12)}. JSON and CSV preserve all 199 rows.`;
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-lesson]');
    if (button) choose(button.dataset.lesson);
  });
  for (const id of ['search', 'render-filter', 'inspection-filter', 'evidence-filter'])
    $(id).addEventListener(id === 'search' ? 'input' : 'change', renderTable);
  $('clear').addEventListener('click', () => {
    $('search').value = '';
    for (const id of ['render-filter', 'inspection-filter', 'evidence-filter']) $(id).value = 'all';
    renderTable();
  });
  const initial = decodeURIComponent(location.hash.slice(1));
  choose(
    dataset.lessons.some((row) => row.id === initial)
      ? initial
      : (dataset.latestCompleted[0] ?? dataset.lessons[0].id),
  );
}

start().catch((error) => {
  $('snapshot').textContent = `Could not load the evidence index: ${error.message}`;
  $('snapshot').classList.add('warning');
});
