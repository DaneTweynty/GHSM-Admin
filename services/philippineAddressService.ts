/**
 * Philippine Address Service
 * Provides provinces, cities, and barangays data for address dropdown selection
 * Uses external API from GitHub repository "isaacdarcilla/philippine-addresses"
 * 
 * Features:
 * - Complete Philippine address data from authoritative source
 * - Async data loading with caching
 * - Error handling and retry logic
 * - Fallback data for offline scenarios
 * - Performance optimizations
 */

export interface Province {
  code: string;
  name: string;
  region: string;
  region_code?: string;
  psgc_code?: string;
}

export interface City {
  code: string;
  name: string;
  provinceCode: string;
  region_code?: string;
  psgc_code?: string;
}

export interface Barangay {
  code: string;
  name: string;
  cityCode: string;
  provinceCode?: string;
  region_code?: string;
}

// External API configuration
const EXTERNAL_API_BASE = 'https://raw.githubusercontent.com/isaacdarcilla/philippine-addresses/master';
const API_ENDPOINTS = {
  provinces: `${EXTERNAL_API_BASE}/province.json`,
  cities: `${EXTERNAL_API_BASE}/city.json`,
  barangays: `${EXTERNAL_API_BASE}/barangay.json`,
  regions: `${EXTERNAL_API_BASE}/region.json`
};

// Cache storage
let cachedProvinces: Province[] | null = null;
let cachedCities: City[] | null = null;
let cachedBarangays: Barangay[] | null = null;
let cachedRegions: any[] | null = null;

// Loading states to prevent duplicate API calls
let isLoadingProvinces = false;
let isLoadingCities = false;
let isLoadingBarangays = false;
let isLoadingRegions = false;

// Cache timestamps
let provincesCacheTime = 0;
let citiesCacheTime = 0;
let barangaysCacheTime = 0;
let regionsCacheTime = 0;

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Generic function to fetch data from external API with retry logic
 */
async function fetchAddressData(url: string, retries = 3): Promise<any[]> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
      
    } catch (error) {
      console.warn(`Fetch attempt ${attempt} failed for ${url}:`, error);
      
      if (attempt === retries) {
        console.error(`All ${retries} attempts failed for ${url}. Using fallback data.`);
        return getFallbackData(url);
      }
      
      // Exponential backoff: wait longer between retries
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  return [];
}

/**
 * Transform external province data to our format
 */
function transformProvinceData(externalData: any[]): Province[] {
  return externalData.map(item => ({
    code: item.province_code || item.code || `PROV_${item.id || Math.random()}`,
    name: item.province_name || item.name || 'Unknown Province',
    region: item.region_name || getRegionName(item.region_code) || 'Unknown Region',
    region_code: item.region_code,
    psgc_code: item.psgc_code
  }));
}

/**
 * Transform external city data to our format
 */
function transformCityData(externalData: any[]): City[] {
  return externalData.map(item => ({
    code: item.city_code || item.code || `CITY_${item.id || Math.random()}`,
    name: item.city_name || item.name || 'Unknown City',
    provinceCode: item.province_code || item.provinceCode || 'UNKNOWN',
    region_code: item.region_code,
    psgc_code: item.psgc_code
  }));
}

/**
 * Transform external barangay data to our format
 */
function transformBarangayData(externalData: any[]): Barangay[] {
  return externalData.map(item => ({
    code: item.brgy_code || item.code || `BRGY_${item.id || Math.random()}`,
    name: item.brgy_name || item.name || 'Unknown Barangay',
    cityCode: item.city_code || item.cityCode || 'UNKNOWN',
    provinceCode: item.province_code || item.provinceCode,
    region_code: item.region_code
  }));
}

/**
 * Get region name by region code
 */
function getRegionName(regionCode: string): string {
  const regionMap: { [key: string]: string } = {
    '01': 'Region I (Ilocos Region)',
    '02': 'Region II (Cagayan Valley)',
    '03': 'Region III (Central Luzon)',
    '04': 'Region IV-A (CALABARZON)',
    '05': 'Region V (Bicol Region)',
    '06': 'Region VI (Western Visayas)',
    '07': 'Region VII (Central Visayas)',
    '08': 'Region VIII (Eastern Visayas)',
    '09': 'Region IX (Zamboanga Peninsula)',
    '10': 'Region X (Northern Mindanao)',
    '11': 'Region XI (Davao Region)',
    '12': 'Region XII (SOCCSKSARGEN)',
    '13': 'National Capital Region (NCR)',
    '14': 'Cordillera Administrative Region (CAR)',
    '15': 'Autonomous Region in Muslim Mindanao (ARMM)',
    '16': 'Region XIII (Caraga)',
    '17': 'Region IV-B (MIMAROPA)'
  };
  
  return regionMap[regionCode] || `Region ${regionCode}`;
}

/**
 * Get fallback data when external API fails
 */
function getFallbackData(url: string): any[] {
  console.warn('Using fallback data for:', url);
  
  if (url.includes('province.json')) {
    return [
      { province_code: "1263", province_name: "South Cotabato", region_code: "12", psgc_code: "126300000" },
      { province_code: "0137", province_name: "Metro Manila", region_code: "13", psgc_code: "137400000" },
      { province_code: "0421", province_name: "Cavite", region_code: "04", psgc_code: "042100000" },
      { province_code: "0434", province_name: "Laguna", region_code: "04", psgc_code: "043400000" },
      { province_code: "0456", province_name: "Batangas", region_code: "04", psgc_code: "045600000" }
    ];
  }
  
  if (url.includes('city.json')) {
    return [
      { city_code: "126301", city_name: "Banga", province_code: "1263", region_code: "12" },
      { city_code: "126302", city_name: "General Santos City", province_code: "1263", region_code: "12" },
      { city_code: "126303", city_name: "Koronadal City", province_code: "1263", region_code: "12" },
      { city_code: "126304", city_name: "Lake Sebu", province_code: "1263", region_code: "12" },
      { city_code: "126305", city_name: "Norala", province_code: "1263", region_code: "12" },
      { city_code: "126306", city_name: "Polomolok", province_code: "1263", region_code: "12" }
    ];
  }
  
  if (url.includes('barangay.json')) {
    return [
      { brgy_code: "126301001", brgy_name: "Poblacion", city_code: "126301", province_code: "1263", region_code: "12" },
      { brgy_code: "126301002", brgy_name: "Libertad", city_code: "126301", province_code: "1263", region_code: "12" },
      { brgy_code: "126302001", brgy_name: "Apopong", city_code: "126302", province_code: "1263", region_code: "12" },
      { brgy_code: "126302002", brgy_name: "Baluan", city_code: "126302", province_code: "1263", region_code: "12" },
      { brgy_code: "126302003", brgy_name: "Buayan", city_code: "126302", province_code: "1263", region_code: "12" }
    ];
  }
  
  return [];
}

/**
 * Philippine Address Service - Main class
 */
export class PhilippineAddressService {
  
  /**
   * Get all provinces
   */
  static async getProvinces(): Promise<Province[]> {
    // Check cache first
    const now = Date.now();
    if (cachedProvinces && (now - provincesCacheTime) < CACHE_DURATION) {
      return cachedProvinces;
    }
    
    // Prevent duplicate API calls
    if (isLoadingProvinces) {
      while (isLoadingProvinces) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return cachedProvinces || [];
    }
    
    isLoadingProvinces = true;
    
    try {
      console.log('Fetching provinces from external API...');
      const externalData = await fetchAddressData(API_ENDPOINTS.provinces);
      cachedProvinces = transformProvinceData(externalData);
      provincesCacheTime = now;
      console.log(`Loaded ${cachedProvinces.length} provinces from external API`);
      return cachedProvinces;
    } catch (error) {
      console.error('Error loading provinces:', error);
      return transformProvinceData(getFallbackData(API_ENDPOINTS.provinces));
    } finally {
      isLoadingProvinces = false;
    }
  }

  /**
   * Get cities by province
   */
  static async getCitiesByProvince(provinceCode: string): Promise<City[]> {
    // Load all cities first if not cached
    const now = Date.now();
    if (!cachedCities || (now - citiesCacheTime) > CACHE_DURATION) {
      
      // Prevent duplicate API calls
      if (isLoadingCities) {
        while (isLoadingCities) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } else {
        isLoadingCities = true;
        
        try {
          console.log('Fetching cities from external API...');
          const externalData = await fetchAddressData(API_ENDPOINTS.cities);
          cachedCities = transformCityData(externalData);
          citiesCacheTime = now;
          console.log(`Loaded ${cachedCities.length} cities from external API`);
        } catch (error) {
          console.error('Error loading cities:', error);
          cachedCities = transformCityData(getFallbackData(API_ENDPOINTS.cities));
        } finally {
          isLoadingCities = false;
        }
      }
    }
    
    // Filter cities by province
    const cities = cachedCities?.filter(city => city.provinceCode === provinceCode) || [];
    console.log(`Found ${cities.length} cities for province ${provinceCode}`);
    return cities;
  }

  /**
   * Get barangays by city
   */
  static async getBarangaysByCity(cityCode: string): Promise<Barangay[]> {
    // Load all barangays first if not cached
    const now = Date.now();
    if (!cachedBarangays || (now - barangaysCacheTime) > CACHE_DURATION) {
      
      // Prevent duplicate API calls
      if (isLoadingBarangays) {
        while (isLoadingBarangays) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } else {
        isLoadingBarangays = true;
        
        try {
          console.log('Fetching barangays from external API...');
          const externalData = await fetchAddressData(API_ENDPOINTS.barangays);
          cachedBarangays = transformBarangayData(externalData);
          barangaysCacheTime = now;
          console.log(`Loaded ${cachedBarangays.length} barangays from external API`);
        } catch (error) {
          console.error('Error loading barangays:', error);
          cachedBarangays = transformBarangayData(getFallbackData(API_ENDPOINTS.barangays));
        } finally {
          isLoadingBarangays = false;
        }
      }
    }
    
    // Filter barangays by city
    const barangays = cachedBarangays?.filter(barangay => barangay.cityCode === cityCode) || [];
    console.log(`Found ${barangays.length} barangays for city ${cityCode}`);
    return barangays;
  }

  /**
   * Preload address data for better performance
   */
  static async preloadAddressData(): Promise<void> {
    console.log('Preloading address data...');
    try {
      await Promise.all([
        this.getProvinces(),
        // Load a sample of cities and barangays to populate cache
        fetchAddressData(API_ENDPOINTS.cities).then(data => {
          cachedCities = transformCityData(data);
          citiesCacheTime = Date.now();
        }),
        fetchAddressData(API_ENDPOINTS.barangays).then(data => {
          cachedBarangays = transformBarangayData(data);
          barangaysCacheTime = Date.now();
        })
      ]);
      console.log('Address data preloading complete');
    } catch (error) {
      console.warn('Address data preloading failed:', error);
    }
  }

  /**
   * Get cache status for debugging
   */
  static getCacheStatus(): {
    provinces: { cached: boolean; count: number; age: number };
    cities: { cached: boolean; count: number; age: number };
    barangays: { cached: boolean; count: number; age: number };
  } {
    const now = Date.now();
    return {
      provinces: {
        cached: !!cachedProvinces,
        count: cachedProvinces?.length || 0,
        age: now - provincesCacheTime
      },
      cities: {
        cached: !!cachedCities,
        count: cachedCities?.length || 0,
        age: now - citiesCacheTime
      },
      barangays: {
        cached: !!cachedBarangays,
        count: cachedBarangays?.length || 0,
        age: now - barangaysCacheTime
      }
    };
  }

  /**
   * Clear all caches (useful for testing)
   */
  static clearCache(): void {
    cachedProvinces = null;
    cachedCities = null;
    cachedBarangays = null;
    cachedRegions = null;
    provincesCacheTime = 0;
    citiesCacheTime = 0;
    barangaysCacheTime = 0;
    regionsCacheTime = 0;
    console.log('Address cache cleared');
  }
}

// Utility functions (preserved from original implementation)

/**
 * Calculate age from birthdate
 */
export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Validate Philippine phone number
 */
export function validatePhilippinePhone(phone: string): boolean {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Philippine mobile number patterns:
  // - 11 digits starting with 09
  // - 12 digits starting with 639
  // - 13 digits starting with +639
  
  if (cleaned.length === 11 && cleaned.startsWith('09')) {
    return true;
  }
  
  if (cleaned.length === 12 && cleaned.startsWith('639')) {
    return true;
  }
  
  return false;
}

/**
 * Format Philippine phone number
 */
export function formatPhilippinePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11 && cleaned.startsWith('09')) {
    // Format: 0999 123 4567
    return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
  }
  
  if (cleaned.length === 12 && cleaned.startsWith('639')) {
    // Format: +63 999 123 4567
    return `+${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8)}`;
  }
  
  return phone; // Return original if doesn't match patterns
}

// Default export for convenience
export default PhilippineAddressService;
