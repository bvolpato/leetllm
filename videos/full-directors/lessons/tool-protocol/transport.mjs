import {
  C,
  arrow,
  band,
  cue,
  disc,
  label,
  lines,
  mono,
  paper,
  path,
  rect,
  serif,
  stage,
  title,
} from './drawing.mjs';
import {
  cacheDecision,
  catalogFixture,
  eraDecision,
  issuerMatches,
  mirrorGate,
  requestEnvelope,
} from '../../../films/tool-protocol/model.mjs';
import { PROTOCOL_VERSION, VERSION_KEY } from '../../../films/tool-protocol/fixtures.mjs';

export function eras(c, t) {
  const b = t.beat.beatIndex + 1;
  stage(c, true);
  if (b === 6) {
    title(
      c,
      'PINNED REVISION   /   2026-07-28',
      'A deprecation still has a migration period',
      true,
    );
    mono(c, 'Roots   /   Sampling   /   Logging', 119, 332, 51, C.white);
    path(
      c,
      [
        [152, 541],
        [1400, 541],
      ],
      C.grid,
      12,
    );
    disc(c, 180, 541, 18, C.gold);
    mono(c, '2026-07-28', 140, 623, 37, C.gold);
    if (cue(t, 6, 'earliest removal')) {
      disc(c, 1287, 541, 18, C.light);
      mono(c, '2027-07-28', 1350, 623, 37, C.light, 'right');
      label(c, 'Earliest eligible revision', 1350, 708, 33, { align: 'right', color: C.white });
    }
    return;
  }
  if (b === 4) {
    title(c, 'LEGACY STDIO   /   2025-11-25 AND EARLIER', 'Initialize a live connection', true);
    mono(c, 'Child exited   →   recover transport', 108, 285, 39, C.coral);
    if (cue(t, 4, 'Earlier revisions')) {
      const names = [
        'initialize',
        'server response',
        'notifications/initialized',
        'operational call',
      ];
      names.forEach((v, i) => {
        const y = 392 + i * 104;
        mono(c, v, i === 1 ? 809 : 156, y, 36, C.white);
        arrow(
          c,
          i === 1 ? 1380 : 156,
          y + 42,
          i === 1 ? 156 : 1380,
          y + 42,
          i === 1 ? C.gold : C.mint,
          3,
        );
      });
    }
    return;
  }
  title(
    c,
    'PROTOCOL COMPATIBILITY',
    b === 5 ? 'Read the HTTP 400 body' : 'Follow the discovery evidence',
    true,
  );
  let facts, kind;
  if (b === 1) {
    kind = 'version';
    facts = [
      'Request metadata',
      'protocolVersion + clientCapabilities',
      'Unsupported version: −32022',
    ];
  } else if (b === 2) {
    kind = 'capability';
    facts = ['Current request lacks a feature', 'error −32021', 'data.requiredCapabilities'];
  } else if (b === 3) {
    const other = cue(t, 3, 'Another error');
    kind = other ? 'other' : 'complete';
    facts = [
      'Bounded stdio probe',
      'server/discover',
      other ? 'Other error or bounded silence' : 'Completed result or modern error',
    ];
  } else {
    const other = cue(t, 5, 'unrecognized or empty');
    kind = other ? 'empty' : 'header';
    facts = [
      'HTTP 400 response',
      'Inspect JSON-RPC error',
      other ? 'Empty or unrecognized body' : 'Version, capability or header error',
    ];
  }
  const route = eraDecision({
    kind,
    transport: b === 5 ? 'http' : 'stdio',
    status: b === 5 ? 400 : 200,
  });
  const modern = route === 'modern';
  lines(c, 116, 295, facts, { gap: 69, size: 36, color: C.white });
  path(
    c,
    [
      [136, 610],
      [620, 610],
      [860, 520],
      [1453, 520],
    ],
    C.grid,
    9,
  );
  path(
    c,
    [
      [620, 610],
      [860, 724],
      [1453, 724],
    ],
    C.grid,
    9,
  );
  const visible =
    b === 1
      ? cue(t, 1, 'unsupported-version response')
      : b === 2
        ? cue(t, 2, 'dedicated capability error')
        : b === 3
          ? cue(t, 3, 'completed discovery result')
          : cue(t, 5, 'recognized modern');
  if (visible) {
    path(
      c,
      [
        [136, 610],
        [620, 610],
        [860, modern ? 520 : 724],
        [1453, modern ? 520 : 724],
      ],
      modern ? C.mint : C.gold,
      9,
    );
    disc(c, 1453, modern ? 520 : 724, 15, modern ? C.mint : C.gold);
  }
  mono(c, 'Use the modern revision', 900, 464, 32, visible && modern ? C.mint : C.light);
  mono(c, 'Legacy if supported + permitted', 870, 792, 31, visible && !modern ? C.gold : C.light);
}

export function mirrorCase(resource = false, mismatch = false, missing = false) {
  const body = resource
    ? {
        method: 'resources/read',
        params: {
          uri: 'release://reranker-v17/status',
          _meta: { [VERSION_KEY]: PROTOCOL_VERSION },
        },
      }
    : requestEnvelope(61, 'get_release_status', { release_id: 'reranker-v17' });
  const target = resource ? body.params.uri : body.params.name;
  const headers = {
    'MCP-Protocol-Version': PROTOCOL_VERSION,
    'Mcp-Method': body.method,
    'Mcp-Name': mismatch ? (resource ? 'release://reranker-v18/status' : 'shift_traffic') : target,
  };
  if (missing) delete headers['Mcp-Name'];
  return { body, headers, target, outcome: mirrorGate(body, headers) };
}
export function http(c, t) {
  const b = t.beat.beatIndex + 1;
  stage(c, false);
  if (b < 3) {
    title(c, 'STREAMABLE HTTP', 'One POST carries one JSON-RPC message');
    arrow(c, 116, 327, 1440, 327, C.teal, 7);
    mono(c, 'POST  /mcp', 119, 268, 43);
    mono(c, 'Accept: application/json, text/event-stream', 117, 420, 34);
    if (cue(t, 1, 'server may return')) {
      arrow(c, 1440, 544, 116, 544, C.secondary, 6);
      mono(c, 'one JSON reply   or   request-scoped SSE', 119, 609, 34);
    }
    if (b === 2) {
      path(
        c,
        [
          [121, 750],
          [1475, 750],
        ],
        C.teal,
        5,
        [14, 9],
      );
      mono(c, 'subscriptions/listen   /   selected changes', 119, 801, 33, C.teal);
    }
    return;
  }
  if (b >= 7) {
    title(c, 'RESOURCE READ   /   AUTHENTICATED', 'Compare each decoded name with its body URI');
    const scored = cue(t, 8, 'The first one can go on');
    [false, true].forEach((bad, i) => {
      const x = 101 + i * 710,
        showBad = bad && cue(t, 7, 'second header names');
      const item = mirrorCase(true, !!showBad);
      paper(c, x, 251, 671, 477);
      mono(c, 'COPY ' + (i ? 'B' : 'A'), x + 46, 314, 31, C.secondary);
      mono(c, 'Body URI', x + 46, 398, 27, C.secondary);
      mono(c, item.target, x + 46, 451, 34, C.ink, 'left', 585);
      mono(c, 'Decoded Mcp-Name', x + 46, 530, 27, C.secondary);
      mono(
        c,
        bad && !showBad ? '…' : item.headers['Mcp-Name'],
        x + 46,
        585,
        34,
        C.ink,
        'left',
        585,
      );
      if (scored && (!i || cue(t, 8, 'Reject the second')))
        band(
          c,
          x + 45,
          665,
          item.outcome.admitted ? 'Proceed to access check' : '400   /   −32020',
          item.outcome.admitted,
        );
    });
    return;
  }
  title(c, 'STREAMABLE HTTP', 'Compare the routing headers with the request body');
  const mismatch = !!cue(t, 5, 'change only the name header'),
    missing = b === 4 && cue(t, 4, 'Remove the required'),
    item = mirrorCase(false, mismatch, missing);
  const rejected = !item.outcome.admitted && (missing
    ? cue(t, 4, 'rejects the request')
    : cue(t, 5, 'reject before dispatch'));
  const xs = [475, 1008];
  mono(c, 'Request body', xs[0], 270, 35, C.teal);
  mono(c, 'Routing headers', xs[1], 270, 35, C.teal);
  const fields = [
    ['version', PROTOCOL_VERSION, item.headers['MCP-Protocol-Version']],
    ['method', item.body.method, item.headers['Mcp-Method']],
    ['name', item.target, item.headers['Mcp-Name'] ?? '(missing)'],
  ];
  fields.forEach(([k, left, right], i) => {
    const y = 387 + i * 117;
    path(
      c,
      [
        [108, y + 58],
        [1485, y + 58],
      ],
      C.rule,
      2,
    );
    mono(c, k, 110, y, 36, C.secondary);
    mono(c, left, xs[0], y, 34);
    mono(c, right, xs[1], y, 34, rejected && right !== left ? C.red : C.ink);
  });
  if (rejected)
    band(c, 110, 778, '400   /   HeaderMismatch   −32020', false);
  if (b === 6) mono(c, 'Decode before comparing', 1025, 778, 28, C.secondary);
}

const issuer = 'https://auth.example/issuer';
export function identity(c, t) {
  const b = t.beat.beatIndex + 1;
  stage(c, b <= 2);
  if (b <= 2) {
    title(c, 'LOOPBACK ENDPOINT', 'Which check stops the read?', true);
    const rejected = cue(t, 1, 'requires HTTP');
    mono(c, 'Resource token', 118, 307, 31, C.light);
    serif(c, 'deployments', 116, 379, 58, C.white);
    mono(c, 'Allowed Origin', 116, 495, 31, C.light);
    mono(c, 'https://ops.example', 114, 573, 38, C.white);
    path(
      c,
      [
        [789, 281],
        [789, 682],
      ],
      C.grid,
      4,
    );
    if (cue(t, 1, 'also carries an Origin')) {
      mono(c, 'Request Origin', 862, 495, 31, C.light);
      mono(c, 'https://other.example', 859, 573, 38, rejected ? C.coral : C.white);
    }
    if (rejected) band(c, 866, 693, '403   /   invalid Origin', false);
    if (b === 2) mono(c, 'Tool invocations   0', 122, 783, 36, C.white);
    return;
  }
  if (b === 3) {
    title(c, 'PROTECTED RESOURCE METADATA', 'Bind the OAuth flow to deployments');
    lines(
      c,
      122,
      297,
      [
        'Resource metadata',
        'Validated authorization server',
        'Authorization request',
        'Token request',
      ],
      { gap: 117, size: 38 },
    );
    [
      'resource → authorization servers',
      'issuer + PKCE support',
      'resource = deployments',
      'resource = deployments',
    ].forEach((v, i) => {
      path(
        c,
        [
          [685, 298 + 117 * i],
          [740, 298 + 117 * i],
        ],
        C.rule,
        3,
      );
      mono(c, v, 790, 298 + 117 * i, 33, C.teal, 'left', 695);
    });
    return;
  }
  title(c, 'AUTHORIZATION RESPONSE', 'Compare the issuer saved with this flow');
  const changed = cue(t, 5, 'change in case'),
    missing = cue(t, 5, 'value is absent'),
    optional = cue(t, 6, 'support was not advertised');
  const presented = missing ? undefined : changed ? 'https://auth.example/Issuer' : issuer;
  const ok = issuerMatches(issuer, presented, !optional);
  paper(c, 114, 254, 1370, 433);
  mono(c, 'Saved issuer', 176, 324, 32, C.secondary);
  mono(c, issuer, 176, 391, 46);
  path(
    c,
    [
      [173, 448],
      [1420, 448],
    ],
    C.rule,
    3,
  );
  if (b >= 5) {
    mono(c, 'Returned iss', 176, 513, 31, C.secondary);
    mono(c, presented ?? '(absent)', 178, 585, 46, ok ? C.teal : C.red);
    mono(
      c,
      optional ? 'support not advertised' : 'support advertised',
      1415,
      646,
      28,
      C.secondary,
      'right',
    );
    band(c, 114, 770, ok ? 'Issuer check permits proceeding' : 'Reject before code exchange', ok);
  }
  if (b === 6 && cue(t, 6, 'upstream API'))
    mono(c, 'Upstream API → separate credential', 773, 770, 32, C.secondary);
}

const catalog = catalogFixture();
function toolStrip(c, x, y, w, name, active) {
  rect(c, x, y, w, 71, active ? C.paper : C.face, active ? null : C.grid, 2, 5);
  disc(c, x + 27, y + 36, 8, active ? C.teal : C.grid);
  mono(c, name, x + 48, y + 36, 30, active ? C.ink : C.light, 'left', w - 64);
}
export function catalogs(c, t) {
  const b = t.beat.beatIndex + 1;
  stage(c, true);
  title(c, 'TOOLS / LIST', 'A new catalog goes through review', true);
  const notice = cue(t, 1, 'notice tells'),
    listed = cue(t, 1, 'refreshed list includes'),
    cleared = cue(t, 2, 'review clears promotion');
  mono(c, 'Server catalog', 105, 266, 37, C.mint);
  toolStrip(c, 104, 323, 533, 'get_release_status', true);
  if (listed) toolStrip(c, 104, 415, 533, 'promote_model', true);
  if (notice)
    mono(c, cleared ? 'Review complete' : 'List changed  →  refresh', 108, 563, 30, C.gold);
  if (listed && !cleared) {
    path(
      c,
      [
        [655, 451],
        [770, 451],
      ],
      C.gold,
      6,
    );
    path(
      c,
      [
        [772, 401],
        [772, 500],
      ],
      C.gold,
      8,
    );
  }
  mono(c, 'Model tools by caller', 844, 266, 37, C.mint);
  for (const [i, scope] of ['Search', 'Ads'].entries()) {
    const y = 333 + i * 260;
    label(c, scope, 844, y, 35, { color: C.white });
    toolStrip(c, 846, y + 43, 600, catalog.adsTools[0], true);
    if (i === 0 && cleared) toolStrip(c, 846, y + 125, 600, catalog.searchTools[1], true);
  }
  if (b === 3) mono(c, 'Execution   /   verify caller + release again', 108, 796, 36, C.white);
}
const stored = { key: ['deployments', 'token-A', 'tools/list', 'page-1'], receivedAt: 0 };
export const lookup = { stored, auth: 'token-A', cursor: 'page-1', now: 10, ttlMs: 1000 };
export const cached = (delta = {}) => cacheDecision({ ...lookup, ...delta });
export const rowLookup = (principal, id) =>
  principal === 'search' && id === 'reranker-v17' ? 'canary_clean' : 'release unavailable';
export function cache(c, t) {
  const b = t.beat.beatIndex + 1;
  stage(c, false);
  if (b <= 2) {
    title(c, 'CATALOG PROOF', 'Read the change against the reviewed copy');
    paper(c, 100, 251, 691, 456);
    paper(c, 828, 251, 672, 456);
    mono(c, 'Exposed to model', 147, 314, 32, C.secondary);
    mono(c, 'Fetched for review', 873, 314, 32, C.secondary);
    mono(c, 'get_release_status', 145, 415, 36);
    mono(c, 'get_release_status', 874, 415, 36);
    if (cue(t, 1, 'Refresh the list')) {
      mono(c, '+ promote_model', 875, 511, 36, C.teal);
      mono(c, 'annotation: read-only', 874, 590, 28);
      mono(c, 'effect: promotes release', 874, 642, 28, C.red);
    }
    if (b === 2) serif(c, 'The handler can change behind the same catalog.', 101, 801, 48);
    return;
  }
  if (b >= 5 && cue(t, 5, 'For this row lookup')) {
    title(c, 'DEPLOYMENTS ROW LOOKUP', 'Take the tenant from verified credentials');
    mono(c, 'Caller', 113, 286, 30, C.secondary);
    mono(c, 'Release', 441, 286, 30, C.secondary);
    mono(c, 'Visible response', 939, 286, 30, C.secondary);
    [
      ['search', 'reranker-v17'],
      ['ads', 'reranker-v17'],
      ['search', 'missing'],
    ].forEach(([p, id], i) => {
      if (i && !(i === 1 ? cue(t, 6, 'An ads caller') : cue(t, 6, 'missing release'))) return;
      const y = 390 + i * 122;
      path(
        c,
        [
          [111, y + 57],
          [1490, y + 57],
        ],
        C.rule,
        2,
      );
      mono(c, p, 113, y, 40);
      mono(c, id, 441, y, 36);
      mono(c, rowLookup(p, id), 939, y, 37, i ? C.red : C.teal);
    });
    if (cue(t, 6, 'historical'))
      mono(c, 'Deployments offline   /   previous read is historical', 114, 802, 30, C.secondary);
    return;
  }
  title(c, 'CATALOG CACHE', 'Which key opens this entry?');
  const priv = cue(t, 3, 'private list'),
    different = cue(t, 3, 'Try another access token') && !cue(t, 4, 'Return to the original token'),
    page = cue(t, 4, 'change just the page cursor'),
    back = cue(t, 4, 'Go back to the original page'),
    changed = cue(t, 4, 'relevant change notice'),
    retry = b === 5;
  const delta = retry
    ? { retry: true }
    : changed
      ? { changed: true }
      : page && !back
        ? { cursor: 'page-2' }
        : different && !page && !back
          ? { auth: 'token-B' }
          : {};
  const val = priv ? cached(delta) : cached({ ttlMs: 0, now: 0 });
  paper(c, 100, 250, 1400, 443);
  mono(
    c,
    priv ? 'PRIVATE  /  received 0 ms' : 'PUBLIC  /  received 0 ms',
    156,
    310,
    33,
    C.secondary,
  );
  mono(c, priv ? 'Age 10 ms     Lifetime 1,000 ms' : 'Age 0 ms     Lifetime 0 ms', 153, 398, 39);
  if (priv) {
    mono(c, 'Stored', 153, 499, 29, C.secondary);
    mono(c, stored.key.join('   /   '), 405, 499, 31, C.ink, 'left', 1023);
    mono(c, 'Lookup', 153, 592, 29, C.secondary);
    mono(
      c,
      retry
        ? 'requestState + inputResponses'
        : [
            'deployments',
            delta.auth || lookup.auth,
            'tools/list',
            delta.cursor || lookup.cursor,
          ].join('   /   '),
      405,
      592,
      31,
      C.ink,
      'left',
      1023,
    );
  }
  const ready = (!different || cue(t, 4, 'That token needs a separate entry'))
    && (!page || cue(t, 4, 'That page needs its own entry'))
    && (priv || cue(t, 3, 'stale on arrival'));
  if (ready) {
    const words = {
      hit: 'Cache hit',
      stale: 'Stale at receipt',
      'miss: scope/parameters': 'Separate entry required',
      invalidate: 'List changed   /   invalidate',
      'bypass: MRTR': 'Continuation   /   bypass cache',
    };
    band(c, 104, 786, words[val], val === 'hit');
  }
}
