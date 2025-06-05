import { TCharacter } from '@/types/character';
import { CharacterCard } from '@/features/home/ui/components/characters/character-card';

type CharactersRowProps = {
    rowIndex: number;
    row: { id: string; character: TCharacter }[];
    grid: { id: string; character: TCharacter }[][];
};

export const CharactersRow = ({
    rowIndex,
    row,
    grid,
}: CharactersRowProps) => {
    return (
        <div
            className={`flex h-[120px] transition-all duration-300 ease-in-out max-md:h-[90px] ${
                rowIndex % 2 === 0
                    ? 'ml-[-40px]'
                    : 'ml-[40px]'
            } ${rowIndex === grid.length - 1 ? 'max-md:mb-8 md:mb-2' : ''}`}
        >
            {row.map(({ character, id }, colIndex) => (
                <div
                    key={`${id}-${colIndex}`}
                    className={`transition-all duration-300 ease-in-out`}
                >
                    <CharacterCard
                        characterId={id}
                        character={character}
                    />
                </div>
            ))}
        </div>
    );
};
