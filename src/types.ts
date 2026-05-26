export interface BookSelection {
  title: string;
  author: string;
  pages: string;
  text?: string;
  isExample?: boolean;
}

export interface VocabularyWord {
  word: string;
  meaning: string;
  exampleInsideBook: string;
}

export interface KeyQuote {
  quote: string;
  speaker: string;
  lesson: string;
}

export interface DiscussionTopic {
  id: string;
  title: string;
  description: string;
  linkToExperience: string;
  startingQuestion: string;
  tailQuestions: string[];
  suggestedStances: {
    positive: string;
    negative: string;
    neutral?: string;
  };
}

export interface AnalysisResponse {
  summary: string;
  keyQuotes: KeyQuote[];
  vocab: VocabularyWord[];
  topics: DiscussionTopic[];
}

export interface DiscussionRecord {
  id: string;
  topicId: string;
  studentName: string;
  opinion: string;
  stance: 'positive' | 'negative' | 'neutral';
  createdAt: string;
}

export interface TopicFeedback {
  topicId: string;
  summaryOfOpinions: string;
  praise: string;
  nextDeeperQuestion: string;
}
