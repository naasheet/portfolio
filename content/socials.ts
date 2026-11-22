/*
 * Where else to find Nasheet (4.1): the contact page, SocialCard, the footer and the terminal's
 * `contact`. Brand icons live in components/media/icons/.
 */

export type Social = {
  platform:
    | "github"
    | "linkedin"
    | "x"
    | "dribbble"
    | "behance"
    | "instagram"
    | "email";
  /** As shown ("@nasheet"). */
  handle: string;
  /** Absolute https URL (or mailto: for email). */
  url: string;
};

// Order = display order. Each platform needs an icon in components/media/icons/ to get a button
// (GitHub and LinkedIn so far; Instagram's arrives with the Contact page, 4.7).
export const socials: readonly Social[] = [
  {
    platform: "github",
    handle: "@naasheet",
    url: "https://github.com/naasheet",
  },
  {
    platform: "linkedin",
    handle: "/in/nasheetkhan",
    url: "https://www.linkedin.com/in/nasheetkhan/",
  },
  {
    platform: "instagram",
    handle: "@naasheet",
    url: "https://www.instagram.com/naasheet",
  },
];
