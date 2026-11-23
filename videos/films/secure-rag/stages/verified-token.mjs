import { drawFooter, drawHeading, drawTag, drawText } from '../defaults.mjs';
export function drawVerifiedToken(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    clamp = (x) => Math.max(0, Math.min(1, x));
  const cue = (name, beat = 0) => {
      const id = 'sr-verified-token-' + name,
        v = state.cues?.[id];
      if (state.cues && !v) throw Error('Missing secure RAG cue ' + id);
      return v
        ? {
            q: v.phase === 'before' ? 0 : v.phase === 'after' ? 1 : v.progress,
            done: v.phase === 'after',
          }
        : {
            q: currentBeat < beat ? 0 : currentBeat > beat ? 1 : clamp((progress - 0.08) / 0.75),
            done: currentBeat > beat || (currentBeat === beat && progress > 0.86),
          };
    },
    Q = (n, i) => cue(n, i).q,
    resultComplete = (n, i) => cue(n, i).done;
  api.focus.target('sr-verified-token-mechanism', () => {
    const forged = resultComplete('headers', 0) || currentBeat > 0;
    drawHeading(ctx, api, 'Protected API identity boundary');
    drawTag(
      ctx,
      api,
      'Caller-supplied headers',
      'tenant=B / role=security',
      170,
      365,
      690,
      forged ? themeColors.pink : themeColors.muted,
    );
    drawTag(
      ctx,
      api,
      'Gateway / API',
      'protected identity channel',
      1050,
      365,
      690,
      themeColors.blue,
    );
    if (forged)
      drawText(ctx, api, 'Caller substitutes removed', 960, 540, 29, themeColors.pink, 'center');
    if (currentBeat === 0 && resultComplete('access', 0)) {
      drawTag(
        ctx,
        api,
        'Accepted credential',
        'API access token',
        170,
        690,
        690,
        themeColors.green,
      );
      drawTag(
        ctx,
        api,
        'Different contract',
        'OIDC ID token → client sign-in',
        1050,
        690,
        690,
        themeColors.yellow,
      );
    }
    if (currentBeat === 1) {
      const fields = [
        'issuer + trusted key',
        'algorithm allow-list',
        'audience + expiry',
        'type + actor / scopes',
      ];
      fields.forEach((v, i) => {
        const q = i < 2 ? Q('keys', 1) : Q('claims', 1);
        if (q > 0)
          drawTag(
            ctx,
            api,
            'validate',
            v,
            170 + (i % 2) * 880,
            650 + Math.floor(i / 2) * 145,
            760,
            themeColors.yellow,
          );
      });
    }
    if (currentBeat === 2) {
      drawTag(ctx, api, 'Credential integrity', 'VALID', 170, 700, 690, themeColors.green);
      drawTag(
        ctx,
        api,
        'Source: security runbook',
        resultComplete('denied', 2) ? 'DENY operations-only reader' : 'document policy pending',
        1050,
        700,
        690,
        themeColors.pink,
      );
    }
    drawFooter(
      ctx,
      api,
      'Opaque tokens need issuer-supported validation. A signature does not establish current document membership.',
    );
  });
}
export default {
  id: 'verified-token',
  draw: drawVerifiedToken,
  cues: [
    'sr-verified-token-0',
    'sr-verified-token-headers',
    'sr-verified-token-access',
    'sr-verified-token-1',
    'sr-verified-token-keys',
    'sr-verified-token-claims',
    'sr-verified-token-2',
    'sr-verified-token-denied',
  ],
};
