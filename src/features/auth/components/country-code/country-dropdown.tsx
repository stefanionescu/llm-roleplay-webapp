import React from 'react';

import { Country } from '@/config/countries';
import { CountryListItem } from '@/features/auth/components/country-code/country-list-item';

type CountryDropdownProps = {
    isOpen: boolean;
    countries: Country[];
    selectedCountry: Country | null;
    onSelectCountry: (country: Country) => void;
};

export const CountryDropdown: React.FC<
    CountryDropdownProps
> = ({
    isOpen,
    countries,
    selectedCountry,
    onSelectCountry,
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="absolute left-0 top-full z-[100] mt-1 w-28 min-w-20 rounded-lg border border-zinc-500/20 bg-white shadow-lg duration-200 animate-in fade-in slide-in-from-top-2 dark:border-zinc-500/20 dark:bg-zinc-800"
            role="listbox"
        >
            <div className="max-h-[13.5rem] overflow-y-scroll [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {countries.map((country) => (
                    <CountryListItem
                        key={country.code}
                        country={country}
                        isSelected={
                            selectedCountry?.code ===
                            country.code
                        }
                        onSelect={onSelectCountry}
                    />
                ))}
            </div>
        </div>
    );
};
