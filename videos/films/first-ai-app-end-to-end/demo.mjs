import { request } from './fixtures.mjs';
import { createApp } from './model.mjs';
import { validateModel } from './validation.mjs';
export function runDemo() {
  validateModel();
  const app = createApp();
  const reply = app.check(request);
  const trace = app.store.get(reply.body.trace_id);
  console.log(
    JSON.stringify(
      {
        scope: 'local in-memory model; fixture provider; no external calls',
        reply,
        trace,
        providerCalls: app.providerCalls,
      },
      null,
      2,
    ),
  );
}
