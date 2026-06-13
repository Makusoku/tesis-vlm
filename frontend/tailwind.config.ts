import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: "#f6f2eb",
          100: "#eadfce",
          700: "#5b3a24",
          900: "#24150c",
        },
        canopy: {
          50: "#f3f8f1",
          100: "#dcefd8",
          700: "#2f6b43",
          900: "#10251b",
        },
      },
      boxShadow: {
        panel: "0 18px 60px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
