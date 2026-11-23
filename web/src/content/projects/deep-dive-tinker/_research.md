# Research notes: hosted Tinker control plane versus open SDK code

## Product-boundary question

What can a researcher control through `forward_backward`, `optim_step`, `sample`, and `save_state`, and which GPU scheduling, base-model, checkpoint, access, data-processing, and catalog decisions remain inside Thinking Machines Lab's hosted service?

## Direct first-party evidence

- The original announcement explains the hosted post-training product and its user-programmed training loop: https://thinkingmachines.ai/news/announcing-tinker/
- The general-availability announcement is dated historical evidence for capabilities announced at that point, not proof that each old model remains available: https://thinkingmachines.ai/news/tinker-general-availability/
- Current official documentation owns client APIs, supported models, checkpoint semantics, server capabilities, and model-specific limits: https://tinker-docs.thinkingmachines.ai/
- The pinned Python SDK exposes concrete client classes, datums, futures, loss names, chunking, optimizer calls, and checkpoint methods: https://github.com/thinking-machines-lab/tinker/tree/0ce5bf2484891570b59f8d330a2daf793646917e
- The separately pinned cookbook implements SFT/RL environments, reward processing, group advantages, and export recipes: https://github.com/thinking-machines-lab/tinker-cookbook/tree/600b802d09be13e03756bfdc31e8c864fed90e7b
- Thinking Machines Lab's LoRA study establishes the company's actual adapter experiments and their workload limitations: https://thinkingmachines.ai/blog/lora/
- The original LoRA paper supports the frozen-base, low-rank-update mechanism: https://arxiv.org/abs/2106.09685
- The provider's current legal terms are the authority for hosted services, customer data, model terms, and access conditions: https://thinkingmachines.ai/legal/terms/

## Token-level training receipt

For four `clamp` completions with rewards `[1,0,1,0]`, the group mean is `0.5` and centered advantages are `[0.5,-0.5,0.5,-0.5]`. The original sampled token IDs, behavior-policy log probabilities, target-token shift, response mask, reward group, and policy version must remain aligned. A unit test that passes on decoded text doesn't prove the learning target was preserved.

`save_state` is training recovery and may need optimizer state; sampler-ready weight publication is a separate operation. A network future is an acknowledgment or handle, not evidence that an arbitrary side effect is idempotent. A `tinker://` URI is a service-owned artifact identity, not proof of self-hosted storage control.

## Capability and governance caveats

The SDK and cookbook being Apache-2.0 does not license the hosted service, underlying model weights, proprietary infrastructure, uploaded customer data, or third-party datasets. The service performs LoRA adaptation, not general full-parameter training. A pinned SDK commit does not pin remote capacity, API enablement, model availability, provider terms, retention, residency, or service-side model support.

Named model IDs and exact SDK chunk limits are volatile or commit-specific. Query documented server capabilities before claiming a model is supported. Company-managed public repositories and a hosted service are not equivalent to an independently governed, self-hostable distributed trainer.
