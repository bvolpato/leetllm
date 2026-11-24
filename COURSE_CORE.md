# Course Core

The LeetLLM core path teaches students to understand, build, and explain AI and ML systems from first principles. Each chapter gives the reader something concrete to reason about: a small hand calculation, a visual intuition, a working program, or a real model run. Use this document alongside [CONTENT_GUIDELINES.md](./CONTENT_GUIDELINES.md) (including the 10 Teaching NONOs) as the engineering standard for foundation, machine learning, and lab chapters.

## Core Skill Bar

- Build implementation fluency through genuine, runnable numerical and systems exercises rather than passive summaries or mock dictionaries.
- Explain stateful systems using concrete events, queues, caches, and invariants.
- Teach Transformer mechanics from scratch before relying on high-level library abstractions.
- Teach the core mechanism cleanly first, then introduce numerical stability when it changes the calculation or explains a failure the reader is ready to diagnose.
- Include backpropagation reasoning across neural network, optimization, and training-loop chapters.
- Cover production predictive ML through feature pipelines, boosted models, ranking, forecasting, vision triage, monitoring, and controlled retraining.
- Cover accelerator and distributed inference systems through hardware execution, kernel measurement, batching, serving data planes, scaling, and failure modes.
- Use hybrid evaluation combining unit tests, dataset metrics, human review, and production checks, including `pass@k` for code generation and agent tasks.
- Connect research foundations to runnable evidence for Bayesian uncertainty, posterior sampling, generalization assumptions, causal identification, conformal coverage, latent-variable fitting, and training-data privacy.

## Library Stack

- **NumPy:** tensor shapes, broadcasting, vectorization, simulations, linear algebra, and from-scratch algorithms.
- **PyTorch:** tensors, autograd, modules, GPU execution, training loops, mixed precision, and model serving.
- **SciPy:** optimization, numerical integration, statistical distributions, hypothesis tests, and sparse linear algebra where helpful.
- **pytest:** regression tests, edge cases, test fixtures, and failure reproduction.
- **pandas:** tabular cleanup, joins, grouping, feature inspection, and evaluation reports.
- **scikit-learn:** baselines, preprocessing, metrics, cross-validation, logistic regression, k-means, and PCA/SVD.
- **Hugging Face:** tokenizers, datasets, model loading, fine-tuning, and evaluation workflows.
- **FastAPI:** API endpoints, request validation, health checks, streaming, and deployment exercises.
- **Docker:** reproducible environments, local services, production parity, and deployment artifacts.

Keep PyTorch as the primary training framework, introducing JAX only after PyTorch foundations to build research-code literacy. Avoid making proprietary wrapper SDKs part of the core path, and keep timeless concepts free of ephemeral package changelogs.

## Algorithm and Statistics Coverage

- Gradient descent and backpropagation for training intuition and numerical optimization.
- Logistic regression, linear regression from scratch, decision trees, random forests, gradient boosting, ranking, forecasting, k-means, PCA/SVD, HNSW, and beam search.
- Bayes' rule, confidence intervals, bootstrap resampling, `pass@k`, Monte Carlo sampling, and uncertainty reporting.
- Bayesian updating, Markov chain Monte Carlo, Metropolis-Hastings sampling, finite-sample learning guarantees, conformal prediction, latent-variable models, causal identification, and differentially private training.

## Lab Standard

Every core lesson must meet these engineering rules:

- **From-scratch mechanism first, then production library:** Build the mechanism directly in NumPy or PyTorch tensors when it illuminates the math, then compare with the idiomatic library API (`torch.nn`, `scikit-learn`, `scipy`).
- **Compute the real payoff in the flow:** Scalar arithmetic, small simulations, and numerical libraries are all welcome when they genuinely compute the behavior being taught. Show legible outputs directly in the flow instead of hiding results inside `<details>` or rigging random weights and hardcoded answers to fake learning.
- **Clean pedagogical Python:** Omit defensive type-police boilerplate (`isinstance(..., bool)`, `type(x) not in (int, float)`, or repetitive `math.isfinite` walls) unless schema validation, data quality, or numerical-stability guards are literally the topic.
- **Domain-native examples:** Ground code and math in the natural objects of the subject: token sequences for NLP and attention, image tensors for computer vision, gridworlds and MDPs for reinforcement learning, matrices and probability distributions for math and statistics, and tiles, warps, and HBM transfers for GPU kernels. Never shoehorn unrelated SRE, billing, or IAM ticket roleplay into ML, math, or systems labs.
- **Focused scope:** Teach one clean mechanism thoroughly per core lab. Move optional proofs, niche edge cases, or tangential framework details into a collapsible `<details>` Deep Dive or a later lesson instead of bloating core chapters.
- **Useful practice and transfer:** Let the learner change an input, trace the consequence, and compare it with an explained answer. Pair labs with a focused failure case placed after the core mechanism works.

## Minimum Required Chapter Coverage

- Python for AI Engineering
- NumPy and Tensor Shapes
- Data Structures for AI Systems
- Probability for Machine Learning
- Bayesian Inference from Evidence
- Statistics, Estimation, and Uncertainty
- Distributions, Sampling, and Simulation
- Linear Regression from Scratch
- Cross-Validation, Leakage, and Generalization
- Statistical Learning and Generalization
- Conformal Prediction and Uncertainty
- Clustering, PCA, and Representation Learning
- Probabilistic Generative Models
- Core Retrieval Algorithms
- Decoding Algorithms
- Experiment Design and A/B Testing Foundations
- Causal Inference and Counterfactuals
- PyTorch Training Loops
- Dataset Pipelines and Data Quality
- Privacy-Preserving Machine Learning
- Feature Engineering for Production ML
- Batch and Streaming Feature Pipelines
- Gradient Boosted Trees in Production
- Ranking and Recommendation Systems
- Forecasting and Anomaly Detection
- Monitoring Predictive Models
- Ship a Delivery ETA Prediction Service
- Ship a Product Ranking System
- Ship Demand Forecasting and Alerts
- Ship a Damaged-Package Vision Classifier
- Ship a Production ML Pipeline
- Ship a Document QA Product
- Ship an Evaluation Dashboard
- Ship a Fine-Tuned Classifier
- Ship a Production LLM Agent
- Accelerator Architecture Field Guide
- GPU Profiling, Correctness, and Benchmarking
- GPU Kernel Performance Engineering Lab
- GPU Parallel Primitives Lab
- GPU Compilers and Kernel Languages
- GEMM From Naive CUDA to Tensor Cores
- Low-Precision GPU Programming
- GPU Runtime Execution Lab
- AI-Generated Kernel Engineering
- GPU Failure Operations
- Distributed Inference Data Plane
- Serving Benchmark Engineering
