/**
 * Resume content for the homepage, from "Dimitri Meimaridis Resume 2026".
 * Contact details (address, phone, email) are deliberately left out; the
 * identity icon rows are the ways to get in touch.
 */

export type Role = {
  title: string;
  organization: string;
  place: string;
  dates: string;
  points: string[];
};

export type SkillGroup = {
  label: string;
  items: string[];
};

export type Education = {
  school: string;
  degree: string;
  note: string;
  place: string;
  dates: string;
  honors: string[];
  coursework: string[];
};

/** Homepage h1 and the line under it. */
export const summary = {
  lead: "I'm an IT manager, administrator, and computer teacher with over eight years of experience running technology in PreK–8 schools, as well as corporate and higher-education environments.",
  more: "I meticulously design, carefully build, and rigorously secure campus-wide systems that support the people who use them. I can take complex projects and ideas and explain them clearly to anyone, at a technical or non-technical level.",
};

export const experience: Role[] = [
  {
    title: "Computer Teacher & Campus IT",
    organization: "Saint Cecilia School",
    place: "Philadelphia, PA",
    dates: "Sept 2023 – Present",
    points: [
      "Develop and deliver computer science and digital literacy lessons for grades PreK–8, adapted to each skill level.",
      "Provide technical support for over 500 students and 50 faculty and staff, keeping classroom disruptions and administrative outages to a minimum.",
      "Train and assist staff in adopting new educational technology and digital tools.",
      "Supervise morning arrival, lunch, recess, and afternoon dismissal for student safety.",
    ],
  },
  {
    title: "Campus IT Manager",
    organization: "Saint Dominic School",
    place: "Philadelphia, PA",
    dates: "June 2018 – June 2025",
    points: [
      "Designed and built the school's computer lab and Chromebook lab from the ground up.",
      "Oversaw the deployment, maintenance, and troubleshooting of all software and hardware on campus.",
      "Administered Google Workspace for all faculty and students: account security, access management, and process automation.",
      "Planned, installed, and maintained a campus-wide WiFi system and an integrated security camera network.",
      "Led the rapid move to online learning during the COVID-19 pandemic, designing and deploying the remote learning platform.",
      "Rolled out iPads to every student and teacher, and installed mobile 4K Smartboards in classrooms.",
      "Digitized the school cemetery's paper records, streamlining retrieval and data management.",
    ],
  },
  {
    title: "Computer Support Specialist",
    organization: "The Wharton School (UPenn)",
    place: "Philadelphia, PA",
    dates: "Mar 2022 – Sept 2022",
    points: [
      "Diagnosed and resolved wireless and general IT issues for students and faculty in a fast-paced academic environment.",
      "Wiped and re-imaged loaner computers to keep them secure and reliable.",
      "Guided students step by step through software installs and access to Wharton resources.",
      "Communicated solutions and updates through Zendesk and telephone support.",
    ],
  },
  {
    title: "Desktop Analyst",
    organization: "Berkley Technology Services",
    place: "Wilmington, DE",
    dates: "Mar 2021 – July 2021",
    points: [
      "Managed logistics for the 2021 company-wide IT refresh, supporting remote work across 50+ organizations.",
      "Imaged, deployed, and shipped laptops, monitors, docks, and peripherals to distributed teams.",
      "Onboarded new hires, migrated user data, and gave white-glove technical support.",
      "Coordinated device setup, data backup, and issue resolution with users through a ticketing system.",
    ],
  },
];

/** One list on the homepage; each label is the row's category. */
export const skills: SkillGroup[] = [
  {
    label: "Platforms",
    items: ["Windows 10/11", "macOS", "Linux (Ubuntu, Pop!_OS, Mint, Raspberry Pi OS, Unraid, TrueNAS)", "iOS/iPadOS", "Android"],
  },
  { label: "Systems", items: ["Google Workspace (Admin)", "Apple MDM (Jamf, Lightspeed)", "Microsoft Active Directory"] },
  {
    label: "Tools",
    items: ["Microsoft Office", "Google Suite", "Zoom", "BlueJeans", "Vonage", "ServiceNow", "Zendesk", "Pharos Printing"],
  },
  { label: "Coding", items: ["Python", "C", "Bash", "PowerShell"] },
  { label: "Hardware", items: ["3D printing", "Lexmark printers", "Smartboards", "Security cameras", "Networking equipment"] },
  {
    label: "Strengths",
    items: [
      "Leadership & project management",
      "Technology integration & training",
      "System administration & automation",
      "Communication & collaboration",
      "Problem solving & analysis",
    ],
  },
  { label: "Languages", items: ["English", "Greek"] },
];

export const education: Education = {
  school: "Drexel University",
  degree: "B.S. Computer Engineering",
  note: "100 credits completed",
  place: "Philadelphia, PA",
  dates: "Sept 2019 – Feb 2023",
  honors: ["Drexel Liberty Scholar (full academic scholarship)", "Dragon Fees Scholar", "Drexel Grant", "PHEAA Grant"],
  coursework: [
    "Physics I–III",
    "Calculus I–II",
    "Discrete Mathematics",
    "Probability & Statistics",
    "Signals & Systems",
    "Digital Logic Design",
    "Microcontroller Design",
    "Technical Communication",
    "Engineering Ethics",
  ],
};
