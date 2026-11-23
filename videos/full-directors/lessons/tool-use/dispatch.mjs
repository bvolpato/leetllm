import {
  P,
  arrow,
  box,
  chip,
  circle,
  cue,
  label,
  line,
  mono,
  page,
  rows,
  serif,
  slip,
  text,
} from './studio.mjs';
import {
  batch,
  batchResult,
  observation,
  repeated,
  repeatStops,
  scoped,
  statusCall,
  strictCases,
  traceCase,
  validArgs,
} from './examples.mjs';

export function envelope(c, k) {
  const b = k.beat.beatIndex + 1;
  const chunks = ['{"book_id":', '"B7"', '}'];
  const n =
    b === 2
      ? Number(cue(k, 2, 'First comes')) +
        Number(cue(k, 2, 'then the book')) +
        Number(cue(k, 2, 'Once the envelope'))
      : 3;
  const raw = chunks.slice(0, n).join('');
  const ready = n === 3 && validArgs(JSON.parse(raw));
  page(
    c,
    b === 2 ? 'Collect the argument stream' : 'The model’s proposal',
    'Dispatcher  /  teaching envelope',
    true,
  );
  label(c, 'Name', 75, 254, P.mint);
  mono(c, observation.call.tool, 74, 307, 36, P.pale);
  label(c, 'Arguments', 75, 389, P.mint);
  mono(c, raw || '…', 74, 451, 50, P.pale, 694);
  label(c, 'Call ID', 823, 253, P.mint);
  mono(c, observation.call.call_id, 820, 309, 37, P.pale, 302);
  if (b === 2) {
    mono(c, Buffer.byteLength(raw) + ' / 128 bytes', 822, 446, 24, P.brass, 298);
  }
  line(c, 74, 490, 1117, 490, '#597774');
  if (b === 2)
    serif(
      c,
      ready ? 'Complete · ready to validate' : 'Collecting · dispatch held',
      73,
      574,
      42,
      P.light,
      1023,
    );
  else
    text(
      c,
      b === 1
        ? 'A named request that the host can inspect'
        : 'Adapt the endpoint’s structured fields into this record.',
      75,
      570,
      28,
      P.light,
    );
}
const providerForms = [
  ['Responses', 'function_call', 'JSON string', 'function_call_output', 'call_id', statusCall.call_id],
  [
    'Chat Completions',
    'assistant.tool_calls',
    'JSON string',
    'tool message',
    'tool_call_id',
    'call-7',
  ],
  ['Claude Messages', 'tool_use', 'input object', 'user · tool_result', 'tool_use_id', 'toolu_18'],
  [
    'Gemini Interactions',
    'function_call step',
    'arguments object',
    'function_result step',
    'call_id',
    'step-4',
  ],
];
export function linkage(c, k) {
  const index = cue(k, 4, 'Gemini Interactions')
    ? 3
    : cue(k, 3, 'Claude Messages')
      ? 2
      : cue(k, 3, 'Chat Completions')
        ? 1
        : 0;
  const [provider, kind, args, out, key, id] = providerForms[index];
  const joined = index !== 0 || cue(k, 2, 'The item identifier');
  page(c, provider, 'Provider adapter  /  result linkage');
  slip(c, 65, 227, 484, 303);
  slip(c, 651, 227, 484, 303);
  label(c, 'Returned call', 95, 275);
  label(c, 'Continuation', 683, 275);
  mono(c, kind, 94, 323, 28, P.ink, 420);
  mono(c, out, 683, 323, 28, P.ink, 417);
  const nameField = index === 1 ? 'function.name' : 'name';
  mono(c, nameField + '  ' + statusCall.name, 95, 365, 21, P.ink, 425);
  text(c, args, 95, 403, 23);
  if (index === 0) mono(c, 'id  ' + statusCall.id, 95, 443, 21, P.dim, 410);
  if (index === 3) {
    mono(c, 'name  ' + statusCall.name, 683, 365, 21, P.ink, 417);
    text(c, 'Result content blocks', 683, 403, 23);
  }
  mono(c, (index === 0 ? 'call_id' : 'id') + '   ' + id, 95, 486, 24, P.teal, 418);
  if (joined) {
    arrow(c, 548, 477, 647, 477);
    mono(c, key + '   ' + id, 683, 486, 23, P.teal, 418);
  } else mono(c, key + '   ?', 683, 486, 24, P.gold);
  text(
    c,
    [
      'Keep the item and invocation identifiers distinct.',
      'Reply to the assistant’s tool call.',
      'Put result blocks before new text in the next user message.',
      'Keep the step history or the previous interaction ID.',
    ][index],
    74,
    602,
    26,
    P.dim,
    'Sans',
    1050,
  );
}
export function wholeBatch(c, k) {
  const secondArrived = cue(k, 2, 'The second');
  const judged = cue(k, 3, 'rejects the whole batch');
  page(c, 'One batch, two proposed calls', 'Release adapter  /  before dispatch');
  batch.forEach((call, i) => {
    const y = 205 + i * 166;
    const received = i === 0 || secondArrived;
    slip(c, 70, y, 747, 148);
    label(c, 'Tool name', 98, y + 31);
    label(c, 'Call ID', 436, y + 31);
    label(c, 'Status', 625, y + 31);
    mono(c, received ? call.name : '…', 98, y + 68, 26, P.ink, 322);
    mono(c, call.call_id, 436, y + 68, 24, P.teal, 175);
    mono(c, received ? call.status : '…', 625, y + 68, 23, i ? P.gold : P.teal, 174);
    line(c, 98, y + 86, 792, y + 86, P.rule, 1);
    label(c, 'Arguments', 98, y + 125);
    mono(c, received ? call.arguments : '…', 211, y + 125, 22, P.ink, 584);
  });
  line(c, 857, 205, 857, 519, P.rust, 8);
  label(c, 'Service calls', 893, 302);
  serif(c, '0', 890, 402, 87, P.ink);
  label(c, 'dispatches', 891, 440);
  if (judged && !batchResult.ok) chip(c, 'Batch rejected', 75, 551, 264, P.rust);
  else text(c, 'Waiting for a complete, validated batch', 73, 588, 28, P.dim);
  mono(c, '2,048 UTF-8 bytes per call', 635, 586, 21, P.dim, 480);
}
export function strict(c, k) {
  const b = k.beat.beatIndex + 1;
  const i =
    b >= 4
      ? 1
      : cue(k, 3, 'Put a hyphen')
        ? 4
        : cue(k, 3, 'Restore true')
          ? 2
          : cue(k, 3, 'the number one')
            ? 3
            : cue(k, 3, 'Boolean true')
              ? 2
              : cue(k, 3, 'then with null')
                ? 1
                : 0;
  const { input, result } = strictCases[i];
  page(
    c,
    b === 5 ? 'Who resolves a duplicate field?' : 'Which values pass the schema?',
    'Release contract  /  strict parsing',
  );
  if (b === 5) {
    slip(c, 70, 218, 1052, 136);
    mono(c, '{"version":"v16", "version":"v17"}', 104, 304, 36, P.ink, 968);
    rows(
      c,
      83,
      397,
      1034,
      [
        ['Default Python JSON', 'Last value: v17'],
        ['Reader’s pairs hook', 'Reject duplicate version', P.rust],
      ],
      { dy: 84, valueX: 439 },
    );
    return;
  }
  slip(c, 70, 230, 589, 289);
  label(c, 'Application input', 100, 276);
  mono(c, 'release_id', 100, 336, 21, P.dim);
  mono(c, JSON.stringify(input.release_id), 100, 384, 32, P.ink);
  mono(
    c,
    'include_gates   ' +
      (Object.hasOwn(input, 'include_gates') ? JSON.stringify(input.include_gates) : '(omitted)'),
    100,
    463,
    24,
    P.ink,
    525,
  );
  label(c, b === 4 ? 'Provider strict schema' : 'Application validation', 710, 275);
  if (b === 4) {
    mono(c, 'required: both fields', 710, 343, 25, P.teal, 414);
    mono(c, 'Boolean | null', 710, 406, 29, P.ink, 414);
    text(c, 'Additional properties: false', 710, 474, 23);
  } else {
    serif(c, result.ok ? 'Accepted' : 'Rejected', 708, 359, 47, result.ok ? P.teal : P.rust, 419);
    text(
      c,
      result.ok
        ? input.include_gates
          ? 'Include gate details'
          : 'No gate details requested'
        : i === 3
          ? 'Expected Boolean or null'
          : 'First character must be alphanumeric',
      710,
      423,
      25,
      P.ink,
      'Sans',
      414,
    );
  }
  mono(c, '1–128 ASCII characters   ·   first: letter or digit', 75, 588, 22, P.dim, 1043);
}
export function choice(c, k) {
  const b = k.beat.beatIndex + 1;
  const turn = cue(k, 2, 'then allow an answer');
  if (b === 3) {
    page(c, 'Forcing one named status lookup', 'Provider adapter  /  function choice', true);
    const forms = [
      ['Responses', 'type: function', 'name: get_release_status'],
      ['Chat Completions', 'type: function', 'function: {name: get_release_status}'],
      ['Claude', 'type: tool', 'name: get_release_status'],
    ];
    forms.forEach(([name, kind, field], i) => {
      const y = 237 + 108 * i;
      label(c, name, 73, y + 35, P.mint);
      mono(c, kind, 372, y + 35, 23, P.brass, 256);
      mono(c, field, 616, y + 35, 22, P.light, 512);
      line(c, 73, y + 66, 1126, y + 66, '#4c6b69', 1);
    });
    return;
  }
  page(
    c,
    b === 1 ? 'What may the model generate?' : 'Leave room for a final answer',
    'Model turn  /  tool choice',
    true,
  );
  if (b === 1) {
    rows(
      c,
      74,
      231,
      1049,
      [
        ['auto', 'Answer or calls'],
        ['required', 'One or more calls'],
        ['none', 'No tool calls'],
        ['forced function', 'Specified function'],
      ],
      { dark: true, dy: 77 },
    );
  } else {
    for (const [i, mode, what] of [
      [0, 'required', 'Propose a status read'],
      [1, turn ? 'auto' : 'required', turn ? 'Answer from the reply' : 'Another call required'],
    ]) {
      const x = 74 + i * 562;
      slip(c, x, 249, 486, 250);
      label(c, 'Model turn ' + (i + 1), x + 28, 294);
      mono(c, mode, x + 28, 365, 40);
      serif(c, what, x + 28, 438, 34, P.ink, 423);
    }
    arrow(c, 564, 385, 630, 385, P.brass);
    const msg =
      b === 3
        ? 'Adapter selects the endpoint’s forcing format.'
        : b === 4
          ? 'parallel_tool_calls = false   →   at most one call'
          : b === 5
            ? 'Host still validates arguments, scope, and budget.'
            : 'The host returns the observation between turns.';
    text(c, msg, 77, 592, 27, P.light, 'Sans', 1050);
  }
}
export function ownership(c, k) {
  const moved = cue(k, 1, 'its owner changes'),
    missing = cue(k, 2, 'which is missing');
  const known = moved ? cue(k, 2, 'The second read') : cue(k, 1, 'so the first read');
  const id = missing ? 'R99' : 'R22',
    owner = moved ? 'ads' : 'search',
    result = scoped(owner, id);
  page(c, 'Read the owner again', 'Release store  /  scoped lookup');
  label(c, 'Private host state', 75, 243);
  label(c, 'Outward observation', 694, 243);
  mono(c, 'session.project   search', 74, 317, 26, P.ink, 515);
  mono(c, 'release           ' + id, 74, 383, 26, P.ink, 515);
  mono(
    c,
    'stored owner      ' + (missing ? 'no row' : owner),
    74,
    449,
    26,
    moved ? P.rust : P.teal,
    515,
  );
  line(c, 624, 222, 624, 535, P.rule, 3);
  if (known) {
    serif(
      c,
      result.ok ? 'Release record' : 'No release fields',
      692,
      332,
      37,
      result.ok ? P.teal : P.rust,
      432,
    );
    mono(c, result.ok ? result.status : result.error, 692, 410, 23, P.ink, 442);
  } else serif(c, 'Checking…', 692, 337, 41, P.dim);
  if (missing)
    mono(c, 'Audit only: R22 → outside scope     R99 → absent', 74, 582, 22, P.dim, 1040);
}
export function parameters(c, k) {
  const b = k.beat.beatIndex + 1;
  page(
    c,
    [
      'Keep the value in its parameter slot',
      'Check each execution boundary',
      'Resolve the path inside its root',
    ][b - 1],
    'Runtime  /  bounded inputs',
    true,
  );
  if (b === 1) {
    mono(c, 'SELECT status FROM releases WHERE id = %s', 64, 317, 33, P.light, 1071);
    label(c, 'Fixed SQL', 66, 252, P.mint);
    const u = cue(k, 1, 'through that binding', 0.85);
    slip(c, 69 + u * 497, 396, 470, 104);
    mono(c, "('reranker-v17',)", 98 + u * 497, 465, 32, P.ink, 406);
    label(c, 'Separate parameter tuple', 69, 563, P.brass);
  } else if (b === 2) {
    rows(
      c,
      72,
      235,
      1050,
      [
        ['Fixed program', '[program, allowed_flag, value]'],
        ['Shell', 'false'],
        ['Remote URL', 'Allowlisted scheme + host'],
        ['Redirect', 'Validate the resolved next hop'],
      ],
      { dark: true, dy: 78, valueX: 310 },
    );
  } else {
    mono(c, '/work/export/', 73, 295, 42, P.light);
    line(c, 104, 319, 104, 460, P.mint, 3);
    line(c, 104, 459, 178, 459, P.mint, 3);
    mono(c, 'link/report', 192, 470, 32, P.light);
    if (cue(k, 3, 'including symlinks')) {
      arrow(c, 441, 455, 599, 455, P.brass);
      mono(c, '/outside/report', 625, 469, 31, P.brass);
      label(c, 'Outside reviewed root', 627, 530, P.rose);
    }
  }
}
export function recovery(c, k) {
  const b = k.beat.beatIndex + 1;
  const signals = [
    ['Missing field', 'corrected call', 'policy denial'],
    ['Transient failure', 'A timed-out write', 'Reconcile under'],
    ['Return bounded', 'HTTP success', 'queued means'],
  ][b - 1];
  const stage = cue(k, b, signals[2]) ? 2 : cue(k, b, signals[1]) ? 1 : 0;
  const [owner, event, detail, next] = [
    [
      ['Host validation', 'Missing field', 'release_id missing', 'Return field error'],
      ['Model proposal', 'Corrected call', 'release_id = v17', 'Validate again'],
      ['Host policy check', 'Policy denial', 'No grant for this reader', 'Await trusted change'],
    ],
    [
      ['Runtime timeout', 'Read timeout', 'Same release ID', 'Bounded backoff'],
      ['Runtime timeout', 'Write timeout', 'Reply missing', 'Outcome unknown'],
      ['Host request', 'Read status', 'Original operation ID', 'Await status reply'],
    ],
    [
      ['Runtime observation', 'Error', 'Bounded code + field', 'Remove secret fields'],
      ['Runtime observation', 'HTTP 200', 'Business result: failed', 'Record the failure'],
      ['Runtime observation', 'Queued', 'Service accepted the job', 'Completion pending'],
    ],
  ][b - 1][stage];
  page(
    c,
    [
      'How should the host handle this error?',
      'Choose recovery after a timeout',
      'What did the service confirm?',
    ][b - 1],
    'Runtime  /  recovery',
  );
  slip(c, 72, 238, 544, 273);
  label(c, owner, 101, 285);
  serif(c, event, 100, 362, 44, P.ink, 480);
  mono(c, detail, 101, 441, 26, P.dim, 480);
  arrow(c, 624, 380, 734, 380);
  const unknown = stage === 1 && b === 2;
  label(c, unknown || (stage === 2 && b === 3) ? 'What we know' : 'Next step', 765, 305);
  serif(c, next, 763, 397, 39, unknown ? P.rust : P.teal, 363);
}
export function duplicates(c, k) {
  const two = cue(k, 1, 'On the next turn');
  const verdict = cue(k, 2, 'Two proposals');
  page(c, 'Do these requests describe different actions?', 'Dispatcher  /  repeat detection');
  repeated.slice(0, two ? 2 : 1).forEach((r, i) => {
    const x = 71 + i * 544;
    slip(c, x, 236, 503, 243);
    mono(c, 'Call ID   ' + r.id, x + 26, 281, 23);
    mono(c, 'Tool name   ' + r.name, x + 26, 335, 25, P.ink, 449);
    Object.entries(r.args).forEach(([key, value], j) =>
      mono(c, key + ' = ' + JSON.stringify(value), x + 26, 392 + j * 43, 21, P.dim, 451),
    );
  });
  label(c, 'Generations', 73, 546);
  serif(c, two ? '2' : '1', 75, 602, 43);
  label(c, 'Service dispatches', 351, 546);
  serif(c, '0', 352, 602, 43);
  if (verdict && repeatStops) chip(c, 'Same sorted name + arguments', 622, 551, 493, P.rust);
}
export function deferred(c, k) {
  const b = k.beat.beatIndex + 1;
  const selected =
    b === 2
      ? cue(k, 2, 'schema loads later')
      : b === 3
        ? cue(k, 3, 'A discovered client tool')
        : false;
  page(
    c,
    'What enters the model context?',
    b === 2
      ? 'Tool discovery  /  Responses example'
      : b === 3
        ? 'Tool discovery  /  Claude example'
        : 'Tool discovery  /  catalog',
  );
  slip(c, 68, 236, 494, 297);
  label(c, 'Application request', 97, 283);
  mono(c, 'get_release_status', 97, 354, 27, P.ink, 433);
  mono(c, 'search_release_policy', 97, 415, 26, P.ink, 433);
  text(c, 'Full definitions in this inventory', 97, 486, 24, P.dim, 'Sans', 432);
  arrow(c, 569, 381, 638, 381);
  box(c, 649, 236, 482, 297, P.night, 6);
  label(c, 'Model context', 676, 283, P.mint);
  text(
    c,
    b === 2 ? 'Names + descriptions' : b === 3 ? 'Search tool' : 'Definitions as needed',
    676,
    359,
    27,
    P.pale,
    'Sans',
    426,
  );
  if (selected) {
    mono(c, 'get_release_status', 676, 430, 25, P.brass, 426);
    label(c, 'Parameter schema loaded', 676, 488, P.light, 426);
  }
  if (b === 3) mono(c, 'Discovery → tool_use → host checks', 74, 589, 26, P.teal, 1045);
}
export function trajectory(c, k) {
  const badText = cue(k, 2, 'Changing the text') && !cue(k, 2, 'Restore the correct sentence');
  const badOk = cue(k, 2, 'It fails even');
  const { events, result } = traceCase(!!badText, !!badOk);
  page(c, 'Check the answer that the reader sees', 'Evaluation  /  three runtime events', true);
  const [call, obs, ans] = events;
  const items = [
    ['Call', 'Call ID   ' + call.id, call.name + '(' + call.args.release_id + ')'],
    ['Observation', 'Call ID   ' + obs.call_id, 'ok = ' + obs.ok + '   ·   ' + obs.status],
    ['Answer', ans.status, ans.text],
  ];
  items.forEach(([name, id, value], i) => {
    const y = 229 + i * 102;
    label(c, name, 76, y + 23, P.mint);
    mono(c, id, 256, y + 23, 22, P.brass, 291);
    mono(c, value, 560, y + 24, 23, P.pale, 570);
    line(c, 75, y + 54, 1124, y + 54, '#4c6b69', 1);
  });
  if (k.beat.beatIndex >= 1)
    chip(
      c,
      result.ok ? 'Trace agrees' : badText ? 'Rendered text disagrees' : 'Expected Boolean true',
      75,
      561,
      450,
      result.ok ? P.teal : P.rust,
    );
}
export function exposure(c, k) {
  const b = k.beat.beatIndex + 1;
  page(
    c,
    [
      'What leaves the host?',
      'Local server launch',
      'Which server may accept this token?',
    ][b - 1],
    'MCP  /  execution boundary',
  );
  const names =
    b === 1
      ? ['Host record', 'Remote catalog']
      : b === 2
        ? ['Launch request', 'Local process']
        : ['Token audience', 'Receiving service'];
  const sent =
    b === 1
      ? cue(k, 1, 'Send only the release identifier', 0.9)
      : b === 2
        ? cue(k, 2, 'before the host starts', 0.9)
        : cue(k, 3, 'A reporting server', 0.9);
  const wrongServer = b === 3 && sent > 0;
  const content =
    b === 1
      ? ['release_id: v16', sent === 1 ? 'release_id: v16' : 'Awaiting arguments']
      : b === 2
        ? ['node catalog.mjs', sent === 1 ? 'Running' : sent > 0 ? 'Starting…' : 'Awaiting approval']
        : ['catalog', wrongServer ? 'reporting' : 'catalog'];
  names.forEach((name, i) => {
    const x = 76 + i * 614;
    box(c, x, 264, 438, 223, i ? P.night : P.pale, 8);
    label(c, name, x + 26, 317, i ? P.mint : P.teal);
    mono(c, content[i], x + 26, 388, 30, i ? P.pale : P.ink, 386);
    if (i === 0 && b === 1) text(c, 'Private session notes', x + 26, 450, 23, P.dim);
    if (i === 0 && b === 2 && sent > 0)
      text(c, 'User approved this command', x + 26, 450, 23, P.teal, 'Sans', 382);
    if (i === 1 && b === 2 && sent === 1)
      text(c, 'Restricted file and network access', x + 26, 450, 22, P.light, 'Sans', 382);
    if (i === 1 && wrongServer && cue(k, 3, 'When the catalog needs'))
      text(c, 'Rejected: audience mismatch', x + 26, 450, 24, P.rose, 'Sans', 382);
  });
  if (b !== 3) {
    line(c, 515, 370, 687, 370, P.rule, 2, [6, 6]);
    if (sent > 0 && sent < 1) circle(c, 524 + sent * 151, 370, 9, P.teal);
  } else line(c, 514, 371, 687, 371, wrongServer ? P.rust : P.teal, 3, wrongServer ? [7, 7] : []);
  if (b === 1 && sent === 1)
    mono(c, 'Outbound payload   { "release_id": "v16" }', 77, 580, 26, P.teal, 1050);
  if (b === 3 && cue(k, 3, 'appropriately scoped credential'))
    mono(c, 'Downstream request   →   separate scoped credential', 77, 580, 25, P.teal, 1050);
}
