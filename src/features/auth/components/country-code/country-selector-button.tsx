import React from 'react';
import { IoChevronDown } from 'react-icons/io5';
import ReactCountryFlag from 'react-country-flag';

import { Country } from '@/config/countries';

type CountrySelectorButtonProps = {
    isOpen: boolean;
    disabled: boolean;
    onClick: () => void;
    selectedCountry: Country | null;
};

export const CountrySelectorButton: React.FC<
    CountrySelectorButtonProps
> = ({ isOpen, disabled, selectedCountry, onClick }) => {
    if (!selectedCountry) return null;

    const buttonClasses = `
    flex h-12 items-center justify-between rounded-l-full border border-zinc-500/20 
    bg-white px-3 text-xs text-zinc-800 transition-colors md:text-[0.850rem] 
    dark:bg-zinc-800 dark:text-zinc-100 ${
        disabled
            ? 'cursor-not-allowed opacity-50 disabled:hover:opacity-50'
            : `cursor-pointer opacity-100 ${isOpen ? 'opacity-80' : 'hover:opacity-80'}`
    }
  `;

    const chevronClasses = `ml-1 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`;

    return (
        <button
            type="button"
            className={buttonClasses}
            onClick={onClick}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-label={
                selectedCountry?.name || 'Select country'
            }
        >
            <div className="flex items-center">
                <ReactCountryFlag
                    countryCode={selectedCountry.code}
                    svg
                    className="text-base"
                    title={selectedCountry.name}
                    aria-label={selectedCountry.name}
                    loading="lazy"
                />
                <span className="ml-1">
                    {selectedCountry.dialCode}
                </span>
            </div>
            <IoChevronDown
                size={12}
                className={chevronClasses}
            />
        </button>
    );
};
