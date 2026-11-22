import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { profile } from "@/content/profile";

/*
 * The share image for every route (4.8): the name in SF Pro Display Bold over a near-black field
 * of teal and amber specks, like the canvas. next/og (Satori) can't read WOFF2, so it loads the
 * subset OTF in public/fonts/og/ (0.2; its GSUB table was removed in 4.8, because Satori's
 * opentype parser throws on its lookup type 7). Satori can't read CSS variables either, so the colours
 * below are literal copies of the dark palette (CLAUDE.md §8): the one place hex values are
 * allowed outside globals.css. Keep them in step with it.
 */

export const alt = `${profile.name} · ${profile.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const C = {
  bg: "#090B0B", // bg/base
  text: "#F4F7F6", // text/primary
  secondary: "#A3B2AF", // text/secondary
  tertiary: "#7A8B88", // text/tertiary
  teal: "#2EC0A0", // accent/primary
  amber: "#FFC56B", // accent/secondary
};

/** Seeded specks (mulberry32), denser on the right like the canvas behind a page. */
function specks(count: number) {
  let a = 0x4e41_5348;
  const rand = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length: count }, () => {
    const x = 1200 * (0.35 + 0.65 * Math.sqrt(rand()));
    const y = 630 * rand();
    const r = 1 + rand() * 2.5;
    return { x, y, r, amber: rand() > 0.83, o: 0.25 + rand() * 0.6 };
  });
}

export default async function OpengraphImage() {
  const font = await readFile(
    join(process.cwd(), "public", "fonts", "og", "SF-Pro-Display-Bold.otf"),
  );
  const [first, ...rest] = profile.name.split(" ");

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: C.bg,
        fontFamily: "SF Pro Display",
      }}
    >
      {specks(260).map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: s.x,
            top: s.y,
            width: s.r * 2,
            height: s.r * 2,
            borderRadius: 999,
            backgroundColor: s.amber ? C.amber : C.teal,
            opacity: s.o,
          }}
        />
      ))}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 999,
              backgroundColor: C.teal,
            }}
          />
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 999,
              backgroundColor: C.amber,
            }}
          />
          <div
            style={{
              display: "flex",
              marginLeft: 10,
              fontSize: 30,
              color: C.text,
              letterSpacing: -0.5,
            }}
          >
            {first?.toLowerCase()}
            <span style={{ color: C.teal }}>.</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              fontSize: 112,
              lineHeight: 1,
              letterSpacing: -4,
              color: C.text,
            }}
          >
            {first} {rest.join(" ")}
            <span style={{ color: C.teal }}>.</span>
          </div>
          <div
            style={{ fontSize: 40, color: C.secondary, letterSpacing: -0.5 }}
          >
            {profile.title}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 24, color: C.tertiary }}>
          {profile.location.city} · {profile.availability.label}
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "SF Pro Display", data: font, style: "normal", weight: 700 },
      ],
    },
  );
}
