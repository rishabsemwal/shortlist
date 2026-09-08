export interface Idea {
  id: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: number; // unix ms — serialisable across server/client boundary
  voteCount: number;
  status?: "open" | "planned" | "shipped";
}

export interface Vote {
  votedAt: number;
}

export interface WaitlistEntry {
  email: string;
  joinedAt: number;
}
