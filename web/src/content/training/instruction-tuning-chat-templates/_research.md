---
query: "We are creating a research-backed page for the following: \"Instruction Tuning & Chat Templates\". Suggest a useful structure and the content that must be present and is relevant.\n\nPage type: curriculum article\nCurriculum section: training\nCurrent page scope: Teach a base language model to answer as an assistant: curate grounded SFT rows, serialize chat turns exactly, choose loss targets, pack safely, and detect serving-time template drift.\nResearch refresh ID: 2026-07-15-soft-v1\n\nThis is a curriculum article. Prefer teaching order, mechanisms, worked examples, and mastery outcomes when useful, but do not force a stock lesson template.\n\nPublished LeetLLM pages do not use one fixed H2 template. `_research.md` is editorial context only: humans and agents use it while writing or updating `content.md`. It is not rendered on the site. Adapt the outline to this topic.\n\nSuggested coverage to include when relevant:\n- teaching or narrative order and prerequisites\n- core concepts, mechanisms, equations, implementation details, and tradeoffs\n- current tools, model versions, APIs, benchmarks, prices, policies, or standards when relevant\n- concrete examples, labs, analogies, diagrams, tables, and practice ideas\n- common mistakes, misconceptions, failure modes, and expected reader outcomes\n- claims that may already be stale, disputed, or incomplete\n- primary-source URLs that verify the important claims\n\nGuidance, not rigid requirements:\n- Use clear Markdown headings. Rename, merge, split, or omit suggested themes when the topic calls for it.\n- Prefer concise bullets and short sections over long essays.\n- Attach exact dates and direct URLs to volatile claims such as versions, prices, benchmarks, policies, and current product capabilities.\n- Prefer primary sources, official docs, standards, and original papers.\n- Every source mention must include a full `https://...` URL in the same bullet or row. Never write `(Source: Vendor)`, `(Sources: Vendor + 1)`, footnote-style markers, or other opaque citations without the link.\n- Separate stable foundations from facts that need periodic reverification.\n- State uncertainty and source disagreement directly.\n\nResearch the current state of this topic instead of relying only on general memory. Do not invent citations, metrics, product details, release information, or future products. Omit any specific claim you cannot support with a direct source URL.\n\nQuality correction attempt 2: previous response failed validation:\n- research body has 2 direct URLs; minimum is 3\n\nReplace it with a complete research packet. Keep useful Markdown structure, include at least 3 direct primary-source URLs, and avoid opaque source labels without links."
model: "Pro"
task_id: "7085a4b2bc69c2a21a19aef77dfbfab7"
status: "completed"
---

Here is a structured curriculum research packet for "Instruction Tuning & Chat Templates." It follows a logical teaching progression from data preparation to training mechanics, ending with serving-time pitfalls.

## Prerequisites & Teaching Order

Before starting this module, learners should understand:

- **Base vs. Instruct Models:** How next-token prediction over raw text corpora differs from supervised instruction following.
- **Tokenization Basics:** How text strings are converted into integer IDs and back.
- **Cross-Entropy Loss:** The standard objective for causal language modeling.

## 1. Curating Grounded SFT Rows

The foundation of a chat model is its Supervised Fine-Tuning (SFT) dataset. Base models require explicit demonstrations of "role-play" to act as helpful assistants.

- **Structure:** Data must be modeled as discrete conversation turns, strictly categorized by roles (typically `system`, `user`, and `assistant`).
- **Quality over Quantity:** A few thousand highly curated, human-verified examples teach the *format* and *tone* better than millions of low-quality scraped web interactions.
- **Grounding:** To prevent hallucination, responses must be perfectly grounded in the user's prompt or the system context. Including examples where the assistant correctly refuses to answer or states "I don't know" is critical for boundary setting.

## 2. Serializing Chat Turns Exactly (Chat Templates)

Base models do not natively understand "roles." They only see linear sequences of tokens. Chat templates serialize structured JSON conversations into a single text string using special boundary tokens.

- **The Mechanism:** Hugging Face uses Jinja2 templates stored in the tokenizer's `chat_template` attribute to guarantee formatting consistency. Review the official guide at `[https://huggingface.co/docs/transformers/chat_templating_writing](https://huggingface.co/docs/transformers/chat_templating_writing)`.
- **Special Tokens:** Templates inject structural markers (e.g., `<|im_start|>user\n`, `<|im_end|>`) so the model learns when a user stops talking and when it should begin generating.
- **Implementation Example:**

```django
{% for message in messages %}
{{'<|im_start|>' + message['role'] + '\n' + message['content'] + '<|im_end|>\n'}}
{% endfor %}
```
- **Common Mistake:** Leaving trailing whitespace in Jinja templates can severely degrade performance, as the model was not trained to predict spaces before start tokens.

## 3. Choosing Loss Targets (Masking)

In standard language modeling, loss is calculated on every token. In instruction tuning, we only want the model to learn how to *respond*, not how to predict the user's prompt.

- **Completion-Only Loss:** We mask out the `user` and `system` tokens by setting their PyTorch labels to `-100` (the default ignore index in `CrossEntropyLoss`).
- **Tooling:** Hugging Face's TRL library supports this natively. Setting `assistant_only_loss=True` in the `SFTTrainer` restricts the loss calculation to the assistant's responses (`[https://huggingface.co/docs/trl/sft_trainer](https://huggingface.co/docs/trl/sft_trainer)`).
- **Template Requirements:** To use `assistant_only_loss=True`, your Jinja chat template must wrap assistant responses in `{% generation %}` and `{% endgeneration %}` markers so the trainer knows exactly which tokens to unmask (`[https://huggingface.co/docs/trl/sft_trainer](https://huggingface.co/docs/trl/sft_trainer)`).

## 4. Packing Safely for Training Efficiency

SFT examples vary wildly in length. Padding short examples to the maximum context window wastes massive amounts of compute.

- **Sequence Packing:** Multiple short conversations are concatenated ("packed") into a single sequence up to `max_seq_length`. This is enabled via `packing=True` in TRL's `SFTTrainer` (`[https://huggingface.co/docs/trl/v0.9.4/sft_trainer](https://huggingface.co/docs/trl/v0.9.4/sft_trainer)`).
- **The Cross-Contamination Risk:** If packing is handled naively, the model might attend to tokens from a completely unrelated conversation packed into the same sequence.
- **Safe Implementation:** Advanced implementations use **block diagonal attention masks** to ensure that self-attention only occurs within the boundaries of a single document, even when multiple documents share the same batch sequence.

## 5. Detecting Serving-Time Template Drift

"Template drift" occurs when the prompt formatting used during inference differs slightly from the exact Jinja template used during training. This is a leading cause of silent performance degradation in production.

- **The Impact:** Recent research highlights that applying chat templates fundamentally shifts how a model allocates attention. A NeurIPS 2025 paper (`[https://neurips.cc/virtual/2025/poster/119708](https://neurips.cc/virtual/2025/poster/119708)`) demonstrated that applying chat templates can actually decrease context awareness (e.g., in Needle-in-a-Haystack tests) compared to base models. The template forces the model to heavily weight "assistant" role tokens at the expense of "user" input tokens.
- **Symptoms of Drift:** If an inference server forgets an `<|im_end|>` token or adds a stray newline, the model may hallucinate, begin generating the user's next turn, or fail to stop generating.
- **Mastery Outcome:** Practitioners must strictly enforce that the exact tokenizer configuration (and its embedded Jinja template) travels with the model weights to the inference engine (e.g., vLLM or TGI) to prevent mismatch.
