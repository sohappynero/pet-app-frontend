interface MascotProps {
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

const sizeMap = {
  sm: { outer: 80, ear: 22, face: 64, eye: 8, nose: 6, paw: 14 },
  md: { outer: 110, ear: 30, face: 88, eye: 11, nose: 8, paw: 18 },
  lg: { outer: 140, ear: 38, face: 112, eye: 14, nose: 10, paw: 22 },
};

export default function Mascot({ size = "md", animate = true }: MascotProps) {
  const s = sizeMap[size];

  return (
    <div
      className={animate ? "animate-float" : ""}
      style={{
        width: s.outer,
        height: s.outer + 10,
        position: "relative",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      {/* 耳朵 */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: s.face,
          display: "flex",
          justifyContent: "space-between",
          paddingLeft: 6,
          paddingRight: 6,
        }}
      >
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{
              width: s.ear,
              height: s.ear,
              borderRadius: i === 0 ? "50% 50% 0 50%" : "50% 50% 50% 0",
              background: "linear-gradient(135deg, #ffd6ec, #ffb3d6)",
              boxShadow: "0 2px 6px rgba(255,124,184,0.35)",
            }}
          />
        ))}
      </div>

      {/* 脸 */}
      <div
        style={{
          width: s.face,
          height: s.face,
          borderRadius: "50%",
          background: "linear-gradient(145deg, #fff8fc, #fff0f7)",
          boxShadow: "0 6px 24px rgba(255,124,184,0.25), 0 2px 8px rgba(0,0,0,0.06)",
          position: "relative",
          border: "2px solid rgba(255,200,230,0.6)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}
      >
        {/* 眼睛 */}
        <div style={{ display: "flex", gap: s.face * 0.2, marginTop: s.face * 0.05 }}>
          {[0, 1].map((i) => (
            <div key={i} style={{ position: "relative" }}>
              <div
                style={{
                  width: s.eye,
                  height: s.eye,
                  borderRadius: "50%",
                  background: "#2d2a4a",
                }}
              />
              {/* 高光 */}
              <div
                style={{
                  position: "absolute",
                  top: 1,
                  right: 1,
                  width: s.eye * 0.4,
                  height: s.eye * 0.4,
                  borderRadius: "50%",
                  background: "#fff",
                }}
              />
            </div>
          ))}
        </div>

        {/* 鼻子 */}
        <div
          style={{
            width: s.nose,
            height: s.nose * 0.7,
            borderRadius: "50%",
            background: "#ff9ec4",
            marginTop: 2,
          }}
        />

        {/* 嘴 */}
        <div
          style={{
            width: s.face * 0.22,
            height: s.face * 0.1,
            borderBottom: "2px solid #ffb3d6",
            borderRadius: "0 0 50% 50%",
            marginTop: 1,
          }}
        />

        {/* 腮红 */}
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "52%",
              [i === 0 ? "left" : "right"]: s.face * 0.07,
              width: s.face * 0.18,
              height: s.face * 0.1,
              borderRadius: "50%",
              background: "rgba(255,160,200,0.45)",
            }}
          />
        ))}
      </div>

      {/* 爪子 */}
      <div
        style={{
          position: "absolute",
          bottom: -4,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 6,
        }}
      >
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{
              width: s.paw,
              height: s.paw * 0.7,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #ffd6ec, #ffb3d6)",
              boxShadow: "0 2px 6px rgba(255,124,184,0.3)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
