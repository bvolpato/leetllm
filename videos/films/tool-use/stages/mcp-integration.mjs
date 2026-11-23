import { cueProgress } from '../arithmetic.mjs';
import { box, chapterCode, chapterLine, chapterText, heading } from '../defaults.mjs';
export function drawMcpIntegration(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    cueProgress2 = (id, beat = currentBeat) =>
      currentBeat < beat
        ? 0
        : currentBeat > beat
          ? 1
          : cueProgress(state.cues, 'tu-' + id, Math.max(0, Math.min(1, (progress - 0.08) / 0.8))),
    resultComplete = (id, beat = currentBeat) =>
      currentBeat > beat ||
      (currentBeat === beat &&
        (state.cues ? state.cues['tu-' + id]?.phase === 'after' : progress >= 0.9));
  api.focus.target('tu-mcp-integration-mechanism', () => {
    heading(ctx, api, 'Three hosts and four services retain their own adapters');
    if (currentBeat === 0) {
      const shared = resultComplete('mcp-factored', 0),
        conversion = shared
          ? 1
          : state.cues
            ? cueProgress2('mcp-factor-operation', 0)
            : Math.max(0, Math.min(1, (progress - 0.52) / 0.42)),
        direct = state.cues
          ? cueProgress2('mcp-direct', 0)
          : Math.max(0, Math.min(1, (progress - 0.05) / 0.35)),
        hosts = ['H1', 'H2', 'H3'],
        services = ['S1', 'S2', 'S3', 'S4'];
      hosts.forEach((v, i) =>
        box(
          ctx,
          api,
          v,
          conversion > 0 ? 'one client integration' : 'assistant host',
          150,
          365 + i * 190,
          390,
          themeColors.blue,
          110,
        ),
      );
      services.forEach((v, i) =>
        box(
          ctx,
          api,
          v,
          conversion > 0 ? 'one server integration' : 'service API',
          1370,
          350 + i * 145,
          360,
          themeColors.green,
          100,
        ),
      );
      if (conversion === 1) {
        hosts.forEach((v, i) =>
          chapterLine(ctx, api, 560, 420 + i * 190, 915, 420 + i * 190, themeColors.blue, 3),
        );
        services.forEach((v, i) =>
          chapterLine(ctx, api, 915, 400 + i * 145, 1340, 400 + i * 145, themeColors.green, 3),
        );
        chapterLine(ctx, api, 915, 365, 915, 840, themeColors.cyan, 4);
      } else {
        let e = 0;
        for (let h = 0; h < hosts.length; h++)
          for (let s = 0; s < services.length; s++)
            if (e++ < Math.ceil(hosts.length * services.length * direct)) {
              const yh = 420 + h * 190,
                ys = 400 + s * 145,
                middle = (yh + ys) / 2,
                entry = middle + (yh - middle) * conversion,
                exit = middle + (ys - middle) * conversion;
              chapterLine(
                ctx,
                api,
                560,
                yh,
                915,
                entry,
                conversion > 0 ? themeColors.blue : themeColors.muted,
                1.5,
              );
              chapterLine(ctx, api, 915, entry, 915, exit, themeColors.cyan, 1.5);
              chapterLine(
                ctx,
                api,
                915,
                exit,
                1340,
                ys,
                conversion > 0 ? themeColors.green : themeColors.muted,
                1.5,
              );
            }
      }
      if (shared)
        chapterText(
          ctx,
          api,
          hosts.length +
            ' clients + ' +
            services.length +
            ' servers = ' +
            (hosts.length + services.length) +
            ' pieces',
          650,
          960,
          33,
          themeColors.green,
        );
      else if (conversion > 0)
        chapterText(
          ctx,
          api,
          'Factor the same host/service connections',
          650,
          960,
          31,
          themeColors.cyan,
        );
      else if (resultComplete('mcp-direct', 0))
        chapterText(
          ctx,
          api,
          hosts.length +
            ' × ' +
            services.length +
            ' = ' +
            hosts.length * services.length +
            ' pair adapters',
          650,
          960,
          34,
          themeColors.yellow,
        );
    } else if (currentBeat === 1) {
      box(
        ctx,
        api,
        'tools/list response',
        ['name: get_release_status', 'inputSchema: release_id'],
        150,
        400,
        720,
        themeColors.blue,
        160,
      );
      box(
        ctx,
        api,
        'tools/call request',
        ['name: get_release_status', 'arguments: release_id R16'],
        1050,
        400,
        680,
        themeColors.cyan,
        160,
      );
      if (resultComplete('mcp-call', 1))
        chapterLine(ctx, api, 900, 480, 1025, 480, themeColors.cyan, 4);
      if (resultComplete('mcp-metadata', 1)) {
        chapterCode(
          ctx,
          api,
          'protocolVersion + clientCapabilities',
          150,
          780,
          30,
          themeColors.yellow,
        );
        chapterText(
          ctx,
          api,
          'Pinned July 2026 request metadata contract',
          150,
          920,
          29,
          themeColors.muted,
        );
      }
    } else {
      box(
        ctx,
        api,
        'Annotation',
        'readOnly: true · issuer may be untrusted',
        150,
        420,
        720,
        themeColors.yellow,
        135,
      );
      box(
        ctx,
        api,
        'Current execution policy',
        'principal + action + resolved resource',
        1050,
        420,
        680,
        themeColors.green,
        135,
      );
      chapterText(
        ctx,
        api,
        'Compare the reviewed schema with the current catalog',
        150,
        780,
        32,
        themeColors.cyan,
      );
      chapterText(
        ctx,
        api,
        'Protocol reuse does not grant caller authority',
        150,
        930,
        32,
        themeColors.yellow,
      );
    }
  });
}
export default {
  id: 'mcp-integration',
  draw: drawMcpIntegration,
  cues: [
    'tu-mcp-integration-1',
    'tu-mcp-direct',
    'tu-mcp-factored',
    'tu-mcp-factor-operation',
    'tu-mcp-integration-2',
    'tu-mcp-call',
    'tu-mcp-metadata',
    'tu-mcp-integration-3',
    'tu-mcp-untrusted-annotation',
  ],
};
