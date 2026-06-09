import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#f97316",
          "orange-dark": "#ea580c",
          "orange-light": "#fb923c",
          black: "#0a0a0a",
          "black-soft": "#171717",
        },
      },
    },
  },
  plugins: [],
};
export default config;
