/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./resources/**/*.blade.php", "./resources/**/*.{js,ts,jsx,tsx}"],
	darkMode: 'class',
	theme: {
		container: {
			center: true
		},
		extend: {
			colors: {
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					light: '#eaf1ff',
					'dark-light': 'rgba(67,97,238,.15)',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					light: '#ebe4f7',
					'dark-light': 'rgb(128 93 202 / 15%)',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				success: {
					DEFAULT: '#00ab55',
					light: '#ddf5f0',
					'dark-light': 'rgba(0,171,85,.15)'
				},
				danger: {
					DEFAULT: '#e7515a',
					light: '#fff5f5',
					'dark-light': 'rgba(231,81,90,.15)'
				},
				warning: {
					DEFAULT: '#e2a03f',
					light: '#fff9ed',
					'dark-light': 'rgba(226,160,63,.15)'
				},
				info: {
					DEFAULT: '#2196f3',
					light: '#e7f7ff',
					'dark-light': 'rgba(33,150,243,.15)'
				},
				dark: {
					DEFAULT: '#10121bff',
					light: '#eaeaec',
					'dark-light': 'rgba(59,63,92,.15)'
				},
				black: {
					DEFAULT: '#0e1726',
					light: '#e3e4eb',
					'dark-light': 'rgba(14,23,38,.15)'
				},
				white: {
					DEFAULT: '#ffffff',
					light: '#e0e6ed',
					dark: '#888ea8'
				},
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				}
			},
			fontFamily: {
				google_sans: [
					'Google Sans',
					'sans-serif'
				],
				nunito: [
					'Nunito',
					'sans-serif'
				]
			},
			spacing: {
				'4.5': '18px'
			},
			boxShadow: {
				'3xl': '0 2px 2px rgb(224 230 237 / 46%), 1px 6px 7px rgb(224 230 237 / 46%)'
			},
			keyframes: {
				float: {
                    '0%, 100%': { transform: 'translateY(0) scale(1)' },
                    '50%': { transform: 'translateY(-8px) scale(1.02)' },
                },
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' },
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' },
                },
                checkIn: {
                    from: { transform: 'scale(0) rotate(-10deg)', opacity: 0 },
                    to: { transform: 'scale(1) rotate(0deg)', opacity: 1 },
                },
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'check-in': 'checkIn 0.2s ease-out',
				'float': 'float 3s ease-in-out infinite',
            },
			typography: ({ theme }) => ({
				DEFAULT: {
					css: {
						"--tw-prose-invert-headings":
							theme("colors.white.dark"),
						"--tw-prose-invert-links": theme("colors.white.dark"),
						h1: {
							fontSize: "40px",
							marginBottom: "0.5rem",
							marginTop: 0,
						},
						h2: {
							fontSize: "32px",
							marginBottom: "0.5rem",
							marginTop: 0,
						},
						h3: {
							fontSize: "28px",
							marginBottom: "0.5rem",
							marginTop: 0,
						},
						h4: {
							fontSize: "24px",
							marginBottom: "0.5rem",
							marginTop: 0,
						},
						h5: {
							fontSize: "20px",
							marginBottom: "0.5rem",
							marginTop: 0,
						},
						h6: {
							fontSize: "16px",
							marginBottom: "0.5rem",
							marginTop: 0,
						},
						p: { marginBottom: "0.5rem" },
						li: { margin: 0 },
						img: { margin: 0 },
					},
				},
			}),
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			}
		}
	},
	plugins: [
		require("@tailwindcss/forms")({
			strategy: "class",
		}),
		require("@tailwindcss/typography"),
		require("tailwindcss-animate")
	],
};
