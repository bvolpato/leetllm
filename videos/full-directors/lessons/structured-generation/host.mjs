import * as ex from './examples.mjs';
import { ink, white, fog, gold, mint, rose, teal, rust, pale, rule, board } from './press.mjs';

export function backend(g) {
  const { beat, at } = g;
  if (beat === 1) {
    g.slip(45, 110, 870, 110, 'OUTLINES v1  /  Generator(model, RunTriage)', [
      '{"run_id":"' + ex.runTriage.run_id + '","status":"' + ex.runTriage.status + '",',
      ' "failing_job":"' + ex.runTriage.failing_job + '"}',
    ]);
    g.text('Return type', 57, 251, 22, fog);
    g.text('str', 57, 302, 36, gold, 'Mono');
    g.arrow(198, 302, 374, 302);
    g.text('model_validate_json(raw)', 407, 252, 24, fog, 'Mono', 450);
    const parsed = at(1, 'Parse that text');
    g.text(
      parsed ? 'triage.status = "' + ex.runTriage.status + '"' : 'Waiting for validation',
      407,
      304,
      29,
      parsed ? mint : white,
      'Mono',
      478,
    );
    g.note('A local Pydantic model reads the fields after generation.');
  } else if (beat === 2 || beat === 3) {
    const converted = at(2, 'Look at the emitted number rule');
    const tried = at(2, 'Try minus zero point five');
    const grammarTested = at(3, 'grammar admits');
    const localTested = at(3, 'local validator rejects');
    const result = ex.durationChecks(ex.durationReply);
    g.slip(45, 123, 415, 150, 'ORIGINAL SCHEMA  /  BUILD DURATION', [
      ex.durationField + ': ' + ex.durationSchema.type,
      'minimum: ' + ex.durationSchema.minimum,
    ]);
    g.slip(
      500,
      123,
      415,
      150,
      'llama.cpp  /  START OF GBNF NUMBER RULE',
      converted ? ['("-"? integral-part)', '("." decimal-part)?'] : ['Inspect conversion'],
      pale,
    );
    if (tried) g.feed(295, 'CANDIDATE REPLY', JSON.stringify(ex.durationReply));
    if (grammarTested) g.text(result.grammar ? 'Grammar accepts' : 'Grammar rejects', 530, 408, 26, result.grammar ? mint : rose);
    if (localTested) g.text(result.local ? 'Host accepts' : 'Host rejects', 75, 408, 26, result.local ? mint : rose);
    if (localTested) g.note('The original minimum excludes this negative build duration.', rose);
    else if (tried && !grammarTested) g.note('How will each check handle this duration?');
  } else {
    g.feed(130, 'ARTICLE’S vLLM REQUEST', 'structured_outputs = {"json": schema}');
    g.text('guided_json', 74, 282, 32, fog, 'Mono');
    if (at(4, 'older guided fields')) g.line(71, 286, 298, 286, rose, 4);
    g.text('removed in v0.12.0', 371, 283, 26, white, 'Mono');
    g.note('Check the outgoing schema against the selected endpoint’s supported rules.');
  }
}

export function bytes(g) {
  const { beat, at } = g;
  if (beat === 1) {
    g.text('Completed response   /   ordered pairs', 48, 130, 22, fog);
    ex.duplicatePairs.forEach(([k, v], i) => {
      g.slip(
        49 + i * 437,
        170,
        405,
        121,
        'PAIR ' + (i + 1),
        [k + '   ' + v],
        i && at(1, 'second run ID') ? '#ffddce' : white,
      );
    });
    const dict = Object.fromEntries(ex.duplicatePairs);
    if (at(1, 'keeps the last value'))
      g.text('Dictionary after collapse    ' + dict.run_id, 53, 356, 25, rose, 'Mono');
    g.note(
      at(1, 'reject the duplicate') && ex.seenTwice(ex.duplicatePairs)
        ? 'Reject the second run_id while both pairs are still visible.'
        : '',
    );
  } else if (beat === 2) {
    const cases = [
      ['NaN / Infinity', 'Nonstandard constant'],
      ['1e999', 'Nonfinite float'],
      ['[]', 'Wrong root type'],
    ];
    cases.forEach(([raw, why], i) => {
      const show = [at(2, 'Reject NaN'), at(2, 'Reject a nonfinite'), at(2, 'empty array')][i];
      const y = 162 + i * 89;
      g.text(raw, 61, y, 31, white, 'Mono');
      g.arrow(353, y, 446, y, rule);
      g.text(show ? why : '', 473, y, 30, rose, 'Sans', 405);
    });
    g.note('Check number conversion and the expected root as separate operations.');
  } else {
    g.feed(138, 'INCOMPLETE RESPONSE', '{"run_id": "RUN-842"');
    g.text('Completion check', 70, 285, 27, white);
    g.line(298, 285, 473, 285, rule, 2);
    g.line(467, 263, 467, 307, rose, 5);
    g.text('Parser calls', 535, 261, 22, fog);
    g.text('0', 539, 323, 61, rose, 'Mono');
    g.note('Retain the incomplete outcome. Bound bytes and nesting for completed input.');
  }
}

export function job(g) {
  const { at } = g,
    extra = at(3, 'try the job name'),
    winner = at(4, 'Keep the null');
  g.feed(112, 'ENTIRE BUILD LOG', 'Build failed.');
  g.text('failing_job', 51, 230, 21, fog, 'Mono');
  g.text('Required string or null', 375, 230, 21, fog);
  g.text('Evidence', 712, 230, 21, fog);
  ex.jobRows.slice(0, extra ? 3 : 2).forEach((r, i) => {
    const y = 277 + i * 54,
      checked = [at(2, 'first reply fails'), at(2, 'null passes'), at(3, 'string passes')][i];
    const ok = ex.nullableRecord(r);
    g.text(i === 0 ? '(omitted)' : JSON.stringify(r.failing_job), 50, y, 28, white, 'Mono', 286);
    if (checked) g.text(ok ? 'Pass' : 'Missing key', 376, y, 27, ok ? mint : rose);
    if (winner && i > 0)
      g.text(i === 1 ? 'Supported' : 'Unstated', 711, y, 25, i === 1 ? mint : rose);
  });
  g.note(
    winner
      ? 'Display “Job unknown”.'
      : extra
        ? 'Which passing value can the log justify?'
        : 'The root requires all listed fields and excludes extra keys.',
  );
}

export function wire(g) {
  const { at, beat } = g;
  if (beat === 4) {
    g.slip(45, 140, 414, 177, 'LOCAL ENUM', ['passed', 'failed']);
    g.slip(499, 140, 415, 177, 'COMPLETED VALUE', ['"Failed"'], pale);
    g.note(
      at(4, 'spelling fails')
        ? 'Exact enum membership fails at the capital F.'
        : 'Compare the spelling.',
      rose,
    );
    return;
  }
  const dropped = at(1, 'Move the lower bound'),
    replace = at(3, 'replace the host validator');
  g.text('Completed candidate    retry_count = ' + ex.wireValue, 46, 130, 25, white, 'Mono');
  [
    [46, 'HOST VALIDATOR', !replace],
    [500, 'SENT TO BACKEND', !dropped],
  ].forEach(([x, label, bound], i) => {
    const show = i === 0 ? at(2, 'It rejects minus one') : at(1, 'wire rule admits');
    g.slip(
      x,
      179,
      414,
      154,
      label,
      ['type: integer', bound ? 'minimum: 0' : 'description: at least 0'],
      i ? pale : white,
    );
    if (show) {
      const ok = ex.acceptsRetry(ex.wireValue, bound ? 0 : undefined);
      g.text(ok ? 'Accepts −1' : 'Rejects −1', x + 33, 378, 29, ok ? mint : rose);
    }
  });
  g.note(
    replace
      ? 'Both validators now use the simplified wire rule.'
      : dropped
        ? 'The description explains the bound. The retained minimum enforces it.'
        : '',
  );
}

export function citations(g) {
  const { beat, at } = g,
    swap = at(2, 'from run eight forty-three'),
    id = swap ? 'RUN-843' : 'RUN-842';
  if (beat === 1) {
    g.feed(116, 'RUNNER LOG', ex.RUN_LOG);
    ex.LANGUAGE.forEach((s, i) => {
      const y = 261 + 77 * i,
        ok = JSON.parse(s).status === ex.CI_RUN.status;
      g.text(s, 59, y, 29, white, 'Mono');
      if (at(1, 'It reported failed'))
        g.text(ok ? 'Agrees' : 'Contradicts', 677, y, 25, ok ? mint : rose);
    });
    return;
  }
  g.slip(45, 144, 415, 168, 'RECORD', ['RUN-842', 'status   failed']);
  g.slip(499, 144, 416, 168, 'CITED RUNNER LOG', [id, 'status   failed'], pale);
  if (swap) {
    g.line(531, 214, 646, 214, rose, 3);
  }
  g.note(
    id === ex.CI_RUN.run_id
      ? 'The citation resolves to the same run.'
      : at(3, 'Compare the run IDs')
        ? 'RUN-843 cannot establish the status of RUN-842.'
        : 'Both words say failed. Check their run IDs.',
    swap ? gold : mint,
  );
}

export function scope(g) {
  const { at } = g,
    alpha = at(2, 'second candidate for alpha'),
    repair = at(3, 'Change only the claim');
  const project = alpha ? 'project-alpha' : 'project-beta',
    status = alpha && !repair ? 'passed' : 'failed';
  const result = ex.scopeCase(project, status);
  const query = alpha && at(2, 'can now read the snapshot');
  g.slip(46, 127, 413, 172, 'CANDIDATE', [project, 'RUN-842', status]);
  g.slip(500, 127, 414, 172, 'CALLER MAY READ', ['project-alpha'], pale);
  g.text('CI lookup', 55, 353, 23, fog);
  g.text(
    query ? 'RUN-842  /  failed' : at(1, 'Deny the request') && !alpha ? 'Skipped' : 'Pending',
    268,
    353,
    28,
    query ? mint : fog,
    'Mono',
    620,
  );
  const verdict = alpha
    ? repair
      ? at(3, 'show the snapshot')
      : at(2, 'send the claim to review')
    : at(1, 'Deny the request');
  g.note(
    verdict
      ? {
          deny: 'Deny before lookup. No beta data leaves the host.',
          review: 'Send the claim to review. CI returned failed.',
          'show snapshot': 'Show the failed snapshot for RUN-842.',
        }[result.outcome]
      : '',
    verdict && result.outcome === 'show snapshot' ? mint : gold,
  );
}

export function quote(g) {
  const { at, beat } = g,
    fake = beat === 1 && at(1, 'sentence demanding'),
    action = at(2, 'from retry tests to rollback') ? 'rollback' : 'retry_tests';
  const s = fake ? ex.inventedQuote : ex.suppliedQuote;
  g.feed(109, 'SOURCE', ex.RUN_LOG);
  g.feed(209, 'QUOTED BYTES', s, { color: pale });
  const checked = fake ? at(1, 'words are absent') : at(1, 'quote passes');
  g.text('Source membership', 47, 337, 23, fog);
  g.text(
    checked ? (ex.exactQuote(s, 'RUN-842') ? 'Pass' : 'Absent') : 'Checking',
    301,
    337,
    24,
    checked ? (fake ? rose : mint) : fog,
  );
  g.text('Proposal', 47, 389, 23, fog);
  g.text(action, 302, 389, 28, white, 'Mono');
  g.note(
    action === 'rollback'
      ? 'The timeout supplies no evidence of a deployment to roll back.'
      : 'Read the quote in the context of its run and the proposed action.',
  );
}

export function tree(g) {
  const { at } = g,
    cyclic = at(2, 'A and B name each other'),
    rows = ex.nodes(cyclic);
  const graph = ex.treeRelationships(rows);
  g.slip(
    46,
    127,
    303,
    250,
    'FLAT ROWS   /   ID → PARENT',
    rows.map((n) => n.id + '   →   ' + (n.parent ?? 'null')),
  );
  const xy = { R: [575, 167], A: [478, 336], B: [789, 336] };
  const walked = cyclic ? at(2, 'From the root you visit') : at(1, 'Walk outward', 0.85);
  for (const { id, parent } of rows) {
    if (!parent) continue;
    const [x, y] = xy[parent],
      [u, v] = xy[id];
    const dx = u - x,
      dy = v - y,
      len = Math.hypot(dx, dy),
      off = cyclic ? (id === 'A' ? -13 : 13) : 0;
    g.arrow(
      x + (36 * dx) / len,
      y + (36 * dy) / len + off,
      u - (37 * dx) / len,
      v - (37 * dy) / len + off,
      cyclic ? rose : mint,
    );
  }
  rows.forEach(({ id }, i) => {
    const [x, y] = xy[id],
      reached = walked > i / 3 && graph.visited.includes(id);
    g.dot(x, y, 32, reached ? mint : white);
    g.text(id, x, y, 27, ink, 'Mono', 52, 'center');
  });
  g.note(
    walked === 1
      ? 'Reached ' +
          graph.visited.length +
          ' of ' +
          rows.length +
          ' from R. ' +
          (graph.valid ? 'Accept the tree.' : 'Reject the disconnected cycle.')
      : 'Start the traversal at the single root.',
    graph.valid ? mint : gold,
  );
}

export function protocol(g) {
  const { at } = g,
    ask = at(1, 'asks for the tool', 0.8),
    forward = at(2, 'host can now look up', 0.8),
    back = at(2, 'return the failed snapshot', 1);
  const final = at(3, 'return a structured record');
  const loc = [97, 466, 839];
  loc.forEach((x, i) => {
    g.dot(x, 226, 16, [gold, white, mint][i]);
    g.text(['Model', 'Host', 'CI'][i], x, 161, 30, white, 'Serif', 160, 'center');
  });
  if (back) {
    g.arrow(811, 226, 492, 226, rule);
    g.arrow(438, 226, 122, 226, rule);
  } else {
    g.arrow(122, 226, 438, 226, rule);
    g.arrow(492, 226, 811, 226, rule);
  }
  let px = 97 + ask * (466 - 97);
  if (forward > 0) px = 466 + (839 - 466) * forward;
  if (back > 0) px = 839 + (97 - 839) * back;
  g.dot(px, 226, 10, back ? mint : gold);
  const lines = back ? ['RUN-842   failed'] : ['get_run_status', '{"run_id":"RUN-842"}'];
  g.slip(
    47,
    285,
    868,
    122,
    final ? 'MODEL → DASHBOARD' : back ? 'TOOL RESULT → MODEL' : 'PROPOSED TOOL CALL',
    final ? [JSON.stringify(ex.baseRecord)] : lines,
  );
  g.note(
    final
      ? 'Read permission covers this lookup. A change requires a separate grant.'
      : at(2, 'caller’s read scope')
        ? 'Name, arguments and read scope checked.'
        : 'Arguments require one run_id string and exclude extra fields.',
  );
}

export function envelope(g) {
  const { beat, at } = g;
  if (beat === 1) {
    g.text('One local Pydantic schema', 48, 145, 28, white, 'Serif');
    g.slip(45, 196, 411, 155, 'RESPONSES', [at(1, 'text dot format') ? 'text.format' : '…']);
    g.slip(
      501,
      196,
      414,
      155,
      'CLAUDE MESSAGES',
      [at(1, 'output config dot format') ? 'output_config.format' : '…'],
      pale,
    );
    g.note('Inspect the serialized request when changing adapters.');
  } else if (beat === 2) {
    const steps = [
      ['Completion', 'completed', 'completion state'],
      ['Refusal', 'none', 'Check for a refusal'],
      ['Parsed record', 'RUN-842 / failed', 'look for the parsed record'],
    ];
    steps.forEach(([label, value, cue], i) => {
      const y = 158 + 92 * i,
        shown = at(2, cue);
      g.text(label, 62, y, 27, fog);
      g.line(303, y, 381, y, rule);
      g.dot(396, y, 8, shown ? mint : rule);
      g.text(shown ? value : 'Pending', 424, y, 32, shown ? white : fog, 'Mono', 458);
    });
    g.note('Handle a parse exception separately from transport failure.');
  } else {
    g.text('Output token budget', 48, 143, 26, fog);
    g.rect(48, 195, 319, 87, gold);
    g.rect(368, 195, 534, 87, pale);
    g.text('Reasoning', 68, 238, 27, ink);
    g.text('Visible response', 406, 238, 27, ink);
    g.text('Schematic allocation', 49, 321, 20, fog);
    g.note('Check completion and validate the final response, including streamed replies.');
  }
}

export function version(g) {
  const { beat, at } = g,
    tag = at(1, 'attach version two'),
    target = beat === 2 ? 1 : 2;
  if (beat <= 2) {
    g.slip(
      45,
      126,
      503,
      216,
      at(1, 'Validate the payload') ? 'VALIDATED PAYLOAD' : 'PAYLOAD FOR VALIDATION',
      ['run_id       RUN-842', 'status       failed', 'failing_job  unit-tests'],
    );
    if (tag) {
      g.rect(386, 126, 162, 41, gold);
      g.text('tag: v2', 468, 146, 23, ink, 'Mono', 144, 'center');
    }
    g.arrow(564, 237, 641, 237, rule);
    g.text('Consumer', 658, 193, 21, fog);
    g.text('v' + target + ' only', 657, 248, 37, white, 'Mono', 245);
    g.note(
      tag
        ? target === 1
          ? 'Hold v2. This consumer only accepts v1.'
          : 'Application code marks which validator checked the payload.'
        : 'Check the payload before applying its version tag.',
      target === 1 ? rose : mint,
    );
  } else {
    g.slip(45, 142, 414, 170, 'COMPILED GRAMMAR', ['schema + adapter', 'compatible identity']);
    g.slip(500, 142, 414, 170, 'PROMPT CACHE', ['matching prefix', 'model KV state'], pale);
    g.note(
      at(3, 'twenty-four-hour')
        ? 'Article example: a 24-hour compiled-grammar cache from last use.'
        : 'Recheck payloads, refusals and truncated responses when the contract changes.',
    );
  }
}

export function recovery(g) {
  const { beat, at } = g;
  if (beat === 3) {
    g.slip(45, 125, 870, 125, 'RESPONSES', [
      'status: incomplete',
      'incomplete_details.reason: max_output_tokens',
    ]);
    g.slip(45, 271, 870, 105, 'CHAT COMPLETIONS', ['finish_reason: length'], pale);
    g.note(
      at(3, 'schema is unsupported')
        ? 'Fix unsupported configurations. Bound corrections to recoverable data errors.'
        : 'Read the provider’s stop reason.',
    );
  } else {
    const refusal = beat === 2 ? at(2, 'refusal') : 0,
      filter = beat === 2 ? at(2, 'content-filter') : 0;
    const retry = at(1, 'Retry with four hundred'),
      secondLimit = at(2, 'second call hits');
    ['Length', 'Refusal', 'Content filter'].forEach((s, i) => {
      if ((i === 1 && !refusal) || (i === 2 && !filter)) return;
      const y = 173 + i * 86;
      g.text(s, 51, y, 27, white);
      g.arrow(230, y, 314, y, rule);
      g.text(i === 0 ? '120 tokens' : 'Stop', 337, y, 24, i ? rose : gold, 'Mono');
      if (i === 0 && retry) {
        g.arrow(503, y, 571, y);
        g.text('400 tokens', 598, y, 24, mint, 'Mono');
      }
      if (i > 0) g.text('1 call', 797, y, 23, fog, 'Mono');
      if (i === 0 && secondLimit) g.text('Limit again', 796, y, 20, rose, 'Sans', 113);
    });
    g.note(
      secondLimit
        ? 'Second length stop → report failure after two calls.'
        : retry
          ? 'One same-schema retry. Validate the completed message and text item.'
          : 'Can another call fit the time, token and cost limits?',
    );
  }
}

export function grants(g) {
  const { at } = g,
    changed = at(3, 'proposal to rollback');
  const proposal = {
    run_id: ex.CI_RUN.run_id,
    action: changed ? 'rollback' : 'retry_tests',
    approved: true,
  };
  const index = at(2, 'stored run and action') ? 2 : at(1, 'run nine ninety-nine') ? 1 : 0,
    grant = ex.authCases[index];
  g.slip(45, 128, 415, 202, 'MODEL PROPOSAL', [proposal.run_id, proposal.action, 'approved: true']);
  g.slip(
    500,
    128,
    414,
    202,
    'HOST APPROVAL STORE',
    grant ? [grant.run_id, grant.action] : ['No stored approval'],
    pale,
  );
  const match = ex.actionMatch(proposal, grant);
  g.note(
    at(1, 'empty store')
      ? match
        ? 'Match. Recheck caller, current access and approval at execution.'
        : changed
          ? 'Deny rollback. The stored grant covers retry_tests.'
          : 'Deny. No grant matches this run and operation.'
      : 'Which trusted grant covers this action?',
    match ? mint : gold,
  );
}

export function digest(g) {
  const { at, beat } = g,
    empty = beat === 2 && at(2, 'no services at all');
  const rows = empty ? [] : beat === 3 ? ex.dupe : ex.mentions,
    identity = ex.digestIdentity(rows, ex.catalog);
  if (empty) {
    g.feed(145, 'SEPARATE REPORT  /  NO SERVICE MENTIONS', '{"mentions": []}');
    g.text(
      at(2, 'accepts an empty list') ? 'Accepted' : 'Check the required list',
      52,
      312,
      40,
      mint,
      'Serif',
    );
    g.note('Check extraction completeness against the report separately.');
    return;
  }
  if (beat < 3)
    g.text(
      'Report: auth-api recovered. vector-indexer remains degraded. report-worker has no known impact.',
      48,
      124,
      21,
      white,
      'Serif',
      862,
    );
  const header = beat === 3 ? 137 : 174;
  g.text('Service', 49, header, 20, fog);
  g.text('Proposed state', 389, header, 20, fog);
  g.text('Catalog', 685, header, 20, fog);
  rows.forEach((r, i) => {
    const y = header + 55 + 60 * i;
    g.text(r.service, 49, y, 27, white, 'Mono', 316);
    g.text(r.status, 390, y, 26, white, 'Mono', 245);
    const unknown = identity.unknown.includes(r.service);
    const checked = beat > 1 || at(1, "worker's name is missing");
    g.text(
      checked ? (unknown ? 'Unknown name' : 'Listed') : 'Pending',
      685,
      y,
      24,
      checked ? (unknown ? rose : mint) : fog,
    );
    g.line(48, y + 29, 913, y + 29, rule, 1);
  });
  let note = at(1, 'Send that mention for review')
    ? 'Review the uncataloged name even when its impact is unknown.'
    : 'Extract one current-state summary per service.';
  if (beat === 3) {
    const dict = Object.fromEntries(rows.map((r) => [r.service, r.status]));
    if (at(3, 'last entry wins'))
      g.text('Dictionary   auth-api → ' + dict['auth-api'], 50, 370, 24, rose, 'Mono');
    note = at(3, 'duplicate is rejected')
      ? 'Reject duplicate ' +
        identity.duplicates[0] +
        '. Resolve current state from timing or telemetry.'
      : 'Keep the original array for the identity check.';
  }
  g.note(note);
}
