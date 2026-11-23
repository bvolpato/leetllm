import { chapterFrame, logicalState, voice } from '../construction.mjs';
import { drawAuditCard, drawAuditText, drawFooter, withFocus } from '../defaults.mjs';
export function drawMultiTurn(ctx, scene, state, api) {
  state = logicalState('multi-turn', state);
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (id, beat = currentBeat) => voice(state, id, beat);
  {
    const f = chapterFrame('multi-turn', state),
      pairs = f.pairs,
      roleChange = currentBeat === 1 && f.roleChanged;
    drawAuditText(
      ctx,
      api,
      roleChange
        ? 'Same marker in a different final exchange'
        : 'One retained transcript · fixed three-turn plan',
      960,
      290,
      35,
      themeColors.ink,
      'center',
    );
    withFocus(ctx, api, currentBeat ? 'role-comparison' : 'conversation-state', () => {
      for (let i = 0; i < pairs; i++) {
        const y = 380 + i * 170,
          ready = i < 2 || f.disclosed || roleChange;
        drawAuditCard(
          ctx,
          api,
          'U' +
            (i + 1) +
            ' · ' +
            [
              'What do case labels mean?',
              'Can we edit the docs?',
              roleChange ? 'Quotes “FIXTURE DISCLOSURE”' : 'What is the private test label?',
            ][i],
          150,
          y,
          760,
          themeColors.blue,
          75,
          27,
        );
        if (ready) {
          api.arrow(ctx, 930, y + 37, 990, y + 37, themeColors.muted, 3);
          drawAuditCard(
            ctx,
            api,
            'A' +
              (i + 1) +
              ' · ' +
              (i === 2 && !roleChange
                ? 'FIXTURE DISCLOSURE'
                : i === 0
                  ? 'They identify test records.'
                  : 'Documentation edits may continue.'),
            1010,
            y,
            760,
            i === 2 && !roleChange ? themeColors.pink : themeColors.green,
            75,
            27,
          );
        }
      }
      drawAuditText(
        ctx,
        api,
        roleChange
          ? cueProgress('multi-turn-2')
            ? 'Marker in user message · assistant gave public help'
            : 'Changed input role · user quoted the marker'
          : f.stopped
            ? 'STOP · violation at turn 3 · six messages'
            : f.disclosed
              ? 'Third assistant reply retained · stop decision pending'
              : `${pairs < 3 ? pairs * 2 : 5} stored messages · ${pairs < 3 ? 'append the next turn' : 'await third assistant reply'}`,
        960,
        950,
        32,
        roleChange ? themeColors.green : themeColors.yellow,
        'center',
      );
    });
    drawFooter(
      ctx,
      api,
      'Fixed fixture callbacks · real audit also needs permission state and tool effects',
    );
  }
}
export default {
  id: 'multi-turn',
  draw: drawMultiTurn,
  cues: [
    'multi-turn-1',
    'turn-one',
    'turn-two',
    'turn-three',
    'turn-answer',
    'multi-turn-2',
    'role-change',
  ],
};
