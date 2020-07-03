const path = require("path");
const fs = require("fs");
import { Octokit } from "@octokit/rest";
import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types";
import { PullRequestEssentials } from "./utils/interfaces";

const pullsDataFile = path.join(__dirname, "../pulls.json");
const config = require(path.join(__dirname, "../config.json"));
const octokit = new Octokit({ auth: config.auth });

async function getRepos(
  page: number
): Promise<
  RestEndpointMethodTypes["teams"]["listReposInOrg"]["response"]["data"]
> {
  const result = await octokit.teams.listReposInOrg({
    org: "guardian",
    team_slug: "digital-cms",
    per_page: 100,
    page: page,
    sort: "full_name"
  });
  return result.data;
}

async function getAllRepos() {
  let records: RestEndpointMethodTypes["teams"]["listReposInOrg"]["response"]["data"] = [];
  let keepGoing = true;
  let offset = 0;
  while (keepGoing) {
    let response = await getRepos(offset);
    await records.push.apply(records, response);
    offset += 1;
    if (response.length === 0) {
      keepGoing = false;
      console.log("done", records.length);
    }
  }
  return records;
}

export async function getAllPRs() {
  let records = (await getAllRepos()).filter(
    (v, i, self) => self.indexOf(v) === i
  );

  const prs = (
    await Promise.all(
      records.map(async (r) => {
        try {
          const pulls = await octokit.pulls.list({
            owner: r.owner.login,
            repo: r.name,
            state: "open"
          });
          const whatICareAbout: PullRequestEssentials[] = pulls.data.map(
            (p) => ({
              prTitle: p.title,
              age: p.created_at,
              openedBy: p.user.login,
              requestedReviewers: p.requested_reviewers.map((r) => r.login)
            })
          );
          return { repo: r.name, pulls: whatICareAbout };
        } catch (err) {
          console.error("PR LIST ERROR: ", err.message, err.request.url);
          return null;
        }
      })
    )
  ).filter((p) => p != null && p.pulls.length > 0);

  const deduped = prs.filter((item, index) => prs.indexOf(item) === index);
  fs.writeFileSync(pullsDataFile, JSON.stringify(deduped, null, 2));
}

(async () => await getAllPRs())();
