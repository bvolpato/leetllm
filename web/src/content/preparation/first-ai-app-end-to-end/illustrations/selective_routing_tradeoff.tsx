import React from "react";
import {
  BarChart,
  Column,
  LineChart,
  Panel,
  Scene,
  defineIllustration,
  getReadableToneColor,
  withDensity,
} from "vizmatic";
import type { ThemeColors } from "vizmatic";

export const width = 560;
export const height = 740;
export const alt =
  "The top chart plots selective accuracy and coverage for five thresholds on fourteen tickets. At 0.55, coverage is 71.4 percent and selective accuracy is 100 percent. The bottom chart shows top probabilities for six selected tickets, including 0.632 for an access message and 0.267 for a mixed-topic message.";

const illustration = defineIllustration((raw: ThemeColors) => {
  const c = withDensity(raw, 1.8);
  const tone = (name: "blue" | "green" | "purple" | "warm" | "critical") =>
    getReadableToneColor(name, c);
  return (
    <Scene c={c} padding={12} gap={12}>
      <Column gap={12} align="stretch">
        <Panel
          c={c}
          title="Accuracy and Coverage"
          width={536}
          padding={12}
          tone="blue"
        >
          <LineChart
            c={c}
            width={508}
            height={186}
            subtitle="Threshold tau on held-out tickets (n = 14)"
            labels={["0.25", "0.35", "0.45", "0.55", "0.65"]}
            min={0}
            max={1}
            yAxisLabel="Rate"
            directLabels
            showPoints
            format="percent"
            series={[
              {
                name: "Acc",
                points: [0.929, 1.0, 1.0, 1.0, 1.0],
                color: tone("green"),
              },
              {
                name: "Cov",
                points: [1.0, 0.857, 0.786, 0.714, 0.429],
                color: tone("blue"),
                area: true,
              },
            ]}
          />
        </Panel>
        <Panel
          c={c}
          title="Top Probability by Ticket"
          width={536}
          padding={12}
          tone="neutral"
        >
          <BarChart
            c={c}
            width={508}
            height={186}
            subtitle="Selected messages from the evaluation set"
            min={0}
            max={1}
            yAxisLabel="P(y|x)"
            format="percent"
            showValues
            data={[
              { label: "Auth", value: 0.632, color: tone("blue") },
              { label: "OOM", value: 0.787, color: tone("purple") },
              { label: "TTFT", value: 0.714, color: tone("green") },
              { label: "Bill", value: 0.71, color: tone("warm") },
              { label: "Retry", value: 0.331, color: tone("critical") },
              { label: "Mixed", value: 0.267, color: tone("critical") },
            ]}
          />
        </Panel>
      </Column>
    </Scene>
  );
});

export const create = illustration.create;
export default illustration.default;
