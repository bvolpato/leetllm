import { fixturePath, rows } from '../fixtures.mjs';
import { cueProgress } from '../construction.mjs';
import { caption, mark, terminal } from '../defaults.mjs';
export function drawShellInspection(ctx, scene, state, api) {
  if ((state.beat ?? 0) === 0) {
    const head = cueProgress(state, 'inspect-head', 0),
      count = cueProgress(state, 'inspect-count', 0, 0.5, 0.8);
    mark(api, 'inspection-terminal', () =>
      terminal(
        ctx,
        api,
        'Same three-row input · Linux shell',
        [
          '$ pwd',
          '/workspace/access-rag',
          '$ head -n 1 ' + fixturePath,
          ...(head === 1 ? [JSON.stringify(rows[0])] : ['row pending']),
          '$ wc -l < ' + fixturePath,
          count === 1 ? '3' : 'count pending',
        ],
        150,
        320,
        1620,
        550,
        {
          size: 25,
          lineHeight: 71,
        },
      ),
    );
    caption(
      ctx,
      api,
      'wc counts newline characters · each of these three objects ends with a newline',
    );
  } else {
    const zero = cueProgress(state, 'grep-empty', 1, 0.1, 0.38),
      missing = cueProgress(state, 'grep-missing', 1, 0.58, 0.86);
    mark(api, 'search-terminal', () =>
      terminal(
        ctx,
        api,
        missing === 1
          ? 'Different path · read failure'
          : missing > 0
            ? 'Different path · read pending'
            : 'Existing fixture · valid zero-match search',
        [
          missing > 0
            ? '$ grep -c \'"denied"\' eval/missing.jsonl'
            : '$ grep -c \'"denied"\' ' + fixturePath,
          ...(missing === 1
            ? ['stderr: grep: eval/missing.jsonl:', 'No such file or directory', 'exit status: 2']
            : missing > 0
              ? ['read pending']
              : zero === 1
                ? ['stdout: 0', 'exit status: 1']
                : ['search pending']),
        ],
        150,
        340,
        1620,
        470,
        {
          color: missing > 0 ? api.C.pink : api.C.yellow,
          size: 37,
          lineHeight: 73,
        },
      ),
    );
    caption(ctx, api, 'No matching line and unavailable input are different observations');
  }
}
export default {
  id: 'shell-inspection',
  draw: drawShellInspection,
  cues: ['inspect-head', 'inspect-count', 'grep-empty', 'grep-missing'],
};
