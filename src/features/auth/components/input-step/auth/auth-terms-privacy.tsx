import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useShallow } from 'zustand/react/shallow';

import { Type } from '@/components/ui/type';
import { useStore } from '@/lib/zustand/store';

type AuthTermsPrivacyProps = {
    isSubmitting: boolean;
};

export const AuthTermsPrivacy = ({
    isSubmitting,
}: AuthTermsPrivacyProps) => {
    const t = useTranslations();
    const setIsAuthModalOpen = useStore(
        useShallow((state) => state.setIsAuthModalOpen),
    );

    const handleLinkClick = () => {
        setIsAuthModalOpen(false);
    };

    return (
        <div className="mt-2">
            <Type size="xs" textColor="tertiary">
                {t('auth.termsAgreement.prefix')}
                {''}
                <Link
                    href="/terms"
                    prefetch={false}
                    onClick={handleLinkClick}
                    className={`inline-block p-1 font-bold text-white underline decoration-slate-200/50 underline-offset-2 ${
                        isSubmitting
                            ? 'pointer-events-none opacity-70'
                            : 'cursor-pointer'
                    }`}
                >
                    {t('common.terms')}
                </Link>
                {''}
                {t('auth.termsAgreement.middle')}
                {''}
                <Link
                    href="/privacy"
                    prefetch={false}
                    onClick={handleLinkClick}
                    className={`inline-block p-1 font-bold text-white underline decoration-slate-200/50 underline-offset-2 ${
                        isSubmitting
                            ? 'pointer-events-none opacity-70'
                            : 'cursor-pointer'
                    }`}
                >
                    {t('common.privacyPolicy')}
                </Link>
                {t('auth.termsAgreement.suffix')}.
            </Type>
        </div>
    );
};
