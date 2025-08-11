/**
 * South Cotabato Address Data Tests
 * Tests specific to South Cotabato province data and cascading dropdowns
 */

const { PhilippineAddressService } = require('./philippine-address-service-mock.cjs');

class SouthCotabatoAddressTester {
  constructor() {
    this.testResults = [];
    this.passCount = 0;
    this.failCount = 0;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(formattedMessage);
    
    if (type === 'pass') this.passCount++;
    if (type === 'fail') this.failCount++;
    
    this.testResults.push({ message, type, timestamp });
  }

  async testSouthCotabatoProvince() {
    this.log('=== Testing South Cotabato Province Data ===');
    
    try {
      const provinces = PhilippineAddressService.getProvinces();
      const southCotabato = provinces.find(p => p.name === 'South Cotabato');
      
      if (southCotabato) {
        this.log(`✓ South Cotabato province found: ${southCotabato.code} (${southCotabato.region})`, 'pass');
        
        if (southCotabato.code === 'SCO') {
          this.log('✓ South Cotabato has correct code: SCO', 'pass');
        } else {
          this.log(`✗ South Cotabato should have code SCO, got: ${southCotabato.code}`, 'fail');
        }
        
        if (southCotabato.region === 'Region XII') {
          this.log('✓ South Cotabato has correct region: Region XII', 'pass');
        } else {
          this.log(`✗ South Cotabato should be in Region XII, got: ${southCotabato.region}`, 'fail');
        }
        
      } else {
        this.log('✗ South Cotabato province not found', 'fail');
      }
      
    } catch (error) {
      this.log(`✗ Error testing South Cotabato province: ${error.message}`, 'fail');
    }
  }

  async testSouthCotabatoCities() {
    this.log('\n=== Testing South Cotabato Cities ===');
    
    try {
      const cities = PhilippineAddressService.getCitiesByProvince('SCO');
      
      if (cities && cities.length > 0) {
        this.log(`✓ Successfully loaded ${cities.length} cities for South Cotabato`, 'pass');
        
        // Test for specific expected cities
        const expectedCities = [
          'General Santos City',
          'Koronadal City',
          'Banga',
          'Lake Sebu',
          'Polomolok',
          'Surallah',
          'Tupi'
        ];
        
        let foundCount = 0;
        for (const expectedCity of expectedCities) {
          const found = cities.find(c => c.name === expectedCity);
          if (found) {
            this.log(`✓ Expected city "${expectedCity}" found: ${found.code}`, 'pass');
            foundCount++;
          } else {
            this.log(`✗ Expected city "${expectedCity}" not found`, 'fail');
          }
        }
        
        this.log(`✓ Found ${foundCount}/${expectedCities.length} expected cities`, foundCount > 0 ? 'pass' : 'fail');
        
        // Test city structure
        const firstCity = cities[0];
        if (firstCity.code && firstCity.name && firstCity.provinceCode === 'SCO') {
          this.log('✓ City structure is correct (code, name, provinceCode)', 'pass');
        } else {
          this.log('✗ City structure is incorrect', 'fail');
        }
        
      } else {
        this.log('✗ No cities found for South Cotabato (SCO)', 'fail');
      }
      
    } catch (error) {
      this.log(`✗ Error testing South Cotabato cities: ${error.message}`, 'fail');
    }
  }

  async testGeneralSantosBarangays() {
    this.log('\n=== Testing General Santos City Barangays ===');
    
    try {
      // First get General Santos City code
      const cities = PhilippineAddressService.getCitiesByProvince('SCO');
      const genSan = cities.find(c => c.name === 'General Santos City');
      
      if (!genSan) {
        this.log('✗ General Santos City not found in South Cotabato cities', 'fail');
        return;
      }
      
      this.log(`✓ General Santos City found: ${genSan.code}`, 'pass');
      
      const barangays = PhilippineAddressService.getBarangaysByCity(genSan.code);
      
      if (barangays && barangays.length > 0) {
        this.log(`✓ Successfully loaded ${barangays.length} barangays for General Santos City`, 'pass');
        
        // Test for specific expected barangays
        const expectedBarangays = [
          'Apopong',
          'Buayan',
          'Calumpang',
          'City Heights',
          'Lagao',
          'San Isidro'
        ];
        
        let foundCount = 0;
        for (const expectedBarangay of expectedBarangays) {
          const found = barangays.find(b => b.name === expectedBarangay);
          if (found) {
            this.log(`✓ Expected barangay "${expectedBarangay}" found: ${found.code}`, 'pass');
            foundCount++;
          } else {
            this.log(`✗ Expected barangay "${expectedBarangay}" not found`, 'fail');
          }
        }
        
        this.log(`✓ Found ${foundCount}/${expectedBarangays.length} expected barangays`, foundCount > 0 ? 'pass' : 'fail');
        
        // Test barangay structure
        const firstBarangay = barangays[0];
        if (firstBarangay.code && firstBarangay.name && firstBarangay.cityCode === genSan.code) {
          this.log('✓ Barangay structure is correct (code, name, cityCode)', 'pass');
        } else {
          this.log('✗ Barangay structure is incorrect', 'fail');
        }
        
      } else {
        this.log('✗ No barangays found for General Santos City', 'fail');
      }
      
    } catch (error) {
      this.log(`✗ Error testing General Santos City barangays: ${error.message}`, 'fail');
    }
  }

  async testKoronadalBarangays() {
    this.log('\n=== Testing Koronadal City Barangays ===');
    
    try {
      const cities = PhilippineAddressService.getCitiesByProvince('SCO');
      const koronadal = cities.find(c => c.name === 'Koronadal City');
      
      if (!koronadal) {
        this.log('✗ Koronadal City not found in South Cotabato cities', 'fail');
        return;
      }
      
      this.log(`✓ Koronadal City found: ${koronadal.code}`, 'pass');
      
      const barangays = PhilippineAddressService.getBarangaysByCity(koronadal.code);
      
      if (barangays && barangays.length > 0) {
        this.log(`✓ Successfully loaded ${barangays.length} barangays for Koronadal City`, 'pass');
        
        const expectedBarangays = [
          'Apokon',
          'Carpenter Hill',
          'Concepcion',
          'Dolores',
          'Poblacion',
          'Rotonda'
        ];
        
        let foundCount = 0;
        for (const expectedBarangay of expectedBarangays) {
          const found = barangays.find(b => b.name === expectedBarangay);
          if (found) {
            this.log(`✓ Expected barangay "${expectedBarangay}" found: ${found.code}`, 'pass');
            foundCount++;
          } else {
            this.log(`✗ Expected barangay "${expectedBarangay}" not found`, 'fail');
          }
        }
        
        this.log(`✓ Found ${foundCount}/${expectedBarangays.length} expected barangays`, foundCount > 0 ? 'pass' : 'fail');
        
      } else {
        this.log('✗ No barangays found for Koronadal City', 'fail');
      }
      
    } catch (error) {
      this.log(`✗ Error testing Koronadal City barangays: ${error.message}`, 'fail');
    }
  }

  async testCompleteAddressFlow() {
    this.log('\n=== Testing Complete South Cotabato Address Flow ===');
    
    try {
      // Step 1: Select South Cotabato province
      const provinces = PhilippineAddressService.getProvinces();
      const southCotabato = provinces.find(p => p.name === 'South Cotabato');
      
      if (!southCotabato) {
        this.log('✗ Cannot start flow - South Cotabato province not found', 'fail');
        return;
      }
      
      this.log('✓ Step 1: South Cotabato province selected', 'pass');
      
      // Step 2: Load cities for South Cotabato
      const cities = PhilippineAddressService.getCitiesByProvince(southCotabato.code);
      
      if (!cities || cities.length === 0) {
        this.log('✗ Step 2 failed: No cities loaded for South Cotabato', 'fail');
        return;
      }
      
      this.log(`✓ Step 2: ${cities.length} cities loaded for South Cotabato`, 'pass');
      
      // Step 3: Select General Santos City
      const genSan = cities.find(c => c.name === 'General Santos City');
      
      if (!genSan) {
        this.log('✗ Step 3 failed: General Santos City not found', 'fail');
        return;
      }
      
      this.log('✓ Step 3: General Santos City selected', 'pass');
      
      // Step 4: Load barangays for General Santos City
      const barangays = PhilippineAddressService.getBarangaysByCity(genSan.code);
      
      if (!barangays || barangays.length === 0) {
        this.log('✗ Step 4 failed: No barangays loaded for General Santos City', 'fail');
        return;
      }
      
      this.log(`✓ Step 4: ${barangays.length} barangays loaded for General Santos City`, 'pass');
      
      // Step 5: Complete address formation
      const selectedBarangay = barangays[0]; // Select first barangay
      const completeAddress = {
        country: 'Philippines',
        province: southCotabato.name,
        city: genSan.name,
        barangay: selectedBarangay.name,
        addressLine1: '123 Sample Street',
        addressLine2: 'Building A'
      };
      
      const formattedAddress = [
        completeAddress.addressLine1,
        completeAddress.addressLine2,
        `Barangay ${completeAddress.barangay}`,
        completeAddress.city,
        completeAddress.province,
        completeAddress.country
      ].filter(Boolean).join(', ');
      
      this.log(`✓ Step 5: Complete address formed: ${formattedAddress}`, 'pass');
      
      // Validate all required fields are present
      const requiredFields = ['country', 'province', 'city', 'addressLine1'];
      const isValid = requiredFields.every(field => completeAddress[field] && completeAddress[field].trim() !== '');
      
      if (isValid) {
        this.log('✓ Address validation: All required fields present', 'pass');
      } else {
        this.log('✗ Address validation: Missing required fields', 'fail');
      }
      
    } catch (error) {
      this.log(`✗ Error in complete address flow: ${error.message}`, 'fail');
    }
  }

  async testOtherMindanaoProvinces() {
    this.log('\n=== Testing Other Mindanao Province Data ===');
    
    try {
      const provinces = PhilippineAddressService.getProvinces();
      
      // Test other Region XII provinces
      const regionXIIProvinces = [
        'South Cotabato',
        'North Cotabato', 
        'Sarangani',
        'Sultan Kudarat'
      ];
      
      let foundCount = 0;
      for (const provinceName of regionXIIProvinces) {
        const found = provinces.find(p => p.name === provinceName);
        if (found) {
          this.log(`✓ Region XII province "${provinceName}" found: ${found.code}`, 'pass');
          foundCount++;
          
          // Test if cities are available
          const cities = PhilippineAddressService.getCitiesByProvince(found.code);
          if (cities && cities.length > 0) {
            this.log(`✓ ${cities.length} cities available for ${provinceName}`, 'pass');
          } else {
            this.log(`⚠ No cities data available for ${provinceName}`, 'fail');
          }
        } else {
          this.log(`✗ Region XII province "${provinceName}" not found`, 'fail');
        }
      }
      
      this.log(`✓ Found ${foundCount}/${regionXIIProvinces.length} Region XII provinces`, 'pass');
      
      // Test Davao region
      const davaoProv = provinces.find(p => p.name === 'Davao del Sur');
      if (davaoProv) {
        this.log(`✓ Davao del Sur province found: ${davaoProv.code}`, 'pass');
        
        const davaoCities = PhilippineAddressService.getCitiesByProvince(davaoProv.code);
        if (davaoCities && davaoCities.length > 0) {
          this.log(`✓ ${davaoCities.length} cities available for Davao del Sur`, 'pass');
          
          const davaoCity = davaoCities.find(c => c.name === 'Davao City');
          if (davaoCity) {
            this.log('✓ Davao City found in Davao del Sur', 'pass');
          } else {
            this.log('✗ Davao City not found in Davao del Sur cities', 'fail');
          }
        } else {
          this.log('⚠ No cities data available for Davao del Sur', 'fail');
        }
      } else {
        this.log('✗ Davao del Sur province not found', 'fail');
      }
      
    } catch (error) {
      this.log(`✗ Error testing other Mindanao provinces: ${error.message}`, 'fail');
    }
  }

  async runAllTests() {
    this.log('Starting South Cotabato Address Data Tests...\n');
    
    await this.testSouthCotabatoProvince();
    await this.testSouthCotabatoCities();
    await this.testGeneralSantosBarangays();
    await this.testKoronadalBarangays();
    await this.testCompleteAddressFlow();
    await this.testOtherMindanaoProvinces();
    
    this.log('\n=== South Cotabato Test Summary ===');
    this.log(`Total Tests: ${this.passCount + this.failCount}`);
    this.log(`Passed: ${this.passCount}`, 'pass');
    this.log(`Failed: ${this.failCount}`, this.failCount > 0 ? 'fail' : 'pass');
    this.log(`Success Rate: ${((this.passCount / (this.passCount + this.failCount)) * 100).toFixed(1)}%`);
    
    return {
      total: this.passCount + this.failCount,
      passed: this.passCount,
      failed: this.failCount,
      successRate: (this.passCount / (this.passCount + this.failCount)) * 100,
      results: this.testResults
    };
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new SouthCotabatoAddressTester();
  tester.runAllTests().then(results => {
    console.log('\n=== South Cotabato Address Tests Complete ===');
    process.exit(results.failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = SouthCotabatoAddressTester;
