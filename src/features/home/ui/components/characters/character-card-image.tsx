import { Skeleton } from '@/components/ui/skeleton';
import { AuthImage } from '@/components/custom/media/auth-image';

type CharacterCardImageProps = {
    characterName: string;
    characterIconUrl: string;
};

export const CharacterCardImage = ({
    characterName,
    characterIconUrl,
}: CharacterCardImageProps) => {
    return (
        <div
            className={`flex shrink-0 items-center justify-center overflow-hidden max-md:h-[65px] max-md:w-[50px] max-md:rounded-lg md:h-[90px] md:w-[70px] md:rounded-xl`}
        >
            {characterIconUrl ? (
                <AuthImage
                    src={characterIconUrl}
                    alt={characterName}
                    width={70}
                    height={90}
                    className={`size-full transform-gpu object-cover object-center transition-opacity max-md:rounded-lg md:rounded-xl`}
                    style={{
                        willChange: 'transform, opacity',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                    }}
                />
            ) : (
                <Skeleton
                    className="size-full"
                    style={{
                        borderRadius: '0.5rem',
                    }}
                />
            )}
        </div>
    );
};
