import { bounded, ringSchedule } from '../arithmetic.mjs';
import { sampleDeepGemmChapter } from '../construction.mjs';
import { drawBox, drawGrid, drawLink, drawSubtitle, drawText } from '../defaults.mjs';
export function drawRingOwnership(ctx, scene, state, api) {
  return api.focus.target('ring-ownership-construction', () => {
    const { C: themeColors, components: components } = api,
      modelState = sampleDeepGemmChapter('ring-ownership', state),
      { b: currentBeat, g: teaching2 } = modelState;
    const done = (beat, index) => teaching2(beat, index) >= 1;
    {
      drawSubtitle(
        ctx,
        api,
        currentBeat === 0
          ? 'A slot is free when its last consumer finishes'
          : currentBeat === 1
            ? 'Typed views share one deliberately sized allocation'
            : 'One leased slot can remove a second chunk’s overlap',
      );
      if (currentBeat === 0) {
        const p = teaching2(0, 2),
          completed = Math.min(4, Math.floor(p * 5)),
          slot = drawBox(
            ctx,
            api,
            'Ring slot S0 · token t7',
            150,
            430,
            600,
            150,
            themeColors.blue,
            39,
          );
        const readers = Array.from(
          {
            length: 4,
          },
          (_, i) =>
            drawBox(
              ctx,
              api,
              `N block ${i} · ${i < completed ? 'finished' : 'reading'}`,
              1150,
              340 + i * 130,
              600,
              90,
              i < completed ? themeColors.green : themeColors.yellow,
              30,
            ),
        );
        readers.forEach((r, i) =>
          drawLink(
            ctx,
            api,
            slot,
            r,
            i < completed ? 1 : bounded(p * 4 - i),
            i < completed ? themeColors.green : themeColors.yellow,
          ),
        );
        drawText(
          ctx,
          api,
          `Consumer completions ${completed} / 4`,
          450,
          735,
          37,
          completed === 4 ? themeColors.green : themeColors.yellow,
          'center',
        );
        drawText(ctx, api, 'Toy four-consumer lease', 450, 820, 28, themeColors.muted, 'center');
        if (teaching2(0, 3) > 0) {
          const safe = completed === 4;
          drawBox(
            ctx,
            api,
            safe ? 'Reusable after all readers finish' : 'New dispatch blocked · preserve old row',
            180,
            875,
            1520,
            90,
            safe ? themeColors.green : themeColors.pink,
            34,
          );
        }
      } else if (currentBeat === 1) {
        const fields = [
          ['FP8 tokens', themeColors.blue],
          ['Packed scales', themeColors.pink],
          ['Route indices', themeColors.cyan],
          ['Route weights', themeColors.yellow],
          ['Intermediate activations', themeColors.green],
        ];
        let x = 150;
        fields.forEach(([name, color], i) => {
          const width = i === 4 ? 450 : 300;
          drawBox(ctx, api, name, x, 365, width, 120, color, 27);
          x += width + 15;
        });
        drawText(
          ctx,
          api,
          'Symmetric allocation · byte count + typed views',
          960,
          565,
          36,
          themeColors.blue,
          'center',
        );
        drawGrid(
          ctx,
          api,
          [['gate₀', 'up₀', 'gate₁', 'up₁']],
          220,
          680,
          1450,
          110,
          themeColors.pink,
          31,
        );
        if (done(1, 2))
          drawText(
            ctx,
            api,
            'July low-bit recipe: (1, 1, 32)',
            960,
            850,
            38,
            themeColors.yellow,
            'center',
          );
        if (teaching2(1, 4) > 0)
          drawText(
            ctx,
            api,
            'Copy fresh token / route / weight values before each call',
            960,
            945,
            30,
            themeColors.green,
            'center',
          );
      } else {
        const e = teaching2(2, 1),
          x = (time) => 450 + (time / 8) * 1280,
          events = ringSchedule(e > 0 ? 1 : 2);
        drawText(
          ctx,
          api,
          e > 0
            ? 'One slot · B waits until A releases at time 4'
            : 'Two slots · independent chunk leases',
          960,
          365,
          35,
          themeColors.yellow,
          'center',
        );
        events.forEach((event, i) => {
          const fraction = i < 3 || e === 0 ? 1 : bounded(e * 3 - (i - 3));
          if (fraction <= 0) return;
          const left = x(event.start),
            right = x(event.start + (event.end - event.start) * fraction);
          components.panel({
            x: left,
            y: 470 + event.lane * 190,
            width: Math.max(0.1, right - left),
            height: 100,
            fill: themeColors.panel,
            stroke: i < 3 ? themeColors.blue : themeColors.pink,
          });
          if (fraction >= 1) {
            const [owner, phase] = event.id.split(' ');
            drawText(
              ctx,
              api,
              owner,
              (left + right) / 2,
              505 + event.lane * 190,
              26,
              i < 3 ? themeColors.blue : themeColors.pink,
              'center',
            );
            drawText(
              ctx,
              api,
              phase,
              (left + right) / 2,
              548 + event.lane * 190,
              26,
              i < 3 ? themeColors.blue : themeColors.pink,
              'center',
            );
          }
        });
        drawText(ctx, api, 'Communication', 400, 535, 27, themeColors.blue, 'right');
        drawText(ctx, api, 'Compute', 400, 725, 27, themeColors.cyan, 'right');
        api.line(ctx, x(0), 810, x(4), 810, themeColors.yellow, 6);
        drawText(
          ctx,
          api,
          'S0 holds A through its last combine consumer',
          960,
          875,
          29,
          themeColors.yellow,
          'center',
        );
        if (e >= 1)
          drawText(
            ctx,
            api,
            'One slot: 8 units · two slots: 6 units',
            960,
            950,
            35,
            themeColors.green,
            'center',
          );
      }
    }
  });
}
export default {
  id: 'ring-ownership',
  draw: drawRingOwnership,
  cues: [
    'ring-ownership-b0',
    'dg-ring-ownership-0-0',
    'dg-ring-ownership-0-1',
    'dg-ring-ownership-0-2',
    'dg-ring-ownership-0-3',
    'dg-ring-ownership-0-4',
    'ring-ownership-b1',
    'dg-ring-ownership-1-0',
    'dg-ring-ownership-1-1',
    'dg-ring-ownership-1-2',
    'dg-ring-ownership-1-3',
    'dg-ring-ownership-1-4',
    'ring-ownership-b2',
    'dg-ring-ownership-2-0',
    'dg-ring-ownership-2-1',
    'dg-ring-ownership-2-2',
    'dg-ring-ownership-2-3',
    'dg-ring-ownership-2-4',
  ],
};
