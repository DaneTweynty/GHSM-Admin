import React, { useState, useEffect } from 'react';
import ThemedSelect from './ThemedSelect';
import { control } from './ui';
import { PhilippineAddressService, Province, City, Barangay } from '../services/philippineAddressService';

interface AddressInputProps {
  address?: {
    country?: string;
    province?: string;
    city?: string;
    barangay?: string;
    addressLine1?: string;
    addressLine2?: string;
  };
  onChange: (address: {
    country?: string;
    province?: string;
    city?: string;
    barangay?: string;
    addressLine1?: string;
    addressLine2?: string;
  }) => void;
  disabled?: boolean;
  className?: string;
}

export const AddressInput: React.FC<AddressInputProps> = ({
  address = {},
  onChange,
  disabled = false,
  className = ''
}) => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  
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

  // Load provinces on component mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setLoadingProvinces(true);
        const provincesData = await PhilippineAddressService.getProvinces();
        setProvinces(provincesData);
      } catch (error) {
        console.error('Error loading provinces:', error);
      } finally {
        setLoadingProvinces(false);
      }
    };

    loadProvinces();
  }, []);

  // Load cities when province changes
  useEffect(() => {
    const loadCities = async () => {
      if (selectedProvince) {
        try {
          setLoadingCities(true);
          const provinceData = provinces.find(p => p.name === selectedProvince);
          if (provinceData) {
            const citiesData = await PhilippineAddressService.getCitiesByProvince(provinceData.code);
            setCities(citiesData);
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
      
      // Reset dependent selections
      if (selectedCity && (!selectedProvince || !cities.some(c => c.name === selectedCity))) {
        setSelectedCity('');
        setSelectedBarangay('');
        setBarangays([]);
      }
    };

    loadCities();
  }, [selectedProvince, provinces]);

  // Load barangays when city changes  
  useEffect(() => {
    const loadBarangays = async () => {
      if (selectedCity) {
        try {
          setLoadingBarangays(true);
          const cityData = cities.find(c => c.name === selectedCity);
          if (cityData) {
            const barangaysData = await PhilippineAddressService.getBarangaysByCity(cityData.code);
            setBarangays(barangaysData);
          }
        } catch (error) {
          console.error('Error loading barangays:', error);
          setBarangays([]);
        } finally {
          setLoadingBarangays(false);
        }
      } else {
        setBarangays([]);
        setLoadingBarangays(false);
      }
      
      // Reset dependent selection
      if (selectedBarangay && (!selectedCity || !barangays.some(b => b.name === selectedBarangay))) {
        setSelectedBarangay('');
      }
    };

    loadBarangays();
  }, [selectedCity, cities]);

  // Update parent component when address changes
  useEffect(() => {
    onChange({
      country: selectedCountry,
      province: selectedProvince,
      city: selectedCity,
      barangay: selectedBarangay,
      addressLine1,
      addressLine2
    });
  }, [selectedCountry, selectedProvince, selectedCity, selectedBarangay, addressLine1, addressLine2, onChange]);

  const handleProvinceChange = (value: string) => {
    setSelectedProvince(value);
    setSelectedCity('');
    setSelectedBarangay('');
    setCities([]);
    setBarangays([]);
  };

  const handleCityChange = (value: string) => {
    setSelectedCity(value);
    setSelectedBarangay('');
    setBarangays([]);
  };

  const handleBarangayChange = (value: string) => {
    setSelectedBarangay(value);
  };

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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Country *
        </label>
        <ThemedSelect
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Province *
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
      </div>

      {/* City Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          City/Municipality *
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
      </div>

      {/* Barangay Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Barangay *
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
      </div>

      {/* Address Line 1 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address Line 1 (Street, Building, etc.) *
        </label>
        <input
          type="text"
          value={addressLine1}
          onChange={(e) => setAddressLine1(e.target.value)}
          disabled={disabled}
          placeholder="Enter street address, building name, etc."
          className={control}
        />
      </div>

      {/* Address Line 2 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address Line 2 (Optional)
        </label>
        <input
          type="text"
          value={addressLine2}
          onChange={(e) => setAddressLine2(e.target.value)}
          disabled={disabled}
          placeholder="Additional address information (optional)"
          className={control}
        />
      </div>

      {/* Address Summary */}
      {(selectedProvince || selectedCity || selectedBarangay || addressLine1) && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Address Summary:</h4>
          <div className="text-sm text-gray-600">
            {addressLine1 && <div>{addressLine1}</div>}
            {addressLine2 && <div>{addressLine2}</div>}
            {selectedBarangay && <div>Barangay {selectedBarangay}</div>}
            {selectedCity && <div>{selectedCity}</div>}
            {selectedProvince && <div>{selectedProvince}</div>}
            <div>{selectedCountry}</div>
          </div>
        </div>
      )}
    </div>
  );
};
