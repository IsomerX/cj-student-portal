import * as React from "react";
import { ImageResponse } from "next/og";

type PwaIconVariant = "default" | "maskable" | "apple";

export function createPwaIcon(size: number, variant: PwaIconVariant = "default") {
  const padding =
    variant === "maskable" ? Math.round(size * 0.18) : variant === "apple" ? Math.round(size * 0.12) : Math.round(size * 0.1);
  const brandMarkSize = Math.round(size * 0.34);
  const livePillFontSize = Math.round(size * 0.08);
  const titleFontSize = Math.round(size * 0.16);
  const subtitleFontSize = Math.round(size * 0.075);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          padding,
          background:
            "radial-gradient(circle at top right, rgba(202,218,178,0.42), rgba(202,218,178,0) 42%), linear-gradient(135deg, #1f2b13 0%, #283618 52%, #3b5722 100%)",
          color: "#fffbe7",
          position: "relative",
          overflow: "hidden",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 55%)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            width: "100%",
            height: "100%",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: brandMarkSize,
                height: brandMarkSize,
                borderRadius: Math.round(brandMarkSize * 0.28),
                background: "#fffbe7",
                color: "#283618",
                fontSize: Math.round(size * 0.15),
                fontWeight: 800,
                letterSpacing: "-0.04em",
                boxShadow: "0 18px 36px rgba(0,0,0,0.16)",
              }}
            >
              CJ
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 9999,
                padding: `${Math.round(size * 0.03)}px ${Math.round(size * 0.055)}px`,
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.18)",
                fontSize: livePillFontSize,
                fontWeight: 700,
                letterSpacing: "0.12em",
              }}
            >
              LIVE
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: Math.round(size * 0.03),
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: titleFontSize,
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 1,
              }}
            >
              Student
            </div>
            <div
              style={{
                display: "flex",
                fontSize: subtitleFontSize,
                fontWeight: 600,
                letterSpacing: "0.12em",
                opacity: 0.92,
                textTransform: "uppercase",
              }}
            >
              School Dost
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
