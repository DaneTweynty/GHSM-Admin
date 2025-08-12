import React, { useState, useEffect, useCallback } from 'react';
import ThemedSelect from './ThemedSelect';
import { control, cn } from './ui';
import { EnhancedPhilippineAddressService, Province, City, Barangay, AddressAvailability } from '../services/philippineAddressService.enhanced';

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
  onReset?: () => void; // New prop for external reset trigger
}

export const EnhancedAddressInput: React.FC<AddressInputProps> = ({
  address = {},
  onChange,
  disabled = false,
  className = '',
  errors = {},
  onReset
}) => {
  // State for dropdown options
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [availability, setAvailability] = useState<AddressAvailability>({
    hasCities: false,
    hasBarangays: false,
    cityCount: 0,
    barangayCount: 0
  });
  
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

  // Reset function
  const resetForm = useCallback(() => {
    setSelectedCountry('Philippines');
    setSelectedProvince('');
    setSelectedCity('');
    setSelectedBarangay('');
    setAddressLine1('');
    setAddressLine2('');
    setCities([]);
    setBarangays([]);
    setAvailability({
      hasCities: false,
      hasBarangays: false,
      cityCount: 0,
      barangayCount: 0
    });
    
    // Notify parent of the reset
    const resetAddressData: AddressData = {
      country: 'Philippines',
      province: '',
      city: '',
      barangay: '',
      addressLine1: '',
      addressLine2: ''
    };
    onChange(resetAddressData);
  }, [onChange]);

  // Handle external reset calls
  useEffect(() => {
    if (onReset) {
      // This effect runs when onReset prop changes, which can be used as a reset trigger
      resetForm();
    }
  }, [onReset, resetForm]);

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

  // Update parent when any field changes
  useEffect(() => {
    notifyParent();
  }, [notifyParent]);

  // Load provinces on component mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setLoadingProvinces(true);
        const provincesData = await EnhancedPhilippineAddressService.getProvinces();
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
            // Get address hierarchy for this province
            const hierarchy = await EnhancedPhilippineAddressService.getAddressHierarchy(provinceData.code);
            setCities(hierarchy.cities);
            
            // Update availability info
            const availabilityInfo = await EnhancedPhilippineAddressService.checkAddressAvailability(provinceData.code);
            setAvailability(availabilityInfo);
            
            // Reset city and barangay if no cities available
            if (!hierarchy.hasCities) {
              setSelectedCity('');
              setSelectedBarangay('');
              setBarangays([]);
            }
          } else {
            setCities([]);
            setAvailability({
              hasCities: false,
              hasBarangays: false,
              cityCount: 0,
              barangayCount: 0
            });
          }
        } catch (error) {
          console.error('Error loading cities:', error);
          setCities([]);
          setAvailability({
            hasCities: false,
            hasBarangays: false,
            cityCount: 0,
            barangayCount: 0
          });
        } finally {
          setLoadingCities(false);
        }
      } else {
        setCities([]);
        setBarangays([]);
        setSelectedCity('');
        setSelectedBarangay('');
        setAvailability({
          hasCities: false,
          hasBarangays: false,
          cityCount: 0,
          barangayCount: 0
        });
      }
    };

    loadCities();
  }, [selectedProvince, provinces]);

  // Load barangays when city changes
  useEffect(() => {
    const loadBarangays = async () => {
      if (selectedCity && cities.length > 0) {
        try {
          setLoadingBarangays(true);
          const cityData = cities.find(c => c.name === selectedCity);
          if (cityData) {
            const barangaysData = await EnhancedPhilippineAddressService.getBarangaysByCity(cityData.code);
            setBarangays(barangaysData);
            
            // Update barangay availability
            const currentProvince = provinces.find(p => p.name === selectedProvince);
            if (currentProvince) {
              const updatedAvailability = await EnhancedPhilippineAddressService.checkAddressAvailability(currentProvince.code, cityData.code);
              setAvailability(prev => ({
                ...prev,
                hasBarangays: updatedAvailability.hasBarangays,
                barangayCount: updatedAvailability.barangayCount
              }));
            }
            
            // Reset barangay if no barangays available
            if (barangaysData.length === 0) {
              setSelectedBarangay('');
            }
          } else {
            setBarangays([]);
            setSelectedBarangay('');
          }
        } catch (error) {
          console.error('Error loading barangays:', error);
          setBarangays([]);
          setSelectedBarangay('');
        } finally {
          setLoadingBarangays(false);
        }
      } else {
        setBarangays([]);
        setSelectedBarangay('');
      }
    };

    loadBarangays();
  }, [selectedCity, cities, provinces, selectedProvince]);

  // Handle province change
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedProvince(value);
    setSelectedCity('');
    setSelectedBarangay('');
    setCities([]);
    setBarangays([]);
  };

  // Handle city change
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedCity(value);
    setSelectedBarangay('');
    setBarangays([]);
  };

  // Handle barangay change
  const handleBarangayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedBarangay(value);
  };

  const inputClasses = cn(
    control,
    'w-full',
    errors.province || errors.city || errors.barangay || errors.addressLine1 
      ? 'border-red-500 focus:ring-red-500' 
      : ''
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Country (Fixed to Philippines) */}
      <div>
        <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Country
        </label>
        <input
          type="text"
          id="country"
          value={selectedCountry}
          disabled={true}
          className={cn(inputClasses, 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed')}
          placeholder="Country"
        />
      </div>

      {/* Province */}
      <div>
        <label htmlFor="province" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Province <span className="text-red-500">*</span>
        </label>
        <ThemedSelect
          value={selectedProvince}
          onChange={handleProvinceChange}
          disabled={disabled || loadingProvinces}
          className={errors.province ? 'border-red-500' : ''}
        >
          <option value="">
            {loadingProvinces ? 'Loading provinces...' : 'Select Province'}
          </option>
          {provinces.map((province) => (
            <option key={province.code} value={province.name}>
              {province.name}
            </option>
          ))}
        </ThemedSelect>
        {errors.province && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.province}</p>
        )}
      </div>

      {/* City - Only show if cities are available */}
      {availability.hasCities && (
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            City/Municipality
            {availability.cityCount > 0 && (
              <span className="text-red-500"> *</span>
            )}
            <span className="text-xs text-gray-500 ml-1">
              ({availability.cityCount} available)
            </span>
          </label>
          <ThemedSelect
            value={selectedCity}
            onChange={handleCityChange}
            disabled={disabled || loadingCities || !selectedProvince}
            className={errors.city ? 'border-red-500' : ''}
          >
            <option value="">
              {loadingCities ? 'Loading cities...' : 'Select City/Municipality'}
            </option>
            {cities.map((city) => (
              <option key={city.code} value={city.name}>
                {city.name}
              </option>
            ))}
          </ThemedSelect>
          {errors.city && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.city}</p>
          )}
        </div>
      )}

      {/* Barangay - Only show if barangays are available */}
      {availability.hasBarangays && selectedCity && (
        <div>
          <label htmlFor="barangay" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Barangay
            <span className="text-xs text-gray-500 ml-1">
              ({availability.barangayCount} available)
            </span>
          </label>
          <ThemedSelect
            value={selectedBarangay}
            onChange={handleBarangayChange}
            disabled={disabled || loadingBarangays || !selectedCity}
            className={errors.barangay ? 'border-red-500' : ''}
          >
            <option value="">
              {loadingBarangays ? 'Loading barangays...' : 'Select Barangay (Optional)'}
            </option>
            {barangays.map((barangay) => (
              <option key={barangay.code} value={barangay.name}>
                {barangay.name}
              </option>
            ))}
          </ThemedSelect>
          {errors.barangay && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.barangay}</p>
          )}
        </div>
      )}

      {/* Address Line 1 */}
      <div>
        <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Street Address
        </label>
        <input
          type="text"
          id="addressLine1"
          value={addressLine1}
          onChange={(e) => setAddressLine1(e.target.value)}
          disabled={disabled}
          className={cn(inputClasses, errors.addressLine1 ? 'border-red-500' : '')}
          placeholder="House number, street name"
        />
        {errors.addressLine1 && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.addressLine1}</p>
        )}
      </div>

      {/* Address Line 2 */}
      <div>
        <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Additional Address Info
        </label>
        <input
          type="text"
          id="addressLine2"
          value={addressLine2}
          onChange={(e) => setAddressLine2(e.target.value)}
          disabled={disabled}
          className={inputClasses}
          placeholder="Apartment, suite, unit, building, floor, etc. (optional)"
        />
      </div>

      {/* Address Summary for User Feedback */}
      {(selectedProvince || addressLine1) && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address Summary:</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {[
              addressLine1,
              addressLine2,
              selectedBarangay,
              selectedCity,
              selectedProvince,
              selectedCountry
            ].filter(Boolean).join(', ') || 'No address information provided'}
          </p>
          
          {/* Helpful Info */}
          {selectedProvince && !availability.hasCities && (
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                ℹ️ This province doesn't require city selection. You can proceed with just the street address.
              </p>
            </div>
          )}
          
          {selectedCity && !availability.hasBarangays && (
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                ℹ️ This city doesn't have barangay options available. You can proceed with the current address.
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Reset Button for Development/Testing */}
      <button
        type="button"
        onClick={resetForm}
        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
      >
        Reset Address
      </button>
    </div>
  );
};

// Export both components for compatibility
export { EnhancedAddressInput as AddressInput };
