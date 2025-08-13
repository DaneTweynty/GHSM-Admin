import React, { useState, useEffect, useCallback } from 'react';
import ThemedSelect from './ThemedSelect';
import { control, card, textPrimary, cn } from './ui';
import { PhilippineAddressService, Province, City, Barangay } from '../services/philippineAddressService';

interface AddressData {
  country?: string;
  province?: string;
  city?: string;
  barangay?: string;
  addressLine1?: string;
  addressLine2?: string;
}

interface AddressInputProps {
  address?: AddressData;
  onChange: (address: AddressData) => void;
  disabled?: boolean;
  className?: string;
  errors?: {
    province?: string;
    city?: string;
    barangay?: string;
    addressLine1?: string;
  };
}

export const AddressInput: React.FC<AddressInputProps> = ({
  address = {},
  onChange,
  disabled = false,
  className = '',
  errors = {}
}) => {
  // State for dropdown options
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  
  // State for selected values
  const [selectedCountry, setSelectedCountry] = useState(address.country || 'Philippines');
  const [selectedProvince, setSelectedProvince] = useState(address.province || '');
  const [selectedCity, setSelectedCity] = useState(address.city || '');
  const [selectedBarangay, setSelectedBarangay] = useState(address.barangay || '');
  const [addressLine1, setAddressLine1] = useState(address.addressLine1 || '');
  const [addressLine2, setAddressLine2] = useState(address.addressLine2 || '');

  // Loading states
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingBarangays, setLoadingBarangays] = useState(false);

  // Memoized onChange callback to prevent unnecessary re-renders
  const notifyParent = useCallback(() => {
    const addressData: AddressData = {
      country: selectedCountry,
      province: selectedProvince,
      city: selectedCity,
      barangay: selectedBarangay,
      addressLine1,
      addressLine2
    };
    onChange(addressData);
  }, [selectedCountry, selectedProvince, selectedCity, selectedBarangay, addressLine1, addressLine2, onChange]);

  // Sync internal state with props when address prop changes
  useEffect(() => {
    setSelectedCountry(address.country || 'Philippines');
    setSelectedProvince(address.province || '');
    setSelectedCity(address.city || '');
    setSelectedBarangay(address.barangay || '');
    setAddressLine1(address.addressLine1 || '');
    setAddressLine2(address.addressLine2 || '');
  }, [address]);

  // Load provinces on component mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setLoadingProvinces(true);
        const provincesData = await PhilippineAddressService.getProvinces();
        setProvinces(provincesData);
      } catch (error) {
        console.error('Error loading provinces:', error);
        setProvinces([]);
      } finally {
        setLoadingProvinces(false);
      }
    };

    loadProvinces();
  }, []);

  // Load cities when province changes
  useEffect(() => {
    const loadCities = async () => {
      if (selectedProvince && provinces.length > 0) {
        try {
          setLoadingCities(true);
          const provinceData = provinces.find(p => p.name === selectedProvince);
          if (provinceData) {
            const citiesData = await PhilippineAddressService.getCitiesByProvince(provinceData.code);
            setCities(citiesData);
          } else {
            setCities([]);
          }
        } catch (error) {
          console.error('Error loading cities:', error);
          setCities([]);
        } finally {
          setLoadingCities(false);
        }
      } else {
        setCities([]);
        setLoadingCities(false);
      }
    };

    loadCities();
  }, [selectedProvince, provinces]);

  // Load barangays when city changes  
  useEffect(() => {
    const loadBarangays = async () => {
      // Loading barangays for selected city
      if (selectedCity && cities.length > 0) {
        try {
          setLoadingBarangays(true);
          const cityData = cities.find(c => c.name === selectedCity);
          // Found city data, loading barangays
          if (cityData) {
            const barangaysData = await PhilippineAddressService.getBarangaysByCity(cityData.code);
            // Loaded barangays successfully
            setBarangays(barangaysData);
          } else {
            // City data not found, clearing barangays
            setBarangays([]);
          }
        } catch (error) {
          console.error('Error loading barangays:', error);
          setBarangays([]);
        } finally {
          setLoadingBarangays(false);
        }
      } else {
        // Clearing barangays - no city selected or cities not loaded
        setBarangays([]);
        setLoadingBarangays(false);
      }
    };

    loadBarangays();
  }, [selectedCity, cities]);

  // Notify parent when address changes (using debounced approach)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      notifyParent();
    }, 100); // Small delay to batch updates

    return () => clearTimeout(timeoutId);
  }, [notifyParent]);

  // Handle province change
  const handleProvinceChange = useCallback((value: string) => {
    setSelectedProvince(value);
    // Reset dependent selections
    setSelectedCity('');
    setSelectedBarangay('');
    setCities([]);
    setBarangays([]);
  }, []);

  // Handle city change
  const handleCityChange = useCallback((value: string) => {
    setSelectedCity(value);
    // Reset dependent selection
    setSelectedBarangay('');
    setBarangays([]);
  }, []);

  // Handle barangay change
  const handleBarangayChange = useCallback((value: string) => {
    setSelectedBarangay(value);
  }, []);

  // Handle country change
  const handleCountryChange = useCallback((value: string) => {
    setSelectedCountry(value);
  }, []);

  // Handle address line changes
  const handleAddressLine1Change = useCallback((value: string) => {
    setAddressLine1(value);
  }, []);

  const handleAddressLine2Change = useCallback((value: string) => {
    setAddressLine2(value);
  }, []);

  // Country options (for future expansion)
  const countryOptions = [
    { value: 'Philippines', label: 'Philippines' }
  ];

  // Province options
  const provinceOptions = provinces.map(province => ({
    value: province.name,
    label: `${province.name} (${province.region})`
  }));

  // City options
  const cityOptions = cities.map(city => ({
    value: city.name,
    label: city.name
  }));

  // Barangay options
  const barangayOptions = barangays.map(barangay => ({
    value: barangay.name,
    label: barangay.name
  }));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Country Selection */}
      <div>
        <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">
          Country
        </label>
        <ThemedSelect
          value={selectedCountry}
          onChange={(e) => handleCountryChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">Select country</option>
          {countryOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </ThemedSelect>
      </div>

      {/* Province Selection */}
      <div>
        <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">
          Province
        </label>
        <ThemedSelect
          value={selectedProvince}
          onChange={(e) => handleProvinceChange(e.target.value)}
          disabled={disabled || loadingProvinces}
        >
          <option value="">
            {loadingProvinces ? "Loading provinces..." : "Select province"}
          </option>
          {provinceOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </ThemedSelect>
        {errors.province && (
          <div className="text-xs text-status-red dark:text-red-400 mt-1">{errors.province}</div>
        )}
        {loadingProvinces && (
          <div className="text-xs text-text-tertiary dark:text-slate-500 mt-1">Loading provinces...</div>
        )}
      </div>

      {/* City Selection */}
      <div>
        <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">
          City/Municipality
        </label>
        <ThemedSelect
          value={selectedCity}
          onChange={(e) => handleCityChange(e.target.value)}
          disabled={disabled || !selectedProvince || loadingCities}
        >
          <option value="">
            {!selectedProvince 
              ? "Select province first"
              : loadingCities 
                ? "Loading cities..." 
                : "Select city/municipality"
            }
          </option>
          {cityOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </ThemedSelect>
        {errors.city && (
          <div className="text-xs text-status-red dark:text-red-400 mt-1">{errors.city}</div>
        )}
        {loadingCities && (
          <div className="text-xs text-text-tertiary dark:text-slate-500 mt-1">Loading cities...</div>
        )}
      </div>

      {/* Barangay Selection */}
      <div>
        <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">
          Barangay
        </label>
        <ThemedSelect
          value={selectedBarangay}
          onChange={(e) => handleBarangayChange(e.target.value)}
          disabled={disabled || !selectedCity || loadingBarangays}
        >
          <option value="">
            {!selectedCity 
              ? "Select city first"
              : loadingBarangays 
                ? "Loading barangays..." 
                : "Select barangay"
            }
          </option>
          {barangayOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </ThemedSelect>
        {errors.barangay && (
          <div className="text-xs text-status-red dark:text-red-400 mt-1">{errors.barangay}</div>
        )}
        {loadingBarangays && (
          <div className="text-xs text-text-tertiary dark:text-slate-500 mt-1">Loading barangays...</div>
        )}
      </div>

      {/* Address Line 1 */}
      <div>
        <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">
          Address Line 1 (Street, Building, etc.)
        </label>
        <input
          type="text"
          value={addressLine1}
          onChange={(e) => handleAddressLine1Change(e.target.value)}
          disabled={disabled}
          placeholder="Enter street address, building name, etc."
          className={control}
        />
        {errors.addressLine1 && (
          <div className="text-xs text-status-red dark:text-red-400 mt-1">{errors.addressLine1}</div>
        )}
      </div>

      {/* Address Line 2 */}
      <div>
        <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">
          Address Line 2 (Optional)
        </label>
        <input
          type="text"
          value={addressLine2}
          onChange={(e) => handleAddressLine2Change(e.target.value)}
          disabled={disabled}
          placeholder="Additional address information (optional)"
          className={control}
        />
      </div>

      {/* Address Summary */}
      {(selectedProvince || selectedCity || selectedBarangay || addressLine1) && (
        <div className={cn(card, "mt-4")}>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-brand-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={cn(textPrimary, "text-sm font-medium mb-2")}>Complete Address</h4>
              <div className="space-y-2">
                {/* Street Address Section */}
                {(addressLine1 || addressLine2) && (
                  <div className="text-sm">
                    {addressLine1 && (
                      <div className="font-medium text-text-primary dark:text-slate-100 leading-relaxed">
                        {addressLine1}
                      </div>
                    )}
                    {addressLine2 && (
                      <div className="text-text-secondary dark:text-slate-300 leading-relaxed">
                        {addressLine2}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Location Badges Section */}
                {(selectedBarangay || selectedCity || selectedProvince) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedBarangay && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brand-primary-light text-brand-primary dark:bg-brand-primary/20 dark:text-brand-secondary">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        Barangay {selectedBarangay}
                      </span>
                    )}
                    {selectedCity && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-status-green/15 text-status-green dark:bg-status-green/20 dark:text-status-green">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm3 2a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 4a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        {selectedCity}
                      </span>
                    )}
                    {selectedProvince && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                        </svg>
                        {selectedProvince}
                      </span>
                    )}
                  </div>
                )}
                
                {/* Country Section */}
                <div className="text-xs text-text-tertiary dark:text-slate-500 pt-1 border-t border-surface-border dark:border-slate-700">
                  <span className="inline-flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                    </svg>
                    {selectedCountry}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
