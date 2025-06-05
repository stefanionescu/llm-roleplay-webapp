import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import importPlugin from 'eslint-plugin-import';
import a11y from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import perfectionist from 'eslint-plugin-perfectionist';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';
import tailwind from 'eslint-plugin-tailwindcss';

export default [
    // Global ignores
    {
        ignores: [
            '**/node_modules/**',
            '**/.next/**',
            '**/.vercel/**',
            '**/dist/**',
            '**/out/**',
            '**/public/**',
            'convex/_generated/**',
            '**/eslint.config.js',
            '**/tailwind.config.js',
            '**/tailwind.config.ts',
        ],
    },

    // Base JS configurations (applied to all JS/JSX files)
    {
        files: ['**/*.{js,jsx}'],
        ...js.configs.recommended,
        languageOptions: {
            globals: {
                browser: true,
                node: true,
                es2021: true,
            },
        },
    },

    // Apply TypeScript recommended type-checked rules ONLY to TypeScript files by mapping each config
    ...tseslint.configs.recommendedTypeChecked.map(
        (config) => ({
            ...config,
            files: ['**/*.{ts,tsx}'], // Restrict to TS/TSX files only
        }),
    ),

    // Apply TypeScript stylistic type-checked rules ONLY to TypeScript files
    ...tseslint.configs.stylisticTypeChecked.map(
        (config) => ({
            ...config,
            files: ['**/*.{ts,tsx}'], // Restrict to TS/TSX files only
        }),
    ),

    // Additional TypeScript-specific settings and rules
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            '@typescript-eslint': tseslint.plugin,
        },
        rules: {
            '@typescript-eslint/no-unused-vars': 'off', // Covered by unused-imports
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-floating-promises':
                'warn',
            '@typescript-eslint/explicit-function-return-type':
                'off',
            '@typescript-eslint/ban-ts-comment': [
                'warn',
                { 'ts-ignore': 'allow-with-description' },
            ],
            '@typescript-eslint/no-misused-promises': [
                'error',
                {
                    checksVoidReturn: { attributes: false },
                },
            ],
            '@typescript-eslint/no-unused-expressions':
                'off',
            '@typescript-eslint/consistent-type-definitions':
                'off',
            '@typescript-eslint/prefer-nullish-coalescing':
                'off',
        },
    },

    // Shared settings for all files (JS/TS/JSX/TSX)
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        plugins: {
            react: reactPlugin,
            'react-hooks': reactHooks,
            'jsx-a11y': a11y,
            import: importPlugin,
            tailwindcss: tailwind,
            perfectionist: perfectionist,
            'unused-imports': unusedImports,
            '@next/next': nextPlugin,
        },
        settings: {
            react: {
                version: 'detect',
            },
            tailwindcss: {
                // Enable stricter validation for Tailwind classes
                callees: ['classnames', 'clsx', 'cn'],
                config: './tailwind.config.ts',
                cssFiles: ['**/*.css', '**/*.scss'],
                removeDuplicates: true,
                whitelist: [],
            },
            'tailwindcss/no-custom-classname': 'off',
            'tailwindcss/no-contradicting-classname':
                'error',
        },
        rules: {
            // General code style
            'max-lines': [
                'error',
                {
                    max: 410,
                    skipBlankLines: true,
                    skipComments: true,
                },
            ],
            'no-console': [
                'warn',
                { allow: ['warn', 'error'] },
            ],
            'no-debugger': 'warn',
            'no-unused-vars': 'off', // Handled by unused-imports

            // Import handling
            'unused-imports/no-unused-imports': 'error',
            'unused-imports/no-unused-vars': [
                'warn',
                {
                    vars: 'all',
                    varsIgnorePattern: '^_',
                    args: 'after-used',
                    argsIgnorePattern: '^_',
                },
            ],
            'import/order': 'off', // We use simple-import-sort instead

            // React rules
            'react/react-in-jsx-scope': 'off',
            'react/jsx-uses-react': 'off',
            'react/jsx-boolean-value': ['warn', 'never'],
            'react/self-closing-comp': 'warn',
            'react/prop-types': 'off',
            'react/jsx-key': 'warn',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': [
                'off',
                { enableDeferredValue: false },
            ],

            // Import sorting - revert to default alphabetical sort
            'perfectionist/sort-imports': [
                'error',
                {
                    type: 'line-length',
                    order: 'asc',
                    groups: [
                        // Enforce side effects first
                        'side-effect',
                        // Then packages
                        ['builtin', 'external'],
                        // Then internal/project paths
                        'internal-type',
                        'internal',
                        // Then relative paths
                        [
                            'parent-type',
                            'sibling-type',
                            'index-type',
                            'parent',
                            'sibling',
                            'index',
                        ],
                        // Then object imports (less common)
                        'object',
                        // Keep unknown last
                        'unknown',
                    ],
                },
            ],

            // Sort interfaces and types by length
            'perfectionist/sort-interfaces': [
                'error',
                {
                    type: 'line-length',
                    order: 'asc',
                },
            ],

            // Sort object types by length
            'perfectionist/sort-object-types': [
                'error',
                {
                    type: 'line-length',
                    order: 'asc',
                },
            ],

            // Sort enums by length
            'perfectionist/sort-enums': [
                'error',
                {
                    type: 'line-length',
                    order: 'asc',
                },
            ],

            // Sort array includes by length
            'perfectionist/sort-array-includes': [
                'error',
                {
                    type: 'line-length',
                    order: 'asc',
                },
            ],

            // Tailwind - enforce validation
            'tailwindcss/classnames-order': 'off',

            // --- Import Boundary Enforcement ---
            'import/no-restricted-paths': [
                'error',
                {
                    zones: [
                        // Prevent `types` from importing anything within src
                        {
                            target: './src/types/**/*!',
                            from: './src/**/*!',
                            except: [
                                './types',
                                './node_modules/',
                            ],
                        },
                        // Prevent `config` from importing most things
                        {
                            target: './src/config/**/*!',
                            from: [
                                './src/app/**/*!',
                                './src/components/**/*!',
                                './src/features/**/*!',
                                './src/hooks/**/*!',
                                './src/lib/**/*!',
                                './src/actions/**/*!',
                                './src/trpc/**/*!',
                                './src/validators/**/*!',
                            ],
                            message:
                                'Config should not import from other application layers.',
                        },
                        // Prevent `lib` from importing application layers
                        {
                            target: './src/lib/**/*!',
                            from: [
                                './src/app/**/*!',
                                './src/components/**/*!',
                                './src/features/**/*!',
                                './src/hooks/**/*!',
                                './src/actions/**/*!',
                                './src/trpc/**/*!',
                                './src/validators/**/*!',
                            ],
                            message:
                                'Lib should only import from types, config, or external packages.',
                        },
                        // Prevent `validators` from importing application layers
                        {
                            target: './src/validators/**/*!',
                            from: [
                                './src/app/**/*!',
                                './src/components/**/*!',
                                './src/features/**/*!',
                                './src/hooks/**/*!',
                                './src/lib/**/*!',
                                './src/actions/**/*!',
                                './src/trpc/**/*!',
                                './src/config/**/*!',
                            ],
                            message:
                                'Validators should only import from types or external packages.',
                        },
                        // Prevent `components/ui` from importing features, custom components, app, etc.
                        {
                            target: './src/components/ui/**/*!',
                            from: [
                                './src/features/**/*!',
                                './src/components/custom/**/*!',
                                './src/components/meta/**/*!',
                                './src/app/**/*!',
                                './src/actions/**/*!',
                                './src/trpc/**/*!',
                            ],
                            message:
                                'UI components should not import from features, custom components, app, actions, or tRPC.',
                        },
                        // Prevent `components/icons` from importing other components/features/app
                        {
                            target: './src/components/icons/**/*!',
                            from: [
                                './src/features/**/*!',
                                './src/components/custom/**/*!',
                                './src/components/meta/**/*!',
                                './src/components/ui/**/*!',
                                './src/app/**/*!',
                                './src/actions/**/*!',
                                './src/trpc/**/*!',
                                './src/hooks/**/*!',
                                './src/lib/**/*!',
                                './src/validators/**/*!',
                                './src/config/**/*!',
                                './src/types/**/*!',
                            ],
                            message:
                                'Icons should be self-contained.',
                        },
                        // Prevent shared `hooks` from importing components, features, app, actions, trpc
                        {
                            target: './src/hooks/**/*!',
                            from: [
                                './src/components/**/*!',
                                './src/features/**/*!',
                                './src/app/**/*!',
                                './src/actions/**/*!',
                                './src/trpc/**/*!',
                            ],
                            message:
                                'Shared hooks should not import from components, features, app, actions, or tRPC.',
                        },
                        // --- Feature-to-Feature Restrictions ---
                        // Zone for 'chat' feature
                        {
                            target: './src/features/chat/**/*!',
                            from: [
                                './src/app/**/*!',
                                './src/features/media/**/*!',
                                './src/features/home/**/*!',
                                './src/features/feedback/**/*!',
                                './src/features/language/**/*!',
                                './src/features/sidebar/**/*!',
                                './src/features/sessions/**/*!',
                            ],
                            message:
                                "Feature 'chat' cannot import directly from sibling features or the app directory.",
                        },
                        // Zone for 'media' feature
                        {
                            target: './src/features/media/**/*!',
                            from: [
                                './src/app/**/*!',
                                './src/features/chat/**/*!',
                                './src/features/home/**/*!',
                                './src/features/feedback/**/*!',
                                './src/features/language/**/*!',
                                './src/features/sidebar/**/*!',
                                './src/features/sessions/**/*!',
                            ],
                            message:
                                "Feature 'media' cannot import directly from sibling features or the app directory.",
                        },
                        // Zone for 'home' feature
                        {
                            target: './src/features/home/**/*!',
                            from: [
                                './src/app/**/*!',
                                './src/features/chat/**/*!',
                                './src/features/media/**/*!',
                                './src/features/feedback/**/*!',
                                './src/features/language/**/*!',
                                './src/features/sidebar/**/*!',
                                './src/features/sessions/**/*!',
                            ],
                            message:
                                "Feature 'home' cannot import directly from sibling features or the app directory.",
                        },
                        // Zone for 'feedback' feature
                        {
                            target: './src/features/feedback/**/*!',
                            from: [
                                './src/app/**/*!',
                                './src/features/chat/**/*!',
                                './src/features/media/**/*!',
                                './src/features/home/**/*!',
                                './src/features/language/**/*!',
                                './src/features/sidebar/**/*!',
                                './src/features/sessions/**/*!',
                            ],
                            message:
                                "Feature 'feedback' cannot import directly from sibling features or the app directory.",
                        },
                        // Zone for 'language' feature
                        {
                            target: './src/features/language/**/*!',
                            from: [
                                './src/app/**/*!',
                                './src/features/chat/**/*!',
                                './src/features/media/**/*!',
                                './src/features/home/**/*!',
                                './src/features/feedback/**/*!',
                                './src/features/sidebar/**/*!',
                                './src/features/sessions/**/*!',
                            ],
                            message:
                                "Feature 'language' cannot import directly from sibling features or the app directory.",
                        },
                        // Zone for 'sidebar' feature
                        {
                            target: './src/features/sidebar/**/*!',
                            from: [
                                './src/app/**/*!',
                                './src/features/chat/**/*!',
                                './src/features/media/**/*!',
                                './src/features/home/**/*!',
                                './src/features/feedback/**/*!',
                                './src/features/language/**/*!',
                                './src/features/sessions/**/*!',
                            ],
                            message:
                                "Feature 'sidebar' cannot import directly from sibling features or the app directory.",
                        },
                        // Zone for 'sessions' feature
                        {
                            target: './src/features/sessions/**/*!',
                            from: [
                                './src/app/**/*!',
                                './src/features/chat/**/*!',
                                './src/features/media/**/*!',
                                './src/features/home/**/*!',
                                './src/features/feedback/**/*!',
                                './src/features/language/**/*!',
                                './src/features/sidebar/**/*!',
                            ],
                            message:
                                "Feature 'sessions' cannot import directly from sibling features or the app directory.",
                        },
                    ],
                },
            ],
            // --- End Import Boundary ---

            // Next.js
            '@next/next/no-html-link-for-pages': 'warn',
        },
    },
];
