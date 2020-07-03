import { RepoWithPulls } from "./interfaces";
import * as fs from "fs";
import path = require("path");

function filterBots(prs: RepoWithPulls) {
  return prs.pulls.filter((pull) => {
    const title = pull.title.toLowerCase();
    return !(title.includes("snyk") || title.includes("bump"));
  });
}

export function countOpenPRs({
  file,
  data,
  bots = true
}: {
  file?: string;
  data?: RepoWithPulls[];
  bots?: boolean;
}): RepoWithPulls[] {
  const pullData = file ? require(file) : data ?? null;

  let total = 0;

  const sorted = pullData
    .sort((a, b) => (a.pulls.length < b.pulls.length ? 1 : -1))
    .filter(
      (pull, index, self) =>
        index === self.findIndex((item) => item.repository === pull.repository)
    )
    .map((repo: RepoWithPulls) => {
      total += repo.pulls.length;
      const pulls = bots ? repo.pulls : filterBots(repo);
      return { ...repo, pulls, count: pulls.length };
    });

  console.log(`${total} total number of pull requests`);

  fs.writeFileSync(
    path.join(__dirname, "../../counted-pulls.json"),
    JSON.stringify(sorted, null, 2)
  );

  return sorted;
}
