import { cueComplete, cueProgress } from '../construction.mjs';
import { drawReportBoard } from '../report-board.mjs';

export default {
  id: 'paths',
  cues: ['walk-cache', 'walk-link', 'walk-parent', 'walk-report', 'walk-verdict'],
  draw(ctx, scene, state, api) {
    const position =
      cueProgress(state, 'walk-cache', 0, 0.02, 0.31) +
      cueProgress(state, 'walk-link', 0, 0.45, 0.85) +
      cueProgress(state, 'walk-parent', 1, 0.02, 0.37) +
      cueProgress(state, 'walk-report', 1, 0.57, 0.87);
    const verdict = cueComplete(state, 'walk-verdict', 2, 0.4);
    const activeComponent =
      position <= 2 && state.beat === 0
        ? 'cache'
        : position <= 3 && state.beat === 1
          ? 'parent'
          : 'report';
    const footer = [
      'cache    Enter the directory or follow its link.',
      position > 3
        ? 'Open report.txt in the directory you reached.'
        : '..    Move up from the directory you reached.',
      verdict
        ? 'The final file determines whether the write fits the grant.'
        : 'Which file falls inside the blue write grant?',
    ][state.beat];
    drawReportBoard(ctx, api, { showLink: true, position, activeComponent, verdict, footer });
  },
};
