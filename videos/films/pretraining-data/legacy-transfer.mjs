import { corpus } from './fixtures.mjs';
import { transferSnapshot } from './model.mjs';
import { legacyText } from './defaults.mjs';
export function paintPretrainingOriginalTransfer(ctx, scene, state, api, C, c, t, b, p, s) {
  const v = transferSnapshot(b, p);
  legacyText(
    ctx,
    api,
    C,
    b === 0
      ? 'Follow the same corpus IDs into consumed blocks'
      : 'Change only the quality cutoff · matched proxy fixture',
    960,
    290,
    36,
    C.ink,
    'center',
  );
  legacyText(ctx, api, C, 'Record and inventory tokens', 160, 390, 28, C.muted);
  legacyText(
    ctx,
    api,
    C,
    b === 0 ? 'Preparation result' : 'Baseline cutoff 0.50',
    740,
    390,
    28,
    C.blue,
  );
  legacyText(
    ctx,
    api,
    C,
    b === 0 ? 'Consumed 100-token blocks' : 'Variant cutoff ' + v.strictThreshold.toFixed(2),
    1330,
    390,
    28,
    C.pink,
  );
  if (b === 2 && v.seconds >= 5.85) api.rect(ctx, 140, 585, 1630, 65, undefined, C.yellow, 8);
  corpus.forEach((row, i) => {
    const y = 475 + i * 75;
    api.focus.target('record-identities', () =>
      legacyText(
        ctx,
        api,
        C,
        row.id + ' · ' + row.source + ' · ' + row.tokens,
        160,
        y,
        29,
        row.source === 'Code' ? C.pink : C.blue,
      ),
    );
    if (b === 0) {
      const retained =
          v.phase === 0
            ? true
            : v.phase === 1
              ? v.baseline.survivors.includes(row)
              : v.baseline.unique.includes(row),
        reason = retained
          ? 'retained'
          : row.id === 'B'
            ? 'B → representative A'
            : 'D removed · score 0.10';
      api.focus.target('preparation-state', () =>
        legacyText(ctx, api, C, reason, 740, y, 27, retained ? C.green : C.muted),
      );
    } else {
      const a = v.baseline.unique.includes(row),
        z = v.strict.unique.includes(row);
      legacyText(
        ctx,
        api,
        C,
        a ? 'retain ' + row.id : row.id === 'B' ? 'B → A' : 'removed',
        740,
        y,
        27,
        a ? C.green : C.muted,
      );
      legacyText(
        ctx,
        api,
        C,
        z ? 'retain ' + row.id : row.id === 'B' ? 'B → A' : 'removed',
        1330,
        y,
        27,
        z ? C.green : C.muted,
      );
    }
  });
  if (b === 0) {
    v.blocks.forEach((id, i) =>
      api.focus.target('consumed-blocks', () =>
        c.card({
          label: id + ' · 100 tokens',
          x: 1330,
          y: 435 + i * 92,
          width: 400,
          height: 68,
          fontSize: 26,
          fill: C.panel,
          stroke: id === 'C' ? C.pink : C.blue,
          textColor: C.ink,
        }),
      ),
    );
    const code = v.blocks.filter((id) => id === 'C').length * 100,
      prose = v.blocks.length * 100 - code;
    legacyText(
      ctx,
      api,
      C,
      'Inventory: ' + (v.phase === 0 ? 1000 : v.phase === 1 ? 800 : 560) + ' tokens',
      740,
      920,
      29,
      C.green,
    );
    if (v.blocks.length)
      legacyText(
        ctx,
        api,
        C,
        'Consumed: code ' + code + ' · prose ' + prose,
        1260,
        920,
        27,
        C.yellow,
      );
    legacyText(
      ctx,
      api,
      C,
      'Declared equal-length blocks · repeated C is an explicit second exposure',
      960,
      1020,
      28,
      C.muted,
      'center',
    );
  } else {
    api.focus.target('baseline-inventory', () =>
      legacyText(
        ctx,
        api,
        C,
        v.baseline.tokens + ' tokens · mean score ' + v.baseline.mean.toFixed(3),
        740,
        900,
        27,
        C.blue,
      ),
    );
    api.focus.target('variant-inventory', () =>
      legacyText(
        ctx,
        api,
        C,
        v.strict.tokens + ' tokens · mean score ' + v.strict.mean.toFixed(3),
        1330,
        900,
        27,
        C.pink,
      ),
    );
    if (
      v.proxyReady ||
      (state.cues?.['transfer-b2-3'] && state.cues['transfer-b2-3'].phase !== 'before')
    ) {
      api.focus.target('proxy-comparison', () =>
        legacyText(
          ctx,
          api,
          C,
          'Proxy fixture: ' + v.correct.baseline + '/10 successes',
          740,
          975,
          26,
          C.green,
        ),
      );
      api.focus.target('proxy-comparison', () =>
        legacyText(
          ctx,
          api,
          C,
          'Proxy fixture: ' + v.correct.strict + '/10 successes',
          1330,
          975,
          26,
          C.pink,
        ),
      );
    }
  }
}
