import {
  C,
  base,
  box,
  round,
  poly,
  line,
  dot,
  word,
  wrap,
  small,
  title,
  pin,
  mark,
  plate,
  leaf,
  cord,
  openFolio,
  score,
  cue,
  smooth,
} from './atelier.mjs';
import {
  POLICY_ID,
  june,
  july,
  drill,
  docs,
  sourceNames,
  pointNames,
  recordDigest,
  admissiblePolicy,
  policyEvaluation,
  altered,
  exposed,
  answers,
  evaluated,
  sourceCount,
  paraphrases,
  classify,
  readerCall,
} from './specimens.mjs';
import { rankPrecision } from '../../../films/rag-evaluation/arithmetic.mjs';
import { suite } from './release.mjs';

const rule = june.records[POLICY_ID];
function docket(g, x, y, w, h, heading, body, size = 29) {
  leaf(g, x, y, w, h);
  box(g, x, y, 9, h, C.teal);
  small(g, heading, x + 29, y + 44);
  wrap(g, body, x + 29, y + 99, w - 62, size);
}
function rankList(g, ids, x, y, label, w = 440) {
  small(g, label, x, y);
  ids.forEach((id, i) => {
    const top = y + 20 + i * 62;
    round(g, x, top, w, 52, 3, id === POLICY_ID ? C.teal : C.ice);
    word(
      g,
      String(i + 1).padStart(2, '0'),
      x + 13,
      top + 35,
      22,
      id === POLICY_ID ? C.cream : C.slate,
      'Mono',
    );
    word(g, sourceNames[id], x + 68, top + 36, 28, id === POLICY_ID ? C.cream : C.navy, 'Serif');
  });
}
function rankMove(g, start, end, x, y, label, w, t) {
  small(g, label, x, y);
  const cardWidth = (w - 61) / 2;
  const clip = (v) => Math.min(1, Math.max(0, v));
  const side = smooth(clip(t / 0.25)) * smooth(clip((1 - t) / 0.25));
  const vertical = smooth(clip((t - 0.25) / 0.5));
  start.forEach((id, i) => {
    const top = y + 20 + i * 62;
    word(g, String(i + 1).padStart(2, '0'), x + 8, top + 35, 22, C.slate, 'Mono');
    const selected = id === POLICY_ID,
      shift = selected ? side * (cardWidth + 8) : 0;
    const xx = x + 50 + shift,
      yy = top + vertical * (end.indexOf(id) - i) * 62;
    round(g, xx, yy, cardWidth, 50, 3, selected ? C.teal : C.ice);
    word(
      g,
      sourceNames[id],
      xx + 12,
      yy + 34,
      26,
      selected ? C.white : C.navy,
      'Serif',
      400,
      'left',
      cardWidth - 22,
    );
  });
}
export function replay(g, k) {
  const b = k.beat.beatIndex;
  base(g, 'wood');
  if (b === 0) {
    leaf(g, 98, 62, 1084, 587);
    small(g, 'PAYMENT SERVICE  /  POLICY ARCHIVE', 145, 127);
    word(g, 'DEPLOY-17', 142, 224, 83, C.ink, 'Serif');
    line(g, 144, 253, 1132, 253, C.edge);
    wrap(g, rule.text.slice('Rule DEPLOY-17. '.length), 145, 327, 989, 43, C.ink, 'Serif', 60);
    if (cue(k, 1, 'before rollout')) plate(g, 'Required before rollout', 144, 555, 348);
    if (cue(k, 1, 'Maya still needs authorization'))
      word(g, 'Deployment requires separate authorization.', 529, 588, 24, C.slate, 'Sans');
  } else if (b === 1) {
    openFolio(g);
    rankList(g, june.trace.candidates, 92, 162, 'CANDIDATES', 460);
    const reranked = cue(k, 2, 'Reranking moves it', 0.9);
    rankMove(
      g,
      june.trace.candidates,
      june.trace.reranked,
      718,
      162,
      reranked === 1 ? 'RERANKED' : reranked ? 'RERANKING' : 'BEFORE RERANKING',
      452,
      reranked,
    );
    if (cue(k, 2, 'Only the freeze rule')) {
      cord(g, 955, 207, 991, 438, C.brass, 4);
      docket(g, 709, 437, 464, 147, 'IN THE PROMPT', 'DEPLOY-17  /  June 1', 32);
    }
  } else if (b === 2) {
    openFolio(g);
    word(g, 'Retrieval receipt', 96, 135, 47, C.ink, 'Serif');
    word(g, 'Saved with this run', 694, 135, 40, C.ink, 'Serif');
    Object.entries(june.trace.versions).forEach(([key, val], i) => {
      const y = 218 + i * 63;
      line(g, 93, y + 12, 1170, y + 12, C.edge, 1);
      word(g, key, 99, y, 28, C.teal, 'Serif');
      word(g, val, 695, y, 26, C.ink, 'Mono');
    });
  } else {
    title(
      g,
      'ARCHIVED RESPONSE  /  DEPLOY-17',
      b === 3 ? 'Which revision answers the question?' : 'What belongs in the replay?',
      64,
      78,
      true,
    );
    if (b === 3) {
      docket(
        g,
        63,
        187,
        557,
        348,
        'HISTORICAL FAITHFULNESS',
        'June 1. Open the exact text in the recorded prompt.',
        35,
      );
      if (cue(k, 4, 'open the current policy'))
        docket(
          g,
          663,
          187,
          557,
          348,
          'CURRENT CORRECTNESS',
          'Open the revision in force today. The requirements may have changed.',
          35,
        );
      word(g, 'The answer can repeat a mistaken source faithfully.', 66, 628, 30, C.cream, 'Serif');
    } else {
      docket(g, 63, 187, 557, 348, 'HISTORICAL COMPLIANCE', 'Policy in force at the time of the deploy', 35);
      if (cue(k, 5, 'To reproduce the answer')) {
        leaf(g, 663, 187, 557, 348);
        small(g, 'GENERATION RECORD', 692, 231);
        ['Assembled prompt', 'Generator version', 'Decoding settings', 'Original output'].forEach(
          (s, i) => {
            if (cue(k, 5, s)) {
              dot(g, 701, 285 + i * 65, 5, C.teal);
              word(g, s, 723, 294 + i * 65, 30, C.ink, 'Serif');
            }
          },
        );
      }
      if (cue(k, 5, 'sample different words'))
        word(g, 'A hosted replay can sample different words.', 68, 667, 29, C.cream, 'Serif');
    }
  }
}
export function integrity(g, k) {
  const b = k.beat.beatIndex;
  base(g);
  if (b === 0) {
    title(g, 'RETURNED CANDIDATES', 'Where does access apply?');
    line(g, 640, 158, 640, 581, C.rust, 5);
    small(g, 'MAYA’S ACCESS BOUNDARY', 667, 185);
    const crossing = cue(k, 1, 'A private note enters', 0.8);
    docket(g, 61, 220, 495, 240, 'INTERNAL INDEX', 'Records scanned during search', 31);
    docket(
      g,
      695,
      220,
      523,
      240,
      'RETURNED TO MAYA',
      june.trace.candidates.map((id) => sourceNames[id]).join(' · '),
      27,
    );
    const xx = 120 + 610 * smooth(crossing);
    plate(g, 'Private note', xx, 385, 243, C.navy);
    if (crossing === 1 && cue(k, 1, 'It fails the access check')) {
      mark(g, 722, 534, admissiblePolicy(exposed, june));
      word(g, 'Private candidate crossed the boundary.', 758, 543, 25, C.rust, 'Sans');
    }
  } else if (b === 1) {
    openFolio(g);
    small(g, 'TRUSTED RECORD', 92, 108);
    word(g, 'Trace receipt', 91, 174, 45, C.ink, 'Serif');
    small(g, 'REPLAY CONTRACT', 696, 108);
    word(g, 'Check each boundary', 694, 174, 40, C.ink, 'Serif');
    const fields = [
      ['Case and question', june.trace.caseId],
      ['Returned IDs', 'Drill, docs, DEPLOY-17'],
      ['Reranker input', 'Subset of returned candidates'],
      ['Reranker output', 'Same unique input IDs, reordered'],
      ['Selected passage', 'DEPLOY-17  /  June 1'],
    ];
    fields.forEach(([a, b], i) => {
      const y = 243 + i * 70;
      word(g, a, 96, y, 29, C.ink, 'Serif');
      word(g, b, 699, y, 23, C.navy, 'Sans');
      line(g, 94, y + 17, 555, y + 17, C.edge, 1);
      line(g, 696, y + 17, 1178, y + 17, C.edge, 1);
    });
  } else {
    openFolio(g);
    const edited = !!cue(k, 3, 'change and to or');
    const current = edited ? altered : june;
    const docs = [june.snapshot[POLICY_ID], current.records[POLICY_ID]];
    docs.forEach((doc, i) => {
      const x = i ? 694 : 94;
      small(g, i ? 'RETURNED COPY' : 'ARCHIVED ORIGINAL', x, 112);
      word(g, 'DEPLOY-17', x, 178, 44, C.ink, 'Serif');
      word(g, doc.version, x, 219, 21, C.slate, 'Mono');
      line(g, x, 246, x + 478, 246, C.edge);
      word(g, 'Commander approval', x, 302, 35, C.ink, 'Serif');
      const joint = doc.text.includes('approval and') ? 'AND' : 'OR';
      plate(g, joint, x, 325, 100, joint === 'AND' ? C.teal : C.rust);
      word(g, 'a linked rollback plan', x, 417, 35, C.ink, 'Serif');
      word(g, 'before rollout.', x, 466, 35, C.ink, 'Serif');
      small(g, 'RECORD SHA-256 PREFIX', x, 532);
      word(g, recordDigest(doc).slice(0, 12), x, 573, 30, C.navy, 'Mono');
    });
    if (b === 4 && cue(k, 5, 'trusted storage'))
      word(g, 'Trusted parent: ' + june.snapshot[POLICY_ID].parent, 94, 603, 18, C.slate, 'Mono');
    if (cue(k, 4, 'It fails'))
      plate(
        g,
        admissiblePolicy(current.trace, current)
          ? 'Replay accepted'
          : 'Stop replay: record differs',
        411,
        604,
        447,
        C.rust,
      );
  }
}
export function rank(g, k) {
  const b = k.beat.beatIndex;
  const copy = !!cue(k, 5, 'an approved copy');
  if (copy) {
    openFolio(g);
    const accepted = !!cue(k, 6, 'Accept either source');
    const ids = [POLICY_ID, 'freeze-handbook-copy'];
    ids.forEach((id, i) => {
      const x = i ? 699 : 92;
      small(g, i ? 'APPROVED COPY' : 'REFERENCE', x, 114);
      word(g, id, x, 180, 29, C.navy, 'Mono', 600, 'left', 486);
      wrap(g, rule.text, x, 269, 477, 31);
    });
    if (cue(k, 6, 'An exact ID check')) {
      const matches = (accepted ? ids : [POLICY_ID]).includes(ids[1]);
      plate(
        g,
        (accepted ? 'Either approved ID' : 'Exact reference ID') + '   ' + Number(matches) + ' / 1',
        376,
        561,
        533,
        matches ? C.teal : C.rust,
      );
    }
    return;
  }
  openFolio(g);
  if (b < 2) {
    const drop = !!cue(k, 1, 'selection drops it');
    const selected = drop ? [drill] : [POLICY_ID];
    rankList(g, june.trace.candidates, 91, 166, 'RETURNED CANDIDATES', 466);
    rankList(g, selected, 697, 166, 'SELECTED CONTEXT', 470);
    if (cue(k, 1, 'Search still found')) {
      score(
        g,
        94,
        478,
        'CANDIDATE RECALL',
        sourceCount(june.trace.candidates, [POLICY_ID]).hits + ' / 1',
      );
      score(g, 697, 478, 'CONTEXT RECALL', sourceCount(selected, [POLICY_ID]).hits + ' / 1');
    }
    if (cue(k, 2, 'prompt packing'))
      word(g, 'Inspect the shortlist, filters and packing.', 696, 601, 24, C.ink, 'Serif');
    return;
  }
  const progress = cue(k, 3, 'Move the freeze rule', 0.95),
    move = progress === 1;
  const order = move ? [drill, docs, POLICY_ID] : [POLICY_ID, drill, docs];
  rankMove(
    g,
    [POLICY_ID, drill, docs],
    [drill, docs, POLICY_ID],
    90,
    171,
    'PROMPT ORDER',
    464,
    progress,
  );
  word(g, 'What counts as useful?', 698, 159, 40, C.ink, 'Serif');
  const hits = sourceCount(order, [POLICY_ID]);
  score(g, 700, 250, 'SELECTED-SET PRECISION', hits.hits + ' / ' + hits.selected);
  if (cue(k, 4, 'A rank-weighted measure')) {
    const baseline = rankPrecision([true, false, false]),
      now = rankPrecision(order.map((id) => id === POLICY_ID));
    small(g, 'PRECISION AT THE USEFUL RANK', 699, 410);
    word(g, 'First: ' + baseline + ' / 1', 699, 467, 32, C.ink, 'Serif');
    word(g, 'Now: 1 / ' + Math.round(1 / now), 699, 522, 36, C.teal, 'Serif', 600);
  }
  if (cue(k, 5, 'moving the evidence'))
    word(g, 'Hold the passages fixed when testing position.', 95, 602, 26, C.slate, 'Sans');
}

// The same reviewed text determines both the line endpoint and the distinct-point tally.
function links(
  g,
  f,
  rows,
  { pendingThird = false, counts = [], edition, verdict, claimId, marginNote } = {},
) {
  openFolio(g);
  small(g, 'MAYA’S ANSWER', 85, 107);
  word(g, 'Claims made', 85, 166, 43, C.ink, 'Serif');
  small(g, 'DEPLOY-17  /  ' + edition, 728, 107);
  word(g, 'Required before rollout', 727, 165, 36, C.ink, 'Serif');
  const state = evaluated(f, rows),
    y0 = 229,
    pitch = 79;
  const rowY = (i) => y0 + i * pitch;
  f.required.forEach((p, i) => {
    const y = rowY(i);
    dot(g, 734, y, 9, null, C.brass);
    word(
      g,
      pointNames[p],
      758,
      y + 9,
      27,
      i === 3 && !state.mapped.includes(p) ? C.rust : C.ink,
      'Serif',
    );
  });
  rows.forEach((r, i) => {
    const y = rowY(i),
      point = state.mapped[i];
    wrap(g, r.text, 86, y - 5, 380, 23, C.ink, 'Serif', 26);
    if (r.citation === POLICY_ID) {
      round(g, 480, y - 20, 56, 26, 3, C.mist);
      word(g, '[17]', 508, y - 1, 17, C.teal, 'Mono', 600, 'center');
    }
    if (point && !(i === 2 && pendingThird)) {
      const target = f.required.indexOf(point);
      cord(g, 543, y, 734, rowY(target), i === 2 ? C.brass : C.teal, 4);
    } else if (!point) mark(g, 553, y, false, 13);
  });
  if (claimId) word(g, 'Claim 3 ID: ' + claimId, 86, 482, 19, C.slate, 'Mono');
  if (marginNote) word(g, marginNote, 86, 553, 23, C.slate, 'Sans', 400, 'left', 1097);
  if (counts.some(Boolean)) {
    ['Faithfulness', 'Cited support', 'Completeness'].forEach((name, i) => {
      const x = 91 + i * 383;
      small(g, name.toUpperCase(), x, 543);
      word(g, counts[i] ? state.counts[i] : '—', x, 595, 42, C.ink, 'Serif', 600);
    });
  }
  if (verdict) plate(g, verdict, 402, 617, 478, state.result.release ? C.teal : C.rust);
}
export function ledger(g, k) {
  const unsafe = !cue(k, 3, 'Now read a partial answer');
  const dup = !!cue(k, 4, 'repeat the approval sentence'),
    known = !!cue(k, 5, 'Approval again'),
    full = !!cue(k, 6, 'A linked rollback plan is required');
  let rows = unsafe
    ? answers.unsafe
    : full
      ? answers.complete
      : dup
        ? answers.duplicate
        : answers.partial;
  let counts = unsafe
    ? [
        cue(k, 1, 'Faithfulness is one of two'),
        cue(k, 2, 'cited support is one of two'),
        cue(k, 2, 'one of three required points'),
      ]
    : dup && !known
      ? [false, false, false]
      : full
        ? [
            cue(k, 6, 'All three claims have support'),
            cue(k, 6, 'all three citations'),
            cue(k, 6, 'all three required points'),
          ]
        : [
            known || cue(k, 3, 'Both claims are supported'),
            known || cue(k, 3, 'correctly cited'),
            known || cue(k, 3, 'Two policy requirements'),
          ];
  links(g, june, rows, {
    counts,
    edition: 'JUNE 1',
    pendingThird: dup && !known,
    claimId: dup ? 'rollback-plan' : '',
    verdict: unsafe && cue(k, 2, 'stops at faithfulness') ? 'First failure: faithfulness' : '',
    marginNote: dup && !known ? 'Where does the third line go?' : '',
  });
}
export function finalReplay(g, k) {
  if (cue(k, 5, 'open the five-case release report')) {
    suite(g, k, true);
    return;
  }
  const turn = cue(k, 1, 'open the July revision', 1.0),
    fresh = turn === 1,
    f = fresh ? july : june;
  const fixed = !!cue(k, 4, 'cite the July rule');
  const rows = f.complete.slice(0, fixed ? 4 : 3);

  // Opening the July revision exposes the added row, with no matching claim.
  links(g, f, rows, {
    edition: fresh ? 'JULY 1' : 'JUNE 1',
    counts: fixed
      ? Array(3).fill(cue(k, 4, 'All four requirements'))
      : [
          cue(k, 3, 'Faithfulness stays'),
          cue(k, 3, 'cited support stays'),
          cue(k, 3, 'Completeness is three of four'),
        ],
    verdict: fixed
      ? cue(k, 4, 'This trace passes')
        ? 'Maya’s trace passes'
        : ''
      : cue(k, 3, 'first failed check')
        ? 'First failure: completeness'
        : '',
    marginNote: !fresh
      ? turn === 0
        ? 'June’s three claims cover the June rule.'
        : ''
      : !cue(k, 3, 'Faithfulness stays')
        ? 'Each of the three claims cites the July revision.'
        : '',
  });
  if (turn > 0 && turn < 1) {
    // Pull out the June leaf. The answer and its three endpoints stay registered.
    const edge = 1222 - 553 * smooth(turn);
    g.save();
    g.beginPath();
    g.rect(edge, 49, 1225 - edge, 584);
    g.clip();
    box(g, 669, 49, 558, 586, C.cream);
    small(g, 'DEPLOY-17  /  JULY 1', 728, 107);
    word(g, 'Required before rollout', 727, 165, 36, C.ink, 'Serif');
    july.required.forEach((p, i) => {
      const y = 229 + i * 79;
      dot(g, 734, y, 9, null, C.brass);
      word(g, pointNames[p], 758, y + 9, 27, i === 3 ? C.rust : C.ink, 'Serif');
      if (i < 3) cord(g, 663, y, 734, y, i === 2 ? C.brass : C.teal, 4);
    });
    g.restore();
    poly(
      g,
      [
        [edge, 49],
        [edge + Math.sin(Math.PI * turn) * 30, 55],
        [edge + Math.sin(Math.PI * turn) * 27, 632],
        [edge, 635],
      ],
      C.edge,
    );
  }
}

function keySheet(g, k, reportOnly) {
  openFolio(g);
  small(g, 'EXACT ANSWER KEY', 92, 110);
  word(g, 'Words submitted', 92, 172, 43, C.ink, 'Serif');
  small(g, 'REVIEWED MEANING', 699, 110);
  word(g, 'Key lookup', 697, 172, 43, C.ink, 'Serif');
  paraphrases.forEach((text, i) => {
    const y = 235 + i * 109;
    wrap(g, text, 92, y, 445, 25);
    const hit = classify(text);
    if (hit || cue(k, 1, 'Both unfamiliar wordings need review')) {
      cord(g, 550, y - 7, 705, y - 7, hit ? C.teal : C.brass, 4);
      word(
        g,
        hit ? pointNames[hit] : 'Refer for review',
        730,
        y + 4,
        30,
        hit ? C.teal : C.rust,
        'Serif',
      );
    }
  });
  if (k.beat.beatIndex === 1 && cue(k, 2, 'rollback-plan'))
    word(
      g,
      'Claim ID: rollback-plan     Reviewed meaning: approval.',
      96,
      591,
      26,
      C.slate,
      'Serif',
    );
  if (reportOnly)
    word(
      g,
      'Review queue: ' +
        paraphrases.filter((t) => !classify(t)).length +
        ' / ' +
        paraphrases.length +
        ' wordings',
      700,
      589,
      28,
      C.ink,
      'Serif',
    );
}
export function key(g, k) {
  const b = k.beat.beatIndex;
  if (b <= 1 || b === 3) {
    keySheet(g, k, b === 3);
    return;
  }
  if (b === 2) {
    const rows = cue(k, 3, 'erase one attachment') ? answers.blank : answers.miscited;
    const m = evaluated(june, rows);
    openFolio(g);
    small(g, 'THREE SUPPORTED CLAIMS', 92, 111);
    word(g, 'Citation attachments', 91, 171, 42, C.ink, 'Serif');
    small(g, 'CITED DESTINATION', 700, 111);
    word(g, 'Outside the prompt', 698, 171, 40, C.ink, 'Serif');
    rows.forEach((r, i) => {
      const y = 247 + i * 84;
      word(g, pointNames[m.mapped[i]], 94, y + 7, 29, C.ink, 'Serif');
      if (r.citation) {
        cord(g, 445, y, 689, y, C.rust, 4);
        word(g, sourceNames[r.citation], 714, y + 7, 28, C.rust, 'Serif');
      } else word(g, 'Attachment blank', 462, y + 7, 24, C.slate, 'Sans');
    });
    if (cue(k, 3, 'Citation support becomes zero')) {
      score(
        g,
        96,
        511,
        'ATTACHED',
        Math.round(m.result.citationCoverage * rows.length) + ' / ' + rows.length,
      );
      score(g, 698, 511, 'CITED SUPPORT', m.counts[1]);
    }
    return;
  }
  base(g, 'night');
  const wrong = !!cue(k, 6, 'Change their citations'),
    full = !!cue(k, 5, 'Add the correctly cited rollback sentence');
  const call = readerCall(full ? 3 : 2, wrong),
    rows = call.rows;
  const scored = wrong
    ? cue(k, 7, 'The citation check')
    : full
      ? cue(k, 5, 'Now the complete answer passes')
      : cue(k, 5, 'At completeness');
  title(g, 'READER-RAG-CLAIMS.PY', 'Run the exact-key evaluator', 64, 74, true);
  round(g, 61, 159, 1156, 415, 13, '#0f2931', '#68847e', 3);
  small(g, 'INPUT  /  CLAIM → CITED SOURCE', 96, 208, C.sea);
  rows.forEach((r, i) => {
    const y = 258 + i * 62;
    wrap(g, r.text, 97, y, 566, 21, C.cream, 'Mono', 23);
    word(g, '→ ' + r.citation, 695, y, 20, wrong ? C.gold : C.sea, 'Mono', 400, 'left', 474);
  });
  line(g, 94, 421, 1177, 421, '#648279');
  small(g, 'OUTPUT', 97, 463, C.sea);
  let out = 'Which check stops this call?';
  if (scored) out = call.out;
  else if (!wrong) out = 'Running checks…';
  word(g, out, 96, 524, 27, C.cream, 'Mono', 500, 'left', 1087);
  if (wrong && scored)
    word(g, 'The evaluator stopped before completeness.', 66, 638, 31, C.gold, 'Serif');
}
