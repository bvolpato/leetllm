import { fixturePath, rows } from '../fixtures.mjs';
import { cueProgress } from '../construction.mjs';
import { code, mark, terminal, text } from '../defaults.mjs';
export function drawFindFile(ctx, scene, state, api) {
  const status = cueProgress(state, 'untracked-fixture', 0),
    answer = cueProgress(state, 'missing-answer', 0, 0.55, 0.8);
  if ((state.beat ?? 0) === 0) {
    mark(api, 'status-output', () =>
      terminal(
        ctx,
        api,
        'Original checkout',
        [
          '$ git status --short',
          ...(status === 1 ? ['?? ' + fixturePath] : ['status pending']),
          '$ git ls-files eval/',
          ...(answer === 1 ? ['(no tracked paths)'] : ['tracked-file check pending']),
        ],
        150,
        340,
        1620,
        400,
        {
          color: api.C.cyan,
          size: 39,
          lineHeight: 65,
        },
      ),
    );
    mark(api, 'file-membership', () =>
      text(
        ctx,
        api,
        answer === 1
          ? 'Readable locally · absent from the recorded snapshot'
          : 'File membership: ?',
        960,
        855,
        38,
        answer === 1 ? api.C.pink : api.C.yellow,
        'center',
      ),
    );
  } else {
    mark(api, 'jsonl-rows', () =>
      terminal(
        ctx,
        api,
        fixturePath,
        rows.map((row) => JSON.stringify(row)),
        150,
        330,
        1620,
        335,
        {
          color: api.C.cyan,
          size: 25,
          lineHeight: 69,
        },
      ),
    );
    mark(api, 'local-residue', () => {
      text(ctx, api, 'TRACK', 350, 760, 30, api.C.green, 'center');
      text(ctx, api, 'fixture + scorer + setup', 350, 825, 31, api.C.ink, 'center');
      text(ctx, api, 'KEEP LOCAL', 1150, 760, 30, api.C.yellow, 'center');
      code(
        ctx,
        api,
        ['.env    .venv/    model cache/', '.env.example → variable names'],
        820,
        825,
        {
          size: 30,
          lineHeight: 65,
        },
      );
    });
  }
}
export default {
  id: 'find-file',
  draw: drawFindFile,
  cues: ['untracked-fixture', 'missing-answer', 'fixture-rows', 'local-files'],
};
