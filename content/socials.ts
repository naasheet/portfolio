/*
 * Where else to find Nasheet (4.1): the contact page, SocialCard, the footer and the terminal's
 * `contact`. Brand icons live in components/media/icons/ (GitHubIcon, LinkedInIcon so far).
 */

export type Social = {
  platform: "github" | "linkedin" | "x" | "dribbble" | "behance" | "instagram" | "email";
  /** As shown ("@nasheet"). */
  handle: string;
  /** Absolute https URL (or mailto: for email). */
  url: string;
};

// TODO(content): your profiles. GitHub and LinkedIn icons already exist.
export const socials: readonly Social[] = [];
