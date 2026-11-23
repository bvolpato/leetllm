export function drawMissionEvidence(ctx, scene, state, api) {
  const { C, focus } = api;
  const write = (s, x, y, size, color = C.ink, font = 'sans') =>
    api.text(ctx, s, x, y, size, color, 'left', font);
  focus.target('mission-problem', () => {
    write('Nia’s interview', 125, 280, 33, C.muted);
    write(
      '“I like building systems where we can test who gets access.”',
      125,
      394,
      59,
      C.ink,
      'serif',
    );
  });
  api.line(ctx, 125, 459, 1770, 459, '#555961', 2);
  if (focus.visible('mission-owned'))
    focus.target('mission-evidence', () => {
      write('Her evidence', 125, 549, 33, C.muted);
      write('Nia’s release check', 125, 633, 48, C.cyan, 'serif');
      api.line(ctx, 595, 616, 743, 616, C.cyan, 3);
      write('B17 stayed at 0% after both offline checks failed.', 789, 633, 37);
    });
  if (state.beat === 1)
    focus.target('mission-question', () => {
      write('Her question for the team', 125, 775, 33, C.muted);
      if (focus.visible('mission-evidence-question'))
        write('“Which actions are hardest for you to evaluate?”', 125, 885, 57, C.yellow, 'serif');
      else api.line(ctx, 125, 885, 1280, 885, '#555961', 2);
    });
}
export default {
  id: 'mission-evidence',
  draw: drawMissionEvidence,
  cues: [
    'mission-evidence-problem',
    'mission-owned',
    'mission-evidence-artifact',
    'mission-evidence-question',
  ],
};
