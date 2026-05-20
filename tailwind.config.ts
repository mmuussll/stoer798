import type { Config } from "tailwindcss";
import tailwindAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ["var(--font-sans)", "'Cairo'", 'system-ui', '-apple-system', 'sans-serif'],
				mono: ["'Cairo'", 'monospace'],
			},
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
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				info: {
					DEFAULT: 'hsl(var(--info))',
					foreground: 'hsl(var(--info-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				xl: 'calc(var(--radius) + 4px)',
				'2xl': 'calc(var(--radius) + 8px)',
			},
			boxShadow: {
				'sm': 'var(--shadow-sm)',
				'md': 'var(--shadow-md)',
				'lg': 'var(--shadow-lg)',
				'xl': 'var(--shadow-xl)',
				'glow': 'var(--shadow-glow)',
				'inner-sm': 'inset 0 1px 2px hsl(232 45% 12% / 0.04)',
			},
			transitionTimingFunction: {
				'premium': 'cubic-bezier(0.22, 1, 0.36, 1)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					from: { opacity: '0' },
					to: { opacity: '1' }
				},
				'fade-up': {
					from: { opacity: '0', transform: 'translateY(8px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				'fade-down': {
					from: { opacity: '0', transform: 'translateY(-8px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				'scale-in': {
					from: { opacity: '0', transform: 'scale(0.95)' },
					to: { opacity: '1', transform: 'scale(1)' }
				},
				'slide-in-right': {
					from: { transform: 'translateX(100%)' },
					to: { transform: 'translateX(0)' }
				},
				'shimmer': {
					'0%': { backgroundPosition: '200% 0' },
					'100%': { backgroundPosition: '-200% 0' }
				},
				'glow-breathe': {
					'0%, 100%': { boxShadow: '0 0 16px hsl(var(--primary) / 0.12)' },
					'50%': { boxShadow: '0 0 28px hsl(var(--primary) / 0.22)' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-4px)' }
				},
				'status-pulse': {
					'0%, 100%': { transform: 'scale(1)', opacity: '0.4' },
					'50%': { transform: 'scale(2.4)', opacity: '0' }
				},
				'spin-slow': {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
				'fade-up': 'fade-up 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
				'fade-down': 'fade-down 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
				'scale-in': 'scale-in 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
				'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
				'shimmer': 'shimmer 2s ease-in-out infinite',
				'glow-breathe': 'glow-breathe 3s ease-in-out infinite',
				'float': 'float 3s ease-in-out infinite',
				'status-pulse': 'status-pulse 2s ease-in-out infinite',
				'spin-slow': 'spin-slow 3s linear infinite',
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
				'gradient-brand': 'linear-gradient(135deg, hsl(240, 70%, 48%), hsl(262, 85%, 50%))',
				'gradient-sidebar': 'linear-gradient(180deg, hsl(236, 48%, 10%), hsl(236, 48%, 6%))',
				'gradient-card': 'linear-gradient(135deg, hsl(var(--card)), hsl(var(--background)))',
				'gradient-success': 'linear-gradient(135deg, hsl(160, 72%, 36%), hsl(160, 60%, 42%))',
				'gradient-warning': 'linear-gradient(135deg, hsl(40, 96%, 48%), hsl(36, 90%, 55%))',
				'gradient-destructive': 'linear-gradient(135deg, hsl(350, 89%, 58%), hsl(345, 80%, 52%))',
			},
		}
	},
	plugins: [tailwindAnimate],
} satisfies Config;
