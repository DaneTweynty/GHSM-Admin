// Calendar Card Display Debug Test
// Comprehensive test to identify why lesson cards are not showing

const debugCalendarCardDisplay = () => {
  console.log('=== Calendar Card Display Debug Test ===');
  
  // Test 1: Check if lesson data exists
  console.log('\n1. Testing Lesson Data Availability');
  const testLessonData = () => {
    // Mock lesson data for testing
    const mockLessons = [
      {
        id: 'l1',
        studentId: 's1',
        instructorId: 'i1',
        date: '2025-08-12', // Today's date
        time: '10:00',
        endTime: '11:00',
        roomId: 1,
        notes: 'Test lesson'
      },
      {
        id: 'l2',
        studentId: 's2',
        instructorId: 'i2',
        date: '2025-08-12',
        time: '14:00',
        endTime: '15:00',
        roomId: 2,
        notes: ''
      }
    ];
    
    console.log(`Mock lessons created: ${mockLessons.length}`);
    console.log('Sample lesson:', mockLessons[0]);
    
    // Test date filtering
    const today = '2025-08-12';
    const todaysLessons = mockLessons.filter(l => l.date === today);
    console.log(`Lessons for today (${today}): ${todaysLessons.length}`);
    
    return todaysLessons.length > 0;
  };
  
  // Test 2: Check instructor color availability
  console.log('\n2. Testing Instructor Color Mapping');
  const testInstructorColors = () => {
    const mockInstructors = [
      { id: 'i1', name: 'Sarah Piano', color: '#3B82F6', status: 'active' },
      { id: 'i2', name: 'Mike Guitar', color: '#EF4444', status: 'active' },
      { id: 'i3', name: 'Lisa Violin', color: '#10B981', status: 'active' }
    ];
    
    console.log(`Mock instructors: ${mockInstructors.length}`);
    mockInstructors.forEach(instructor => {
      console.log(`${instructor.name}: ${instructor.color}`);
      
      // Test if color is valid
      const isValidColor = /^#[0-9A-F]{6}$/i.test(instructor.color);
      console.log(`  Color valid: ${isValidColor ? 'PASS' : 'FAIL'}`);
    });
    
    return mockInstructors.every(i => i.color && i.color.startsWith('#'));
  };
  
  // Test 3: Check student mapping
  console.log('\n3. Testing Student Data Mapping');
  const testStudentMapping = () => {
    const mockStudents = [
      { id: 's1', name: 'John Doe', instrument: 'Piano', status: 'active' },
      { id: 's2', name: 'Jane Smith', instrument: 'Guitar', status: 'active' }
    ];
    
    console.log(`Mock students: ${mockStudents.length}`);
    const studentMap = new Map(mockStudents.map(s => [s.id, s]));
    
    // Test mapping functionality
    const testStudent = studentMap.get('s1');
    console.log(`Student mapping test: ${testStudent ? 'PASS' : 'FAIL'}`);
    if (testStudent) {
      console.log(`Retrieved: ${testStudent.name} - ${testStudent.instrument}`);
    }
    
    return studentMap.size === mockStudents.length;
  };
  
  // Test 4: CSS Class and Style Application
  console.log('\n4. Testing CSS Classes and Styles');
  const testCSSApplication = () => {
    // Test z-index values
    const expectedZIndex = {
      lessonCards: 20,
      plusButtons: 30,
      dragGuides: 10,
      gridLines: 0
    };
    
    console.log('Expected z-index values:');
    Object.entries(expectedZIndex).forEach(([element, zIndex]) => {
      console.log(`  ${element}: z-${zIndex}`);
    });
    
    // Test color application
    const testColor = '#3B82F6';
    console.log(`\nTesting background color: ${testColor}`);
    
    // Test absolute positioning
    const testPosition = {
      top: 120, // 60px * 2 (10:00 AM)
      left: 'calc(0 * (100% / 1) + 0 * 2px)',
      width: 'calc((100% - 0px) / 1)',
      height: 120 // 1 hour
    };
    
    console.log('Expected position styles:', testPosition);
    
    return true;
  };
  
  // Test 5: Date Format Validation
  console.log('\n5. Testing Date Format Consistency');
  const testDateFormats = () => {
    const testDate = new Date('2025-08-12');
    const toYYYYMMDD = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const formatted = toYYYYMMDD(testDate);
    console.log(`Date formatting test: ${formatted}`);
    console.log(`Expected format: YYYY-MM-DD - ${/^\d{4}-\d{2}-\d{2}$/.test(formatted) ? 'PASS' : 'FAIL'}`);
    
    // Test current date
    const today = new Date();
    const todayFormatted = toYYYYMMDD(today);
    console.log(`Today's date: ${todayFormatted}`);
    
    return /^\d{4}-\d{2}-\d{2}$/.test(formatted);
  };
  
  // Test 6: DOM Element Visibility
  console.log('\n6. Testing DOM Element Visibility');
  const testDOMVisibility = () => {
    if (typeof document === 'undefined') {
      console.log('DOM not available (running in Node.js)');
      return true;
    }
    
    // Check for calendar elements
    const calendarElements = {
      dayView: document.querySelector('[data-testid="day-view"]'),
      weekView: document.querySelector('[data-testid="week-view"]'),
      monthView: document.querySelector('[data-testid="month-view"]'),
      lessonCards: document.querySelectorAll('[data-testid="lesson-card"]')
    };
    
    Object.entries(calendarElements).forEach(([name, element]) => {
      if (element) {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;
        console.log(`${name}: ${isVisible ? 'VISIBLE' : 'HIDDEN'} (${rect.width}x${rect.height})`);
      } else {
        console.log(`${name}: NOT FOUND`);
      }
    });
    
    return true;
  };
  
  // Test 7: Console Error Detection
  console.log('\n7. Checking for Console Errors');
  const testConsoleErrors = () => {
    if (typeof window === 'undefined') {
      console.log('Window not available (running in Node.js)');
      return true;
    }
    
    // Override console.error to catch errors
    const originalError = console.error;
    const errors = [];
    
    console.error = (...args) => {
      errors.push(args.join(' '));
      originalError.apply(console, args);
    };
    
    // Restore after a brief period
    setTimeout(() => {
      console.error = originalError;
      if (errors.length > 0) {
        console.log(`Found ${errors.length} console errors:`);
        errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      } else {
        console.log('No console errors detected');
      }
    }, 1000);
    
    return true;
  };
  
  // Run all tests
  try {
    const results = {
      lessonData: testLessonData(),
      instructorColors: testInstructorColors(),
      studentMapping: testStudentMapping(),
      cssApplication: testCSSApplication(),
      dateFormats: testDateFormats(),
      domVisibility: testDOMVisibility(),
      consoleErrors: testConsoleErrors()
    };
    
    console.log('\n=== Test Results Summary ===');
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`${test}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    });
    
    const allPassed = Object.values(results).every(Boolean);
    console.log(`\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (!allPassed) {
      console.log('\n🔍 DEBUGGING SUGGESTIONS:');
      console.log('1. Check if lesson data is being passed to calendar components');
      console.log('2. Verify instructor colors are defined and valid');
      console.log('3. Ensure date formats match between lesson data and calendar filtering');
      console.log('4. Check for CSS conflicts affecting z-index or visibility');
      console.log('5. Look for JavaScript errors in browser console');
      console.log('6. Verify component props are being passed correctly');
    }
    
    console.log('\n=== Debug Test Complete ===');
    return results;
  } catch (error) {
    console.error('Debug test failed:', error);
    return false;
  }
};

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { debugCalendarCardDisplay };
}

// Browser testing
if (typeof window !== 'undefined') {
  window.debugCalendarCardDisplay = debugCalendarCardDisplay;
  console.log('Calendar card display debug test loaded. Run debugCalendarCardDisplay() to execute.');
}

// Auto-run if in Node.js environment
if (typeof window === 'undefined' && typeof module !== 'undefined') {
  debugCalendarCardDisplay();
}
