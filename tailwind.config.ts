
import type { Config } from "tailwindcss";

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
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				brand: {
					blue: '#082646',
					yellow: '#a78940',
					offwhite: '#f6f0e1',
				},
				// Daryle AI semantic tokens (mapped to CSS vars in src/index.css).
				// Use `-daryle` suffix where a shadcn token already owns the base name.
				'bg-app': 'var(--color-bg-app)',
				'bg-sidebar': 'var(--color-bg-sidebar)',
				'bg-sidebar-deep': 'var(--color-bg-sidebar-deep)',
				'bg-surface': 'var(--color-bg-surface)',
				'bg-surface-soft': 'var(--color-bg-surface-soft)',
				'bg-surface-hover': 'var(--color-bg-surface-hover)',
				'bg-elevated': 'var(--color-bg-elevated)',
				'bg-input-daryle': 'var(--color-bg-input)',
				'text-primary-daryle': 'var(--color-text-primary)',
				'text-secondary-daryle': 'var(--color-text-secondary)',
				'text-muted-daryle': 'var(--color-text-muted)',
				'text-disabled-daryle': 'var(--color-text-disabled)',
				'text-inverse-daryle': 'var(--color-text-inverse)',
				'border-subtle': 'var(--color-border-subtle)',
				'border-default-daryle': 'var(--color-border-default)',
				'border-strong': 'var(--color-border-strong)',
				'border-gold': 'var(--color-border-gold)',
				'success-daryle': 'var(--color-success)',
				'success-soft': 'var(--color-success-soft)',
				'success-border': 'var(--color-success-border)',
				'warning-daryle': 'var(--color-warning)',
				'warning-soft': 'var(--color-warning-soft)',
				'warning-border': 'var(--color-warning-border)',
				'error-daryle': 'var(--color-error)',
				'error-soft': 'var(--color-error-soft)',
				'error-border': 'var(--color-error-border)',
				'info-daryle': 'var(--color-info)',
				'info-soft': 'var(--color-info-soft)',
				'info-border': 'var(--color-info-border)',
				'brand-primary': 'var(--color-brand-primary)',
				'brand-primary-hover': 'var(--color-brand-primary-hover)',
				'brand-primary-active': 'var(--color-brand-primary-active)',
				'brand-primary-soft': 'var(--color-brand-primary-soft)',
				'brand-primary-border': 'var(--color-brand-primary-border)',
			},
		fontFamily: {
			sans: ['Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
			serif: ['Lora', 'Georgia', 'serif'],
			heading: ['Lora', 'Georgia', 'serif'],
			body: ['Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
		},
			fontWeight: {
				normal: '400',
				medium: '500',
				semibold: '600',
				bold: '700',
				extrabold: '800',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				'card': 'var(--radius-lg)',
				'pill-daryle': 'var(--radius-pill)',
				'xs-daryle': 'var(--radius-xs)',
				'sm-daryle': 'var(--radius-sm)',
				'md-daryle': 'var(--radius-md)',
				'xl-daryle': 'var(--radius-xl)',
			},
			boxShadow: {
				'soft': 'var(--shadow-soft)',
				'elevated': 'var(--shadow-elevated)',
				'gold-glow': 'var(--shadow-gold-glow)',
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
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'fade-in-left': {
					'0%': {
						opacity: '0',
						transform: 'translateX(-20px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateX(0)'
					}
				},
				'fade-out-seamless': {
					'0%': {
						opacity: '1',
						transform: 'translateY(0)'
					},
					'100%': {
						opacity: '0',
						transform: 'translateY(-8px)'
					}
				},
				'step-enter': {
					'0%': {
						opacity: '0',
						transform: 'translateX(-10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateX(0)'
					}
				},
				// New smooth 60Hz thinking animations
				'thinking-fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(4px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'thinking-fade-out': {
					'0%': {
						opacity: '1',
						transform: 'translateY(0)'
					},
					'100%': {
						opacity: '0',
						transform: 'translateY(-4px)'
					}
				},
			'thinkingStepFade': {
				'0%': {
					opacity: '0',
					transform: 'translateY(6px)'
				},
				'100%': {
					opacity: '1',
					transform: 'translateY(0)'
				}
			},
			// Smooth 60fps typing dot animation - GPU accelerated
			'soft-pulse': {
				'0%, 100%': {
					transform: 'translateY(0) translateZ(0)',
					opacity: '0.4'
				},
				'50%': {
					transform: 'translateY(-6px) translateZ(0)',
					opacity: '1'
				}
			},
		},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'fade-in-left': 'fade-in-left 0.5s ease-out',
				'fade-out-seamless': 'fade-out-seamless 0.4s ease-out forwards',
				'step-enter': 'step-enter 0.25s ease-out forwards',
			// Smooth 60Hz thinking animations - slowed down for beautiful linear UX
			'thinking-fade-in': 'thinking-fade-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
			'thinking-fade-out': 'thinking-fade-out 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
			'thinking-step-fade': 'thinkingStepFade 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
			// 60fps smooth pulse for typing dots
			'soft-pulse': 'soft-pulse 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
		}
		}
	},
	plugins: [
		require("tailwindcss-animate"),
		function({ addUtilities }) {
			addUtilities({
				'.scrollbar-hide': {
					/* IE and Edge */
					'-ms-overflow-style': 'none',
					/* Firefox */
					'scrollbar-width': 'none',
					/* Safari and Chrome */
					'&::-webkit-scrollbar': {
						display: 'none'
					}
				}
			})
		}
	],
} satisfies Config;
