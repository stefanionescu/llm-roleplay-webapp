import { HugeiconsIcon } from '@hugeicons/react';
import { Tick02Icon } from '@hugeicons/core-free-icons';
import { VariantProps } from 'class-variance-authority';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { badgeVariants } from '@/components/ui/badge';
import { AuthImage } from '@/components/custom/media/auth-image';

type CharacterInfoMainProps = {
    iconUrl: string;
    categoryName: string;
    characterName: string;
    icon: typeof Tick02Icon;
    badgeVariant: VariantProps<
        typeof badgeVariants
    >['variant'];
};

export const CharacterInfoMain = ({
    badgeVariant,
    categoryName,
    iconUrl,
    icon,
    characterName,
}: CharacterInfoMainProps) => {
    return (
        <>
            <Badge
                className="flex h-7 items-center justify-center gap-1 self-center"
                variant={badgeVariant}
            >
                <HugeiconsIcon icon={icon} size={16} />{' '}
                {categoryName}
            </Badge>

            <div className="relative size-32 self-center overflow-hidden rounded-full md:size-36">
                {iconUrl ? (
                    <AuthImage
                        src={iconUrl}
                        alt={characterName}
                        width={144}
                        height={144}
                        className="size-full object-cover"
                    />
                ) : (
                    <Skeleton className="size-full rounded-full" />
                )}
            </div>
        </>
    );
};
