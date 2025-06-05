'use client';

import React from 'react';
import { useState, useEffect, useRef } from 'react';

import { countries, Country } from '@/config/countries';
import { CountryDropdown } from '@/features/auth/components/country-code/country-dropdown';
import { CountrySelectorButton } from '@/features/auth/components/country-code/country-selector-button';

export type CountryCodePickerProps = {
    value: string;
    disabled?: boolean;
    className?: string;
    onChange: (value: string) => void;
};

const CountryCodePicker: React.FC<
    CountryCodePickerProps
> = ({
    value,
    onChange,
    disabled = false,
    className = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCountry, setSelectedCountry] =
        useState<Country | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Initialize selected country on mount or when value changes
    useEffect(() => {
        const country =
            countries.find((c) => c.dialCode === value) ||
            countries.find((c) => c.code === 'US') ||
            countries[0];
        setSelectedCountry(country);
    }, [value]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(
                    event.target as Node,
                )
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener(
            'mousedown',
            handleClickOutside,
        );
        return () => {
            document.removeEventListener(
                'mousedown',
                handleClickOutside,
            );
        };
    }, []);

    const handleCountrySelect = (country: Country) => {
        setSelectedCountry(country);
        onChange(country.dialCode);
        setIsOpen(false);
    };

    const toggleDropdown = () => setIsOpen(!isOpen);

    return (
        <div
            className={`relative ${className}`}
            ref={dropdownRef}
        >
            <CountrySelectorButton
                isOpen={isOpen}
                disabled={disabled}
                selectedCountry={selectedCountry}
                onClick={() =>
                    !disabled && toggleDropdown()
                }
            />

            <CountryDropdown
                isOpen={isOpen}
                countries={countries}
                selectedCountry={selectedCountry}
                onSelectCountry={handleCountrySelect}
            />
        </div>
    );
};

export default CountryCodePicker;
