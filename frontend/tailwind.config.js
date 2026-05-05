/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: This has to be manually kept in sync with the content array in babel.config.js for nativewind/babel
  content: ["./app/**/*.{js,jsx,ts,tsx}",
           "./components/**/*.{js,jsx,ts,tsx}",
      "./app/(tabs)/**/*.{js,jsx,ts,tsx}",
       "./app/(auth)/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
}