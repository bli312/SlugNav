export interface Class {
  id: string;
  courseCode: string;
  title: string;
  instructor: string | null;
  days: string | null;
  time: string | null;
  building: string | null;
  room: string | null;
}

// Sample data for development only. Not a real schedule.
// Kept in sync with the sample rows in supabase/classes.sql.
export const mockClasses: Array<Class> = [
  {
    id: "1",
    courseCode: "CSE 101",
    title: "Intro to Data Structures and Algorithms",
    instructor: "Staff",
    days: "MWF",
    time: "9:20AM-10:25AM",
    building: "Thimann Lecture",
    room: "003",
  },
  {
    id: "2",
    courseCode: "CSE 120",
    title: "Computer Architecture",
    instructor: "Staff",
    days: "TuTh",
    time: "11:40AM-1:15PM",
    building: "Baskin Engineering",
    room: "152",
  },
  {
    id: "3",
    courseCode: "CSE 130",
    title: "Principles of Computer Systems Design",
    instructor: "Staff",
    days: "MWF",
    time: "1:20PM-2:25PM",
    building: "Earth & Marine",
    room: "B206",
  },
  {
    id: "4",
    courseCode: "AM 10",
    title: "Mathematical Methods for Engineers I",
    instructor: "Staff",
    days: "TuTh",
    time: "8:00AM-9:35AM",
    building: "Physical Sciences",
    room: "110",
  },
  {
    id: "5",
    courseCode: "ECE 101",
    title: "Intro to Electronic Circuits",
    instructor: "Staff",
    days: "MWF",
    time: "10:40AM-11:45AM",
    building: "Media Theater",
    room: "M110",
  },
  {
    id: "6",
    courseCode: "MATH 19A",
    title: "Calculus for Science, Engineering, and Mathematics",
    instructor: "Staff",
    days: "MWF",
    time: "12:00PM-1:05PM",
    building: "Classroom Unit",
    room: "002",
  },
  {
    id: "7",
    courseCode: "CSE 115A",
    title: "Introduction to Software Engineering",
    instructor: "Richard Konrad Jullig",
    days: "MWF",
    time: "10:40AM-11:45AM",
    building: "Physical Sciences",
    room: "114",
  },
  {
    id: "8",
    courseCode: "CSE 118A",
    title: "Mobile Applications",
    instructor: "David Harrison",
    days: "MWF",
    time: "2:40PM-3:45PM",
    building: "Stevenson Academics",
    room: "150",
  },
];
