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
  photos: readonly Photo[];
  /** A file under public/. */
  resume: string;
  email: string;
};

export const profile = {
  name: "Nasheet Khan",
  // TODO(content): confirm the title and the availability line (both from the Home board).
  title: "Designer and frontend developer",
  location: { city: "Indore", timeZone: "Asia/Kolkata", zoneLabel: "IST" },
  availability: { open: true, label: "Open to work" },
  // TODO(content): tagline, bio, off-screen line.
  tagline: "[One line about what you do]",
  bio: ["[A short paragraph about you]", "[A second paragraph]"],
  offScreen: "[What you do away from the screen]",
  // TODO(content): photos (files in public/photos/), each with alt text and a caption.
  photos: [],
  resume: "/resume.pdf",
  email: "nxsheet@gmail.com",
} as const satisfies Profile;
