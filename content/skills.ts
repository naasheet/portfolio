/*
 * Skills (4.1, reshaped in 4.6): SkillsCard on the Skills page, About's skills count
 * (lib/content/stats.ts), the terminal's `skills` and the chatbot. Honest dots, no logo wall.
 * scripts/check-content.ts checks it on every build.
 */

/** 1 just started · 2 getting there · 3 comfortable · 4 ship with it daily · 5 could teach it. */
export type SkillLevel = 1 | 2 | 3 | 4 | 5;

export type Skill = {
  name: string;
  /** Leave it out until you've decided: the dots then show empty, never a made-up rating. */
  level?: SkillLevel;
  /** Years of use, shown as "[4 yrs]" on wide screens. */
  years?: number;
};

export type SkillArea = {
  name: string;
  /** One line under the area's name ("What I reach for first."). */
  summary: string;
  skills: readonly Skill[];
};

/** Something being learned now, with how far along (0–100) once you want to say. */
export type Learning = { name: string; progress?: number };

/** "Where I used it": a skill (or pairing) and where it shows up. */
export type UsedIn = {
  title: string;
  /** `project` is a slug from content/projects.ts: the row links to its case study or site. */
  items: readonly { label: string; project?: string }[];
};

// From Nasheet's resume (public/resume.pdf), Nov 2026.
// TODO(content): levels (1–5) and years: the resume doesn't rate anything, so the dots stay empty
// until you choose (never a made-up rating).
export const skillAreas: readonly SkillArea[] = [
  {
    name: "Web",
    summary: "Full-stack: the interface, the API and the database behind it.",
    skills: [
      { name: "JavaScript" },
      { name: "React" },
      { name: "Node.js" },
      { name: "Express" },
      { name: "FastAPI" },
      { name: "PostgreSQL" },
      { name: "Prisma" },
      { name: "Redis" },
    ],
  },
  {
    name: "Mobile",
    summary: "Flutter apps with offline sync, alerts and an admin side.",
    skills: [
      { name: "Flutter" },
      { name: "Dart" },
      { name: "Riverpod" },
      { name: "Firebase" },
      { name: "Isar DB" },
      { name: "Supabase" },
    ],
  },
  {
    name: "AI and data",
    summary:
      "Training models, evaluating LLMs and charting what the data says.",
    skills: [
      { name: "Python" },
      { name: "PyTorch" },
      { name: "Scikit-learn" },
      { name: "NumPy" },
      { name: "Pandas" },
      { name: "LLM evaluation" },
      { name: "Tableau" },
      { name: "Power BI" },
    ],
  },
  {
    name: "Foundations",
    summary: "The computer engineering underneath it all.",
    skills: [
      { name: "Java" },
      { name: "MySQL" },
      { name: "HTML & CSS" },
      { name: "Data structures & algorithms" },
      { name: "OOP" },
      { name: "Computer networks" },
    ],
  },
];

// TODO(content): what you're learning now (and how far along, 0–100, if you want to show it).
// The resume doesn't say, so these stay placeholders.
export const learning: readonly Learning[] = [
  { name: "[Thing you're learning]" },
  { name: "[Another one]" },
  { name: "[A third]" },
];

// The resume's software list.
export const tools: readonly string[] = [
  "VS Code",
  "Git",
  "GitHub",
  "Google Colab",
  "Firebase",
  "Supabase",
  "Tableau",
  "Power BI",
  "Adobe Photoshop",
  "Adobe Premiere Pro",
  "AutoCAD",
  "Cisco Packet Tracer",
];

// Where the main skills show up (project slugs from content/projects.ts).
export const usedIn: readonly UsedIn[] = [
  {
    title: "React",
    items: [
      { label: "Filmly", project: "filmly" },
      { label: "Eco Waste Analyzer", project: "eco-waste-analyzer" },
    ],
  },
  {
    title: "Flutter",
    items: [
      { label: "Bunk Alert", project: "bunk-alert" },
      { label: "NMIMS Hostel App", project: "nmims-hostel-app" },
    ],
  },
  {
    title: "Python and ML",
    items: [
      { label: "Eco Waste Analyzer", project: "eco-waste-analyzer" },
      { label: "Outlier AI · LLM evaluation" },
    ],
  },
];
