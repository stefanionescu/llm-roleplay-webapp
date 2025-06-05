import {
    PiggyBankIcon,
    MusicNote01Icon,
    BookOpen01Icon,
    VegetarianFoodIcon,
    MaskTheater01Icon,
    FavouriteIcon,
    Building03Icon,
    Shirt01Icon,
    FireIcon,
    GraduationScrollIcon,
    WorkoutRunIcon,
} from '@hugeicons/core-free-icons';

export const iconMap: Record<string, typeof PiggyBankIcon> =
    {
        food: VegetarianFoodIcon, // Food
        music: MusicNote01Icon, // Lipsync & Dance
        book: BookOpen01Icon, // Books
        mask: MaskTheater01Icon, // Cosplay
        piggybank: PiggyBankIcon, // Luxury,
        heart: FavouriteIcon, // Dating
        building: Building03Icon, // London
        shirt: Shirt01Icon, // Fashion
        flame: FireIcon, // Kinky
        graduationcap: GraduationScrollIcon, // University
        workout: WorkoutRunIcon, // Wellness
    };

export const categoryToIcon = {
    cosplay: 'mask',
    luxury: 'piggybank',
    food: 'food',
    university: 'graduationcap',
};

export type IconKey = keyof typeof iconMap;
