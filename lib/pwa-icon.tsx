import * as React from "react";
import { ImageResponse } from "next/og";

type PwaIconVariant = "default" | "maskable" | "apple";

function CjEconomicsMark({
  size,
  background,
  foreground,
}: {
  size: number;
  background: string;
  foreground: string;
}) {
  const monogramWidth = Math.round(size * 0.68);
  const monogramHeight = Math.round(size * 0.68);
  const cFontSize = Math.round(size * 0.7);
  const jFontSize = Math.round(size * 0.54);
  const economicsFontSize = Math.max(18, Math.round(size * 0.13));

  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        background,
        color: foreground,
      }}
    >
      <div
        style={{
          display: "flex",
          position: "relative",
          width: monogramWidth,
          height: monogramHeight,
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: Math.round(monogramWidth * 0.02),
            top: Math.round(monogramHeight * 0.03),
            fontSize: cFontSize,
            fontWeight: 500,
            lineHeight: 0.78,
            letterSpacing: "-0.08em",
            fontFamily: "Georgia, Times New Roman, serif",
            color: foreground,
          }}
        >
          C
        </div>
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: Math.round(monogramWidth * 0.47),
            top: Math.round(monogramHeight * 0.32),
            fontSize: jFontSize,
            fontWeight: 600,
            lineHeight: 0.78,
            letterSpacing: "-0.08em",
            fontFamily: "Georgia, Times New Roman, serif",
            color: foreground,
          }}
        >
          J
        </div>
      </div>
      <div
        style={{
          display: "flex",
          marginTop: Math.round(size * 0.015),
          fontSize: economicsFontSize,
          fontWeight: 700,
          letterSpacing: "0.04em",
          lineHeight: 1,
          fontFamily: "Georgia, Times New Roman, serif",
          color: foreground,
        }}
      >
        ECONOMICS
      </div>
    </div>
  );
}

export function createPwaIcon(size: number, variant: PwaIconVariant = "default") {
  const isMaskable = variant === "maskable";
  const isApple = variant === "apple";
  const background = "#143f46";
  const foreground = "#ead1b0";
  const shellPadding = isMaskable
    ? Math.round(size * 0.16)
    : isApple
      ? Math.round(size * 0.13)
      : Math.round(size * 0.11);
  const logoScale = isMaskable ? 0.7 : isApple ? 0.76 : 0.8;
  const logoSize = Math.round(size * logoScale);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: shellPadding,
          background,
          color: foreground,
          overflow: "hidden",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CjEconomicsMark
            size={logoSize}
            background={background}
            foreground={foreground}
          />
        </div>
      </div>
    ),
    {
      width: size,
      height: size,
    },
  );
}
