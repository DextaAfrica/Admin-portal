/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      overrideBrowserslist: [
        "last 2 Chrome versions",
        "last 2 Firefox versions",
        "last 2 Safari versions",
        "last 2 Edge versions",
        "> 0.5%",
        "not dead",
        "not IE 11"
      ],
      flexbox: "no-2009",
    },
  },
};

export default config;

