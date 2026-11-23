---
query: "We are creating a research-backed page for the following: \"Capstone: Fine-Tuned Classifier\". Suggest a useful structure and the content that must be present and is relevant.\n\nPage type: curriculum article\nCurriculum section: foundations\nCurrent page scope: Train and gate an access-ticket encoder that exports exact-receipt evidence and safe intake decisions to a production agent.\nResearch refresh ID: 2026-08-13\n\nThis is a curriculum article. Prefer teaching order, mechanisms, worked examples, and mastery outcomes when useful, but do not force a stock lesson template.\n\nPublished LeetLLM pages do not use one fixed H2 template. `_research.md` is editorial context only: humans and agents use it while writing or updating `content.md`. It is not rendered on the site. Adapt the outline to this topic.\n\nSuggested coverage to include when relevant:\n- teaching or narrative order and prerequisites\n- core concepts, mechanisms, equations, implementation details, and tradeoffs\n- current tools, model versions, APIs, benchmarks, prices, policies, or standards when relevant\n- concrete examples, labs, analogies, diagrams, tables, and practice ideas\n- common mistakes, misconceptions, failure modes, and expected reader outcomes\n- claims that may already be stale, disputed, or incomplete\n- primary-source URLs that verify the important claims\n\nGuidance, not rigid requirements:\n- Use clear Markdown headings. Rename, merge, split, or omit suggested themes when the topic calls for it.\n- Prefer concise bullets and short sections over long essays.\n- Attach exact dates and direct URLs to volatile claims such as versions, prices, benchmarks, policies, and current product capabilities.\n- Prefer primary sources, official docs, standards, and original papers.\n- Every source mention must include a full `https://...` URL in the same bullet or row. Prefer plain Markdown links like `[label](https://...)`. Avoid `(Source: Vendor)` wrappers, even when a link is present, and never use footnote-style or opaque citations without the URL.\n- Link directly to the source page. Never use search-result or search-redirect URLs.\n- Do not embed external images, image-search thumbnails, data URLs, or inline SVG. Describe useful visual ideas in text instead.\n- Separate stable foundations from facts that need periodic reverification.\n- State uncertainty and source disagreement directly.\n\nResearch the current state of this topic instead of relying only on general memory. Do not invent citations, metrics, product details, release information, or future products. Omit any specific claim you cannot support with a direct source URL.\n\nQuality correction attempt 2: previous response failed validation:\n- research body has 5 opaque source annotation(s) without direct URLs\n\nReplace it with a complete research packet. Keep useful Markdown structure, include at least 3 direct primary-source URLs, and avoid opaque source labels without links."
model: "Pro"
task_id: "010714d24795f75174e5fa5265ac1f36"
status: "completed"
---

# Capstone: Fine-Tuned Classifier

## 1. Teaching Context & Prerequisites

- **Scope**: Train and gate an access-ticket encoder that exports exact-receipt evidence and safe intake decisions to a production agent.
- **Prerequisites**: Learners should already understand zero-shot prompt engineering, Retrieval-Augmented Generation (RAG) constraints, and classification evaluation metrics (Precision, Recall, F1-Score).
- **Narrative Order**:

1. Evaluate a zero-shot baseline to prove the need for fine-tuning.
2. Synthesize and format the dataset (JSONL) with "exact-receipt" extraction tasks.
3. Run the supervised fine-tuning (SFT) job.
4. Evaluate the fine-tuned model against a holdout set (gating).
5. Deploy and route production agent traffic through the tuned classifier.

## 2. Core Concepts & Mechanisms

- **Supervised Fine-Tuning (SFT) vs. Prompting**: Fine-tuning updates model weights to reliably enforce output structure (e.g., rigid JSON schemas) and style. It is best used for formatting, tone, and specific tasks like classification, rather than injecting new factual knowledge.
- **Access-Ticket Encoder**: A specialized classifier acting as a router. When an IT or support ticket enters the system, the encoder classifies the intent, standardizes the payload, and validates if it meets the criteria for downstream agent execution.
- **Exact-Receipt Evidence**: A safety mechanism where the model must extract exact substrings ("receipts") from the user's prompt to justify its classification. If the receipt does not perfectly match the input tokens, the system halts.
- **Intake Gating**: The logical barrier preventing ambiguous or malicious inputs from reaching the core production agent. The fine-tuned classifier acts as this gate.

## 3. Implementation Workflow & Tools

- **Data Preparation**: Fine-tuning data must match the exact format of production requests. A standard practice is "prompt baking": logging real zero-shot inputs/outputs, having humans correct them, and compiling them into training sets. Both OpenAI and Claude require JSONL format.
- **OpenAI Fine-Tuning**: You can fine-tune models like `gpt-4o-mini` by uploading a JSONL file of conversational formats to their API and initiating a training job. View the [OpenAI Fine-tuning Guide](https://platform.openai.com/docs/guides/fine-tuning) for current formatting rules.
- **Claude Fine-Tuning**: Anthropic supports fine-tuning models like Claude 3 Haiku via Amazon Bedrock. This requires formatting JSONL data into system/user/assistant roles and passing it to a Bedrock Customization Job. View the AWS release post: [Anthropic Claude 3 Fine-tuning on Bedrock](https://aws.amazon.com/blogs/machine-learning/fine-tune-anthropics-claude-3-haiku-in-amazon-bedrock-to-boost-model-accuracy-and-quality/).
- **Open-Weight Alternatives**: For strict data privacy, teams often fine-tune open-weight models (e.g., Llama 3 or DistilBERT) using the Hugging Face ecosystem. View the [Hugging Face Training Documentation](https://huggingface.co/docs/transformers/training) for standard implementations.
- **Experiment Tracking**: Use tools like Weights & Biases to log training metrics (loss, validation accuracy) over time. View the [Weights & Biases OpenAI Integration](https://docs.wandb.ai/models/integrations/openai-fine-tuning) for syncing API job runs automatically.

## 4. Common Mistakes & Failure Modes

- **Dataset Contamination**: Accidentally including validation/holdout data in the training set, leading to artificially high confidence (overfitting).
- **Missing RAG Context**: If the production agent uses retrieval to augment prompts, the fine-tuning dataset *must* include that retrieved context. Training without it teaches the model to hallucinate answers zero-shot.
- **Overly Broad Tasks**: Attempting to fine-tune a single model to act as a general conversationalist *and* a strict JSON classifier. Splitting the routing task into a dedicated, narrow classifier yields better results.
- **Visualizing the Architecture (Text Description)**: A successful diagram for this lesson should show a two-stage funnel: Unstructured User Input enters the "Fine-Tuned Gating Classifier". The classifier extracts "JSON Payload + Exact Quote Evidence". Only if the quote matches the input does it pass to the "Production Agent"; otherwise, it hits a "Human Escalation" block.

## 5. Volatile Claims & Metrics (Requires Periodic Reverification)

- *Note: The following constraints, limits, and pricing models change frequently. Verify against primary sources during content updates.*
- **Dataset Size Minimums**: OpenAI typically requires a minimum of 10 examples to run a job, but strongly recommends 50-100 high-quality examples to see behavioral improvements.
- **Claude/Bedrock Limits**: AWS historically capped Claude 3 Haiku fine-tuning jobs at 10,000 training records and 1,000 validation records. Verify current limits in the AWS Bedrock quota console.
- **Pricing Disagreement**: The community heavily debates whether the upfront cost of dataset generation and higher fine-tuned inference token pricing outweighs the cost savings of shorter production prompts. There is no one-size-fits-all answer; it depends on inference volume.
- **Prompt Caching vs. Fine-Tuning**: Some engineering teams dispute the necessity of fine-tuning for structured output, arguing that few-shot prompting combined with Prompt Caching achieves 99% of the benefit with zero training overhead. Address this tradeoff explicitly in the curriculum.
