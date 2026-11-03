// html element names coming from ENDPOINT so cheerio can read
export const ENDPOINT = "https://pisa.ucsc.edu/class_search/index.php";
export const TERM_DROPDOWN = "term_dropdown";

export interface PisaClass {
  code: string;
  name: string;
  number: number;
  meetingInfo: {
    location: string;
    dayAndTime: string;
  };
  instructor: {
    name: string;
  };
}
