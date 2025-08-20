/** @type {import('tailwindcss').Config} */
module.exports = {
content: ['./**/*.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pastel: {
          pink: '#FFD6E8',
          lilac: '#E8D6FF',
          violet: '#C9A7FF',
          coral: '#FFB4A2',
          mint: '#CFFFE6',
          dark: '#6B3E7A',
          bg: '#FFF8FF'
        }
      },
      fontFamily: {
        retro: ['"Poppins"', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        'kawaii-soft': '0 6px 18px rgba(107,62,122,0.08)',
        'kawaii-glow': '0 0 24px rgba(201,167,255,0.15)'
      },
    },
  },
  theme: {
	extend:{
		colors: {
			text: '#FFFFFF',
   			primary: '#402D33',
        			secondary: '#AD7B8A',
        			accent: '#C7426A',
        			background: '#FFB5CB',
				},
			fontFamily: {
			boldins: ['Boldins', 'sans-serif'],
			},
	},
	},
  plugins: [],
};

