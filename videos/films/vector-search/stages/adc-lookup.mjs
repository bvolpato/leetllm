import { cueProgress } from '../construction.mjs';
import { collisionFixture, compressionFixture, encodeChunks } from '../model.mjs';
import { detailText } from '../defaults.mjs';
export function drawAdcLookup(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const target = 'adc-lookup-mechanism';
  api.focus.target(target, () => {
    if (currentBeat === 2) {
      const f = collisionFixture(),
        residual = cueProgress(state, 'adc-database-residual') > 0,
        ordered = cueProgress(state, 'adc-original-order') >= 1,
        overfetch = cueProgress(state, 'adc-overfetch-originals') >= 1;
      if (residual) {
        const values = f.database.map((v, i) => v - f.coarse[i]),
          query = f.query.map((v, i) => v - f.coarse[i]),
          encoded = encodeChunks(values);
        detailText(
          ctx,
          api,
          'Explicit residual fixture · one probed coarse list',
          960,
          285,
          36,
          themeColors.yellow,
          'center',
        );
        const rows = [
          ['Coarse centroid c', f.coarse],
          ['Original vector x', f.database],
          ['Residual x − c', values],
        ];
        rows.forEach(([label, v], i) => {
          detailText(
            ctx,
            api,
            label,
            390,
            420 + i * 150,
            31,
            i === 2 ? themeColors.cyan : themeColors.muted,
            'center',
          );
          detailText(
            ctx,
            api,
            '[' + v.map((n) => Number(n.toFixed(2))).join(', ') + ']',
            1100,
            420 + i * 150,
            36,
            i === 2 ? themeColors.cyan : themeColors.ink,
            'center',
          );
        });
        detailText(
          ctx,
          api,
          'Residual code [' + encoded.ids.join(', ') + ']',
          960,
          835,
          38,
          themeColors.green,
          'center',
        );
        if (cueProgress(state, 'adc-query-residual') >= 1)
          detailText(
            ctx,
            api,
            'Query q − c = [' + query.join(', ') + '] → residual ADC score 0',
            960,
            940,
            34,
            themeColors.yellow,
            'center',
          );
        detailText(
          ctx,
          api,
          'The coarse-list identity is part of this code’s meaning',
          960,
          1010,
          29,
          themeColors.muted,
          'center',
        );
      } else {
        detailText(
          ctx,
          api,
          ordered
            ? overfetch ? 'Rerank both retained originals' : 'Audit both originals against the same zero query'
            : 'Explicit collision: zero query, two different originals',
          960,
          285,
          36,
          themeColors.yellow,
          'center',
        );
        f.originals.forEach((a, i) => {
          const rank = ordered ? 1 - i : i,
            y = 400 + rank * 185;
          detailText(
            ctx,
            api,
            a.id + ' = [' + a.values.join(', ') + ']',
            490,
            y,
            35,
            a.id === 'A' ? themeColors.blue : themeColors.pink,
            'center',
          );
          detailText(
            ctx,
            api,
            'code [' + a.code.join(', ') + ']',
            1080,
            y,
            37,
            themeColors.cyan,
            'center',
          );
          detailText(
            ctx,
            api,
            ordered ? 'true d² = ' + a.trueDistance2.toFixed(2) : 'ADC = 0',
            1540,
            y,
            36,
            ordered ? themeColors.green : themeColors.cyan,
            'center',
          );
          api.arrow(ctx, 790, y - 12, 920, y - 12, themeColors.muted, 3);
        });
        detailText(
          ctx,
          api,
          ordered ? 'Prior code tie A, B · original ranking now B, A' : 'Code tie → ID order A, B',
          960,
          770,
          35,
          ordered ? themeColors.muted : themeColors.cyan,
          'center',
        );
        if (ordered) detailText(ctx, api, '0.04 < 2.56', 960, 865, 42, themeColors.green, 'center');
        detailText(
          ctx,
          api,
          overfetch
            ? 'Candidate {A} cannot recover B · overfetch {A, B} + originals can'
            : 'Same centroid IDs hide different original distances',
          960,
          990,
          31,
          themeColors.muted,
          'center',
        );
      }
      return;
    }
    const f = compressionFixture();
    const first = currentBeat > 0 || cueProgress(state, 'adc-first-byte') > 0;
    const second = currentBeat > 0 || cueProgress(state, 'adc-second-byte') > 0;
    const sum = currentBeat > 0 || cueProgress(state, 'adc-sum') > 0;
    let code = [1, 2];
    if (currentBeat === 1) {
      const index = ['lookup-one-zero', 'lookup-zero-one', 'lookup-scores']
        .filter((id) => cueProgress(state, id) > 0).length;
      code = f.codes[index];
    }
    const selected = code.map((id, j) => f.tables[j][id]);
    detailText(
      ctx,
      api,
      'Uncompressed query [0, 0 | 0, 0]',
      960,
      285,
      38,
      themeColors.yellow,
      'center',
    );
    f.tables.forEach((row, j) => {
      detailText(
        ctx,
        api,
        'chunk ' + (j + 1),
        210,
        430 + j * 180,
        31,
        j ? themeColors.pink : themeColors.blue,
      );
      row.forEach((v, k) => {
        const x = 430 + k * 260,
          y = 370 + j * 180,
          active = (j === 0 ? first : second) && code[j] === k;
        api.rect(
          ctx,
          x,
          y,
          170,
          110,
          themeColors.panel,
          active ? themeColors.green : j ? themeColors.pink : themeColors.blue,
          active ? 5 : 2,
          10,
        );
        detailText(
          ctx,
          api,
          v.toFixed(0),
          x + 85,
          y + 70,
          48,
          active ? themeColors.green : themeColors.muted,
          'center',
        );
        detailText(ctx, api, 'ID ' + k, x + 85, y - 30, 27, themeColors.muted, 'center');
      });
    });
    detailText(
      ctx,
      api,
      'Stored code [' + code.join(', ') + ']',
      550,
      860,
      40,
      themeColors.cyan,
      'center',
    );
    detailText(
      ctx,
      api,
      sum ? selected.join(' + ') + ' = ' + (selected[0] + selected[1]) : 'Squared distance = ?',
      1380,
      860,
      48,
      themeColors.green,
      'center',
    );
    detailText(
      ctx,
      api,
      'One query table per chunk · the same rows score every stored code',
      960,
      995,
      30,
      themeColors.muted,
      'center',
    );
  });
}
export default {
  id: 'adc-lookup',
  draw: drawAdcLookup,
  cues: [
    'adc-lookup-b1', 'adc-first-byte', 'adc-second-byte', 'adc-sum', 'lookup-one-zero', 'lookup-zero-one',
    'adc-lookup-b2',
    'lookup-scores',
    'adc-lookup-b3',
    'adc-original-order',
    'adc-overfetch-originals',
    'adc-database-residual',
    'adc-query-residual',
  ],
};
