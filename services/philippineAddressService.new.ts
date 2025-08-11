/**
 * Philippine Address Service - Enhanced with External API Data
 * Provides complete provinces, cities, and barangays data from authoritative source
 * Uses GitHub repository: https://github.com/isaacdarcilla/philippine-addresses
 */

export interface Province {
  code: string;
  name: string;
  region: string;
  regionCode: string;
  psgcCode?: string;
}

export interface City {
  code: string;
  name: string;
  provinceCode: string;
  regionDesc?: string;
  psgcCode?: string;
}

export interface Barangay {
  code: string;
  name: string;
  cityCode: string;
  provinceCode: string;
  regionCode: string;
}

export interface Region {
  code: string;
  name: string;
  psgcCode: string;
}

// External API Configuration
const PHILIPPINE_ADDRESS_API_BASE = 'https://raw.githubusercontent.com/isaacdarcilla/philippine-addresses/master';

// Cache for loaded data
let cachedProvinces: any[] | null = null;
let cachedCities: any[] | null = null;
let cachedBarangays: any[] | null = null;
let cachedRegions: any[] | null = null;

// Loading states
let isLoadingProvinces = false;
let isLoadingCities = false;
let isLoadingBarangays = false;
let isLoadingRegions = false;

/**
 * Fetch data from external API with error handling and retry logic
 */
async function fetchAddressData(endpoint: string, retries = 3): Promise<any[]> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${PHILIPPINE_ADDRESS_API_BASE}/${endpoint}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        // Add timeout and retry handling
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Successfully loaded ${endpoint}:`, data.length, 'records');
      return data;
    } catch (error) {
      console.warn(`Attempt ${attempt}/${retries} failed for ${endpoint}:`, error);
      
      if (attempt === retries) {
        console.error(`Failed to fetch ${endpoint} after ${retries} attempts:`, error);
        // Return fallback data for critical functionality
        return getFallbackData(endpoint);
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  return [];
}

/**
 * Provide fallback data when external API fails
 */
function getFallbackData(endpoint: string): any[] {
  console.log(`Using fallback data for ${endpoint}`);
  
  if (endpoint === 'province.json') {
    return [
      { province_code: "1263", province_name: "South Cotabato", region_code: "12", psgc_code: "126300000" },
      { province_code: "0137", province_name: "Metro Manila", region_code: "13", psgc_code: "137400000" },
      { province_code: "0421", province_name: "Cavite", region_code: "04", psgc_code: "042100000" },
      { province_code: "0434", province_name: "Laguna", region_code: "04", psgc_code: "043400000" },
      { province_code: "0456", province_name: "Batangas", region_code: "04", psgc_code: "045600000" },
    ];
  }
  
  if (endpoint === 'city.json') {
    return [
      { city_code: "126301", city_name: "Banga", province_code: "1263", region_code: "12" },
      { city_code: "126302", city_name: "General Santos City", province_code: "1263", region_code: "12" },
      { city_code: "126303", city_name: "Koronadal City", province_code: "1263", region_code: "12" },
      { city_code: "126304", city_name: "Lake Sebu", province_code: "1263", region_code: "12" },
    ];
  }
  
  if (endpoint === 'barangay.json') {
    return [
      { brgy_code: "126301001", brgy_name: "Poblacion", city_code: "126301", province_code: "1263", region_code: "12" },
      { brgy_code: "126302001", brgy_name: "Apopong", city_code: "126302", province_code: "1263", region_code: "12" },
    ];
  }
  
  return [];
}

/**
 * Load provinces data from external API
 */
async function loadProvinces(): Promise<any[]> {
  if (cachedProvinces) return cachedProvinces;
  if (isLoadingProvinces) {
    // Wait for ongoing load to complete
    while (isLoadingProvinces) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return cachedProvinces || [];
  }
  
  isLoadingProvinces = true;
  try {
    cachedProvinces = await fetchAddressData('province.json');
    return cachedProvinces;
  } finally {
    isLoadingProvinces = false;
  }
}

/**
 * Load cities data from external API
 */
async function loadCities(): Promise<any[]> {
  if (cachedCities) return cachedCities;
  if (isLoadingCities) {
    while (isLoadingCities) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return cachedCities || [];
  }
  
  isLoadingCities = true;
  try {
    cachedCities = await fetchAddressData('city.json');
    return cachedCities;
  } finally {
    isLoadingCities = false;
  }
}

/**
 * Load barangays data from external API
 */
async function loadBarangays(): Promise<any[]> {
  if (cachedBarangays) return cachedBarangays;
  if (isLoadingBarangays) {
    while (isLoadingBarangays) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return cachedBarangays || [];
  }
  
  isLoadingBarangays = true;
  try {
    cachedBarangays = await fetchAddressData('barangay.json');
    return cachedBarangays;
  } finally {
    isLoadingBarangays = false;
  }
}

/**
 * Load regions data from external API
 */
async function loadRegions(): Promise<any[]> {
  if (cachedRegions) return cachedRegions;
  if (isLoadingRegions) {
    while (isLoadingRegions) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return cachedRegions || [];
  }
  
  isLoadingRegions = true;
  try {
    cachedRegions = await fetchAddressData('region.json');
    return cachedRegions;
  } finally {
    isLoadingRegions = false;
  }
}

/**
 * Transform external province data to internal format
 */
function transformProvinceData(externalProvince: any): Province {
  return {
    code: externalProvince.province_code,
    name: externalProvince.province_name,
    region: getRegionName(externalProvince.region_code),
    regionCode: externalProvince.region_code,
    psgcCode: externalProvince.psgc_code
  };
}

/**
 * Transform external city data to internal format
 */
function transformCityData(externalCity: any): City {
  return {
    code: externalCity.city_code,
    name: externalCity.city_name,
    provinceCode: externalCity.province_code,
    regionDesc: externalCity.region_desc,
    psgcCode: externalCity.psgc_code
  };
}

/**
 * Transform external barangay data to internal format
 */
function transformBarangayData(externalBarangay: any): Barangay {
  return {
    code: externalBarangay.brgy_code,
    name: externalBarangay.brgy_name,
    cityCode: externalBarangay.city_code,
    provinceCode: externalBarangay.province_code,
    regionCode: externalBarangay.region_code
  };
}

/**
 * Get region name from region code
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
 * Philippine Address Service Class
 */
export class PhilippineAddressService {
  
  /**
   * Get all provinces
   */
  static async getProvinces(): Promise<Province[]> {
    try {
      const externalProvinces = await loadProvinces();
      return externalProvinces.map(transformProvinceData);
    } catch (error) {
      console.error('Error loading provinces:', error);
      return [];
    }
  }

  /**
   * Get cities/municipalities by province code
   */
  static async getCitiesByProvince(provinceCode: string): Promise<City[]> {
    try {
      const externalCities = await loadCities();
      const filteredCities = externalCities.filter(city => city.province_code === provinceCode);
      return filteredCities.map(transformCityData);
    } catch (error) {
      console.error('Error loading cities for province:', provinceCode, error);
      return [];
    }
  }

  /**
   * Get barangays by city code
   */
  static async getBarangaysByCity(cityCode: string): Promise<Barangay[]> {
    try {
      const externalBarangays = await loadBarangays();
      const filteredBarangays = externalBarangays.filter(barangay => barangay.city_code === cityCode);
      return filteredBarangays.map(transformBarangayData);
    } catch (error) {
      console.error('Error loading barangays for city:', cityCode, error);
      return [];
    }
  }

  /**
   * Get all regions
   */
  static async getRegions(): Promise<Region[]> {
    try {
      const externalRegions = await loadRegions();
      return externalRegions.map(region => ({
        code: region.region_code,
        name: region.region_name,
        psgcCode: region.psgc_code
      }));
    } catch (error) {
      console.error('Error loading regions:', error);
      return [];
    }
  }

  /**
   * Search provinces by name
   */
  static async searchProvinces(query: string): Promise<Province[]> {
    const provinces = await this.getProvinces();
    const lowercaseQuery = query.toLowerCase();
    return provinces.filter(province => 
      province.name.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Search cities by name within a province
   */
  static async searchCities(provinceCode: string, query: string): Promise<City[]> {
    const cities = await this.getCitiesByProvince(provinceCode);
    const lowercaseQuery = query.toLowerCase();
    return cities.filter(city => 
      city.name.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Search barangays by name within a city
   */
  static async searchBarangays(cityCode: string, query: string): Promise<Barangay[]> {
    const barangays = await this.getBarangaysByCity(cityCode);
    const lowercaseQuery = query.toLowerCase();
    return barangays.filter(barangay => 
      barangay.name.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Get province by code
   */
  static async getProvinceByCode(code: string): Promise<Province | null> {
    const provinces = await this.getProvinces();
    return provinces.find(p => p.code === code) || null;
  }

  /**
   * Get city by code
   */
  static async getCityByCode(code: string): Promise<City | null> {
    try {
      const externalCities = await loadCities();
      const city = externalCities.find(c => c.city_code === code);
      return city ? transformCityData(city) : null;
    } catch (error) {
      console.error('Error finding city by code:', code, error);
      return null;
    }
  }

  /**
   * Get barangay by code
   */
  static async getBarangayByCode(code: string): Promise<Barangay | null> {
    try {
      const externalBarangays = await loadBarangays();
      const barangay = externalBarangays.find(b => b.brgy_code === code);
      return barangay ? transformBarangayData(barangay) : null;
    } catch (error) {
      console.error('Error finding barangay by code:', code, error);
      return null;
    }
  }

  /**
   * Get complete address path (Region > Province > City > Barangay)
   */
  static async getAddressPath(barangayCode: string): Promise<{
    region: string;
    province: string;
    city: string;
    barangay: string;
  } | null> {
    try {
      const barangay = await this.getBarangayByCode(barangayCode);
      if (!barangay) return null;

      const city = await this.getCityByCode(barangay.cityCode);
      if (!city) return null;

      const province = await this.getProvinceByCode(barangay.provinceCode);
      if (!province) return null;

      return {
        region: province.region,
        province: province.name,
        city: city.name,
        barangay: barangay.name
      };
    } catch (error) {
      console.error('Error getting address path:', error);
      return null;
    }
  }

  /**
   * Preload all address data for better performance
   */
  static async preloadAddressData(): Promise<void> {
    try {
      console.log('Preloading Philippine address data...');
      const startTime = Date.now();
      
      // Load all data in parallel
      await Promise.all([
        loadRegions(),
        loadProvinces(),
        loadCities(),
        loadBarangays()
      ]);
      
      const loadTime = Date.now() - startTime;
      console.log(`Address data preloaded successfully in ${loadTime}ms`);
      console.log('Cache summary:', {
        regions: cachedRegions?.length || 0,
        provinces: cachedProvinces?.length || 0,
        cities: cachedCities?.length || 0,
        barangays: cachedBarangays?.length || 0
      });
    } catch (error) {
      console.error('Error preloading address data:', error);
    }
  }

  /**
   * Clear cached data and reload from external source
   */
  static async refreshAddressData(): Promise<void> {
    console.log('Refreshing address data cache...');
    cachedProvinces = null;
    cachedCities = null;
    cachedBarangays = null;
    cachedRegions = null;
    await this.preloadAddressData();
  }

  /**
   * Get cache status and statistics
   */
  static getCacheStatus(): {
    provinces: { loaded: boolean; count: number };
    cities: { loaded: boolean; count: number };
    barangays: { loaded: boolean; count: number };
    regions: { loaded: boolean; count: number };
  } {
    return {
      provinces: { loaded: !!cachedProvinces, count: cachedProvinces?.length || 0 },
      cities: { loaded: !!cachedCities, count: cachedCities?.length || 0 },
      barangays: { loaded: !!cachedBarangays, count: cachedBarangays?.length || 0 },
      regions: { loaded: !!cachedRegions, count: cachedRegions?.length || 0 }
    };
  }

  // Utility functions (kept from original implementation)
  
  /**
   * Calculate age from birthdate
   */
  static calculateAge(birthdate: string): number {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Validate Philippine phone number
   * Supports formats: 09XX-XXX-XXXX, +639XX-XXX-XXXX, etc.
   */
  static validatePhilippinePhone(phone: string): boolean {
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Philippine mobile: 09XXXXXXXXX or +639XXXXXXXXX
    if (cleanPhone.startsWith('639') && cleanPhone.length === 12) return true;
    if (cleanPhone.startsWith('09') && cleanPhone.length === 11) return true;
    
    // Philippine landline: (02) XXX-XXXX or similar
    if (cleanPhone.startsWith('02') && cleanPhone.length >= 9 && cleanPhone.length <= 11) return true;
    
    return false;
  }

  /**
   * Format Philippine phone number
   */
  static formatPhilippinePhone(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.startsWith('639') && cleanPhone.length === 12) {
      return `+63 ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6, 9)} ${cleanPhone.slice(9)}`;
    }
    
    if (cleanPhone.startsWith('09') && cleanPhone.length === 11) {
      return `${cleanPhone.slice(0, 4)} ${cleanPhone.slice(4, 7)} ${cleanPhone.slice(7)}`;
    }
    
    if (cleanPhone.startsWith('02')) {
      return `(02) ${cleanPhone.slice(2, 5)}-${cleanPhone.slice(5)}`;
    }
    
    return phone; // Return original if no match
  }
}

// Auto-preload data when module is imported (optional)
if (typeof window !== 'undefined') {
  // Only preload in browser environment
  PhilippineAddressService.preloadAddressData().catch(console.error);
}
