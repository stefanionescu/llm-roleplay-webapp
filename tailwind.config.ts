import plugin from 'tailwindcss/plugin';
import type { Config } from 'tailwindcss';
import typographyPlugin from '@tailwindcss/typography';
import { fontFamily } from 'tailwindcss/defaultTheme';

const config = {
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './lib/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    prefix: '',
    theme: {
        screens: {
            sm: '640px',
            md: '768px',
            lg: '1024px',
            xl: '1280px',
            '2xl': '1536px',
        },
        container: {
            center: true,
            padding: '2rem',
            screens: {
                '2xl': '1400px',
            },
        },
        extend: {
            fontFamily: {
                sans: [
                    'var(--font-baloo2)',
                    ...fontFamily.sans,
                ],
            },
            colors: {
                zinc: {
                    '25': 'hsl(0, 0%, 99%, <alpha-value>)',
                    '50': 'hsl(0, 0%, 93.7%, <alpha-value>)',
                    '100': 'hsl(0, 0%, 87.8%, <alpha-value>)',
                    '200': 'hsl(0, 0%, 77%, <alpha-value>)',
                    '300': 'hsl(0, 0%, 66.3%, <alpha-value>)',
                    '400': 'hsl(0, 0%, 55.5%, <alpha-value>)',
                    '500': 'hsl(0, 0%, 45.1%, <alpha-value>)',
                    '600': 'hsl(0, 0%, 34.3%, <alpha-value>)',
                    '700': 'hsl(0, 0%, 23.5%, <alpha-value>)',
                    '800': 'hsl(0, 0%, 12.7%, <alpha-value>)',
                    '900': 'hsl(0, 0%, 5.9%, <alpha-value>)',
                    '950': 'hsl(0, 0%, 3.1%, <alpha-value>)',
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground:
                        'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground:
                        'hsl(var(--secondary-foreground))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground:
                        'hsl(var(--destructive-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground:
                        'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground:
                        'hsl(var(--accent-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground:
                        'hsl(var(--popover-foreground))',
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground:
                        'hsl(var(--card-foreground))',
                },
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))',
                },
            },
            fontSize: {
                xs: '0.8rem',
                sm: '0.875rem',
                base: '1rem',
                lg: '1.115rem',
                xl: '1.25rem',
                '2xl': '1.563rem',
                '3xl': '1.953rem',
                '4xl': '2.441rem',
                '5xl': '3.052rem',
            },
            fontWeight: {
                normal: '400',
                medium: '500',
                semibold: '550',
                bold: '650',
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            keyframes: {
                marquee: {
                    '0%': {
                        transform: 'translateX(0%)',
                    },
                    '100%': {
                        transform: 'translateX(-100%)',
                    },
                },
                marquee2: {
                    '0%': {
                        transform: 'translateX(100%)',
                    },
                    '100%': {
                        transform: 'translateX(0%)',
                    },
                },
                'fade-in': {
                    '0%': {
                        opacity: '0',
                    },
                    '100%': {
                        opacity: '1',
                    },
                },
                'fade-out': {
                    '0%': {
                        opacity: '1',
                    },
                    '100%': {
                        opacity: '0',
                    },
                },
                'pulse-bg': {
                    '0%, 100%': {
                        backgroundColor:
                            'hsl(var(--primary) / 0.1)',
                    },
                    '50%': {
                        backgroundColor:
                            'hsl(var(--primary) / 0.05)',
                    },
                },
            },
            animation: {
                'fade-in':
                    'fade-in 150ms ease-out forwards',
                'fade-out':
                    'fade-out 150ms ease-out forwards',
                'pulse-bg':
                    'pulse-bg 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            maxWidth: {
                '4xl': '56rem',
                '5xl': '64rem',
                '6xl': '72rem',
                '7xl': '80rem',
            },
            // Icon related constants
            icon: {
                stroke: '2',
                sizes: {
                    desktop: '20px',
                },
            },
        },
    },
    plugins: [
        typographyPlugin,
        require('tailwindcss-safe-area'),
        plugin(function ({ addUtilities }) {
            addUtilities({
                '.scrollbar-hide': {
                    '-ms-overflow-style': 'none',
                    'scrollbar-width': 'none',
                    '&::-webkit-scrollbar': {
                        display: 'none',
                    },
                },
                '.scrollbar-default': {
                    '-ms-overflow-style': 'auto',
                    'scrollbar-width': 'auto',
                    '&::-webkit-scrollbar': {
                        display: 'block',
                    },
                },
                '.size-menu-icon-desktop': {
                    width: '20px',
                    height: '20px',
                },
                '.stroke-menu-icon': {
                    'stroke-width': '2',
                },
                '.size-menu-icon-mobile': {
                    width: '15px',
                    height: '15px',
                },
                '.stroke-menu-icon-mobile': {
                    'stroke-width': '1.5',
                },
            });
        }),
        require('tailwindcss-animate'),
    ],
} satisfies Config;

export default config;
