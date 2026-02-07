/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: 'var(--color-primary, #f97316)', // Orange-500 fallback
                'background-light': '#ffffff',
                'background-dark': '#0f0f0f', // Near black for dark mode
            },
            fontFamily: {
                inter: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
