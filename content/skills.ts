/*
 * Skills by area (4.1): SkillsCard, the Skills page, the terminal's `skills` and the chatbot.
 */

export type SkillArea = {
  name: string;
  skills: readonly string[];
};

// TODO(content): your real areas and skills.
export const skillAreas: readonly SkillArea[] = [
  { name: "[Area 1]", skills: ["[Skill]", "[Skill]"] },
  { name: "[Area 2]", skills: ["[Skill]", "[Skill]"] },
];
