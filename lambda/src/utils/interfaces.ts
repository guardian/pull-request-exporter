export interface RepoWithPulls {
  repository: string;
  pulls: PullRequestEssentials[];
  count?: number;
  botCount?: number;
}

export interface PullRequestEssentials {
  title: string;
  age: string;
  openedBy: string;
  requestedReviewers: string[];
}
