import { HeaderSection } from '@/features/home/ui/sections/header-section';
import { CategoriesSection } from '@/features/home/ui/sections/categories-section';
import { CharactersSection } from '@/features/home/ui/sections/characters-section';

export const HomeLayout = () => {
    return (
        <div
            className={`no-scrollbar h-full overflow-y-auto lg:h-screen`}
        >
            <HeaderSection />
            <CategoriesSection />
            <CharactersSection />
        </div>
    );
};
