---
title: KEDA
aliases: ["Kubernetes Event-driven Autoscaling"]
importance: 78
---
**KEDA** (Kubernetes Event-driven Autoscaling) is a Kubernetes component that scales workloads from **external event sources and custom metrics**, alongside CPU and memory. It sits beside the Horizontal Pod Autoscaler (HPA): KEDA polls triggers (queues, Kafka lag, Prometheus queries, cron, cloud services, and many others), exposes those metrics through its metrics API server, and owns the special case of scaling a Deployment or StatefulSet **between zero and one** replica. Above one replica, the HPA still decides the count using KEDA-fed external metrics.

KEDA was created by Microsoft and Red Hat and is a CNCF project. It is single-purpose and additive: you opt specific apps in with a `ScaledObject` or `ScaledJob`; everything else keeps its existing HPA or fixed replica count. That split matters for AI platforms, where embedding workers, crawl consumers, eval runners, and batch summarizers care about **backlog and lag**, while interactive GPU serving often needs Prometheus signals such as waiting requests or KV-cache use rather than average CPU.

## Intuition

CPU HPA answers: "are my pods busy?" KEDA answers: "is there work waiting *outside* the pods?" An embedding queue can sit deep while every worker pod shows low CPU (blocked on an API, loading a model, waiting on the network). Full GPUs with an empty queue indicate healthy packing, so queue depth does not call for more consumers. Event-driven scale matches the scarce resource you actually care about: messages per worker, age of the oldest job, or inference queue depth.

## How it works

KEDA runs three in-cluster pieces:

| Component | Role |
|---|---|
| **keda-operator** | For `ScaledObject`, creates and owns the HPA and handles activation from zero; for `ScaledJob`, creates Jobs directly from event demand |
| **keda-metrics-apiserver** | Serves external metrics to the HPA for **1 ↔ N** scale |
| **keda-admission-webhooks** | Rejects bad config early (for example two ScaledObjects on the same Deployment) |

Custom resources you author:

- **ScaledObject**: scale a Deployment, StatefulSet, or any CR with a `/scale` subresource.
- **ScaledJob**: spawn Kubernetes Jobs from backlog (good for long one-shot work).
- **TriggerAuthentication** / **ClusterTriggerAuthentication**: credentials for scalers (secrets, cloud workload identity, Vault, and so on).

Scaling has **two phases**:

1. **Activation (0 ↔ 1):** The operator decides whether the workload is *active* from the scaler's activation metric (default activation target is $0$; activation is **strictly greater than** the activation value). With `minReplicaCount >= 1`, activation is always on and scale-to-zero never runs.
2. **Scaling (1 ↔ N):** Once active, the HPA reads KEDA external metrics and applies the usual target ratio, bounded by `minReplicaCount` / `maxReplicaCount` and HPA behavior (stabilization windows, policies).

Key knobs on a ScaledObject:

- `pollingInterval` (default $30$ s): how often KEDA polls the event source. This is separate from the HPA controller sync period (default $\sim 15$ s via `--horizontal-pod-autoscaler-sync-period`), which governs how often the HPA re-reads metrics once the workload is already at $\ge 1$ replica.
- `cooldownPeriod` (default $300$ s): idle time before scale-to-zero after work drains.
- `minReplicaCount` / `maxReplicaCount`: floor and ceiling (defaults $0$ / $100$; set max from real downstream capacity).
- Trigger `threshold` / `value` vs `activationThreshold` / `activationValue`: different bars for "wake up" and "how many pods once awake."

CPU and memory triggers are special: the HPA reads those from the cluster metrics-server, not the KEDA metrics API. **CPU/memory alone cannot scale from zero** (no pods means no resource metrics, so nothing can wake the workload). Scale-to-zero only works if you also attach a non-resource trigger (queue, Prometheus, cron, and so on) with `minReplicaCount: 0`.

## Diagram

```mermaid
flowchart TB
 S["Queue /<br/>Kafka /<br/>Prometheus"] --> O["KEDA<br/>operator"]
 O -->|"inactive +<br/>cooldown"| Z["0 replicas"]
 O -->|active| N["At least<br/>1 replica"]
 O --> M["Metrics<br/>API server"]
 M --> H["HPA 1 ↔ N"]
 H --> D["Deployment /<br/>StatefulSet"]
 D --> P["Drain source<br/>work"]
 ```

## Formula

For a ScaledObject, once the operator has activated the workload, the HPA owns $1 \leftrightarrow N$. The formula depends on the trigger `metricType` (default **AverageValue** for most event scalers). ScaledJob uses a separate Job-scaling calculation.

**AverageValue** (queue depth, lag, typical "work per pod" targets). The metric is treated as a total shared across replicas. Desired count does not multiply by current replicas:

$$
desiredReplicas = \left\lceil \frac{L}{T} \right\rceil
$$

where $L$ is current queue length (or lag) and $T$ is the per-replica target (for example RabbitMQ `value: "10"` in `QueueLength` mode). With $L = 47$ and $T = 10$,

$$
desiredReplicas = \lceil 47/10 \rceil = 5
$$

KEDA's own docs use the same shape: queue size $20$ with target $5$ yields $4$ replicas, independent of how many pods are already up.

**Value** (and resource-style ratios). When the metric is not meant to be averaged across pods (for example average queue wait time, or some rate targets), HPA uses the classic ratio form:

$$
desiredReplicas = \left\lceil currentReplicas \times \frac{currentMetricValue}{desiredMetricValue} \right\rceil
$$

So $3$ replicas, metric $20$, target $5$ yields $\lceil 3 \times 20/5 \rceil = 12$. **Utilization** (CPU/memory) follows the same ratio idea against requested resources.

All of the above are still bounded by `minReplicaCount` / `maxReplicaCount`, missing metrics, not-ready pods, and HPA scale-down stabilization. With multiple independent triggers, HPA takes the **largest** recommended replica count across metrics. Activation has priority over the scale target: if `threshold: 10` but `activationThreshold: 50` and $L = 40$, the scaler is **not** active and KEDA keeps the workload at zero even though $40/10$ would suggest four replicas if it were already running.

## Example

An embedding pipeline enqueues document chunks on RabbitMQ. Each worker pod can sustain about $20$ messages of backlog without missing the drain SLO. A ScaledObject (pattern matches official RabbitMQ scaler docs):

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: embed-worker
spec:
  scaleTargetRef:
    name: embed-worker
  minReplicaCount: 0
  maxReplicaCount: 40
  pollingInterval: 15
  cooldownPeriod: 180
  triggers:
    - type: rabbitmq
      metadata:
        protocol: amqp
        queueName: embed-jobs
        mode: QueueLength
        value: "20"
        activationValue: "0"
      authenticationRef:
        name: rabbitmq-trigger-auth
```

**Worked numbers.** At $t=0$ the queue is empty and replicas are $0$. A crawl dump enqueues $L = 20{,}000$ messages. After the next poll, activation sees $L > 0$ and the operator brings the Deployment to at least one replica. The HPA then targets

$$
\lceil 20000 / 20 \rceil = 1000
$$

but `maxReplicaCount: 40` caps desired replicas at $40$. HPA scale-up policies determine how quickly the workload reaches that count. For an illustrative cold-start budget of $60$–$180$ s per pod, much of the backlog remains until workers become Ready; it grows further only if arrivals exceed completions. When all triggers are inactive for `cooldownPeriod` ($180$ s), KEDA can scale back to zero. Use the broker's metric semantics and graceful shutdown behavior to tell queue emptiness from completed in-flight jobs.

The same shape works for **eval runners** (queue of eval rows), **crawl workers**, **async tool workers**, and **batch summarization**. For online LLM serving, a Prometheus trigger is often a better fit than raw CPU, for example:

```yaml
triggers:
  - type: prometheus
    metadata:
      serverAddress: http://prometheus:9090
      query: sum(vllm:num_requests_waiting{job="vllm"})
      threshold: "5"
      activationThreshold: "0"
```

with `minReplicaCount: 1` (or higher) so interactive traffic does not pay full cold start on every idle period.

## Trade-offs

| Choice | Upside | Cost / failure |
|---|---|---|
| Scale on queue depth | Matches pending work | Over-scale if workers are stuck (errors requeue forever) |
| Scale-to-zero (`min: 0`) | Idle cost near zero | First request / first message pays cold start; bad for interactive GPU chat |
| Aggressive `maxReplicaCount` | Drains faster | Hits provider RPM/TPM, DB write limits, GPU node quota, vector-index ingest caps |
| Short `pollingInterval` | Faster reaction | More load on brokers and Prometheus |
| Long `cooldownPeriod` | Less thrash | Holds idle capacity after drain |
| Deployment scale-down | Cheap for short tasks | HPA can kill a pod mid long job; need grace period / `preStop` or use ScaledJob |
| CPU/memory KEDA triggers | Familiar metrics | Cannot wake from zero alone; often a weak signal for LLM workers |

KEDA sets **desired pods**. It does not provision GPUs. If new pods stay Pending for accelerators, you still need a node autoscaler such as [Karpenter](glossary://karpenter) or a managed node pool, plus [backpressure](glossary://backpressure) at the admission edge while capacity catches up.

## Debug path

When the queue rises but replicas do not:

1. `kubectl get scaledobject,hpa` and check ScaledObject status (`Ready`, `Active`, external metric name).
2. Confirm trigger auth (secrets, workload identity, broker permissions to read queue stats).
3. Verify metric freshness and that the query returns a **single** scalar/vector element (Prometheus scaler requirement).
4. Compare activation vs scale thresholds: activation too high keeps the app at zero.
5. Inspect HPA events, pod startup time, image pulls, and GPU Pending events.
6. Check `maxReplicaCount`, pause annotations (`autoscaling.keda.sh/paused`), and whether a non-KEDA HPA already owns the same Deployment.
7. Watch downstream error rate and rate limits: scale-out without backpressure turns queue delay into $429$s and retries.

For a rising queue with healthy workers but no scale-out, check the metric path, authentication, activation threshold, and maximum replica setting.

## Why it matters here

AI batch and async paths are bursty: document dumps, re-embed jobs, eval suites, and tool-side effects create deep queues that average CPU never sees. KEDA can wire those queues (and Prometheus serving signals) into Kubernetes replica count, including scale-to-zero to remove idle worker pods. Broker, controller, and node costs can remain. Pair it with Karpenter-style node supply for GPUs, `maxReplicaCount` from real dependency capacity, and backpressure so scale-out does not stampede model providers or databases. Interactive decode fleets usually keep a warm floor (`minReplicaCount > 0`) and scale on waiting requests or KV pressure; queue workers often run `minReplicaCount: 0` and accept cold start on the first message.

## Related terms

- [Autoscaling](glossary://autoscaling)
- [Backpressure](glossary://backpressure)
- [Prometheus](glossary://prometheus)
- [Karpenter](glossary://karpenter)
- [Cold start](glossary://cold-start)
