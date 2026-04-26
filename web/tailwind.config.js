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
                primary: 'var(--color-primary, #d4af37)', // Premium Gold / Champagne
                'zinc-dark': '#09090b',
                'evolution-indigo': '#1e1b4b', // Midnight Blue
                border: 'rgba(255, 255, 255, 0.1)',
                background: {
                    DEFAULT: '#09090b',
                    light: '#f8fafc',
                    dark: '#0f172a', // Slate dark for a more blueish premium dark
                },
                accent: {
                    DEFAULT: '#d4af37',
                    foreground: '#1e1b4b',
                },
            },
            fontFamily: {
                sans: ['Inter', 'Geist Sans', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            backdropBlur: {
                xs: '2px',
            },
            boxShadow: {
                'glow': '0 0 15px -3px rgba(99, 102, 241, 0.3)',
            },
        },
    },
    plugins: [
        require("tailwindcss-animate"),
    ],
}
