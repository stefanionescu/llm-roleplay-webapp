import { useTranslations } from 'next-intl';

export const HeaderText = () => {
    const t = useTranslations();

    return (
        <div
            className={`flex flex-col items-center text-center`}
        >
            <h1
                className={`font-bold max-md:text-xl md:text-2xl`}
            >
                {t('homepage.title')}
            </h1>
            <p
                className={`max-md:text-md mt-2 px-2.5 md:text-lg`}
            >
                {t('homepage.subtitle')}
            </p>
        </div>
    );
};
