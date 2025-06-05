import { DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { MainMenuDropdownContent } from '@/features/sidebar/ui/components/main-menu-dropdown-content';

type MainMenuDropdownProps = {
    collapse?: () => void;
};

export const MainMenuDropdown = ({
    collapse,
}: MainMenuDropdownProps) => {
    const handleCollapse =
        collapse ??
        (() => {
            return;
        });

    return (
        <>
            <DropdownMenuContent
                className={`mr-2 px-4 text-sm max-md:w-full md:max-w-40 md:text-base`}
                align="end"
                side="left"
                sideOffset={4}
            >
                <MainMenuDropdownContent
                    collapse={handleCollapse}
                />
            </DropdownMenuContent>
        </>
    );
};
