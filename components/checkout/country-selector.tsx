'use client';

import { useState } from 'react';
import { getAllCountries, COMMON_COUNTRIES } from '@/lib/geo/detect-country';

interface CountrySelectorProps {
  selectedCountry: string;
  onCountryChange: (countryCode: string) => void;
  disabled?: boolean;
}

export function CountrySelector({
  selectedCountry,
  onCountryChange,
  disabled = false,
}: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const allCountries = getAllCountries();
  
  const selectedCountryName = allCountries.find(
    (c) => c.code === selectedCountry
  )?.name || selectedCountry;

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Billing Country
      </label>
      <select
        value={selectedCountry}
        onChange={(e) => onCountryChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <optgroup label="Common Countries">
          {COMMON_COUNTRIES.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="All Countries">
          {allCountries
            .filter((c) => !COMMON_COUNTRIES.find((cc) => cc.code === c.code))
            .map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
        </optgroup>
      </select>
      <p className="mt-1 text-xs text-gray-500">
        Tax rates are calculated based on your billing country
      </p>
    </div>
  );
}



