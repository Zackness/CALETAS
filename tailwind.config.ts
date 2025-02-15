const { withUt } = require("uploadthing/tw")

import type { Config } from "tailwindcss";

const config = withUt ({
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'global-blue-1': '#000e16',
  		  'global-blue-2': '#0b151c',
  		  'global-blue-3': '#0f1d27',
  		  'global-green': '#58CC02',
  		  'global-green-2': '#3B841F',
  		  'global-green-3': '#296B0F',
  		  'global-red': '#C01515',
  		  'global-red-2': '#AA2727',
  		  'global-red-3': '#7E0202',
  		  'global-yellow': '#EAD70E',
  		  white: '#ffffff',
  		  black: '#000000',
  		  'monster-points': '#e8a923',
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require('@tailwindcss/typography'),],
} )satisfies Config;

export default config;