module.exports = {
  content: ["./app/**/*.{ts,tsx,jsx,js}"],
  presets: [require('@treasure-project/tailwind-config')],
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/forms")],
};
