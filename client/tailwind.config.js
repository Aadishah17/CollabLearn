/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Force class-based dark mode
    theme: {
        extend: {
            colors: {
                brand: {
                    primary: '#DC2626',      // red-600
                    'primary-light': '#EF4444', // red-500
                    'primary-dark': '#991B1B',  // red-800
                    secondary: '#000000',     // black
                    'secondary-light': '#18181B', // zinc-900
                    accent: '#FFFFFF',        // white
                    'accent-dark': '#F4F4F5', // zinc-100
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
