type ColorVariant = 'light' | 'dark';
type ColorMapping = Record<ColorVariant, string>;

export const IMPORTANT_CATEGORIES = [
    'food',
    'university',
    'cosplay',
];

export const EXPECTED_CATEGORY_NUMBER = 3;

export const categoryColorMap: Record<
    string,
    ColorMapping
> = {
    cosplay: {
        light: 'light_purple',
        dark: 'dark_purple',
    },
    food: {
        light: 'light_green',
        dark: 'dark_green',
    },
    university: {
        light: 'light_blue',
        dark: 'dark_blue',
    },
    luxury: {
        light: 'light_gold',
        dark: 'dark_gold',
    },
};
