/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{js,jsx,tsx}",
    "./pages/**/*.{js,jsx,tsx}",
    "./components/**/*.{js,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"], 
        mulish: ["Mulish", "sans-serif"],// Inter is the default font
      },
    },
  },
    plugins: [require('@tailwindcss/line-clamp')],

};

export default config;
