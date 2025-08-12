/** @type {import('tailwindcss').Config} */
module.exports = {
content: ['./**/*.html', './src/**/*.{js,ts,jsx,tsx}', './path/to/js/**/*.js'],
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

