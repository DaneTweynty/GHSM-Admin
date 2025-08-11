/**
 * Philippine Address Service - Fixed Version
 * Uses local data instead of external API to avoid CORS issues
 * Provides provinces, cities, and barangays data for address dropdown selection
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
  regionCode: string;
}

export interface Barangay {
  code: string;
  name: string;
  cityCode: string;
  provinceCode: string;
  regionCode: string;
}

// Import local data instead of fetching from external API
import addressData from '../data/philippine-addresses.json';

// Cache storage
let cachedProvinces: Province[] | null = null;
let cachedCities: City[] | null = null;
let cachedBarangays: Barangay[] | null = null;

/**
 * Load and transform province data
 */
function loadProvinces(): Province[] {
  if (cachedProvinces) {
    return cachedProvinces;
  }

  cachedProvinces = addressData.provinces.map(province => ({
    code: province.code,
    name: province.name,
    region: province.region,
    regionCode: province.regionCode,
    psgcCode: province.psgcCode
  }));

  return cachedProvinces;
}

/**
 * Load and transform city data
 */
function loadCities(): City[] {
  if (cachedCities) {
    return cachedCities;
  }

  cachedCities = addressData.cities.map(city => ({
    code: city.code,
    name: city.name,
    provinceCode: city.provinceCode,
    regionCode: city.regionCode
  }));

  return cachedCities;
}

/**
 * Load and transform barangay data
 */
function loadBarangays(): Barangay[] {
  if (cachedBarangays) {
    return cachedBarangays;
  }

  cachedBarangays = addressData.barangays.map(barangay => ({
    code: barangay.code,
    name: barangay.name,
    cityCode: barangay.cityCode,
    provinceCode: barangay.provinceCode,
    regionCode: barangay.regionCode
  }));

  return cachedBarangays;
}

/**
 * Philippine Address Service - Main class
 */
export class PhilippineAddressService {
  
  /**
   * Get all provinces
   */
  static async getProvinces(): Promise<Province[]> {
    // Return loaded provinces immediately (no async needed for local data)
    return Promise.resolve(loadProvinces());
  }

  /**
   * Get cities by province code
   */
  static async getCitiesByProvince(provinceCode: string): Promise<City[]> {
    const allCities = loadCities();
    const filteredCities = allCities.filter(city => city.provinceCode === provinceCode);
    return Promise.resolve(filteredCities);
  }

  /**
   * Get barangays by city code
   */
  static async getBarangaysByCity(cityCode: string): Promise<Barangay[]> {
    const allBarangays = loadBarangays();
    const filteredBarangays = allBarangays.filter(barangay => barangay.cityCode === cityCode);
    return Promise.resolve(filteredBarangays);
  }

  /**
   * Search provinces by name
   */
  static async searchProvinces(searchTerm: string): Promise<Province[]> {
    const allProvinces = loadProvinces();
    const filtered = allProvinces.filter(province => 
      province.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      province.region.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return Promise.resolve(filtered);
  }

  /**
   * Search cities by name within a province
   */
  static async searchCities(searchTerm: string, provinceCode?: string): Promise<City[]> {
    const allCities = loadCities();
    let filtered = allCities;
    
    if (provinceCode) {
      filtered = filtered.filter(city => city.provinceCode === provinceCode);
    }
    
    filtered = filtered.filter(city => 
      city.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return Promise.resolve(filtered);
  }

  /**
   * Search barangays by name within a city
   */
  static async searchBarangays(searchTerm: string, cityCode?: string): Promise<Barangay[]> {
    const allBarangays = loadBarangays();
    let filtered = allBarangays;
    
    if (cityCode) {
      filtered = filtered.filter(barangay => barangay.cityCode === cityCode);
    }
    
    filtered = filtered.filter(barangay => 
      barangay.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return Promise.resolve(filtered);
  }

  /**
   * Get complete address hierarchy (province -> cities -> barangays)
   */
  static async getAddressHierarchy(): Promise<{
    provinces: Province[];
    cities: City[];
    barangays: Barangay[];
  }> {
    return Promise.resolve({
      provinces: loadProvinces(),
      cities: loadCities(),
      barangays: loadBarangays()
    });
  }

  /**
   * Get province by code
   */
  static async getProvinceByCode(code: string): Promise<Province | null> {
    const provinces = loadProvinces();
    const province = provinces.find(p => p.code === code);
    return Promise.resolve(province || null);
  }

  /**
   * Get city by code
   */
  static async getCityByCode(code: string): Promise<City | null> {
    const cities = loadCities();
    const city = cities.find(c => c.code === code);
    return Promise.resolve(city || null);
  }

  /**
   * Get barangay by code
   */
  static async getBarangayByCode(code: string): Promise<Barangay | null> {
    const barangays = loadBarangays();
    const barangay = barangays.find(b => b.code === code);
    return Promise.resolve(barangay || null);
  }

  /**
   * Get cache status for debugging
   */
  static getCacheStatus(): {
    provinces: { cached: boolean; count: number };
    cities: { cached: boolean; count: number };
    barangays: { cached: boolean; count: number };
  } {
    return {
      provinces: {
        cached: !!cachedProvinces,
        count: cachedProvinces?.length || 0
      },
      cities: {
        cached: !!cachedCities,
        count: cachedCities?.length || 0
      },
      barangays: {
        cached: !!cachedBarangays,
        count: cachedBarangays?.length || 0
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
  }

  /**
   * Preload all data into cache
   */
  static async preloadData(): Promise<void> {
    loadProvinces();
    loadCities();
    loadBarangays();
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
