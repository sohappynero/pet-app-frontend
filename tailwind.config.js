/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Microsoft YaHei"', '"Segoe UI"', "sans-serif"],
      },
      colors: {
        primary: "#ff7cb8",
        "primary-dark": "#ff5ca7",
        "primary-light": "#ffa5d4",
        "bg-from": "#b4f0ff",
        "bg-to": "#ffe7f4",
        "text-main": "#2d2a4a",
        "text-sub": "#5f5b88",
        accent: "#8c58ff",
      },
      borderRadius: {
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        "float-slow": "float-slow 5s ease-in-out infinite",
        "fade-in": "fade-in 0.5s ease-out both",
        wiggle: "wiggle 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
