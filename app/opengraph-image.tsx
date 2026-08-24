import { ImageResponse } from "next/og";

export const alt = "ORBYVEN CREATIVE — Web Design & Digital Experiences";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#050505",
          color: "#f5f5f7",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 760,
            height: 760,
            borderRadius: "50%",
            border: "1px solid rgba(139,135,255,.18)",
            left: 610,
            top: -80,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 560,
            height: 560,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,.08)",
            left: 710,
            top: 20,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 360,
            height: 360,
            borderRadius: "50%",
            border: "1px solid rgba(139,135,255,.14)",
            left: 810,
            top: 120,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#4b46ee",
            left: 1040,
            top: 78,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "64px 72px",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 18,
              letterSpacing: "0.22em",
              color: "#8c8c92",
              fontWeight: 700,
            }}
          >
            ORBYVEN CREATIVE
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 82,
                lineHeight: 0.95,
                letterSpacing: "-0.06em",
                fontWeight: 700,
                maxWidth: 850,
              }}
            >
              We build what gets remembered.
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 34,
                fontSize: 23,
                lineHeight: 1.4,
                color: "#a1a1a6",
                maxWidth: 720,
              }}
            >
              Web design & digital experiences.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              color: "#77777d",
              fontSize: 17,
            }}
          >
            <div
              style={{
                width: 34,
                height: 1,
                background: "rgba(255,255,255,.2)",
              }}
            />
            Built by ORBYVEN.
          </div>
        </div>
      </div>
    ),
    size
  );
}
