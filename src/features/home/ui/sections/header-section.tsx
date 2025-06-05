import { HeaderText } from '../components/header/header-text';
import { HeaderImages } from '../components/header/header-images';

export const HeaderSection = () => {
    return (
        <div
            className={`no-scrollbar w-full flex-1 overflow-hidden`}
        >
            <div
                className={`mx-auto max-w-[900px] px-6 pt-16 sm:px-12`}
            >
                <div
                    className={`flex flex-col items-center gap-4`}
                >
                    <HeaderImages />
                    <HeaderText />
                </div>
            </div>
        </div>
    );
};
