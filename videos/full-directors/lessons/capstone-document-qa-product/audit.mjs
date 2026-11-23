import * as A from './press.mjs';
import * as M from './evidence.mjs';
const {
  ink,
  teal,
  green,
  red,
  navy,
  muted,
  white,
  paper,
  pale,
  pink,
  yellow,
  blue,
  base,
  rect,
  line,
  dot,
  txt,
  para,
  mono,
  heading,
  label,
  leaf,
  folio,
  book,
  hashMark,
  stamp,
  fold,
  bracket,
  link,
  band,
} = A;
function underlineMatches(c, text, matches, x, y, size, color, underline) {
  txt(c, text, x, y, size, color, 'Serif');
  for (const word of text.matchAll(/[a-z0-9]+/gi)) {
    const [term] = M.terms(word[0]);
    if (matches.includes(term)) {
      const start = x + c.measureText(text.slice(0, word.index)).width;
      line(c, start, y + 5, start + c.measureText(word[0]).width, y + 5, underline, 2.5);
    }
  }
}
export function requests(c, { b, cue }) {
  base(c, 'green');
  const idx = cue(3, 'For the third request') ? 2 : cue(1, 'Now ask about permanent') ? 1 : 0;
  const row = M.cases[idx];
  const hit = row.hits[0];
  const scoresVisible = [
    cue(1, 'Eight shared terms'),
    cue(1, 'Four terms still match'),
    cue(3, 'Two terms still retrieve'),
  ];
  folio(c, 60, 40, 1075, 180, white, navy);
  label(c, 'APPROVED POLICY PASSAGE', 92, 74, teal);
  label(c, 'CANDIDATE MINIMUM   ' + M.candidateMinimum + ' DISTINCT TERMS', 777, 74, teal);
  mono(c, hit.id, 92, 114, 31);
  const sentences = hit.text.match(/[^.!?]+[.!?]/g);
  sentences.forEach((sentence, i) =>
    underlineMatches(c, sentence.trim(), hit.matched, 92, 156 + 41 * i, 26, ink, teal),
  );
  for (let i = 0; i <= idx; i++) {
    const y = 241 + 101 * i,
      v = M.cases[i],
      ready = [
        cue(1, 'Its matching review'),
        cue(2, 'The review says unknown'),
        cue(3, 'There is no review'),
      ][i];
    leaf(c, 69, y, 1051, 87, i === idx ? white : paper);
    label(c, v.name.toUpperCase(), 90, y + 28);
    if (scoresVisible[i]) mono(c, v.hits[0].score + ' shared terms', 90, y + 63, 21, navy);
    if (ready) {
      txt(
        c,
        v.receipt ? v.label : 'No review on file',
        458,
        y + 56,
        28,
        v.receipt ? ink : red,
        'Serif',
      );
      stamp(
        c,
        v.status + '   /   ' + v.reply.citations.length + ' cited',
        795,
        y + 23,
        288,
        i === 0 ? green : red,
        21,
      );
    }
  }
  label(c, idx === 2 ? 'SEARCH TEXT FROM THE LOOSE NOTE' : 'CALLER’S QUESTION', 75, 566, pale);
  underlineMatches(c, row.q, hit.matched, 75, 604, 27, white, yellow);
}
export function http(c, { b, cue }) {
  base(c, 'blue');
  if (b <= 4) {
    folio(c, 48, 43, 1100, 566, white, navy);
    label(c, 'FASTAPI   /   LOCAL TESTCLIENT', 83, 87, teal);
    mono(c, 'POST /answer', 82, 140, 41, ink);
    if (b === 1 && !cue(1, 'The successful response')) {
      mono(
        c,
        'uv run document_qa_lab.py --check --output eval-rows.jsonl',
        83,
        244,
        26,
        navy,
        1005,
      );
      line(c, 84, 272, 1084, 272, muted);
      [
        ['fastapi', '0.116.1'],
        ['httpx', '0.28.1'],
        ['uvicorn', '0.35.0'],
      ].forEach(([name, v], i) => {
        const x = 86 + i * 331;
        txt(c, name, x, 363, 36, ink, 'Serif');
        mono(c, v, x, 414, 25, teal);
      });
      return;
    }
    const ok = M.cases[0],
      citation = ok.reply.citations[0];
    label(
      c,
      '200   /   ' + ok.status.toUpperCase() + '    /    bound_support_receipt_entailed',
      86,
      188,
      teal,
    );
    const on = cue(3, 'Start at character zero');
    rect(c, 78, 212, 1035, 118, on ? pale : paper);
    para(c, ok.reply.answer, 97, 251, 993, 30, 40);
    if (b >= 2) {
      label(c, 'CITATION   /   ' + citation.section, 84, 373, teal);
      mono(c, citation.chunkId, 84, 408, 22, ink, 1007);
      hashMark(c, M.original[0].hash, 85, 457, 317);
      mono(c, '[' + citation.span.join(', ') + ')', 478, 456, 27, navy);
      txt(c, 'end excluded', 690, 456, 23, muted);
      mono(c, 'entailed   /   ' + ok.receipt, 85, 515, 23);
    }
    if (b === 4)
      band(
        c,
        'Public payload excludes rejected record IDs, including debug fields.',
        82,
        545,
        1027,
        red,
        pink,
      );
    else if (b >= 2) mono(c, citation.corpusVersion, 85, 570, 20, muted, 991);
  } else {
    folio(c, 53, 54, 1094, 510, white, navy);
    heading(c, 'IN-PROCESS REQUESTS', 'At the HTTP boundary', 91, 100, 990);
    const visible = [
      cue(5, 'four oh one'),
      cue(5, 'four twenty-two'),
      cue(5, 'four twenty-two'),
      cue(5, 'It receives'),
    ];
    const rows = [
      ['Credential omitted', '401', 'Authentication required'],
      ['Valid caller, blank question', '422', 'Invalid request'],
      ['Valid caller, extra region field', '422', 'Unexpected field'],
      ['Valid EU caller, valid question', '200', 'abstain   /   citations []'],
    ];
    rows.forEach(([input, code, result], i) => {
      const y = 225 + i * 78;
      if (!visible[i]) return;
      txt(c, input, 93, y, 29, ink, 'Serif');
      mono(c, code, 600, y, 31, i === 3 ? teal : red);
      txt(c, result, 753, y, 24, ink, 'Sans', 400, 336);
      line(c, 92, y + 21, 1094, y + 21, '#bdbea5', 1);
    });
    if (b === 6)
      label(c, 'Use verified identities and server-side grants in the deployed service.', 93, 533);
  }
}
export function upgrades(c, { b, cue, after }) {
  base(c, 'linen');
  if (b <= 2) {
    book(c, 59, 67, 1080, 462);
    heading(c, 'FROZEN QUERY', 'The paraphrase', 93, 107, 462);
    para(c, M.PARAPHRASE, 95, 222, 460, 34, 44);
    band(
      c,
      'Lexical overlap   ' + M.sharedTerms(M.PARAPHRASE, M.LAB_POLICY).length,
      93,
      417,
      454,
      red,
      pink,
    );
    const dense = b === 2;
    heading(c, 'RETRIEVAL EXPERIMENT', dense ? 'Separate encodings' : 'BM25', 637, 107, 448);
    if (dense) {
      ['Question vector', 'Passage vector'].forEach((s, i) => {
        label(c, s, 643, 235 + i * 93, navy);
        for (let j = 0; j < 8; j++)
          rect(c, 645 + j * 44, 251 + i * 93, 32, 26, (i + j) % 3 ? blue : teal);
      });
      label(c, 'Schematic   /   compare vectors', 644, 445, muted);
    } else {
      ['Term frequency', 'Term rarity', 'Document length'].forEach((s, i) => {
        txt(c, s, 640, 249 + i * 74, 31, ink, 'Serif');
        line(c, 640, 267 + i * 74, 1083, 267 + i * 74, '#a5aaa0');
      });
    }
    label(
      c,
      'Check meaning with a reviewer. Freeze the question and expected result for comparison.',
      78,
      589,
      ink,
      1040,
    );
  } else if (b <= 5 || (b === 6 && !after(6, 'For another upgrade'))) {
    const trial = b > 4 && after(5, 'eight'),
      k = trial ? 8 : 60,
      docs = trial ? M.transfer : M.fusion;
    const totals = trial
      ? [
          after(6, 'S gets one tenth plus one twelfth, about point one eight three'),
          after(6, 'T gets one ninth, about point one one one'),
        ]
      : [
          after(4, 'A gets one over sixty-one plus one over sixty-two'),
          after(4, 'B gets the same terms in reverse order, so they tie'),
          after(4, 'C is absent from both lists and gets zero'),
        ];
    folio(c, 59, 56, 1080, 523, white, navy);
    heading(c, 'RECIPROCAL RANK FUSION', 'Add the rank contributions', 95, 100, 945);
    mono(c, 'k = ' + k + '     rank starts at 1     absent adds 0', 95, 198, 23, teal);
    ['Document', 'First list', 'Second list', 'Sum of 1 / (k + rank)'].forEach((t, i) =>
      label(c, t, [94, 315, 520, 726][i], 249),
    );
    docs.forEach(([id, rs], i) => {
      const y = 321 + 78 * i;
      txt(c, id, 96, y, 40, ink, 'Serif');
      rs.forEach((r, j) => mono(c, r === null ? 'absent' : r, 315 + j * 205, y, 27, muted));
      if (totals[i]) {
        const score = M.rrf(rs, k);
        mono(c, score === 0 ? '0' : '≈ ' + score.toFixed(trial ? 3 : 5), 729, y, 32, teal);
      }
      line(c, 94, y + 20, 1097, y + 20, '#bdbba6');
    });
    if (trial && !totals[0]) txt(c, 'Which sum is larger?', 95, 501, 34, ink, 'Serif');
    if (totals[0]) {
      const [id, ranks] = docs[0];
      mono(c, id + ' = ' + ranks.map((rank) => '1/' + (k + rank)).join(' + '), 95, 535, 27, navy);
    }
  } else if (b === 6) {
    folio(c, 61, 64, 1078, 504, white, teal);
    heading(c, 'RERANKING', 'Read each pair together', 94, 112, 972);
    const y = 265;
    ['Q  +  candidate A', 'Q  +  candidate B', 'Q  +  candidate C'].forEach((s, i) => {
      const x = 95 + i * 338;
      leaf(c, x, y, 305, 145, blue);
      txt(c, s, x + 14, y + 64, 26, navy, 'Mono', 400, 276);
      if (cue(6, 'Tokens from the two')) {
        link(c, x + 32, y + 83, x + 199, y + 83, teal);
        label(c, 'joint token interactions', x + 15, y + 119);
      }
    });
    band(c, 'Three pairs require three pair scores.', 96, 463, 975);
  } else {
    folio(c, 54, 65, 1092, 491, white, navy);
    heading(c, 'CONTEXT PACKING EXPERIMENT', 'Move the evidence', 91, 113, 990);
    const r = cue(7, 'vary the evidence position', 1.4);
    const offset = (1 - r) * 1 + r * 4;
    label(c, 'Model input   /   fixed question', 94, 230);
    for (let i = 0; i < 7; i++) {
      rect(c, 95 + i * 144, 255, 134, 118, blue);
      for (let j = 0; j < 4; j++)
        line(c, 108 + i * 144, 282 + j * 16, 207 + i * 144, 282 + j * 16, '#8ba4a3', 2);
    }
    rect(c, 95 + offset * 144, 249, 134, 130, teal);
    txt(c, 'Evidence', 103 + offset * 144, 318, 23, white, 'Sans', 700, 118);
    txt(
      c,
      'Compare answer quality and latency at each position and budget.',
      95,
      476,
      29,
      ink,
      'Serif',
      400,
      990,
    );
  }
}
export function scope(c, { b, cue }) {
  base(c, 'clay');
  const removed = Boolean(cue(4, 'Remove the unsupported claim'));
  folio(c, 59, 43, 1082, 548, white, navy);
  heading(
    c,
    'ACCESS POLICY   /   PROOF OF SCOPE',
    b < 3 ? 'Read the qualifier' : 'Audit the draft',
    93,
    87,
    970,
  );
  const x = 97,
    leftEnd = 621,
    end = 1093;
  const r = A.ease(cue(1, 'Now extend the bracket', 1.8));
  if (b < 3) {
    const y = 240;
    bracket(c, x, leftEnd + (end - leftEnd) * r, y, r > 0 ? red : teal);
    label(
      c,
      r === 1
        ? 'DRAFT   /   ALL RESTORES'
        : r === 0
          ? 'POLICY   /   PRIVILEGED SCOPES'
          : 'EXTENDING THE DRAFT’S SCOPE',
      x,
      y - 18,
      r > 0 ? red : teal,
    );
    line(c, 642, 264, 642, 508, '#c4baa2', 2);
    label(c, 'PRIVILEGED ACCESS', x, 303, teal);
    label(c, 'ORDINARY ACCESS', 677, 303, muted);
    rect(c, x - 2, 341, 502, 125, pale);
    para(c, M.LAB_POLICY.split('. ')[1], x + 12, 382, 480, 28, 34);
    line(c, 678, 450, 1080, 450, '#b3a88f', 1.4);
    if (b === 2) label(c, 'No supporting passage', 678, 485, red);
    if (r === 1)
      txt(c, 'Draft: “All restores require manager approval.”', 94, 548, 28, ink, 'Serif');
  } else {
    txt(c, 'Does ordinary access need manager approval?', 94, 203, 34, navy, 'Serif');
    const shown = removed ? [M.claims[0]] : M.claims;
    shown.forEach((claim, i) => {
      const y = 246 + i * 93,
        marked = i === 0 ? cue(3, 'The policy supports') : cue(3, 'The policy never says');
      rect(c, 92, y, 1002, 68, marked ? (claim.supported ? pale : pink) : paper);
      txt(c, claim.text, 111, y + 44, 29, ink, 'Serif', 400, 639);
      if (marked)
        label(
          c,
          claim.supported ? 'SUPPORTED' : 'NO SUPPORT IN SOURCE',
          788,
          y + 42,
          claim.supported ? teal : red,
        );
    });
    if (!removed && cue(3, 'One of the two'))
      txt(
        c,
        shown.filter((x) => x.supported).length +
          ' of ' +
          shown.length +
          ' atomic claims supported',
        95,
        494,
        36,
        teal,
        'Serif',
      );
    if (removed) {
      label(c, 'Surviving claim covers privileged access.', 96, 374, teal);
      if (cue(4, 'the service abstains'))
        stamp(c, 'Abstain on ordinary access', 94, 461, 548, red, 28);
    }
    txt(c, 'Source: “' + M.LAB_POLICY.split('. ')[1] + '”', 95, 551, 23, ink, 'Serif', 400, 988);
  }
}
export function replay(c, { b, cue }) {
  base(c, 'green');
  folio(c, 47, 47, 1106, 550, white, navy);
  const copies = Boolean(cue(5, 'Replace the private-note row')),
    imported = copies ? [M.cases[0], M.cases[1], M.cases[0]] : M.cases;
  if (b <= 4) {
    const recall = b >= 3;
    heading(
      c,
      'POLICY-QA-V1   /   THREE FROZEN FIXTURES',
      recall ? 'Who enters recall at one?' : 'Replay ledger',
      79,
      88,
      1000,
    );
    const heads = recall
      ? ['Fixture', 'Expected docs', 'Found at 1', 'Recall @1']
      : ['Fixture', 'Actual', 'Support label', 'Receipt'];
    const cx = recall ? [81, 526, 749, 956] : [81, 462, 625, 817];
    heads.forEach((s, i) => label(c, s, cx[i], 208, muted));
    M.cases.forEach((r, i) => {
      const y = 271 + i * 83;
      line(c, 79, y - 35, 1115, y - 35, '#b9b69c');
      mono(c, r.id, cx[0], y, 21, ink, 361);
      if (recall) {
        mono(c, r.expectedDocs.length, cx[1], y, 26);
        mono(c, r.recall === null ? 'n/a' : r.recall, cx[2], y, 26);
      } else {
        txt(c, r.status, cx[1], y, 24, ink);
        txt(c, r.label, cx[2], y, 24, ink);
      }
      if (!recall || cue(3, i === 0 ? 'giving one out of one' : 'store null'))
        mono(
          c,
          recall ? (r.recall === null ? 'null' : '1 / 1') : (r.receipt ?? 'null'),
          cx[3],
          y,
          recall ? 26 : 18,
          r.receipt ? teal : muted,
          recall ? 133 : 291,
        );
    });
    const detail =
      b === 1
        ? 'A bound unknown judgment has a receipt ID.'
        : b === 2
          ? 'Keep question, expected and actual response, citations, snapshot, slice and grader.'
          : b === 3
            ? 'Recall divides retrieved expected documents by expected documents.'
            : 'Grade refusals by their text and empty citations.';
    band(c, detail, 79, 499, 1033, navy, blue);
  } else {
    heading(c, 'IMPORT AUDIT', 'Count the identities', 80, 90, 1000);
    const counts = M.coverage(imported);
    label(c, 'IMPORTED ROWS', 82, 202);
    label(c, 'EXPECTED ONCE EACH', 674, 202);
    imported.forEach((r, i) => {
      const y = 226 + i * 72;
      leaf(c, 83, y, 489, 54, paper);
      mono(c, r.id, 99, y + 34, 22, ink, 450);
    });
    M.cases.forEach((r, i) => {
      const y = 259 + i * 72;
      mono(c, r.id, 675, y, 19, ink, 325);
      mono(c, counts[i], 1059, y, 27, counts[i] === 1 ? teal : red);
    });
    if (cue(5, 'Block the release')) stamp(c, 'Block release', 83, 477, 319, red, 28);
    if (b === 6) {
      const field =
        M.replayFailures[cue(6, 'fabricated receipt') ? 2 : cue(6, 'unsafe advice') ? 1 : 0];
      band(c, field.name + '   /   ' + field.result, 450, 461, 649, red, pink);
      mono(c, 'imported   ' + JSON.stringify(field.imported), 451, 537, 19, ink, 643);
      mono(c, 'expected   ' + JSON.stringify(field.expected), 451, 570, 19, teal, 643);
    }
  }
}
export function rebuild(c, { b, cue }) {
  base(c, 'linen');
  const restored = Boolean(cue(3, 'Rebuild from the restored file'));
  const edit = cue(1, 'one-word edit');
  const files = !edit || restored || cue(2, 'Put the original bytes back') ? M.original : M.edited,
    loaded = !edit || restored ? M.original : M.edited;
  const found = M.retrieve(M.SUPPORT_QUESTION, loaded),
    success = found.length > 0 && M.cases[0].reply.bound;
  folio(c, 60, 52, 1080, 528, white, teal);
  heading(c, 'FROZEN REQUEST   /   REQUIRED_POLICY_ANSWER', 'Rebuild the lookup', 92, 97, 976);
  txt(c, M.SUPPORT_QUESTION, 93, 195, 28, ink, 'Serif', 400, 986);
  line(c, 93, 215, 1097, 215, teal, 2);
  [
    ['Registry expects', M.original[0].hash],
    ['File on disk', files[0].hash],
    ['Input to last build', loaded[0].hash],
  ].forEach(([t, h], i) => {
    const x = 95 + i * 338;
    label(c, t.toUpperCase(), x, 270);
    hashMark(c, h, x, 322, 307, h === M.original[0].hash ? teal : red);
  });
  txt(c, '“' + files[0].record.text.split('. ')[0] + '.”', 94, 387, 30, ink, 'Serif', 400, 987);
  if (b >= 2) {
    band(
      c,
      success ? 'Candidate   ' + found[0].id : 'Candidate list   []',
      92,
      445,
      605,
      success ? teal : red,
      success ? pale : pink,
    );
    stamp(
      c,
      success ? 'Grounded   /   1 citation' : 'Abstain   /   0 citations',
      725,
      450,
      364,
      success ? green : red,
    );
    if (success || cue(2, 'fails the test'))
      label(
        c,
        success ? 'EXPECTED ANSWER RECOVERED' : 'REQUIRED ANSWER MISSING',
        94,
        545,
        success ? teal : red,
      );
  } else {
    txt(c, 'Expected: one citation to the original policy', 94, 505, 28, navy, 'Serif');
  }
}
