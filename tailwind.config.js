/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                'munchkin-title': ['"Windlass"', '"IM Fell English SC"', '"Rye"', '"Metamorphous"', 'cursive'],
                'munchkin-body': ['"Caslon Antique"', '"IM Fell DW Pica"', '"IM Fell English"', 'serif'],
                'medieval': ['"MedievalSharp"', 'cursive'],
            },
            boxShadow: {
                'card': '0 0 0 1px rgba(0,0,0,0.5), 0 20px 40px -5px rgba(0,0,0,0.6)',
            }
        }
    },
    plugins: [],
}
