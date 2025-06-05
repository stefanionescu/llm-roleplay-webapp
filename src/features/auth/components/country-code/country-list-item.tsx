import React from 'react';
import ReactCountryFlag from 'react-country-flag';

import { Country } from '@/config/countries';

type CountryListItemProps = {
    country: Country;
    isSelected: boolean;
    onSelect: (country: Country) => void;
};

export const CountryListItem: React.FC<
    CountryListItemProps
> = ({ country, isSelected, onSelect }) => {
    return (
        <div
            className="flex cursor-pointer select-none items-center gap-2 rounded-lg px-2 py-3 text-xs font-medium outline-none transition-colors hover:bg-zinc-50 hover:text-zinc-800 md:text-sm dark:hover:bg-black/30 dark:hover:text-white"
            onClick={() => onSelect(country)}
            role="option"
            aria-selected={isSelected}
        >
            <ReactCountryFlag
                countryCode={country.code}
                svg
                className="text-base"
                title={country.name}
                loading="lazy"
            />
            <span>{country.dialCode}</span>
        </div>
    );
};
