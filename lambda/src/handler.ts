import { getAllPRs } from "./getPulls";
import { countOpenPRs } from "./utils/counter";
import { RepoWithPulls } from "./utils/interfaces";
import { SharedIniFileCredentials, CloudWatch } from "aws-sdk";

const createMetric = (
  repos: RepoWithPulls[],
  { metricName, valueKey }: { metricName: string; valueKey: string }
): CloudWatch.PutMetricDataInput => {
  const metricData = repos.map((repo) => {
    if (repo[valueKey] === undefined) {
      throw new Error(
        `No key ${valueKey} in repo ${repo.repository} with keys ${Object.keys(
          repo
        )}`
      );
    }

    const value = repo[valueKey];

    console.log(`${metricName}: ${value} for repo ${repo.repository}`);

    return {
      MetricName: metricName,
      Dimensions: [
        {
          Name: "Repository",
          Value: repo.repository
        }
        /* more items */
      ],
      Timestamp: new Date(),
      Unit: "Count",
      Value: value
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

      console.log(`Uploading metrics for ${n} to ${n + 20} pulls`);
      await Promise.all(
        ["count", "botCount", "humanCount"].map(async (metricName) => {
          const metrics = createMetric(metricsToShip, {
            metricName,
            valueKey: metricName
          });

          try {
            const res = await cloudwatch.putMetricData(metrics).promise();
            console.log("putMetricData response", res);
          } catch (e) {
            console.error(e);
            throw e;
          }
        })
      );

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
