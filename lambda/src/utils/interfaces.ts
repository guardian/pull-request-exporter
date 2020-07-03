export interface RepoWithPulls {
  repository: string;
  pulls: PullRequestEssentials[];
}

export interface PullRequestEssentials {
  title: string;
  age: string;
  openedBy: string;
  requestedReviewers: string[];
}
