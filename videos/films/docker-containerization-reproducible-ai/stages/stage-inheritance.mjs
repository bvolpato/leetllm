import { codeText, focusTarget, line, rectangle } from '../defaults.mjs';
import { stageContents } from '../model.mjs';

export function drawStageInheritance(ctx, scene, state, api) {
  const { C } = api;
  const after = (k) => state.cues?.['dk-stage-inheritance-' + k]?.phase === 'after';
  focusTarget(ctx, api, 'stage-inheritance-construction', () => {
    if (state.beat === 0) {
      codeText(ctx, api, 'Builder additions', 147, 317, 35);
      const objects = ['/opt/venv', '/opt/helper.bin', 'TOOL_MODE=review'];
      const options = [
        { name: 'FROM builder', contents: stageContents(true), visible: after('inherit'), x: 779 },
        {
          name: 'FROM python base',
          contents: stageContents(false),
          visible: after('copy'),
          x: 1293,
        },
      ];
      objects.forEach((v, i) =>
        codeText(ctx, api, v, 147, 515 + i * 130, 35, C.ink, 'left', 'mono'),
      );
      for (const { name, contents, visible, x } of options) {
        codeText(ctx, api, name, x, 317, 36, C.blue);
        if (name === 'FROM python base')
          codeText(ctx, api, 'COPY /opt/venv only', x, 387, 28, C.muted, 'left', 'mono');
        const present = [
          contents.files.includes(objects[0]),
          contents.files.includes(objects[1]),
          contents.env.TOOL_MODE === 'review',
        ];
        for (const [i, has] of present.entries()) {
          const y = 515 + i * 130;
          line(ctx, api, x, y + 32, x + 423, y + 32, C.muted);
          codeText(
            ctx,
            api,
            visible ? (has ? 'present' : 'absent') : '·',
            x + 32,
            y,
            34,
            visible && has ? C.cyan : C.muted,
          );
        }
      }
    } else if (state.beat === 1) {
      codeText(ctx, api, 'Postgres driver built against the system library', 144, 319, 40);
      const fixed = after('repair');
      const retried = after('retry');
      rectangle(ctx, api, 145, 435, 724, 247, C.panel, C.blue);
      codeText(ctx, api, 'Python environment · /opt/venv', 177, 512, 37, C.blue);
      codeText(ctx, api, 'psycopg2', 177, 611, 44, C.ink, 'left', 'mono');
      rectangle(ctx, api, 1084, 435, 688, 247, C.panel, fixed ? C.green : C.muted);
      codeText(ctx, api, 'System library · libpq', 1116, 512, 37, C.muted);
      if (after('missing'))
        codeText(
          ctx,
          api,
          fixed ? 'installed in runtime' : 'missing from runtime',
          1116,
          611,
          37,
          fixed ? C.green : C.pink,
        );
      api.arrow(ctx, 898, 566, 1057, 566, fixed ? C.green : C.muted, 4);
      codeText(ctx, api, 'Import check in the runtime', 148, 775, 30, C.muted);
      codeText(ctx, api, '$ python -c "import psycopg2"', 148, 860, 39, C.ink, 'left', 'mono');
      if (after('missing')) {
        let result = 'ImportError · cannot load libpq';
        let color = C.pink;
        if (fixed) {
          result = retried ? 'Checking the import…' : 'Library installed · retry the import';
          color = C.yellow;
        }
        if (after('result')) {
          result = 'Exit 0 · driver loaded';
          color = C.green;
        }
        codeText(ctx, api, result, 177, 940, 37, color);
      }
    } else {
      const rows = [
        ['WORKDIR /app', 'scripts/ resolves under /app', 'workdir'],
        ['COPY --chown=appuser:appuser', 'Copied scorer belongs to appuser', 'owner'],
        ['USER appuser', 'Python runs as appuser', 'user'],
        ['ENTRYPOINT ["python", …]', 'The scorer script is the next argument', 'entry'],
      ];
      rows.forEach(([op, result, cue], i) => {
        const y = 357 + 148 * i;
        codeText(ctx, api, op, 150, y, 33, C.blue, 'left', 'mono');
        line(ctx, api, 148, y + 52, 1770, y + 52, C.muted);
        if (after(cue)) codeText(ctx, api, result, 992, y, 32);
      });
    }
  });
}

export default {
  id: 'stage-inheritance',
  draw: drawStageInheritance,
  cues: [
    'dk-stage-inheritance-beat0',
    'dk-stage-inheritance-copy',
    'dk-stage-inheritance-inherit',
    'dk-stage-inheritance-beat1',
    'dk-stage-inheritance-missing',
    'dk-stage-inheritance-repair',
    'dk-stage-inheritance-retry',
    'dk-stage-inheritance-result',
    'dk-stage-inheritance-beat2',
    'dk-stage-inheritance-workdir',
    'dk-stage-inheritance-owner',
    'dk-stage-inheritance-user',
    'dk-stage-inheritance-entry',
  ],
};
