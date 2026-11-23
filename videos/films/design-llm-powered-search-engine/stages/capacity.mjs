import { capacityTeachingState, sampleModel } from '../model.mjs';
import { originalCard, originalMath, originalText } from '../defaults.mjs';
export function drawCapacity(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('capacity', state),
    currentBeat = modelState.step;
  {
    const v = capacityTeachingState(state.beat ?? currentBeat, state.beatP ?? 0, state.cues);
    if (currentBeat === 0) {
      api.focus.target('capacity-id-request-label-r1-request-id-kv-label-r1-kv-state', () =>
        teaching.timeline({
          x: 170,
          y: 320,
          width: 1580,
          height: 310,
          domain: [0, 2.5],
          time: v.time,
          lanes: [
            {
              id: 'request',
              label: 'R1 request',
            },
            {
              id: 'kv',
              label: 'R1 KV state',
            },
          ],
          intervals: [
            {
              id: 'retrieve',
              lane: 'request',
              start: 0,
              end: 0.37,
              label: 'Retrieve',
              color: themeColors.blue,
            },
            {
              id: 'model',
              lane: 'request',
              start: 0.37,
              end: 2.3,
              label: 'Synthesis',
              color: themeColors.cyan,
            },
            {
              id: 'check',
              lane: 'request',
              start: 2.3,
              end: 2.5,
              label: 'Check',
              color: themeColors.green,
            },
            {
              id: 'resident',
              lane: 'kv',
              start: 0.37,
              end: 2.3,
              label: 'Allocate → resident → release',
              color: themeColors.cyan,
            },
          ],
          ticks: [0, 0.37, 2.3, 2.5],
          formatTime: (x) => x.toFixed(2) + ' s',
          fontSize: 24,
          labelWidth: 250,
          color: themeColors.muted,
          trackColor: themeColors.panel,
        }),
      );
      if (v.seconds < 8.81)
        api.focus.target(
          'capacity-v-time-3-r1-waits-for-retrieval-kv-absent-v-kvlive-r1-model-history',
          () =>
            originalCard(
              ctx,
              api,
              v.time < 0.37
                ? 'R1 waits for retrieval · KV absent'
                : v.kvLive
                  ? 'R1 model history allocated · KV resident'
                  : 'R1 final checking · KV released',
              330,
              760,
              1260,
              v.kvLive ? themeColors.cyan : themeColors.muted,
              130,
              35,
            ),
        );
      else {
        [
          ['Synthesis in flight', v.inflight, 1500, themeColors.blue, 2.5],
          ['KV residents', v.resident, 1158, themeColors.cyan, 1.93],
        ].forEach(([name, n, max, color, span], i) => {
          const y = 705 + i * 135;
          originalText(ctx, api, name, 170, y + 45, 31, color);
          api.rect(ctx, 490, y, 1100, 65, themeColors.panel, themeColors.muted, 4);
          teaching.changeCue(
            {
              x: 475,
              y: y - 12,
              width: 1305,
              height: 95,
              from: 0,
              to: max,
              progress: n / max,
              color,
            },
            (cue) => {
              api.rect(ctx, 490, y, (1100 * cue.value) / 1500, 65, color, undefined, 4);
              originalText(
                ctx,
                api,
                Math.round(cue.value).toLocaleString(),
                1745,
                y + 45,
                34,
                color,
                'right',
              );
            },
          );
          if (n === max)
            originalText(
              ctx,
              api,
              '600 requests/s × ' + span.toFixed(2) + ' s',
              1050,
              y + 105,
              27,
              color,
              'center',
            );
        });
      }
      originalText(
        ctx,
        api,
        'Same arrival stream · total mean residence 2.50 s · KV mean residence 1.93 s',
        960,
        1020,
        28,
        themeColors.muted,
        'center',
      );
    } else {
      originalText(
        ctx,
        api,
        '1,158 mean KV residents · derive the per-position payload',
        960,
        285,
        33,
        themeColors.cyan,
        'center',
      );
      const names = ['K + V', 'Layers', 'Stored heads', 'Head width', 'Bytes/value'],
        values = [2, 32, 8, 128, 2];
      names.forEach((name, i) => {
        const x = 170 + i * 320;
        originalText(ctx, api, name, x + 140, 380, 27, themeColors.muted, 'center');
        api.focus.target('capacity-v-factors-i-string-values-i', () =>
          originalCard(
            ctx,
            api,
            v.factors[i] ? String(values[i]) : '·',
            x,
            415,
            280,
            v.factors[i] ? themeColors.cyan : themeColors.muted,
            90,
            40,
          ),
        );
      });
      if (v.factors.every(Boolean))
        originalMath(
          ctx,
          api,
          '2\\cdot32\\cdot8\\cdot128\\cdot2=131072\\ \\mathrm{bytes/position}',
          960,
          585,
          37,
        );
      if (v.positionCount) {
        originalText(
          ctx,
          api,
          '1,560 time-weighted cached positions per resident request',
          960,
          670,
          30,
          themeColors.blue,
          'center',
        );
        originalMath(
          ctx,
          api,
          '1158\\cdot1560\\cdot131072/2^{30}=' + v.gib.toFixed(2) + '\\ \\mathrm{GiB}',
          960,
          745,
          36,
        );
      }
      api.focus.target('capacity-memory-bound', () =>
        originalCard(
          ctx,
          api,
          v.memoryReady
            ? 'Memory lower bound: ' +
                v.memoryDevices +
                ' devices\n⌈' +
                v.gib.toFixed(2) +
                ' GiB / 12 GiB⌉'
            : 'Memory lower bound pending',
          170,
          820,
          710,
          v.memoryReady ? themeColors.cyan : themeColors.muted,
          140,
          30,
        ),
      );
      api.focus.target('capacity-output-bound', () =>
        originalCard(
          ctx,
          api,
          v.decodeReady
            ? 'Decode lower bound: ' +
                v.decodeDevices +
                ' devices\n600 req/s × 120 tok/req ÷ 6,000 tok/s'
            : 'Output-throughput bound pending',
          1040,
          820,
          710,
          v.decodeReady ? themeColors.green : themeColors.muted,
          140,
          28,
        ),
      );
    }
  }
}

// These local models mirror the article fixtures; no provider or retrieval service runs here.
export default {
  id: 'capacity',
  draw: drawCapacity,
  cues: [
    'capacity-beat-1-focus-1',
    'capacity-beat-1-focus-2',
    'capacity-beat-2-focus-1',
    'capacity-beat-2-focus-2',
  ],
};
