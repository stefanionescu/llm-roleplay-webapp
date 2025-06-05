import { VariantProps } from 'class-variance-authority';

import { Type } from '@/components/ui/type';
import { Badge } from '@/components/ui/badge';
import { badgeVariants } from '@/components/ui/badge';

type CharacterInfoDetailsProps = {
    characterBio: string;
    commonTraits: string;
    characterName: string;
    characterHashtags: string[];
    badgeVariant: VariantProps<
        typeof badgeVariants
    >['variant'];
};

export const CharacterInfoDetails = ({
    characterName,
    characterBio,
    characterHashtags,
    commonTraits,
    badgeVariant,
}: CharacterInfoDetailsProps) => {
    return (
        <>
            <div className="mb-1 max-md:h-4 md:h-6">
                <Type size="lg" textColor="primary">
                    {characterName}
                </Type>
            </div>

            <Type
                size="sm"
                textColor="primary"
                className="max-w-[400px] px-4 text-center"
            >
                {characterBio}
            </Type>

            {characterHashtags &&
                characterHashtags.length > 0 && (
                    <Badge
                        className="mx-1 my-2 gap-1 whitespace-normal text-center"
                        variant={badgeVariant}
                    >
                        {commonTraits}:{' '}
                        {characterHashtags.join(', ')}
                    </Badge>
                )}
        </>
    );
};
