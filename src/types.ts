export interface AgeEnum {
  eighteen_to_twentyfour: string;
  twentyfive_to_thirtyfour: string;
  thirtyfive_to_fortyfour: string;
  fortyfive_to_fiftyfour: string;
  fiftyfive_to_sixtyfour: string;
  sixtyfive_plus: string;
}

export interface Location {
  city?: string;
  state?: string;
  country?: string;
  geolocation?: string;
}

export interface Contributor {
  name: string;
  age_bucket: keyof AgeEnum;
  gender?: string;
  ethnicity: string;
  nationality?: string;
  languages_spoken: string[];
  occupation?: string;
}

export interface Collector {
  name: string;
  gender?: string;
  collector_comments: string;
}

export interface Context {
  use_context?: string;
  cultural_background?: string;
  collection_context?: string;
}

export interface Analysis {
  context: Context;
  interpretation?: string;
  collector_comments?: string;
}

export interface Folklore {
  item: string;
  genre: string;
  language_of_origin?: string;
  medium: string;
  translation?: string;
  place_mentioned: Location[];
}

export interface FolkloreCollection {
  _id: string;
  filename?: string;
  contributor: Contributor;
  folklore: Folklore;
  collector: Collector;
  analysis: Analysis;
  storage_medium: string;
  cleaned_full_text: string;
  date_collected: string;
  location_collected: Location;
}