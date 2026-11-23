import { PROTOCOL_VERSION, VERSION_KEY, CAPABILITIES_KEY } from '../fixtures.mjs';
import { mirrorGate, requestEnvelope } from '../model.mjs';
import { codePanel, filmPainter, footer, text } from '../defaults.mjs';
function drawResourceRead(ctx, state, api) {
  const { C } = api;
  const { label, line, target, started, finished } = filmPainter(ctx, api);
  const uri = 'release://v17/status';
  const body = {
    jsonrpc: '2.0',
    id: 60,
    method: 'resources/read',
    params: { uri, _meta: { [VERSION_KEY]: PROTOCOL_VERSION, [CAPABILITIES_KEY]: {} } },
  };
  label('Body for both copies', 170, 295, 34, C.muted, 'left');
  label(body.method, 170, 388, 48, C.ink, 'left');
  label(body.params.uri, 1000, 388, 49, C.cyan, 'left');
  line(170, 451, 1750, 451, C.muted, 2);
  label('Decoded Mcp-Name', 295, 543, 35, C.muted, 'left');
  label('Header check', 1185, 543, 35, C.muted, 'left');
  for (const [i, name] of [
    uri,
    started('mirror-resource-change') ? 'release://v18/status' : uri,
  ].entries()) {
    const y = 648 + i * 144,
      first = i === 0;
    label(first ? 'A' : 'B', 170, y, 46, C.ink, 'left');
    target(first ? 'resource-header-a' : 'resource-header-b', () =>
      label(name, 295, y, 45, C.blue, 'left'),
    );
    const gate = mirrorGate(body, {
      'Mcp-Protocol-Version': PROTOCOL_VERSION,
      'Mcp-Method': body.method,
      'Mcp-Name': name,
    });
    target(first ? 'resource-route-a' : 'resource-route-b', () => {
      const reveal = finished(first ? 'mirror-resource-pass' : 'mirror-resource-fail');
      const result = gate.admitted
        ? 'Check release access'
        : 'HTTP ' + gate.http + '  /  ' + gate.code;
      label(
        reveal ? result : '?',
        1185,
        y,
        39,
        reveal ? (gate.admitted ? C.green : C.yellow) : C.muted,
        'left',
      );
    });
  }
  if (state.beat === 3 && finished('mirror-resource-change'))
    label('Which request can go on to the release access check?', 960, 923, 38, C.ink);
}
export function drawHttpBinding(ctx, scene, state, api) {
  if (state.beat >= 3) return drawResourceRead(ctx, state, api);
  return api.focus.target('http-binding-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const cueVisible = (key) => api.focus.visible(`t-http-binding-${key}`);
    const cueComplete = (key) => api.focus.cue(`t-http-binding-${key}`)?.phase === 'after';
    {
      if (currentBeat === 0) {
        codePanel(
          ctx,
          api,
          'POST /mcp · one message',
          ['Accept: application/json,', '        text/event-stream', 'body: JSON-RPC request'],
          150,
          330,
          735,
          340,
        );
        const stream = cueVisible('stream');
        codePanel(
          ctx,
          api,
          'one request-scoped reply',
          [
            'JSON object  OR',
            'SSE: related notifications',
            stream ? 'SSE: final response ID 53' : 'SSE: awaiting final response',
          ],
          1030,
          330,
          735,
          340,
          themeColors.cyan,
        );
        text(
          ctx,
          api,
          'subscriptions/listen → separate longer notification stream',
          960,
          800,
          33,
          themeColors.yellow,
        );
        footer(
          ctx,
          api,
          'This revision supplies no protocol GET stream, session-ID header or Last-Event-ID resumption.',
        );
      } else {
        const changed = currentBeat === 2 && cueVisible('change'),
          name = changed ? 'shift_traffic' : 'get_release_status',
          body = requestEnvelope(53, 'get_release_status', {
            release_id: 'reranker-v17',
          }),
          headers = {
            'MCP-Protocol-Version': PROTOCOL_VERSION,
            'Mcp-Method': 'tools/call',
            'Mcp-Name': name,
          },
          gate = mirrorGate(body, headers);
        codePanel(
          ctx,
          api,
          'body · source of truth',
          [`version: ${PROTOCOL_VERSION}`, 'method: tools/call', 'name: get_release_status'],
          150,
          335,
          735,
          335,
          themeColors.blue,
        );
        codePanel(
          ctx,
          api,
          'gateway routing headers',
          [`version: ${PROTOCOL_VERSION}`, 'method: tools/call', `name: ${name}`],
          1030,
          335,
          735,
          335,
          changed ? themeColors.yellow : themeColors.cyan,
        );
        if (currentBeat === 2 && cueComplete('reject-changed'))
          text(
            ctx,
            api,
            `mismatch → HTTP ${gate.http} / ${gate.code} · dispatch stopped`,
            960,
            795,
            39,
            themeColors.red,
          );
        else if (currentBeat === 1 && cueVisible('mirror'))
          text(
            ctx,
            api,
            'Compare every required mirror to the decoded body value',
            960,
            795,
            34,
            themeColors.cyan,
          );
        footer(
          ctx,
          api,
          'Header names ignore case; method/name values keep case. Non-header-safe names require SDK encoding.',
        );
      }
    }
  });
}
export default {
  id: 'http-binding',
  draw: drawHttpBinding,
  cues: [
    'http-binding-beat-0',
    't-http-binding-post',
    't-http-binding-stream',
    'http-binding-beat-1',
    't-http-binding-mirror',
    't-http-binding-reject',
    'http-binding-beat-2',
    't-http-binding-change',
    't-http-binding-reject-changed',
    'mirror-resource-change',
    'mirror-resource-pass',
    'mirror-resource-fail',
  ],
};
