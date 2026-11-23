import { codeText, focusTarget, imageLayer, line, rectangle } from '../defaults.mjs';

export function drawRuntimeContract(ctx, scene, state, api) {
  const { C } = api;
  const after = (key) => state.cues?.['dk-runtime-contract-' + key]?.phase === 'after';
  focusTarget(ctx, api, 'runtime-contract-construction', () => {
    if (state.beat === 0) {
      codeText(ctx, api, 'What the teammate receives', 148, 291, 40);
      imageLayer(ctx, api, 145, 696, 730, 'Python + OS libraries', C.blue);
      imageLayer(ctx, api, 145, 580, 730, 'Installed packages', C.blue);
      imageLayer(ctx, api, 145, 464, 730, 'Scorer + fixture', C.blue);
      codeText(ctx, api, 'Stored image', 185, 886, 37, C.blue);
      rectangle(ctx, api, 1050, 401, 720, 446, C.panel, C.cyan);
      codeText(ctx, api, 'The run', 1090, 472, 42, C.cyan);
      codeText(ctx, api, 'Input path', 1090, 558, 31, C.muted);
      codeText(ctx, api, '/app/eval', 1090, 621, 40, C.ink, 'left', 'mono');
      if (after('data'))
        codeText(ctx, api, 'A host directory can attach here', 1090, 701, 33, C.cyan);
      if (after('secret')) codeText(ctx, api, 'Credentials needed: 0', 1090, 798, 31, C.muted);
    } else {
      codeText(ctx, api, '$ docker version', 148, 325, 48, C.ink, 'left', 'mono');
      line(ctx, api, 147, 375, 1770, 375, C.muted);
      codeText(ctx, api, 'Client', 150, 496, 43, C.blue);
      codeText(ctx, api, 'CLI in the terminal', 624, 496, 39);
      if (after('server')) {
        codeText(ctx, api, 'Server', 150, 632, 43, C.cyan);
        codeText(ctx, api, 'Docker Engine', 624, 632, 39);
        codeText(ctx, api, 'Engine directly on Linux', 149, 784, 34, C.blue);
        imageLayer(ctx, api, 855, 720, 870, 'Host Linux kernel', C.blue);
        if (after('vm')) {
          codeText(ctx, api, 'Desktop on Linux or Mac', 149, 929, 34, C.cyan);
          imageLayer(ctx, api, 855, 865, 870, 'Linux kernel inside the VM', C.cyan);
        }
      }
    }
  });
}
export default {
  id: 'runtime-contract',
  draw: drawRuntimeContract,
  cues: [
    'dk-runtime-contract-beat0',
    'dk-runtime-contract-data',
    'dk-runtime-contract-secret',
    'dk-runtime-contract-beat1',
    'dk-runtime-contract-server',
    'dk-runtime-contract-vm',
  ],
};
