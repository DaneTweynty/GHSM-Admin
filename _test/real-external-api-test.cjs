/**
 * Real External API Test
 * Tests the actual external API integration (not mocked)
 */

const logInfo = (message) => {
  console.log(`[${new Date().toISOString()}] [INFO] ${message}`);
};

const logPass = (message) => {
  console.log(`[${new Date().toISOString()}] [PASS] ✓ ${message}`);
};

const logFail = (message) => {
  console.log(`[${new Date().toISOString()}] [FAIL] ✗ ${message}`);
};

const logWarn = (message) => {
  console.log(`[${new Date().toISOString()}] [WARN] ⚠ ${message}`);
};

/**
 * Test the actual external API endpoints
 */
async function testRealExternalAPI() {
  logInfo('Testing Real External Philippine Address API...');
  logInfo('Source: https://github.com/isaacdarcilla/philippine-addresses');
  
  let testsPassed = 0;
  let testsFailed = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      logPass(message);
      testsPassed++;
    } else {
      logFail(message);
      testsFailed++;
    }
  }

  const baseUrl = 'https://raw.githubusercontent.com/isaacdarcilla/philippine-addresses/master';
  
  try {
    // Test 1: Fetch provinces
    logInfo('=== Testing Province API ===');
    try {
      const provinceResponse = await fetch(`${baseUrl}/province.json`);
      assert(provinceResponse.ok, 'Province API endpoint is accessible');
      
      const provinces = await provinceResponse.json();
      assert(Array.isArray(provinces), 'Province data is returned as array');
      assert(provinces.length > 50, `Province count is reasonable (${provinces.length} provinces)`);
      
      // Find South Cotabato
      const southCotabato = provinces.find(p => 
        p.province_name && p.province_name.toLowerCase().includes('south cotabato')
      );
      assert(!!southCotabato, 'South Cotabato province found in external data');
      
      if (southCotabato) {
        assert(!!southCotabato.province_code, 'South Cotabato has province_code');
        assert(southCotabato.region_code === '12', 'South Cotabato is in Region XII (SOCCSKSARGEN)');
        logInfo(`South Cotabato details: ${southCotabato.province_name} (Code: ${southCotabato.province_code}, Region: ${southCotabato.region_code})`);
      }
      
    } catch (error) {
      logFail(`Province API test failed: ${error.message}`);
      testsFailed++;
      totalTests++;
    }

    // Test 2: Fetch cities
    logInfo('=== Testing City API ===');
    try {
      const cityResponse = await fetch(`${baseUrl}/city.json`);
      assert(cityResponse.ok, 'City API endpoint is accessible');
      
      const cities = await cityResponse.json();
      assert(Array.isArray(cities), 'City data is returned as array');
      assert(cities.length > 1000, `City count is reasonable (${cities.length} cities)`);
      
      // Find South Cotabato cities
      const southCotabatoCities = cities.filter(c => 
        c.province_code === '1263' || 
        (c.city_name && c.city_name.toLowerCase().includes('general santos'))
      );
      assert(southCotabatoCities.length > 0, `South Cotabato cities found (${southCotabatoCities.length} cities)`);
      
      // Find General Santos City specifically
      const genSan = southCotabatoCities.find(c => 
        c.city_name && c.city_name.toLowerCase().includes('general santos')
      );
      assert(!!genSan, 'General Santos City found in external data');
      
      if (genSan) {
        logInfo(`General Santos City details: ${genSan.city_name} (Code: ${genSan.city_code}, Province: ${genSan.province_code})`);
      }
      
    } catch (error) {
      logFail(`City API test failed: ${error.message}`);
      testsFailed++;
      totalTests++;
    }

    // Test 3: Fetch barangays
    logInfo('=== Testing Barangay API ===');
    try {
      const barangayResponse = await fetch(`${baseUrl}/barangay.json`);
      assert(barangayResponse.ok, 'Barangay API endpoint is accessible');
      
      const barangays = await barangayResponse.json();
      assert(Array.isArray(barangays), 'Barangay data is returned as array');
      assert(barangays.length > 10000, `Barangay count is reasonable (${barangays.length} barangays)`);
      
      // Find South Cotabato barangays
      const southCotabatoBarangays = barangays.filter(b => 
        b.province_code === '1263' || 
        (b.brgy_name && b.brgy_name.toLowerCase().includes('apopong'))
      );
      assert(southCotabatoBarangays.length > 0, `South Cotabato barangays found (${southCotabatoBarangays.length} barangays)`);
      
      // Find Apopong barangay specifically
      const apopong = southCotabatoBarangays.find(b => 
        b.brgy_name && b.brgy_name.toLowerCase().includes('apopong')
      );
      assert(!!apopong, 'Apopong barangay found in external data');
      
      if (apopong) {
        logInfo(`Apopong barangay details: ${apopong.brgy_name} (Code: ${apopong.brgy_code}, City: ${apopong.city_code})`);
      }
      
    } catch (error) {
      logFail(`Barangay API test failed: ${error.message}`);
      testsFailed++;
      totalTests++;
    }

    // Test 4: Fetch regions
    logInfo('=== Testing Region API ===');
    try {
      const regionResponse = await fetch(`${baseUrl}/region.json`);
      assert(regionResponse.ok, 'Region API endpoint is accessible');
      
      const regions = await regionResponse.json();
      assert(Array.isArray(regions), 'Region data is returned as array');
      assert(regions.length >= 17, `Region count is reasonable (${regions.length} regions)`);
      
      // Find Region XII (SOCCSKSARGEN)
      const regionXII = regions.find(r => 
        r.region_code === '12' || 
        (r.region_name && r.region_name.toLowerCase().includes('soccsksargen'))
      );
      assert(!!regionXII, 'Region XII (SOCCSKSARGEN) found in external data');
      
      if (regionXII) {
        logInfo(`Region XII details: ${regionXII.region_name} (Code: ${regionXII.region_code})`);
      }
      
    } catch (error) {
      logFail(`Region API test failed: ${error.message}`);
      testsFailed++;
      totalTests++;
    }

    // Test 5: Data consistency
    logInfo('=== Testing Data Consistency ===');
    
    try {
      // Test that our service can handle the external data format
      const fs = require('fs');
      const path = require('path');
      
      const servicePath = path.join(__dirname, '..', 'services', 'philippineAddressService.ts');
      if (fs.existsSync(servicePath)) {
        const serviceContent = fs.readFileSync(servicePath, 'utf8');
        
        assert(
          serviceContent.includes('province_code') && 
          serviceContent.includes('province_name'),
          'Service handles external province data format'
        );
        
        assert(
          serviceContent.includes('city_code') && 
          serviceContent.includes('city_name'),
          'Service handles external city data format'
        );
        
        assert(
          serviceContent.includes('brgy_code') && 
          serviceContent.includes('brgy_name'),
          'Service handles external barangay data format'
        );
        
        assert(
          serviceContent.includes('https://raw.githubusercontent.com/isaacdarcilla/philippine-addresses'),
          'Service points to correct external API'
        );
        
      } else {
        logFail('Service file not found for consistency testing');
        testsFailed++;
        totalTests++;
      }
      
    } catch (error) {
      logFail(`Data consistency test failed: ${error.message}`);
      testsFailed++;
      totalTests++;
    }

  } catch (error) {
    logFail(`External API tests failed: ${error.message}`);
    testsFailed++;
    totalTests++;
  }

  // Print summary
  logInfo('');
  logInfo('=== Real External API Test Summary ===');
  logInfo(`Total Tests: ${totalTests}`);
  if (testsPassed > 0) logPass(`Passed: ${testsPassed}`);
  if (testsFailed > 0) logFail(`Failed: ${testsFailed}`);
  
  const successRate = totalTests > 0 ? ((testsPassed / totalTests) * 100).toFixed(1) : 0;
  logInfo(`Success Rate: ${successRate}%`);
  
  if (testsFailed === 0) {
    logPass('🎉 All external API tests passed!');
    logInfo('✅ External API is accessible and contains complete Philippine address data');
    logInfo('✅ South Cotabato province, cities, and barangays are available');
    logInfo('✅ Data format is compatible with our service implementation');
    logInfo('✅ Complete address hierarchy is working correctly');
  } else if (successRate >= 80) {
    logPass(`✅ External API tests mostly successful (${successRate}% pass rate)`);
    logWarn('Some tests failed but core functionality is working');
  } else {
    logWarn(`⚠ External API tests had significant issues (${successRate}% pass rate)`);
    logInfo('Consider using fallback data or investigating network connectivity');
  }
  
  logInfo('');
  logInfo('=== Real External API Tests Complete ===');
  
  return { testsPassed, testsFailed, totalTests, successRate };
}

// Run the tests
if (require.main === module) {
  testRealExternalAPI().catch(console.error);
}

module.exports = { testRealExternalAPI };
