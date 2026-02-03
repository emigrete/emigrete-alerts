/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#09090b',
        'dark-card': '#18181b',
        'dark-secondary': '#27272a',
        'primary': '#9146FF',
        'dark-text': '#e4e4e7',
        'dark-muted': '#a1a1aa',
        'dark-border': '#27272a',
        'cafecito': '#0ec2c2',
        'paypal': '#0070ba',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
