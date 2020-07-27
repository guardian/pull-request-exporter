import { getAllPRs } from "./getPulls";
import { countOpenPRs } from "./utils/counter";
import { RepoWithPulls } from "./utils/interfaces";
import { SharedIniFileCredentials, CloudWatch } from "aws-sdk";

const createMetric = (
  repos: RepoWithPulls[],
  overrides?: { metricName: string; valueKey: string }
): CloudWatch.PutMetricDataInput => {
  const metricData = repos.map((repo) => {
    if (overrides && !repo[overrides.valueKey]) {
      throw new Error(
        `No key ${overrides.valueKey} in repo ${
          repo.repository
        } with keys ${Object.keys(repo)}`
      );
    }

    return {
      MetricName: overrides?.metricName ?? "open_pull_requests" /* required */,
      Dimensions: [
        {
          Name: "Repository" /* required */,
          Value: repo.repository /* required */
        }
        /* more items */
      ],
      Timestamp: new Date(),
      Unit: "Count",
      Value: overrides?.valueKey ? repo[overrides.valueKey] : repo.pulls.length
    };
  });
  return {
    MetricData: metricData,
    Namespace: "GitHub"
  };
};

export const handler = async (): Promise<RepoWithPulls[]> => {
  try {
    const pulls = await getAllPRs();
    const counted = countOpenPRs({ data: pulls });
    const cloudwatch = new CloudWatch({
      region: "eu-west-1",
      ...(process.env.STAGE !== "PROD" && {
        credentials: new SharedIniFileCredentials({ profile: "media-service" })
      })
    });

    let n = 0;

    console.log(`Uploading metrics for ${counted.length} repositories`);
    while (n < counted.length) {
      const metricsToShip = counted.slice(n, n + 20);

      const metrics = createMetric(metricsToShip);
      console.log(`Uploading metrics for ${n} to ${n + 20} pulls`);
      await cloudwatch
        .putMetricData(metrics)
        .promise()
        .catch((err) => console.error(err));

      const botMetrics = createMetric(metricsToShip, {
        metricName: "bot_pull_requests",
        valueKey: "botCount"
      });
      await cloudwatch
        .putMetricData(botMetrics)
        .promise()
        .catch((err) => console.error(err));
      n += 20;
    }
    console.log(`${counted.length} repo state uploaded to CW`);
    return counted;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

if (require.main === module) {
  (async () => await handler())();
}
