export interface ExtractedEvent {
  title: string;
  start: string; // ISO-8601 datetime format
  end: string; // ISO-8601 datetime format
  description?: string;
  location?: string;
}

export type ExtractedEvents = readonly ExtractedEvent[];
