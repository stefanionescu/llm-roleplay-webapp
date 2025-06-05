'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

import { useCharacterId } from '@/hooks/data/use-character-id';
import { useStopInference } from '@/hooks/inference/use-stop-inference';

export const MobileSidebarLogo = () => {
    const pathname = usePathname();
    const isHomePage = pathname === '/';
    const characterId = useCharacterId() ?? '';
    const { stopGeneration } =
        useStopInference(characterId);

    const logoImage = (
        <Image
            src="/sidebar-logo.webp"
            alt="LLM Roleplay Logo"
            width={52}
            height={22}
            className="ml-1"
            priority
        />
    );

    if (isHomePage) {
        return <div className="mt-1">{logoImage}</div>;
    }

    return (
        <Link
            href="/"
            prefetch={false}
            onClick={stopGeneration()}
            className="mt-1 block"
        >
            {logoImage}
        </Link>
    );
};
