import { EVAL_DATE, PARENTS } from '../fixtures.mjs';
import { parentAdmission, parentPackingFixture } from '../model.mjs';
import { drawText, paragraph, recordCard } from '../defaults.mjs';
import { layoutAllocation } from 'vizmatic';
export function drawChildToParent(ctx, scene, state, api) {
  const { C: themeColors, components: components, phase, teaching: teaching } = api;
  const beat = state.beat ?? 0,
    progress2 = state.beatP ?? 0,
    q = phase(progress2, 0.04, 0.92);
  const route = (from, to, color = themeColors.cyan, progress = q, opacity = 1) =>
    teaching.transfer({
      source: {
        shape: from,
        opacity,
      },
      target: {
        shape: to,
        opacity,
      },
      color,
      progress,
      width: 3,
      gap: 16,
      margin: 3,
      particle: {
        radius: 6,
        fill: color,
      },
    });
  {
    const fixture = parentPackingFixture(),
      run = fixture.run,
      childRecord = run.hits[0].record,
      parentRecord = PARENTS[childRecord.parentId],
      admission = parentAdmission(childRecord, parentRecord, run.caller);
    api.focus.target('request-scope', () =>
      drawText(
        ctx,
        api,
        'Luna · EU · support:eu · pinned index/42',
        960,
        275,
        29,
        themeColors.blue,
        'center',
      ),
    );
    if (beat < 2) {
      const child = api.focus.target('matched-child', () =>
        recordCard(
          ctx,
          api,
          'eu-key-v2 · matching child\nAutomated rotation within 14 days',
          100,
          380,
          475,
          themeColors.cyan,
          150,
          25,
        ),
      );
      const checkedProgress = api.focus.progress('check-parent', beat > 1 ? 1 : 0);
      const check = api.focus.target('parent-check', () =>
        recordCard(
          ctx,
          api,
          beat === 0
            ? 'Parent pointer\neu-access-v2'
            : 'Parent admission\n' +
                (checkedProgress < 1
                  ? 'Checks pending'
                  : admission.accepted
                    ? 'All declared checks pass'
                    : 'Reject parent'),
          720,
          380,
          475,
          themeColors.yellow,
          150,
          26,
        ),
      );
      const expansion = beat > 0 ? 1 : api.focus.progress('parent-condition', q);
      const parent = api.focus.target('parent-section', () => {
        const shape = components.panel({
          x: 1290,
          y: 340,
          width: 530,
          height: 190 + 120 * expansion,
          fill: themeColors.panel,
          stroke: themeColors.green,
        });
        drawText(ctx, api, 'eu-access-v2 · complete section', 1315, 380, 25, themeColors.green);
        paragraph(ctx, api, 'Automated rotation within 14 days.', 1315, 440, 480, 26);
        if (expansion >= 0.8)
          paragraph(
            ctx,
            api,
            'provided the risk signal is at most 48 hours old.',
            1315,
            515,
            480,
            26,
          );
        return shape;
      });
      route(child, check, themeColors.cyan, beat > 0 ? 1 : api.focus.progress('child-match', q));
      if (beat > 0)
        route(check, parent, themeColors.green, api.focus.progress('resolve-parent', q));
      const entryX =
        beat === 0 ? 100 : api.lerp(100, 1290, api.focus.progress('resolve-parent', q));
      api.focus.target('evidence-record', () =>
        recordCard(
          ctx,
          api,
          'eu-key-v2 → eu-access-v2',
          entryX,
          660,
          475,
          themeColors.cyan,
          70,
          25,
        ),
      );
      if (beat === 1) {
        const progress = api.focus.progress('check-parent', q),
          fields = [
            ['Parent', parentRecord.id, admission.checks.identifier],
            ['Document', parentRecord.documentId, admission.checks.document],
            ['Version', parentRecord.version.split('/')[1], admission.checks.version],
            ['Effective', parentRecord.from + ' ≤ ' + EVAL_DATE, admission.checks.effective],
            ['Region', parentRecord.region, admission.checks.region],
            ['Access tag', parentRecord.acl, admission.checks.access],
          ];
        fields.forEach(([label, value, pass], i) => {
          const checked = progress >= (i + 0.5) / fields.length;
          api.focus.target('parent-check', () =>
            recordCard(
              ctx,
              api,
              label + ' · ' + (checked ? (pass ? '✓' : '✗') : 'pending') + '\n' + value,
              120 + (i % 3) * 590,
              780 + Math.floor(i / 3) * 125,
              520,
              checked ? (pass ? themeColors.green : themeColors.pink) : themeColors.muted,
              105,
              24,
            ),
          );
        });
      }
    } else {
      const dedup = api.focus.progress('deduplicate', q),
        duplicateOpacity = 1 - Math.min(1, 2 * dedup),
        shift = Math.max(0, 2 * dedup - 1),
        budget = fixture.budget;
      fixture.hits.forEach((hit, i) =>
        api.focus.target('matched-child', () =>
          recordCard(
            ctx,
            api,
            'Hit ' + (i + 1) + ' · ' + hit.record.id + '\n→ ' + hit.record.parentId,
            100,
            320 + i * 155,
            600,
            i === 1 ? themeColors.yellow : themeColors.cyan,
            115,
            25,
          ),
        ),
      );
      const section = (item, y) =>
        api.focus.target('parent-section', () =>
          api.focus.target('evidence-record', () => {
            const shape = components.panel({
              x: 1000,
              y,
              width: 810,
              height: 175,
              fill: themeColors.panel,
              stroke: themeColors.green,
            });
            drawText(
              ctx,
              api,
              '[' + item.sourceId + '] ' + item.parentId + ' · ' + item.version.split('/')[1],
              1405,
              y + 35,
              26,
              themeColors.green,
              'center',
            );
            const words = item.text.split(' '),
              lines = [];
            let line = '';
            for (const word of words) {
              if ((line + ' ' + word).trim().length > 63) {
                lines.push(line);
                line = word;
              } else line = (line + ' ' + word).trim();
            }
            if (line) lines.push(line);
            lines.forEach((value, i) =>
              drawText(ctx, api, value, 1025, y + 75 + i * 31, 23, themeColors.ink),
            );
            return shape;
          }),
        );
      section(fixture.packed[0], 320);
      if (duplicateOpacity > 0)
        components.fade(duplicateOpacity, () =>
          api.focus.target('duplicate-parent', () =>
            recordCard(
              ctx,
              api,
              'Repeated eu-access-v2 · same version\nAlready represented by E1',
              1000,
              515,
              810,
              themeColors.yellow,
              95,
              25,
            ),
          ),
        );
      section(fixture.packed[1], 650 - 135 * shift);
      api.focus.target('packed-count', () => {
        drawText(
          ctx,
          api,
          '3 hits → ' + (dedup === 1 ? '2 unique parents' : 'deduplicate parent/version'),
          400,
          825,
          29,
          themeColors.yellow,
          'center',
        );
        if (dedup === 1)
          drawText(ctx, api, 'Hit 2 reuses E1', 400, 875, 26, themeColors.green, 'center');
      });
      const tokenProgress = api.focus.progress('count-complete-request', 0),
        shown = Math.ceil(budget.parts.length * tokenProgress),
        visibleParts = budget.parts.slice(0, shown),
        counted = visibleParts.reduce((sum, row) => sum + row.tokens, 0),
        colors = [
          themeColors.blue,
          themeColors.yellow,
          themeColors.pink,
          themeColors.green,
          themeColors.cyan,
        ];
      api.focus.target('complete-token-budget', () => {
        drawText(
          ctx,
          api,
          'Toy target tokenizer: byte-v1 · UTF-8 bytes are token IDs',
          960,
          925,
          26,
          themeColors.muted,
          'center',
        );
        const allocation = layoutAllocation({
          x: 120,
          y: 955,
          width: 1680,
          height: 34,
          capacity: budget.limit,
          parts: budget.parts.map((row, i) => ({
            id: row.label,
            label: row.label,
            value: i < shown ? row.tokens : 0,
          })),
        });
        api.rect(ctx, 120, 955, 1680, 34, themeColors.panel, themeColors.muted, 0);
        allocation.parts.forEach((part, i) => {
          if (part.value > 0)
            api.rect(
              ctx,
              part.bounds.x,
              part.bounds.y,
              part.bounds.width,
              part.bounds.height,
              colors[i],
              undefined,
              0,
            );
          if (i < shown)
            drawText(
              ctx,
              api,
              budget.parts[i].label + ' ' + part.value,
              120 + i * 340,
              1030,
              24,
              colors[i],
            );
        });
        drawText(
          ctx,
          api,
          'Counted ' +
            counted +
            ' / ' +
            budget.limit +
            ' prompt tokens · ' +
            budget.reservedOutput +
            ' reserved output',
          960,
          885,
          28,
          themeColors.cyan,
          'center',
        );
      });
    }
  }
}
export default {
  id: 'child-to-parent',
  draw: drawChildToParent,
  cues: [
    'child-match',
    'parent-condition',
    'resolve-parent',
    'check-parent',
    'pack-sections',
    'deduplicate',
    'count-complete-request',
  ],
};
