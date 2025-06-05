import { useTranslations } from 'next-intl';
import {
    FcPhoneAndroid,
    FcBusinessContact,
} from 'react-icons/fc';

import { Button } from '@/components/ui/button';

type AuthMode = 'email' | 'phone';

type AuthSwitchModeButtonProps = {
    authMode: AuthMode;
    onSwitchMode: () => void;
};

export const AuthSwitchModeButton = ({
    authMode,
    onSwitchMode,
}: AuthSwitchModeButtonProps) => {
    const t = useTranslations();

    return (
        <Button
            className="w-[90%] border border-zinc-200 bg-white text-black [&:hover]:border-zinc-200 [&:hover]:bg-white [&:hover]:text-black"
            rounded="full"
            size="default"
            variant="outline"
            onClick={onSwitchMode}
        >
            {authMode === 'email' ? (
                <>
                    <FcPhoneAndroid size={22} />
                    {t('auth.usePhoneNumber')}
                </>
            ) : (
                <>
                    <FcBusinessContact size={22} />
                    {t('auth.useEmail')}
                </>
            )}
        </Button>
    );
};
