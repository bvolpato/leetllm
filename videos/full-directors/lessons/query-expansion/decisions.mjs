import { C, mix } from './ink.mjs';
import {
  LATENCY_STAGES,
  LATENCY_TRACES,
  RELEASE_ROUTES,
  cost,
  tails,
  fan,
  eligibleRoutes,
  run,
  retrievalAfter,
  shortName,
  folio,
  requestBudget,
  INCIDENTS,
  lookupIncident,
  observedId,
  proposedId,
} from './evidence.mjs';

export function latency(p) {
  const { at, base, mono, text, rect, line, serif, band, beat, tag, circle } = p;
  const stageColors = [C.blue, C.rust, C.jade, '#715981', '#496649'];
  if (beat <= 2) {
    base('LATENCY   /   ONE INVENTED SERIAL TRACE', 'When can the first token arrive?');
    const cues = [
      'one hundred twenty',
      'Encoding takes twenty',
      'retrieval takes twenty-five',
      'reranking takes fifty',
      'another one hundred eighty',
    ];
    const names = ['Rewrite', 'Encode', 'Retrieve', 'Rerank', 'First token'];
    let running = 0;
    LATENCY_STAGES.forEach(({ ms }, i) => {
      const start = running;
      running += ms;
      const y = 151 + i * 52,
        x = 265 + start * 1.5;
      text(names[i], 40, y + 20, 21);
      line(264, y + 11, 264 + cost * 1.5, y + 11, C.edge, 1);
      if (at(1, cues[i])) {
        rect(x, y, ms * 1.5, 21, stageColors[i], 2);
        mono(ms + ' ms', x + ms * 0.75, y + 43, 15, stageColors[i], 125, 'center');
      }
    });
    const finish = at(2, 'three hundred ninety-five');
    band(
      finish
        ? 'Time to first token    ' + cost + ' ms   ·   Generation continues after this point.'
        : 'Each stage starts when the previous stage finishes.',
    );
    return;
  }
  if (beat <= 5) {
    const reveal = at(5, 'one hundred ten milliseconds');
    const rank = Math.ceil(LATENCY_TRACES.length * 0.95);
    const ranked = at(4, 'nineteenth one');
    base('TAIL LATENCY   /   TWENTY SERIAL REQUESTS', 'What is p95 of the complete requests?');
    mono('Stage A', 39, 143, 16, C.blue);
    mono('Stage B', 177, 143, 16, C.rust);
    text('18 traces   10 + 10 ms', 39, 190, 22);
    text('Trace 19   100 + 10', 365, 190, 22);
    text('Trace 20   10 + 100', 663, 190, 22);
    const sorted = [...LATENCY_TRACES].sort((a, b) => a.total - b.total);
    sorted.forEach(({ a, b, id }, i) => {
      const x = 40 + i * 43.8,
        y = 379,
        scale = 1.38;
      rect(x, y - a * scale, 30, a * scale, C.blue);
      rect(x, y - (a + b) * scale, 30, b * scale, C.rust);
      mono(id, x + 15, y + 24, 13, C.soft, 34, 'center');
      if (ranked && i === rank - 1) {
        line(x - 3, y + 32, x + 34, y + 32, C.jade, 4);
        if (reveal) mono(tails[2] + ' ms', x + 14, y - 160, 17, C.jade, 93, 'center');
      }
    });
    const stageP95 = at(3, 'Each stage on its own');
    band(
      reveal
        ? 'Request p95 = ' +
            tails[2] +
            ' ms. Adding stage percentiles would give ' +
            (tails[0] + tails[1]) +
            ' ms.'
        : ranked
          ? 'Nearest rank   ceil(20 × 0.95) = 19. Read the entire bar at rank 19.'
          : stageP95
            ? 'Stage A p95 = 10 ms. Stage B p95 = 10 ms. The stalls affect different requests.'
            : 'Each bar is a complete request, with its own two stage times.',
    );
    return;
  }
  const product = at(6, 'about point eight five seven');
  base('FAN-OUT   /   THREE INDEPENDENT DEADLINES', 'What is the chance all three finish on time?');
  const origin = 97,
    fork = 250,
    join = 713;
  circle(origin, 282, 13, C.ink);
  line(origin, 282, fork, 282, C.ink, 3);
  for (let i = 0; i < fan.paths; i++) {
    const y = 182 + i * 100;
    line(fork, 282, fork, y, C.blue, 3);
    line(fork, y, join, y, C.blue, 3);
    line(join, y, join, 282, C.blue, 3);
    rect(330, y - 25, 296, 50, C.white, 5);
    text(
      'Search ' + (i + 1) + '   P(≤ ' + fan.deadline + ' ms) = ' + fan.p,
      478,
      y + 7,
      18,
      C.blue,
      'Mono',
      277,
      'center',
    );
  }
  line(join, 282, 853, 282, C.ink, 3);
  circle(858, 282, 14, product ? C.jade : C.soft);
  mono('Wait for all', 760, 242, 16);
  band(
    product
      ? 'Under independence    0.95 × 0.95 × 0.95 = ' +
          (fan.p ** fan.paths).toFixed(3) +
          ' (rounded)'
      : 'Each search must meet the same deadline. Assume independent completion times.',
  );
}

export function release(p) {
  const { at, base, mono, text, serif, rect, line, band, beat, tag } = p;
  if (beat <= 2) {
    base('HELD-OUT EVALUATION   /   CONTROL = RAW HYBRID', 'Which failure did the baseline show?');
    const rows = [
      ['Missing subject', 'Use the prior turn', 'rewrite for a missing subject', 1],
      ['Right page buried', 'Rerank the shortlist', 'try reranking', 1],
      ['Short query misses formal prose', 'Try a passage proxy', 'test HyDE', 1],
      ['Missing fact or entity', 'Correct or follow the dependency', 'correct the search', 2],
    ];
    mono('OBSERVED ON THE SAME QUESTIONS', 40, 143);
    mono('REPAIR TO TEST', 525, 143);
    rows.forEach(([symptom, repair, cue, n], i) => {
      const y = 160 + i * 64;
      rect(38, y, 884, 54, C.white, 3);
      text(symptom, 54, y + 35, 22, C.ink);
      if (at(n, cue)) {
        p.arrow(456, y + 26, 495, y + 26, C.jade);
        text(repair, 523, y + 35, 22, C.jade, 'Sans', 385);
      }
    });
    band(
      at(2, 'trained Self-RAG generator')
        ? 'A trained Self-RAG generator can read HyDE hits. Evaluate the combination separately.'
        : 'Keep the baseline so you can measure what each extra step changes.',
    );
    return;
  }
  const qualityReady = p.after(4, 'point nine three') === 1;
  const requested = at(4, 'three hundred fifty milliseconds') && p.after(4, 'three hundred fifty milliseconds');
  const tightening = at(6, 'three hundred milliseconds');
  const travel = p.after(6, 'three hundred milliseconds', 0.85);
  const ceiling = mix(350, 300, travel);
  const firstResult = at(5, 'Rewrite clears both') && p.after(5, 'Rewrite clears both');
  const tighterResult = at(6, 'No route passes both') && p.after(6, 'No route passes both');
  const showResult = tightening ? travel === 1 && tighterResult : firstResult;
  const eligible = eligibleRoutes(travel === 1 ? 300 : 350).map((r) => r.id);
  base(
    'RELEASE DECISION   /   SAME 50 ANSWERABLE QUESTIONS',
    'Which route clears both requirements?',
  );
  mono('Supported answers', 220, 144, 15);
  mono('End-to-end p95', 574, 144, 15);
  mono('Gate', 849, 144, 15);
  const xMs = (ms) => 568 + ms * 0.53;
  const gateX = xMs(ceiling);
  if (qualityReady) mono('≥ 0.93', 220, 170, 15, C.rust);
  if (requested)
    mono(tightening && travel < 1 ? 'Tightening' : '≤ ' + (travel === 1 ? 300 : 350) + ' ms',
      574, 170, 15, C.rust);
  RELEASE_ROUTES.forEach((route, i) => {
    const y = 193 + i * 72;
    text(['Raw hybrid', 'Rewrite', 'Costly route'][i], 39, y + 26, 22);
    for (let j = 0; j < route.total; j++)
      rect(
        218 + (j % 25) * 8.1,
        y + Math.floor(j / 25) * 11,
        6.5,
        8,
        j < route.supported ? C.jade : C.edge,
        1,
      );
    mono(route.supported + '/' + route.total + ' = ' + route.accuracy.toFixed(2),
      218, y + 48, 15, C.ink);
    rect(568, y + 2, xMs(route.p95) - xMs(0), 21, C.blue, 3);
    if (tightening && route.p95 > ceiling) {
      const end = xMs(route.p95);
      rect(gateX, y + 2, end - gateX, 21, C.rust, 2);
    }
    mono(route.p95 + ' ms', 569, y + 47, 15, C.blue);
    if (showResult)
      tag(eligible.includes(route.id) ? 'Pass' : 'Hold', 838, y + 1, 78,
        eligible.includes(route.id) ? C.mint : C.amber,
        eligible.includes(route.id) ? C.jade : C.rust);
  });
  if (requested) {
    if (tightening) line(xMs(350), 181, xMs(350), 367, C.edge, 2);
    line(gateX, 181, gateX, 367, C.rust, 2.5);
    p.circle(gateX, 181, 4, C.rust);
  }
  const message = showResult
    ? eligible.length
      ? 'Rewrite meets both gates on this sample.'
      : 'Release blocked. No route meets both gates.'
    : tightening
      ? 'Same answers and latencies. Which route still fits?'
      : requested
        ? 'Which route meets both thresholds?'
        : 'One mark per question. Count source-backed answers.';
  rect(38, 395, 884, 29, C.dark, 4);
  text(message, 56, 416, 19, C.white, 'Sans', 847);
}

export function finalLookup(p) {
  const { at, base, mono, text, serif, rect, line, film, slip, band, tag, beat } = p;
  if (beat <= 2) {
    const cues = [
      'Send the original wording',
      'Send the quota query',
      'Send the queue query',
      'send the capacity query',
    ];
    const calls = cues.filter((s) => at(1, s)).length;
    const state = retrievalAfter(calls);
    const blocked = at(2, 'Stop it before dispatch') && !requestBudget(calls + 1).admitted;
    base(
      'SEARCH BUDGET   /   THREE RESULTS ALLOWED PER CALL',
      'How much work did the four searches do?',
    );
    mono('QUERY', 38, 141);
    mono('RETURNED FOLIOS', 434, 141);
    run.queries.forEach((q, i) => {
      const y = 156 + i * 61;
      rect(38, y, 884, 52, i < calls ? C.white : C.shade, 3);
      text(q, 53, y + 33, 22, C.ink, 'Sans', 368);
      if (i < calls) {
        const ids = state.returns[i];
        if (!ids.length) mono('Empty return', 436, y + 33, 17);
        ids.forEach((id, j) =>
          tag(
            folio[id] + '   ' + shortName[id],
            433 + j * 219,
            y + 13,
            207,
            id === 'queue-guide' ? C.sky : C.mint,
            id === 'queue-guide' ? C.blue : C.jade,
          ),
        );
      }
    });
    mono(
      blocked
        ? 'FIFTH CALL HELD BEFORE DISPATCH'
        : calls +
            (calls === 1 ? ' call' : ' calls') +
            '   ×   top 3   =   ' +
            state.budget.candidateCap +
            ' possible entries',
      39,
      423,
      16,
      blocked ? C.rust : C.soft,
    );
    band(
      'Dispatched   ' +
        calls +
        ' / 4               Returned entries   ' +
        state.entries +
        '               Distinct pages   ' +
        state.ids.length,
    );
    return;
  }
  const proposal = at(3, 'A proposed rewrite');
  const wrong = at(4, 'returns nine eighteen UTC');
  const carry = at(4, 'Carry the exact ID', 1.1);
  const settled = at(4, 'This incident closed');
  const lookupId = carry >= 1 ? observedId : proposal && carry === 0 ? proposedId : null;
  const row = lookupIncident(lookupId);
  const cited = settled && row?.id === observedId;
  const inspected = wrong && (row?.id === proposedId || cited);
  base('SUPPORT REGISTER   /   EXACT LOOKUP', 'When did this developer’s incident close?');
  slip(38, 122, 421, 124);
  mono('EARLIER MESSAGE', 58, 150);
  text('We logged the leaked key as', 58, 181, 20);
  const srcX = 56,
    srcY = 193,
    dstX = 598,
    dstY = 180;
  tag(observedId, srcX, srcY, 170, C.sky, C.blue);
  film(495, 122, 427, 124);
  mono('LOOKUP KEY', 517, 151, 15, C.amber);
  if (lookupId && !carry) tag(lookupId, dstX, dstY, 170, C.amber, C.rust);
  if (carry) tag(observedId, mix(srcX, dstX, carry), mix(srcY, dstY, carry), 170, C.sky, C.blue);
  mono('INCIDENT', 43, 281);
  mono('CLOSED AT', 520, 281);
  mono('SOURCE CHECK', 726, 281);
  INCIDENTS.forEach((entry, i) => {
    const y = 296 + i * 59,
      chosen = inspected && entry.id === row.id;
    rect(38, y, 884, 51, chosen ? (cited ? C.mint : C.amber) : C.white, 3);
    text(entry.id, 56, y + 34, 25, C.ink, 'Mono');
    text(entry.closed, 516, y + 34, 25, C.ink, 'Mono');
    if (chosen)
      mono(cited ? 'Matches chat' : 'Different ID', 725, y + 33, 17, cited ? C.jade : C.rust);
  });
  band(
    cited
      ? 'Closed ' + row.closed + '     ·     Source ' + row.id
      : carry > 0
        ? 'Use the identifier as written in the conversation.'
        : wrong
          ? '09:18 belongs to INC-48219. Compare the final two digits.'
          : 'The follow-up asks “When did it close?” Match the number in the earlier turn.',
  );
}
