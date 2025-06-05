import { Flex } from '@/components/ui/flex';
import { Type } from '@/components/ui/text';
import { AuthImage } from '@/components/custom/media/auth-image';
import {
    formatRelativeTime,
    type TimeTranslations,
} from '@/lib/utils/time';

type SessionCharacterInfoProps = {
    lastUpdatedAt: Date;
    characterName: string;
    characterImageUrl: string;
    timeTranslations: TimeTranslations;
};

export const SessionCharacterInfo = ({
    characterImageUrl,
    characterName,
    lastUpdatedAt,
    timeTranslations,
}: SessionCharacterInfoProps) => {
    return (
        <>
            <div
                className={`relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full`}
            >
                {characterImageUrl ? (
                    <AuthImage
                        src={characterImageUrl}
                        alt={characterName}
                        width={10}
                        height={10}
                        className="size-full object-cover"
                    />
                ) : (
                    <div
                        className={`size-full bg-zinc-700`}
                    />
                )}
            </div>

            <Flex
                direction="col"
                items="start"
                className="w-full"
            >
                <Type
                    className="line-clamp-1"
                    size="sm"
                    textColor="primary"
                    weight="medium"
                >
                    {characterName}
                </Type>

                <Type
                    className="line-clamp-1"
                    size="xs"
                    textColor="secondary"
                >
                    {formatRelativeTime(
                        lastUpdatedAt,
                        timeTranslations,
                    )}
                </Type>
            </Flex>
        </>
    );
};
