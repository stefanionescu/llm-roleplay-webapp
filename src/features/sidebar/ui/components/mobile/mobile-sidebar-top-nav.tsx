import { useTranslations } from 'next-intl';
import { HugeiconsIcon } from '@hugeicons/react';
import { MenuCollapseIcon } from '@hugeicons/core-free-icons';

import { Button } from '@/components/ui/button';

import { MobileSidebarLogo } from './mobile-sidebar-logo';

type MobileSidebarTopNavProps = {
    collapse: () => void;
};

export const MobileSidebarTopNav = ({
    collapse,
}: MobileSidebarTopNavProps) => {
    const t = useTranslations();

    return (
        <div
            className={`sticky top-0 z-10 bg-secondary p-2`}
        >
            <div
                className={`flex items-center justify-between`}
            >
                <MobileSidebarLogo />
                <div className="flex items-center">
                    <Button
                        size="iconSm"
                        variant="ghost"
                        aria-label={t(
                            'common.collapseSidebar',
                        )}
                        className="my-1 flex items-center"
                        onClick={collapse}
                    >
                        <HugeiconsIcon
                            icon={MenuCollapseIcon}
                            className="size-30px"
                            fontVariant="stroke"
                        />
                    </Button>
                </div>
            </div>
            <div className="border-b border-border" />
        </div>
    );
};
