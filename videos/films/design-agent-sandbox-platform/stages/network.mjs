import { clamp, networkTrace } from '../arithmetic.mjs';
import { sampleModel } from '../model.mjs';
import { drawLegacyCard, drawLegacyText } from '../defaults.mjs';
export function drawNetwork(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('network', state),
    currentBeat = modelState.step;
  {
    const n = networkTrace(currentBeat, state.beatP ?? 0),
      seconds = n.seconds;
    const send = (source, target, p, color = themeColors.cyan) =>
      teaching.transfer({
        source: {
          shape: source,
          opacity: 1,
        },
        target: {
          shape: target,
          opacity: 1,
        },
        progress: clamp(p),
        color,
        particle: false,
      });
    if (currentBeat === 0) {
      api.focus.target('network-guest-host-control-vsock', () =>
        drawLegacyCard(
          ctx,
          api,
          'Guest ↔ host control · vsock',
          170,
          270,
          1580,
          themeColors.muted,
          85,
          30,
        ),
      );
      if (seconds >= 6.14) {
        const guest = drawLegacyCard(
          ctx,
          api,
          n.request + ' · connect attempt ' + n.attempt + '\napi.vendor.test',
          170,
          450,
          420,
          themeColors.blue,
          150,
          29,
        );
        const dns = api.focus.target('network-dns-answer', () =>
          drawLegacyCard(
            ctx,
            api,
            n.resolved
              ? 'Fixture DNS answer\n' +
                  (n.rebound ? '10.0.0.7 · private' : '93.184.216.34 · public')
              : 'DNS resolution pending',
            760,
            450,
            530,
            n.rebound ? themeColors.pink : n.resolved ? themeColors.cyan : themeColors.muted,
            150,
            29,
          ),
        );
        const gate = api.focus.target('network-address-policy', () =>
          drawLegacyCard(
            ctx,
            api,
            n.checked
              ? n.rebound
                ? 'Address policy\nBLOCK private target'
                : 'Address policy\nALLOW public target'
              : 'Trusted egress policy\naddress check pending',
            1450,
            450,
            350,
            n.checked ? (n.rebound ? themeColors.pink : themeColors.green) : themeColors.muted,
            150,
            28,
          ),
        );
        if (n.resolved) {
          send(guest, dns, 1);
          send(
            dns,
            gate,
            clamp((seconds - (n.rebound ? 22.6 : 15.6)) / 0.8),
            n.rebound ? themeColors.pink : themeColors.cyan,
          );
        }
        if (state.cues)
          api.focus.reveal('network-denied-addresses', () =>
            api.focus.target('network-denied-destinations', () =>
              drawLegacyCard(
                ctx,
                api,
                '169.254.169.254 metadata: BLOCK\n10.0.0.7 private subnet: BLOCK',
                170,
                745,
                780,
                themeColors.pink,
                190,
                28,
              ),
            ),
          );
        else if (seconds >= 12.32)
          drawLegacyCard(
            ctx,
            api,
            '169.254.169.254 metadata: BLOCK\n10.0.0.7 private subnet: BLOCK',
            170,
            745,
            780,
            themeColors.pink,
            190,
            28,
          );
        const connect = drawLegacyCard(
          ctx,
          api,
          n.rebound
            ? 'Attempt 2 blocked before connect\nPrior public connection stays pinned'
            : n.connected
              ? 'J4/R1 · attempt 1 connected\nPinned to approved public address'
              : 'Public connection pending',
          1120,
          745,
          680,
          n.rebound ? themeColors.pink : n.connected ? themeColors.green : themeColors.muted,
          190,
          28,
        );
        if (n.connected) send(gate, connect, 1, themeColors.green);
        drawLegacyText(
          ctx,
          api,
          n.rebound
            ? 'Same allowed name · changed address · fresh policy check blocks the new attempt'
            : seconds >= 19.86
              ? 'Re-resolve the same allowed name for the next connection'
              : 'Internet requests cross a separate trusted boundary',
          960,
          1010,
          28,
          n.rebound ? themeColors.pink : themeColors.muted,
          'center',
        );
      }
    } else {
      const guest = drawLegacyCard(
        ctx,
        api,
        n.request +
          ' · GET /summarize\n' +
          (n.opaque ? 'Opaque reference cap-J4' : 'Requesting scoped reference'),
        170,
        350,
        600,
        n.opaque ? themeColors.blue : themeColors.muted,
        150,
        29,
      );
      const vault = api.focus.target('network-credential-broker-secret-stays-outside-guest', () =>
        drawLegacyCard(
          ctx,
          api,
          'Credential broker\nSecret stays outside guest',
          1100,
          270,
          700,
          themeColors.yellow,
          150,
          29,
        ),
      );
      if (n.opaque) send(vault, guest, clamp((seconds - 1.24) / 1.8), themeColors.yellow);
      const scope = drawLegacyCard(
        ctx,
        api,
        n.scoped
          ? 'cap-J4 scope verified\nJ4 · api.vendor.test · GET /summarize'
          : 'cap-J4 scope check\njob + destination + method + operation',
        170,
        620,
        760,
        n.scoped ? themeColors.green : themeColors.muted,
        150,
        28,
      );
      if (seconds >= 8.72)
        send(
          guest,
          scope,
          clamp((seconds - 8.72) / 3.98),
          n.scoped ? themeColors.green : themeColors.cyan,
        );
      const proxy = api.focus.target(
        'network-n-injected-n-request-public-connection-injects-scoped-credential-tru',
        () =>
          drawLegacyCard(
            ctx,
            api,
            n.injected
              ? n.request + ' · public connection\nProxy injects scoped credential'
              : 'Trusted proxy · public target approved\nCredential injection pending',
            1120,
            620,
            680,
            n.injected ? themeColors.green : themeColors.cyan,
            150,
            28,
          ),
      );
      if (n.scoped) send(scope, proxy, clamp((seconds - 13.13) / 2.67), themeColors.green);
      if (seconds >= 13.13) {
        send(vault, proxy, clamp((seconds - 13.13) / 2.67), themeColors.yellow);
        drawLegacyText(
          ctx,
          api,
          n.injected
            ? 'Authenticated operation runs outside the guest'
            : 'Scoped credential is released only to the approved proxy connection',
          960,
          855,
          29,
          n.injected ? themeColors.green : themeColors.yellow,
          'center',
        );
      }
      if (seconds >= 16.45) {
        [
          'Output + network volume bounded',
          'Time + retries bounded',
          n.audited ? 'Restricted audit: J4/R2 recorded' : 'Restricted audit pending',
        ].forEach((label, i) =>
          drawLegacyCard(
            ctx,
            api,
            label,
            170 + i * 560,
            940,
            500,
            i === 2 && n.audited ? themeColors.green : themeColors.muted,
            65,
            25,
          ),
        );
      }
    }
  }
}

// These supplied ownership and byte models are local illustrations, not a VMM or host-security test.
export default {
  id: 'network',
  draw: drawNetwork,
  cues: [
    'network-beat-1-focus-1',
    'network-beat-1-focus-2',
    'network-denied-addresses',
    'network-resolved-address',
    'network-beat-2-focus-1',
    'network-beat-2-focus-2',
  ],
};
