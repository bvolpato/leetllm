import { text } from '../defaults.mjs';
export function drawIntake(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api;
  {
    api.focus.target('intake-field-grid', () =>
      teaching.grid({
        x: 210,
        y: 380,
        width: 1500,
        height: 380,
        rows: 4,
        columns: 4,
        cellFocusTarget: (row) => (row >= 2 ? 'intake-rejected-rows' : undefined),
        labels: [
          ['Ticket', 'Bundle', 'Route', 'Planner steps'],
          ['r-104', 'Current', 'Routine', '4 permitted'],
          ['r-105', 'Current', 'Urgent', '0'],
          ['r-106', 'Stale', 'Routine', '0'],
        ],
        fontSize: 30,
        padding: 13,
        fill: themeColors.panel,
        stroke: themeColors.muted,
        textColor: themeColors.ink,
        highlights: [
          {
            row: 2,
            column: 3,
            fill: themeColors.panel,
            stroke: themeColors.pink,
          },
          {
            row: 3,
            column: 3,
            fill: themeColors.panel,
            stroke: themeColors.pink,
          },
        ],
      }),
    );
    api.focus.target('intake-host-owned-receipt-account-grant-remains-a300', () =>
      text(
        ctx,
        api,
        'Host-owned receipt · account grant remains A300',
        960,
        900,
        34,
        themeColors.yellow,
        'center',
      ),
    );
    api.focus.target('intake-a-caller-provided-matching-string-does-not-authenticate-t', () =>
      text(
        ctx,
        api,
        'A caller-provided matching string does not authenticate the producer',
        960,
        990,
        28,
        themeColors.muted,
        'center',
      ),
    );
  }
}
export default {
  id: 'intake',
  draw: drawIntake,
  cues: ['trusted-intake', 'bound-principal', 'preplanning-stops', 'account-grant'],
};
