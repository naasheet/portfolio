/*
 * Who the site belongs to (4.1): one typed source for the hero, the About page, the terminal's
 * `whoami`, the chatbot and the metadata. Nasheet's facts; everything not yet supplied is a
 * bracketed placeholder marked TODO(content). scripts/check-content.ts checks it on every build.
 */

export type Photo = {
  /** A file under public/ (e.g. "/photos/desk.jpg"). */
  src: string;
  alt: string;
  caption: string;
};

export type Profile = {
  name: string;
  title: string;
  /** What you're studying or where you are (ProfileCard's second line). */
  degree: string;
  location: {
    city: string;
    /** IANA zone for the live local time. */
    timeZone: string;
    /** Shown after the time ("IST"). */
    zoneLabel: string;
  };
  availability: { open: boolean; label: string };
  /** One line under the name. */
  tagline: string;
  /** The About page's paragraphs. */
  bio: readonly string[];
  /** What you do away from the screen. */
  offScreen: string;
  /** Things you're into (About's interests row). */
  interests: readonly string[];
  photos: readonly Photo[];
  /** A file under public/. */
  resume: string;
  /** When the resume was last updated ("Nov 2026"), shown on Contact's resume card when set. */
  resumeUpdated?: string;
  email: string;
};

// Typed as Profile (not `as const`), so readers see the declared shape, e.g. photos: Photo[].
// Filled from Nasheet's resume (public/resume.pdf), Nov 2026. TODO(content): review the wording.
export const profile: Profile = {
  name: "Nasheet Khan",
  title: "Full-stack and AI developer",
  degree: "Final-year B.Tech, Computer Engineering · NMIMS Indore",
  location: { city: "Indore", timeZone: "Asia/Kolkata", zoneLabel: "IST" },
  // TODO(content): confirm the availability label.
  availability: { open: true, label: "Open to work" },
  tagline:
    "I build full-stack web apps, Flutter apps and the ML models behind them, from the database to the drag-and-drop.",
  bio: [
    "I'm a computer engineering student at NMIMS's School of Technology, Management and Engineering in Indore, graduating in 2027. I like building whole products: the API, the database, the interface, and more and more often the model in the middle.",
    "Lately that's been Filmly, a social platform for film reviews and watchlists; Bunk Alert and a hostel app for NMIMS, both in Flutter; and Eco Waste Analyzer, which sorts waste from a photo with a MobileNetV2 model at about 91% accuracy. I've also worked as a freelance AI trainer with Outlier AI, grading how language models reason through maths and conversation.",
  ],
  offScreen:
    "Off the screen I swim, play badminton and watch movies. The rest of the time goes into music: production and sound design are my other rabbit hole.",
  interests: [
    "Full-stack web",
    "Mobile apps",
    "Machine learning",
    "NLP",
    "LLM evaluation",
    "Data visualization",
    "Image & video processing",
    "Music production",
    "Sound design",
    "Movies",
    "Swimming",
    "Badminton",
  ],
  // TODO(content): photos (files in public/photos/), each with alt text and a caption.
  photos: [],
  resume: "/resume.pdf",
  // TODO(content): when the resume was last updated, e.g. "Nov 2026" (hidden until set).
  resumeUpdated: undefined,
  email: "nxsheet@gmail.com",
};
