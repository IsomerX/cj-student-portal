import * as React from "react";
import { ImageResponse } from "next/og";

type PwaIconVariant = "default" | "maskable" | "apple";

function SchoolDostMark({
  size,
  navy,
  green,
  blue,
}: {
  size: number;
  navy: string;
  green: string;
  blue: string;
}) {
  const circleSize = Math.round(size * 0.16);
  const bodyWidth = Math.round(size * 0.22);
  const bodyHeight = Math.round(size * 0.18);
  const pageWidth = Math.round(size * 0.31);
  const pageHeight = Math.round(size * 0.16);
  const stroke = Math.max(4, Math.round(size * 0.028));
  const bodyTop = Math.round(size * 0.22);
  const bookTop = Math.round(size * 0.48);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: size,
        height: size,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: Math.round(size * 0.03),
          top: Math.round(size * 0.06),
          width: circleSize,
          height: circleSize,
          borderRadius: 9999,
          background: green,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: Math.round(size * 0.34),
          top: 0,
          width: circleSize,
          height: circleSize,
          borderRadius: 9999,
          background: blue,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: Math.round(size * 0.04),
          top: bodyTop,
          width: bodyWidth,
          height: bodyHeight,
          borderTopLeftRadius: Math.round(bodyWidth * 0.5),
          borderTopRightRadius: Math.round(bodyWidth * 0.5),
          borderBottomLeftRadius: Math.round(bodyWidth * 0.18),
          borderBottomRightRadius: Math.round(bodyWidth * 0.18),
          background: green,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: Math.round(size * 0.25),
          top: Math.round(size * 0.26),
          width: Math.round(size * 0.28),
          height: Math.round(size * 0.14),
          borderTopLeftRadius: Math.round(size * 0.2),
          borderTopRightRadius: Math.round(size * 0.2),
          borderBottomLeftRadius: Math.round(size * 0.12),
          borderBottomRightRadius: Math.round(size * 0.12),
          background: blue,
          transform: "rotate(18deg)",
          transformOrigin: "left center",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: Math.round(size * 0.1),
          top: bookTop,
          width: pageWidth,
          height: pageHeight,
          border: `${stroke}px solid ${navy}`,
          borderTopLeftRadius: Math.round(size * 0.08),
          borderTopRightRadius: Math.round(size * 0.04),
          borderBottomLeftRadius: Math.round(size * 0.1),
          borderBottomRightRadius: Math.round(size * 0.08),
          borderRightWidth: Math.max(2, Math.round(stroke * 0.6)),
          background: "transparent",
          transform: "skewY(10deg) rotate(-10deg)",
          transformOrigin: "bottom right",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: Math.round(size * 0.31),
          top: bookTop,
          width: pageWidth,
          height: pageHeight,
          border: `${stroke}px solid ${navy}`,
          borderTopLeftRadius: Math.round(size * 0.04),
          borderTopRightRadius: Math.round(size * 0.08),
          borderBottomLeftRadius: Math.round(size * 0.08),
          borderBottomRightRadius: Math.round(size * 0.1),
          borderLeftWidth: Math.max(2, Math.round(stroke * 0.6)),
          background: "transparent",
          transform: "skewY(-10deg) rotate(10deg)",
          transformOrigin: "bottom left",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: Math.round(size * 0.285),
          top: Math.round(size * 0.53),
          width: Math.round(size * 0.08),
          height: Math.round(size * 0.22),
          borderRadius: 9999,
          background: navy,
        }}
      />
    </div>
  );
}

export function createPwaIcon(size: number, variant: PwaIconVariant = "default") {
  const isMaskable = variant === "maskable";
  const isApple = variant === "apple";
  const navy = "#10255a";
  const green = "#6f9a50";
  const blue = "#0a5bb2";
  const shellPadding = isMaskable
    ? Math.round(size * 0.16)
    : isApple
      ? Math.round(size * 0.12)
      : Math.round(size * 0.1);
  const logoScale = isMaskable ? 0.76 : isApple ? 0.82 : 0.84;
  const logoSize = Math.round(size * logoScale);
  const markSize = Math.round(logoSize * 0.36);
  const titleFontSize = Math.round(logoSize * 0.14);
  const subtitleFontSize = Math.round(logoSize * 0.16);
  const gap = Math.round(logoSize * 0.05);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: shellPadding,
          background: "linear-gradient(180deg, #efe6c8 0%, #ece5c8 52%, #e6dec0 100%)",
          color: navy,
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
            gap,
          }}
        >
          <SchoolDostMark size={markSize} navy={navy} green={green} blue={blue} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: Math.max(4, Math.round(logoSize * 0.01)),
              marginTop: Math.round(logoSize * 0.01),
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: titleFontSize,
                fontWeight: 700,
                letterSpacing: "-0.05em",
                lineHeight: 0.95,
                color: navy,
              }}
            >
              School
            </div>
            <div
              style={{
                display: "flex",
                fontSize: subtitleFontSize,
                fontWeight: 800,
                letterSpacing: "-0.05em",
                lineHeight: 0.95,
                color: navy,
              }}
            >
              Dost
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: size,
      height: size,
    },
  );
}
