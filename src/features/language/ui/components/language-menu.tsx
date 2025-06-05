'use client';

import { useCallback, useState } from 'react';

import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { LanguageMenuContent } from '@/features/language/ui/components/language-menu-content';

export const LanguageMenu = () => {
    const [languageOpen, setLanguageOpen] = useState(false);

    const handleOpenChange = useCallback(
        (open: boolean) => {
            setLanguageOpen(open);
        },
        [],
    );

    return (
        <DropdownMenu
            open={languageOpen}
            onOpenChange={handleOpenChange}
        >
            <LanguageMenuContent />
        </DropdownMenu>
    );
};
