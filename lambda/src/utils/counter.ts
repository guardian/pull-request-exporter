import { RepoWithPulls, PullRequestEssentials } from "./interfaces";

function pullIsBot(pull): boolean {
  const title = pull.title.toLowerCase();
  return title.includes("snyk") || title.includes("bump");
}

function filterBots(prs: RepoWithPulls): PullRequestEssentials[] {
  return prs.pulls.filter((pull) => !pullIsBot(pull));
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

  const sorted: RepoWithPulls[] = pullData
    .sort((a, b) => (a.pulls.length < b.pulls.length ? 1 : -1))
    .filter(
      (pull, index, self) =>
        index === self.findIndex((item) => item.repository === pull.repository)
    )
    .map((repo: RepoWithPulls) => {
      total += repo.pulls.length;
      const botCount = repo.pulls.filter((p) => pullIsBot(p)).length;
      const humanCount = repo.pulls.filter((p) => !pullIsBot(p)).length;
      const pulls = bots ? repo.pulls : filterBots(repo);
      return {
        ...repo,
        pulls,
        count: pulls.length,
        botCount,
        humanCount
      };
    });

  console.log(`${total} total number of pull requests`);

  return sorted;
}
