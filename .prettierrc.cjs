/** @type {import('prettier').Config} */
module.exports = {
    plugins: ['prettier-plugin-tailwindcss'],
    tailwindConfig: './tailwind.config.ts',
    semi: true,
    singleQuote: true,
    printWidth: 60,
    tabWidth: 4,
    trailingComma: 'all',
    bracketSpacing: true,
    arrowParens: 'always',
};
