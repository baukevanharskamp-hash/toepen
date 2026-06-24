import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#11130f",
        felt: "#183d2d",
        cream: "#f6efd9",
        lime: "#c9f14a",
        amber: "#f4b942",
      },
      boxShadow: {
        card: "0 14px 32px rgba(3, 12, 8, .24)",
      },
    },
  },
  plugins: [],
};

export default config;
