import { getAllPRs } from "./getPulls";
import { countOpenPRs } from "./utils/counter";
import { RepoWithPulls } from "./utils/interfaces";
import { SharedIniFileCredentials, CloudWatch } from "aws-sdk";

const createMetric = (
  repos: RepoWithPulls[]
): CloudWatch.PutMetricDataInput => {
  const metricData = repos.map((repo) => ({
    MetricName: "open_pull_requests" /* required */,
    Dimensions: [
      {
        Name: "Repository" /* required */,
        Value: repo.repository /* required */
      }
      /* more items */
    ],
    Timestamp: new Date(),
    Unit: "Count",
    Value: repo.pulls.length
  }));
  return {
    MetricData: metricData,
    Namespace: "GitHub"
  };
};

const handler = async () => {
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
    while (n < counted.length) {
      const metrics = createMetric(counted.slice(n, n + 20));
      await cloudwatch.putMetricData(metrics).promise();
      n += 20;
    }
    console.log(`${counted.length} repo state uploaded to CW`);
  } catch (err) {
    console.error(err);
  }
};

if (require.main === module) {
  (async () => await handler())();
}
