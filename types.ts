export type SatisfactionLevel = 1 | 2 | 3 | 4 | 5;

export interface Question {
  id: string;
  text: string;
}

export interface DemographicQuestion {
  id: string;
  label: string;
  options: string[];
  includeOther: boolean;
}

export interface Answer {
  questionId: string;
  level: SatisfactionLevel;
}

export interface SurveyResponse {
  id: string;
  timestamp: number;
  answers: Answer[];
  demographics?: Record<string, string>;
  comment?: string;
}

export interface SurveyProject {
  id: string;
  title: string;
  description: string;
  coverImage?: string | null;
  isOpen: boolean;
  questions: Question[];
  demographicQuestions: DemographicQuestion[];
  responses: SurveyResponse[];
  createdAt: number;
}