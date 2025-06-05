import { TBaseCharacter } from '@/types/character';
import { CharacterWithTranslationsResponse } from '@/types/db';
import { LinkedMapList } from '@/components/custom/lists/linked-map-list';

export const transformCharacters = (
    data: CharacterWithTranslationsResponse[],
) => {
    return data.map((character) => {
        // Create a LinkedMapList for translations
        const translationsList =
            new LinkedMapList<TBaseCharacter>();

        // Add each translation to the LinkedMapList
        character.translations.forEach((translation) => {
            translationsList.pushEnd(
                translation.language_code,
                {
                    name: translation.name,
                    bio: translation.bio,
                    display_hashtags:
                        translation.display_hashtags,
                    chat_starters:
                        translation.chat_starters,
                    system_prompt:
                        translation.system_prompt,
                    system_prompt_token_count:
                        translation.system_prompt_token_count,
                    initial_message:
                        translation.initial_message,
                    initial_message_token_count:
                        translation.initial_message_token_count,
                    initial_message_content:
                        translation.initial_message_content,
                },
            );
        });

        // Return the transformed character
        return {
            // Base character fields from TBaseCharacter
            name: character.name,
            bio: character.bio,
            display_hashtags: character.display_hashtags,
            chat_starters: character.chat_starters,
            system_prompt: character.system_prompt,
            system_prompt_token_count:
                character.system_prompt_token_count,
            initial_message: character.initial_message,
            initial_message_token_count:
                character.initial_message_token_count,
            initial_message_content:
                character.initial_message_content,

            // Additional TCharacter fields
            icon_url: character.icon_url,
            main_hashtags: character.main_hashtags,
            secondary_hashtags:
                character.secondary_hashtags,
            translations: translationsList,
            paused: character.paused,
        };
    });
};
