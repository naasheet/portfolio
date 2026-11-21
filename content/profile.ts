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
  email: string;
};

// Typed as Profile (not `as const`), so readers see the declared shape, e.g. photos: Photo[].
export const profile: Profile = {
  name: "Nasheet Khan",
  // TODO(content): confirm the title and the availability line (both from the Home board).
  title: "Designer and frontend developer",
  // TODO(content): confirm the degree line (from the About frame).
  degree: "Final-year B.Tech, Computer Engineering",
  location: { city: "Indore", timeZone: "Asia/Kolkata", zoneLabel: "IST" },
  availability: { open: true, label: "Open to work" },
  // TODO(content): confirm the tagline (from the About frame); write the bio and off-screen line.
  tagline:
    "I design interfaces, then build them — with motion, 3D and an unhealthy interest in easing curves.",
  bio: ["[A short paragraph about you]", "[A second paragraph]"],
  offScreen: "[A paragraph about life outside code: what you watch, play, make or obsess over.]",
  // TODO(content): your interests.
  interests: Array.from({ length: 12 }, (_, i) => `[Interest ${i + 1}]`),
  // TODO(content): photos (files in public/photos/), each with alt text and a caption.
  photos: [],
  resume: "/resume.pdf",
  email: "nxsheet@gmail.com",
};
