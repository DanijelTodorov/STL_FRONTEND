const withMT = require("@material-tailwind/react/utils/withMT");

module.exports = withMT({
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
    },
    colors: {
      "baseColor": "#FB8245",
      "baseHoverColor": "#fc5400",
      "firstColor": "#FB8245",
      "secondColor": "#fc5400",
      "slate-tableHeader": "#ffffff12",
      "slate-title": "#FB8245",
      "slate-900": "#1f252d",
      "slate-950": "#ffffff0d",
      "slate-500": "#ffffff05",
      "blue-950": "#142B69"
    }
  },
  plugins: [],
});
