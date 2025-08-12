/**
 * Enhanced Philippine Address Service
 * Addresses the issue where some provinces don't have cities or some cities don't have barangays
 * Only shows city dropdown if cities are available for selected province
 * Only shows barangay dropdown if barangays are available for selected city
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

export interface AddressAvailability {
  hasCities: boolean;
  hasBarangays: boolean;
  cityCount: number;
  barangayCount: number;
}

// Enhanced Address Data Structure for fallback
const enhancedAddressData = {
  // Mock data - in real implementation, this would come from a comprehensive database
  provinces: [
    { code: "NCR", name: "Metro Manila", region: "National Capital Region", regionCode: "NCR" },
    { code: "CAV", name: "Cavite", region: "Region IV-A (CALABARZON)", regionCode: "IV-A" },
    { code: "LAG", name: "Laguna", region: "Region IV-A (CALABARZON)", regionCode: "IV-A" },
    { code: "BAT", name: "Bataan", region: "Region III (Central Luzon)", regionCode: "III" },
    { code: "CEU", name: "Cebu", region: "Region VII (Central Visayas)", regionCode: "VII" },
    { code: "DAV", name: "Davao del Sur", region: "Region XI (Davao Region)", regionCode: "XI" },
    { code: "SOC", name: "South Cotabato", region: "Region XII (SOCCSKSARGEN)", regionCode: "XII" },
    // Some provinces without detailed city/barangay data
    { code: "BAS", name: "Basilan", region: "Autonomous Region in Muslim Mindanao", regionCode: "ARMM" },
    { code: "SLU", name: "Sulu", region: "Autonomous Region in Muslim Mindanao", regionCode: "ARMM" }
  ],
  cities: [
    // NCR Cities
    { code: "MAN", name: "Manila", provinceCode: "NCR", regionCode: "NCR" },
    { code: "QUE", name: "Quezon City", provinceCode: "NCR", regionCode: "NCR" },
    { code: "MAK", name: "Makati", provinceCode: "NCR", regionCode: "NCR" },
    { code: "PAS", name: "Pasig", provinceCode: "NCR", regionCode: "NCR" },
    
    // Cavite Cities
    { code: "DAM", name: "Dasmariñas", provinceCode: "CAV", regionCode: "IV-A" },
    { code: "ICA", name: "Imus", provinceCode: "CAV", regionCode: "IV-A" },
    { code: "CAV-BAC", name: "Bacoor", provinceCode: "CAV", regionCode: "IV-A" },
    
    // Laguna Cities
    { code: "STC", name: "Santa Cruz", provinceCode: "LAG", regionCode: "IV-A" },
    { code: "CAL", name: "Calamba", provinceCode: "LAG", regionCode: "IV-A" },
    
    // Cebu Cities
    { code: "CEB", name: "Cebu City", provinceCode: "CEU", regionCode: "VII" },
    { code: "MAN-CEB", name: "Mandaue", provinceCode: "CEU", regionCode: "VII" },
    
    // Davao Cities
    { code: "DAV-CITY", name: "Davao City", provinceCode: "DAV", regionCode: "XI" },
    
    // South Cotabato Cities
    { code: "GEN-SANTOS", name: "General Santos", provinceCode: "SOC", regionCode: "XII" },
    { code: "KORONADAL", name: "Koronadal", provinceCode: "SOC", regionCode: "XII" },
    { code: "TUPI", name: "Tupi", provinceCode: "SOC", regionCode: "XII" },
    { code: "POLOMOLOK", name: "Polomolok", provinceCode: "SOC", regionCode: "XII" },
    { code: "TAMPAKAN", name: "Tampakan", provinceCode: "SOC", regionCode: "XII" },
    { code: "TANTANGAN", name: "Tantangan", provinceCode: "SOC", regionCode: "XII" },
    { code: "TBOLI", name: "T'Boli", provinceCode: "SOC", regionCode: "XII" },
    { code: "LAKE-SEBU", name: "Lake Sebu", provinceCode: "SOC", regionCode: "XII" },
    { code: "NORALA", name: "Norala", provinceCode: "SOC", regionCode: "XII" },
    { code: "SURALLAH", name: "Surallah", provinceCode: "SOC", regionCode: "XII" },
    { code: "BANGA", name: "Banga", provinceCode: "SOC", regionCode: "XII" },
    { code: "SANTO-NINO", name: "Santo Niño", provinceCode: "SOC", regionCode: "XII" },
    
    // Note: Basilan and Sulu have no cities in this mock data
  ],
  barangays: [
    // Manila Barangays
    { code: "MAN-001", name: "Barangay 1", cityCode: "MAN", provinceCode: "NCR", regionCode: "NCR" },
    { code: "MAN-002", name: "Barangay 2", cityCode: "MAN", provinceCode: "NCR", regionCode: "NCR" },
    { code: "MAN-003", name: "Ermita", cityCode: "MAN", provinceCode: "NCR", regionCode: "NCR" },
    { code: "MAN-004", name: "Malate", cityCode: "MAN", provinceCode: "NCR", regionCode: "NCR" },
    
    // Quezon City Barangays
    { code: "QUE-001", name: "Bagong Pag-asa", cityCode: "QUE", provinceCode: "NCR", regionCode: "NCR" },
    { code: "QUE-002", name: "Diliman", cityCode: "QUE", provinceCode: "NCR", regionCode: "NCR" },
    { code: "QUE-003", name: "Project 8", cityCode: "QUE", provinceCode: "NCR", regionCode: "NCR" },
    
    // Makati Barangays
    { code: "MAK-001", name: "Poblacion", cityCode: "MAK", provinceCode: "NCR", regionCode: "NCR" },
    { code: "MAK-002", name: "Salcedo Village", cityCode: "MAK", provinceCode: "NCR", regionCode: "NCR" },
    { code: "MAK-003", name: "Bel-Air", cityCode: "MAK", provinceCode: "NCR", regionCode: "NCR" },
    
    // Dasmariñas Barangays
    { code: "DAM-001", name: "Zone I", cityCode: "DAM", provinceCode: "CAV", regionCode: "IV-A" },
    { code: "DAM-002", name: "Zone II", cityCode: "DAM", provinceCode: "CAV", regionCode: "IV-A" },
    { code: "DAM-003", name: "Salawag", cityCode: "DAM", provinceCode: "CAV", regionCode: "IV-A" },
    
    // Cebu City Barangays
    { code: "CEB-001", name: "Lahug", cityCode: "CEB", provinceCode: "CEU", regionCode: "VII" },
    { code: "CEB-002", name: "Kasambagan", cityCode: "CEB", provinceCode: "CEU", regionCode: "VII" },
    { code: "CEB-003", name: "Capitol Site", cityCode: "CEB", provinceCode: "CEU", regionCode: "VII" },
    
    // General Santos City Barangays
    { code: "GEN-001", name: "Dadiangas East", cityCode: "GEN-SANTOS", provinceCode: "SOC", regionCode: "XII" },
    { code: "GEN-002", name: "Dadiangas North", cityCode: "GEN-SANTOS", provinceCode: "SOC", regionCode: "XII" },
    { code: "GEN-003", name: "Dadiangas South", cityCode: "GEN-SANTOS", provinceCode: "SOC", regionCode: "XII" },
    { code: "GEN-004", name: "Dadiangas West", cityCode: "GEN-SANTOS", provinceCode: "SOC", regionCode: "XII" },
    { code: "GEN-005", name: "City Heights", cityCode: "GEN-SANTOS", provinceCode: "SOC", regionCode: "XII" },
    { code: "GEN-006", name: "Fatima", cityCode: "GEN-SANTOS", provinceCode: "SOC", regionCode: "XII" },
    { code: "GEN-007", name: "Lagao", cityCode: "GEN-SANTOS", provinceCode: "SOC", regionCode: "XII" },
    { code: "GEN-008", name: "San Isidro", cityCode: "GEN-SANTOS", provinceCode: "SOC", regionCode: "XII" },
    { code: "GEN-009", name: "Upper Labay", cityCode: "GEN-SANTOS", provinceCode: "SOC", regionCode: "XII" },
    { code: "GEN-010", name: "Buayan", cityCode: "GEN-SANTOS", provinceCode: "SOC", regionCode: "XII" },
    
    // Koronadal City Barangays
    { code: "KOR-001", name: "Poblacion", cityCode: "KORONADAL", provinceCode: "SOC", regionCode: "XII" },
    { code: "KOR-002", name: "Zone I", cityCode: "KORONADAL", provinceCode: "SOC", regionCode: "XII" },
    { code: "KOR-003", name: "Zone II", cityCode: "KORONADAL", provinceCode: "SOC", regionCode: "XII" },
    { code: "KOR-004", name: "Zone III", cityCode: "KORONADAL", provinceCode: "SOC", regionCode: "XII" },
    { code: "KOR-005", name: "Zone IV", cityCode: "KORONADAL", provinceCode: "SOC", regionCode: "XII" },
    { code: "KOR-006", name: "Carpenter Hill", cityCode: "KORONADAL", provinceCode: "SOC", regionCode: "XII" },
    { code: "KOR-007", name: "Morales", cityCode: "KORONADAL", provinceCode: "SOC", regionCode: "XII" },
    { code: "KOR-008", name: "Namnama", cityCode: "KORONADAL", provinceCode: "SOC", regionCode: "XII" },
    
    // Polomolok Barangays
    { code: "POL-001", name: "Poblacion", cityCode: "POLOMOLOK", provinceCode: "SOC", regionCode: "XII" },
    { code: "POL-002", name: "Crossing Rubber", cityCode: "POLOMOLOK", provinceCode: "SOC", regionCode: "XII" },
    { code: "POL-003", name: "Cannery Site", cityCode: "POLOMOLOK", provinceCode: "SOC", regionCode: "XII" },
    { code: "POL-004", name: "Bentung", cityCode: "POLOMOLOK", provinceCode: "SOC", regionCode: "XII" },
    { code: "POL-005", name: "Silway 8", cityCode: "POLOMOLOK", provinceCode: "SOC", regionCode: "XII" },
    
    // Note: Some cities like Pasig, Imus, etc. have no barangays in this mock data
    // This simulates the real-world scenario where some areas might not have complete data
  ]
};

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

  cachedProvinces = enhancedAddressData.provinces.map(province => ({
    code: province.code,
    name: province.name,
    region: province.region,
    regionCode: province.regionCode
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

  cachedCities = enhancedAddressData.cities.map(city => ({
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

  cachedBarangays = enhancedAddressData.barangays.map(barangay => ({
    code: barangay.code,
    name: barangay.name,
    cityCode: barangay.cityCode,
    provinceCode: barangay.provinceCode,
    regionCode: barangay.regionCode
  }));

  return cachedBarangays;
}

/**
 * Enhanced Philippine Address Service
 */
export class EnhancedPhilippineAddressService {
  
  /**
   * Get all provinces
   */
  static async getProvinces(): Promise<Province[]> {
    return Promise.resolve(loadProvinces());
  }

  /**
   * Get cities by province code - returns empty array if no cities available
   */
  static async getCitiesByProvince(provinceCode: string): Promise<City[]> {
    const allCities = loadCities();
    const filteredCities = allCities.filter(city => city.provinceCode === provinceCode);
    return Promise.resolve(filteredCities);
  }

  /**
   * Get barangays by city code - returns empty array if no barangays available
   */
  static async getBarangaysByCity(cityCode: string): Promise<Barangay[]> {
    const allBarangays = loadBarangays();
    const filteredBarangays = allBarangays.filter(barangay => barangay.cityCode === cityCode);
    return Promise.resolve(filteredBarangays);
  }

  /**
   * Check availability of cities and barangays for a province
   */
  static async checkAddressAvailability(provinceCode: string, cityCode?: string): Promise<AddressAvailability> {
    const cities = await this.getCitiesByProvince(provinceCode);
    const hasCities = cities.length > 0;
    
    let hasBarangays = false;
    let barangayCount = 0;
    
    if (cityCode) {
      const barangays = await this.getBarangaysByCity(cityCode);
      hasBarangays = barangays.length > 0;
      barangayCount = barangays.length;
    }
    
    return {
      hasCities,
      hasBarangays,
      cityCount: cities.length,
      barangayCount
    };
  }

  /**
   * Get complete address hierarchy with availability info
   */
  static async getAddressHierarchy(provinceCode: string): Promise<{
    province: Province | null;
    cities: City[];
    hasCities: boolean;
  }> {
    const allProvinces = await this.getProvinces();
    const province = allProvinces.find(p => p.code === provinceCode) || null;
    const cities = await this.getCitiesByProvince(provinceCode);
    
    return {
      province,
      cities,
      hasCities: cities.length > 0
    };
  }

  /**
   * Validate address completeness based on available data
   */
  static async validateAddressCompleteness(address: {
    province?: string;
    city?: string;
    barangay?: string;
  }): Promise<{
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  }> {
    const errors: string[] = [];
    const suggestions: string[] = [];
    
    if (!address.province) {
      errors.push('Province is required');
      return { isValid: false, errors, suggestions };
    }
    
    // Find province
    const allProvinces = await this.getProvinces();
    const province = allProvinces.find(p => p.name === address.province);
    
    if (!province) {
      errors.push('Invalid province selected');
      return { isValid: false, errors, suggestions };
    }
    
    // Check if cities are available for this province
    const availability = await this.checkAddressAvailability(province.code, address.city);
    
    if (availability.hasCities && !address.city) {
      errors.push('City is required for this province');
      suggestions.push('Please select a city from the available options');
    }
    
    if (address.city && availability.hasCities) {
      const cities = await this.getCitiesByProvince(province.code);
      const city = cities.find(c => c.name === address.city);
      
      if (!city) {
        errors.push('Invalid city selected for this province');
      } else {
        // Check barangays for selected city
        const barangayAvailability = await this.checkAddressAvailability(province.code, city.code);
        
        if (barangayAvailability.hasBarangays && !address.barangay) {
          suggestions.push('Consider selecting a barangay for more specific address');
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      suggestions
    };
  }
}

// Utility functions for phone and age validation (keeping existing functionality)
export function formatPhilippinePhone(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  if (cleaned.startsWith('63')) {
    const localNumber = cleaned.substring(2);
    if (localNumber.length === 10) {
      return `+63-${localNumber.substring(0, 3)}-${localNumber.substring(3, 6)}-${localNumber.substring(6)}`;
    }
  } else if (cleaned.startsWith('0')) {
    const localNumber = cleaned.substring(1);
    if (localNumber.length === 10) {
      return `+63-${localNumber.substring(0, 3)}-${localNumber.substring(3, 6)}-${localNumber.substring(6)}`;
    }
  } else if (cleaned.length === 10) {
    return `+63-${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
  }
  
  return phoneNumber;
}

export function validatePhilippinePhone(phoneNumber: string): boolean {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  if (cleaned.startsWith('63')) {
    return cleaned.length === 12;
  } else if (cleaned.startsWith('0')) {
    return cleaned.length === 11;
  } else {
    return cleaned.length === 10;
  }
}

export function calculateAge(birthdate: string): number {
  if (!birthdate) return 0;
  
  const today = new Date();
  const birth = new Date(birthdate);
  
  if (isNaN(birth.getTime())) return 0;
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return Math.max(0, age);
}
