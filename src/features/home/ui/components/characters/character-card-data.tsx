type CharacterCardDataProps = {
    characterBio: string;
    characterName: string;
    characterHashtags: string[];
};

export const CharacterCardData = ({
    characterName,
    characterBio,
    characterHashtags,
}: CharacterCardDataProps) => {
    return (
        <div
            className={`ml-3 flex size-full flex-col overflow-hidden max-md:justify-between md:justify-between`}
        >
            <div
                className={`relative flex w-full flex-col justify-center max-md:mb-0.5 md:mb-2`}
            >
                <p
                    className={`mb-1 line-clamp-1 w-full overflow-hidden text-ellipsis text-sm font-bold leading-tight`}
                >
                    {characterName}
                </p>

                <p
                    className={`line-clamp-2 w-full overflow-hidden text-ellipsis text-xs font-normal text-foreground`}
                >
                    {characterBio}
                </p>
            </div>

            <div className="flex items-center">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    width="14"
                    height="14"
                    className="text-muted-foreground"
                >
                    <path
                        d="M10 3L6 21M18 3l-4 18M4 8h17M3 16h17"
                        stroke="currentColor"
                        strokeLinecap="square"
                        strokeLinejoin="round"
                        strokeWidth="2"
                    />
                </svg>

                <p
                    className={`ml-1 truncate whitespace-nowrap text-sm text-muted-foreground`}
                >
                    {characterHashtags
                        .map((tag) => tag.toLowerCase())
                        .join(', ')}
                </p>
            </div>
        </div>
    );
};
