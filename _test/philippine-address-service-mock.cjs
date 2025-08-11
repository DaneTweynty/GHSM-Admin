/**
 * Philippine Address Service (CommonJS version for testing)
 * Simplified version of the Philippine address service for testing purposes
 */

// Sample provinces data
const PHILIPPINES_PROVINCES = [
  { code: "MNL", name: "Metro Manila", region: "NCR" },
  { code: "CEB", name: "Cebu", region: "Region VII" },
  { code: "LAG", name: "Laguna", region: "Region IV-A" },
  { code: "CAV", name: "Cavite", region: "Region IV-A" },
  { code: "DAS", name: "Davao del Sur", region: "Region XI" },
  { code: "BTG", name: "Batangas", region: "Region IV-A" },
  { code: "BUL", name: "Bulacan", region: "Region III" },
  { code: "PAM", name: "Pampanga", region: "Region III" },
  { code: "RIZ", name: "Rizal", region: "Region IV-A" },
  { code: "ILO", name: "Iloilo", region: "Region VI" },
  { code: "SCO", name: "South Cotabato", region: "Region XII" },
  { code: "NCO", name: "North Cotabato", region: "Region XII" },
  { code: "SAR", name: "Sarangani", region: "Region XII" },
  { code: "SUK", name: "Sultan Kudarat", region: "Region XII" }
];

// Sample cities data
const PHILIPPINES_CITIES = {
  "MNL": [
    { code: "MNL001", name: "Manila", provinceCode: "MNL" },
    { code: "QC001", name: "Quezon City", provinceCode: "MNL" },
    { code: "MAK001", name: "Makati", provinceCode: "MNL" },
    { code: "PAS001", name: "Pasig", provinceCode: "MNL" },
    { code: "TAR001", name: "Taguig", provinceCode: "MNL" },
    { code: "MAN001", name: "Mandaluyong", provinceCode: "MNL" },
    { code: "PAR001", name: "Parañaque", provinceCode: "MNL" },
    { code: "LAS001", name: "Las Piñas", provinceCode: "MNL" }
  ],
  "CEB": [
    { code: "CEB001", name: "Cebu City", provinceCode: "CEB" },
    { code: "LAP001", name: "Lapu-Lapu", provinceCode: "CEB" },
    { code: "MAN002", name: "Mandaue", provinceCode: "CEB" },
    { code: "TOL001", name: "Toledo", provinceCode: "CEB" },
    { code: "TAL001", name: "Talisay", provinceCode: "CEB" }
  ],
  "LAG": [
    { code: "STA001", name: "Sta. Rosa", provinceCode: "LAG" },
    { code: "CAL001", name: "Calamba", provinceCode: "LAG" },
    { code: "BIN001", name: "Biñan", provinceCode: "LAG" },
    { code: "CAB001", name: "Cabuyao", provinceCode: "LAG" },
    { code: "LOS001", name: "Los Baños", provinceCode: "LAG" }
  ],
  "DAS": [
    { code: "DAV001", name: "Davao City", provinceCode: "DAS" },
    { code: "DIG001", name: "Digos", provinceCode: "DAS" }
  ],
  "SCO": [
    { code: "SCO-GEN", name: "General Santos City", provinceCode: "SCO" },
    { code: "SCO-KOR", name: "Koronadal City", provinceCode: "SCO" },
    { code: "SCO-BAG", name: "Banga", provinceCode: "SCO" },
    { code: "SCO-LAK", name: "Lake Sebu", provinceCode: "SCO" },
    { code: "SCO-NOR", name: "Norala", provinceCode: "SCO" },
    { code: "SCO-PIN", name: "Polomolok", provinceCode: "SCO" },
    { code: "SCO-SAN", name: "Santo Niño", provinceCode: "SCO" },
    { code: "SCO-SUR", name: "Surallah", provinceCode: "SCO" },
    { code: "SCO-TUP", name: "Tupi", provinceCode: "SCO" },
    { code: "SCO-TBO", name: "T'boli", provinceCode: "SCO" },
    { code: "SCO-TAN", name: "Tantangan", provinceCode: "SCO" },
    { code: "SCO-TAM", name: "Tampakan", provinceCode: "SCO" }
  ]
};

// Sample barangays data
const PHILIPPINES_BARANGAYS = {
  "MNL001": [
    { code: "MNL001-001", name: "Ermita", cityCode: "MNL001" },
    { code: "MNL001-002", name: "Malate", cityCode: "MNL001" },
    { code: "MNL001-003", name: "Intramuros", cityCode: "MNL001" },
    { code: "MNL001-004", name: "Binondo", cityCode: "MNL001" },
    { code: "MNL001-005", name: "Quiapo", cityCode: "MNL001" },
    { code: "MNL001-006", name: "Tondo", cityCode: "MNL001" },
    { code: "MNL001-007", name: "Paco", cityCode: "MNL001" },
    { code: "MNL001-008", name: "Sta. Ana", cityCode: "MNL001" }
  ],
  "QC001": [
    { code: "QC001-001", name: "Diliman", cityCode: "QC001" },
    { code: "QC001-002", name: "Cubao", cityCode: "QC001" },
    { code: "QC001-003", name: "Fairview", cityCode: "QC001" },
    { code: "QC001-004", name: "Commonwealth", cityCode: "QC001" },
    { code: "QC001-005", name: "Novaliches", cityCode: "QC001" },
    { code: "QC001-006", name: "Kamuning", cityCode: "QC001" },
    { code: "QC001-007", name: "Loyola Heights", cityCode: "QC001" },
    { code: "QC001-008", name: "Tandang Sora", cityCode: "QC001" }
  ],
  "CEB001": [
    { code: "CEB001-001", name: "Lahug", cityCode: "CEB001" },
    { code: "CEB001-002", name: "Capitol Site", cityCode: "CEB001" },
    { code: "CEB001-003", name: "Colon", cityCode: "CEB001" },
    { code: "CEB001-004", name: "Fuente Circle", cityCode: "CEB001" },
    { code: "CEB001-005", name: "IT Park", cityCode: "CEB001" }
  ],
  "SCO-GEN": [
    { code: "SCO-GEN-APO", name: "Apopong", cityCode: "SCO-GEN" },
    { code: "SCO-GEN-BUB", name: "Buayan", cityCode: "SCO-GEN" },
    { code: "SCO-GEN-CAL", name: "Calumpang", cityCode: "SCO-GEN" },
    { code: "SCO-GEN-CIT", name: "City Heights", cityCode: "SCO-GEN" },
    { code: "SCO-GEN-LAG", name: "Lagao", cityCode: "SCO-GEN" },
    { code: "SCO-GEN-SAN", name: "San Isidro", cityCode: "SCO-GEN" },
    { code: "SCO-GEN-TAM", name: "Tambler", cityCode: "SCO-GEN" },
    { code: "SCO-GEN-TIN", name: "Tinagacan", cityCode: "SCO-GEN" }
  ],
  "SCO-KOR": [
    { code: "SCO-KOR-APO", name: "Apokon", cityCode: "SCO-KOR" },
    { code: "SCO-KOR-CAR", name: "Carpenter Hill", cityCode: "SCO-KOR" },
    { code: "SCO-KOR-CON", name: "Concepcion", cityCode: "SCO-KOR" },
    { code: "SCO-KOR-DOL", name: "Dolores", cityCode: "SCO-KOR" },
    { code: "SCO-KOR-POB", name: "Poblacion", cityCode: "SCO-KOR" },
    { code: "SCO-KOR-ROT", name: "Rotonda", cityCode: "SCO-KOR" },
    { code: "SCO-KOR-SAN", name: "San Roque", cityCode: "SCO-KOR" }
  ],
  "SCO-BAG": [
    { code: "SCO-BAG-BAG", name: "Bagumbayan", cityCode: "SCO-BAG" },
    { code: "SCO-BAG-KIN", name: "Kinoma", cityCode: "SCO-BAG" },
    { code: "SCO-BAG-POB", name: "Poblacion", cityCode: "SCO-BAG" },
    { code: "SCO-BAG-SAN", name: "San Vicente", cityCode: "SCO-BAG" }
  ]
};

/**
 * Philippine Address Service Class (CommonJS)
 */
class PhilippineAddressService {
  /**
   * Get all provinces
   */
  static getProvinces() {
    return PHILIPPINES_PROVINCES.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get cities/municipalities for a specific province
   */
  static getCitiesByProvince(provinceCode) {
    if (!provinceCode) return [];
    return PHILIPPINES_CITIES[provinceCode] || [];
  }

  /**
   * Get barangays for a specific city
   */
  static getBarangaysByCity(cityCode) {
    if (!cityCode) return [];
    return PHILIPPINES_BARANGAYS[cityCode] || [];
  }

  /**
   * Search provinces by name
   */
  static searchProvinces(query) {
    const lowerQuery = query.toLowerCase();
    return PHILIPPINES_PROVINCES.filter(province => 
      province.name.toLowerCase().includes(lowerQuery) ||
      province.region.toLowerCase().includes(lowerQuery)
    ).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Search cities by name within a province
   */
  static searchCities(provinceCode, query) {
    const cities = this.getCitiesByProvince(provinceCode);
    const lowerQuery = query.toLowerCase();
    return cities.filter(city => 
      city.name.toLowerCase().includes(lowerQuery)
    ).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Search barangays by name within a city
   */
  static searchBarangays(cityCode, query) {
    const barangays = this.getBarangaysByCity(cityCode);
    const lowerQuery = query.toLowerCase();
    return barangays.filter(barangay => 
      barangay.name.toLowerCase().includes(lowerQuery)
    ).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get province by code
   */
  static getProvinceByCode(code) {
    return PHILIPPINES_PROVINCES.find(p => p.code === code) || null;
  }

  /**
   * Get city by code
   */
  static getCityByCode(code) {
    for (const cities of Object.values(PHILIPPINES_CITIES)) {
      const city = cities.find(c => c.code === code);
      if (city) return city;
    }
    return null;
  }

  /**
   * Get barangay by code
   */
  static getBarangayByCode(code) {
    for (const barangays of Object.values(PHILIPPINES_BARANGAYS)) {
      const barangay = barangays.find(b => b.code === code);
      if (barangay) return barangay;
    }
    return null;
  }

  /**
   * Calculate age from birthdate
   */
  static calculateAge(birthdate) {
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
   */
  static validatePhilippinePhone(phone) {
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
  static formatPhilippinePhone(phone) {
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
    
    return phone; // Return original if format not recognized
  }
}

module.exports = {
  PhilippineAddressService,
  PHILIPPINES_PROVINCES,
  PHILIPPINES_CITIES,
  PHILIPPINES_BARANGAYS
};
