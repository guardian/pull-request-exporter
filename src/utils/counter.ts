import { Pull, PullRequestEssentials, RepoWithPulls } from "./interfaces";
import * as fs from "fs";
const path = require("path");

export function countOpenPRs(
  pathToPullsFile: string = path.join(__dirname, "../../pulls.json")
) {
  const pullData = require(pathToPullsFile);
  let total = 0;

  const sorted: RepoWithPulls[] = pullData
    .sort((a, b) => (a.pulls.length < b.pulls.length ? 1 : -1))
    .filter(
      (pull, index, self) =>
        index === self.findIndex((thing) => thing.repo === pull.repo)
    )
    .map((prs: RepoWithPulls) => {
      return {
        ...prs,
        pulls: prs.pulls.filter((pull) => {
          const title = pull.prTitle.toLowerCase();
          return !(title.includes("snyk") || title.includes("bump"));
        })
      };
    })
    .map(
      (repo: RepoWithPulls) =>
        (total += repo.pulls.length) && {
          ...repo,
          pulls: repo.pulls.map((p) => `${p.age}: ${p.prTitle}`),
          count: repo.pulls.length
        }
    );

  console.log(sorted, `${total} total number of pull requests`);

  fs.writeFileSync(
    path.join(__dirname, "../../counted-pulls.json"),
    JSON.stringify(sorted, null, 2)
  );
}
