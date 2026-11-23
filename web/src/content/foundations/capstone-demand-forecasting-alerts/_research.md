---
query: "We are creating a research-backed page for the following: \"Capstone: Demand Forecasting\". Suggest a useful structure and the content that must be present and is relevant.\n\nPage type: curriculum article\nCurriculum section: foundations\nCurrent page scope: Ship a demand forecast and capacity-alert artifact with rolling backtests, alert review, and retraining policy.\nResearch refresh ID: 2026-08-13\n\nThis is a curriculum article. Prefer teaching order, mechanisms, worked examples, and mastery outcomes when useful, but do not force a stock lesson template.\n\nPublished LeetLLM pages do not use one fixed H2 template. `_research.md` is editorial context only: humans and agents use it while writing or updating `content.md`. It is not rendered on the site. Adapt the outline to this topic.\n\nSuggested coverage to include when relevant:\n- teaching or narrative order and prerequisites\n- core concepts, mechanisms, equations, implementation details, and tradeoffs\n- current tools, model versions, APIs, benchmarks, prices, policies, or standards when relevant\n- concrete examples, labs, analogies, diagrams, tables, and practice ideas\n- common mistakes, misconceptions, failure modes, and expected reader outcomes\n- claims that may already be stale, disputed, or incomplete\n- primary-source URLs that verify the important claims\n\nGuidance, not rigid requirements:\n- Use clear Markdown headings. Rename, merge, split, or omit suggested themes when the topic calls for it.\n- Prefer concise bullets and short sections over long essays.\n- Attach exact dates and direct URLs to volatile claims such as versions, prices, benchmarks, policies, and current product capabilities.\n- Prefer primary sources, official docs, standards, and original papers.\n- Every source mention must include a full `https://...` URL in the same bullet or row. Prefer plain Markdown links like `[label](https://...)`. Avoid `(Source: Vendor)` wrappers, even when a link is present, and never use footnote-style or opaque citations without the URL.\n- Link directly to the source page. Never use search-result or search-redirect URLs.\n- Do not embed external images, image-search thumbnails, data URLs, or inline SVG. Describe useful visual ideas in text instead.\n- Separate stable foundations from facts that need periodic reverification.\n- State uncertainty and source disagreement directly.\n\nResearch the current state of this topic instead of relying only on general memory. Do not invent citations, metrics, product details, release information, or future products. Omit any specific claim you cannot support with a direct source URL."
model: "Pro"
task_id: "683088212e0e23a13d7bb70396d751ea"
status: "completed"
---

Here is a proposed curriculum structure and content guide for a Capstone on Demand Forecasting, emphasizing production readiness over pure theoretical modeling.

## 1. Capstone Scope & Narrative Order

This capstone bridges the gap between standard time-series modeling and operational machine learning. Students must transition from predicting "next day demand" in a vacuum to building a decision-centric artifact that answers: *What do we need to do today to avoid a stock-out over our lead time?* [Intuendi](https://intuendi.com/resource-center/machine-learning-in-demand-forecasting/).

**Recommended teaching sequence:**

1. **Baselines & Backtesting:** Establishing robust temporal cross-validation.
2. **Feature Engineering:** Engineering lags, rolling windows, and external regressors.
3. **Model Selection & Training:** Evaluating speed vs. accuracy tradeoffs.
4. **Business Logic Integration:** Translating raw forecasts into capacity alerts.
5. **Lifecycle Management:** Defining a continuous monitoring and retraining policy.

## 2. Core Concepts & Implementation

- **Rolling Backtests (Walk-Forward Validation):** Traditional cross-validation fails on time series due to temporal dependencies. Students must implement walk-forward validation where the model sequentially updates as new data arrives, mirroring how it will be evaluated in production [MachineLearningMastery](https://machinelearningmastery.com/backtest-machine-learning-models-time-series-forecasting/).
- **Feature Engineering:** Because models like LightGBM do not model time natively, students must explicitly engineer features: lag variables (past values), rolling statistics (moving averages, standard deviations), and date-based features (day of week, promotional flags) [GeeksforGeeks](https://www.geeksforgeeks.org/machine-learning/time-series-using-lightgbm/).
- **Capacity Alerts:** The output artifact must integrate with operational policies. Instead of merely predicting demand, the system orchestrates decisions—triggering an alert if the predicted demand over the next L days (where L is lead time) exceeds current inventory thresholds [Intuendi](https://intuendi.com/resource-center/machine-learning-in-demand-forecasting/).
- **Retraining Policy:** Models inevitably degrade over time as macroeconomic factors or consumer behaviors shift. Students must define a policy specifying when to retrain—such as schedule-based (e.g., weekly) vs. performance-based (e.g., when error exceeds a threshold)—to adapt to volatility [AltexSoft](https://www.altexsoft.com/blog/demand-forecasting-methods-using-machine-learning/).

## 3. Current Tools & Frameworks

The modern forecasting landscape heavily favors high-performance, specialized libraries.

- **The Nixtla Ecosystem:**

- **StatsForecast:** Ideal for robust baseline statistical models (ARIMA, ETS). It is optimized for speed and horizontal scaling across large datasets [Nixtla](https://nixtlaverse.nixtla.io/statsforecast/docs/tutorials/statisticalneuralmethods.html).
- **MLForecast:** Simplifies adapting standard machine learning models (like scikit-learn or LightGBM) to time-series tasks [Nixtla](https://nixtlaverse.nixtla.io/statsforecast/docs/tutorials/statisticalneuralmethods.html).
- **NeuralForecast:** Provides deep learning models (AutoTFT, NBEATS) for capturing highly complex, non-linear dependencies [Nixtla](https://nixtlaverse.nixtla.io/statsforecast/docs/tutorials/statisticalneuralmethods.html).
- **LightGBM vs. Deep Learning Tradeoffs:** LightGBM often strikes the best balance of speed and accuracy for tabular time-series tasks with extensive external features [GeeksforGeeks](https://www.geeksforgeeks.org/machine-learning/time-series-using-lightgbm/). While deep learning models like NeuralProphet can occasionally achieve slightly higher accuracy, they are significantly slower to train (e.g., ~45 seconds vs. ~4 seconds for LightGBM on benchmark datasets), and their hyperparameter optimization can be computationally prohibitive [Quantiphi](https://medium.com/@datalab_70093/from-data-to-dollars-a-deep-dive-in-time-series-forecasting-v-b7f0d2ec9b50). Furthermore, independent experiments suggest NeuralProphet can sometimes be outperformed by classical ETS models in both accuracy and computation time [GitHub/Nixtla](https://github.com/Nixtla/statsforecast/blob/main/experiments/neuralprophet/README.md).

## 4. System Architecture

> **Key insight:** The capstone succeeds not at the "Model Training" step, but when the student successfully implements the feedback loop that governs retraining and the downstream capacity alert rules.

## 5. Common Pitfalls & Misconceptions

- **Data Leakage:** Shuffling data during the train-test split or using future data in rolling windows. Time series data must strictly respect temporal order [GeeksforGeeks](https://www.geeksforgeeks.org/machine-learning/time-series-using-lightgbm/).
- **Ignoring Lead Times:** Forecasting just the "next day" when the business requires multi-week horizons tied to capacity cycles and production constraints [Intuendi](https://intuendi.com/resource-center/machine-learning-in-demand-forecasting/).
- **Over-engineering:** Spending excessive time tuning complex neural networks when a properly feature-engineered LightGBM or simple ETS baseline achieves comparable performance at a fraction of the compute cost [Quantiphi](https://medium.com/@datalab_70093/from-data-to-dollars-a-deep-dive-in-time-series-forecasting-v-b7f0d2ec9b50).

## 6. Worked Examples & Practice Ideas

- **Lab 1: Manual Walk-Forward:** Implement a manual rolling backtest loop using a standard scikit-learn regressor before introducing abstraction libraries like `MLForecast`.
- **Artifact Delivery:** Build a Python script that simulates daily batch processing. It should ingest a simulated day of data and output a CSV/JSON containing: `date`, `SKU`, `predicted_demand`, `confidence_interval`, and a boolean `capacity_alert` flag.
- **Simulated Drift & Retraining:** Introduce an artificial shift in the validation dataset (e.g., a simulated viral promotional event) to demonstrate model degradation and force the student's retraining policy to trigger automatically.
