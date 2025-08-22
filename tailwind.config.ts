import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
		"./client.html",
		"./guard.html",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '1rem',
			screens: {
				sm: '375px', // iPhone SE
				md: '390px', // iPhone 12/13/14
				lg: '414px', // iPhone Plus
				xl: '428px', // iPhone Pro Max
				'2xl': '480px' // Large phones
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				success: 'hsl(var(--success))',
				warning: 'hsl(var(--warning))',
			},
			spacing: {
				'safe-top': 'var(--safe-area-top)',
				'safe-bottom': 'var(--safe-area-bottom)',
				'safe-left': 'var(--safe-area-left)',
				'safe-right': 'var(--safe-area-right)',
				'touch': 'var(--touch-target)',
				'mobile': 'var(--mobile-padding)',
			},
      height: {
        'button': 'var(--button-height)',
        'button-sm': 'var(--button-height-sm)',
        'card': 'var(--card-height)',
        'hero': '40px',
        'touch': 'var(--touch-target)',
      },
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				'mobile': '12px',
				'button': '32px',
			},
      fontSize: {
        'hero': ['var(--hero-font-size)', 'var(--hero-line-height)'],
        'title': ['var(--title-font-size)', 'var(--title-line-height)'],
        'mobile-xl': ['24px', '28px'],    /* 20pt equivalent */
        'mobile-lg': ['20px', '24px'],    /* 16pt equivalent */
        'mobile-base': ['16px', '20px'],  /* 14pt equivalent */
        'mobile-sm': ['14px', '18px'],    /* 12pt equivalent */
      },
			fontWeight: {
				'hero': '700',
			},
			maxWidth: {
				'mobile': '420px',
				'card': '540px',
			},
			width: {
				'nav-pill': '92%',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'fade-in': {
					from: {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					to: {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'slide-up': {
					from: {
						transform: 'translateY(100%)'
					},
					to: {
						transform: 'translateY(0)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'slide-up': 'slide-up 0.3s ease-out'
			},
			zIndex: {
				'overlay': '2147483647',
				'modal': '1000',
				'dropdown': '500',
				'nav': '100',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
