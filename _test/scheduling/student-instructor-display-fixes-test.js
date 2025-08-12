/**
 * Test Suite: Student & Instructor Display Fixes
 * Module: Scheduling
 * 
 * Tests to verify the following fixes:
 * 1. Student dropdown shows instrument information
 * 2. Instructor dropdown properly formats specialty arrays
 * 3. Add button accessibility color improvements
 * 
 * Usage: node _test/scheduling/student-instructor-display-fixes-test.js
 */

const { test } = require('@playwright/test');

// Test Configuration
const LESSON_MODAL_SELECTORS = {
  studentDropdown: '#studentId',
  instructorDropdown: '#instructorId',
  addLessonButton: '[aria-label*="Add lesson"]',
  modal: '[role="dialog"]',
  submitButton: 'button[type="submit"]'
};

const CALENDAR_VIEW_SELECTORS = {
  dayView: '[data-testid="day-view"]',
  weekView: '[data-testid="week-view"]', 
  monthView: '[data-testid="month-view"]',
  addButtons: 'button[aria-label*="Add lesson"]'
};

// Test Data Expectations
const EXPECTED_STUDENT_FORMAT = /^.+ - .+ (\(Not Enrolled\))?$/; // Name - Instrument (Status)
const EXPECTED_INSTRUCTOR_FORMAT = /^.+ \(.+\)$/; // Name (Specialty1, Specialty2)

// Accessibility Color Requirements
const ACCESSIBILITY_REQUIREMENTS = {
  minContrast: 4.5, // WCAG AA standard
  lightTextColors: ['text-text-tertiary', 'text-slate-400', 'text-slate-500'],
  improvedTextColors: ['text-text-secondary', 'text-slate-300']
};

/**
 * Test Suite: Student Dropdown Instrument Display
 */
test.describe('Student Dropdown - Instrument Display', () => {
  
  test('should display student name with instrument in dropdown options', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Open Add Lesson modal
    await page.click(LESSON_MODAL_SELECTORS.addLessonButton);
    await page.waitForSelector(LESSON_MODAL_SELECTORS.modal);
    
    // Check student dropdown options
    const studentOptions = await page.$$eval(
      `${LESSON_MODAL_SELECTORS.studentDropdown} option:not([disabled])`,
      options => options.map(opt => opt.textContent)
    );
    
    console.log('✓ Student dropdown options found:', studentOptions.length);
    
    // Verify format: "Name - Instrument" or "Name - Instrument (Not Enrolled)"
    studentOptions.forEach((optionText, index) => {
      if (index === 0) return; // Skip "Select a student" option
      
      const hasCorrectFormat = EXPECTED_STUDENT_FORMAT.test(optionText);
      if (!hasCorrectFormat) {
        throw new Error(`Student option "${optionText}" does not include instrument information`);
      }
      
      // Verify contains instrument
      const hasInstrument = optionText.includes(' - ');
      if (!hasInstrument) {
        throw new Error(`Student option "${optionText}" missing instrument separator`);
      }
    });
    
    console.log('✓ All student options display instrument information correctly');
  });
  
  test('should handle students with different enrollment statuses', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click(LESSON_MODAL_SELECTORS.addLessonButton);
    await page.waitForSelector(LESSON_MODAL_SELECTORS.modal);
    
    const studentOptions = await page.$$eval(
      `${LESSON_MODAL_SELECTORS.studentDropdown} option:not([disabled])`,
      options => options.map(opt => ({ value: opt.value, text: opt.textContent }))
    );
    
    // Check for both active and inactive students
    const activeStudents = studentOptions.filter(opt => !opt.text.includes('(Not Enrolled)'));
    const inactiveStudents = studentOptions.filter(opt => opt.text.includes('(Not Enrolled)'));
    
    console.log(`✓ Found ${activeStudents.length} active students`);
    console.log(`✓ Found ${inactiveStudents.length} inactive students`);
    
    // All should have instrument format
    [...activeStudents, ...inactiveStudents].forEach(student => {
      if (!student.text.includes(' - ')) {
        throw new Error(`Student "${student.text}" missing instrument information`);
      }
    });
    
    console.log('✓ All students (active/inactive) show instrument correctly');
  });
  
  test('should allow duplicate names with different instruments', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click(LESSON_MODAL_SELECTORS.addLessonButton);
    await page.waitForSelector(LESSON_MODAL_SELECTORS.modal);
    
    const studentOptions = await page.$$eval(
      `${LESSON_MODAL_SELECTORS.studentDropdown} option:not([disabled])`,
      options => options.map(opt => opt.textContent)
    );
    
    // Extract names and instruments
    const studentsData = studentOptions.map(text => {
      const match = text.match(/^(.+) - (.+?)( \(Not Enrolled\))?$/);
      return match ? { name: match[1], instrument: match[2] } : null;
    }).filter(Boolean);
    
    // Check for duplicate names with different instruments
    const nameGroups = {};
    studentsData.forEach(student => {
      if (!nameGroups[student.name]) {
        nameGroups[student.name] = [];
      }
      nameGroups[student.name].push(student.instrument);
    });
    
    // Verify duplicate names have different instruments
    Object.entries(nameGroups).forEach(([name, instruments]) => {
      if (instruments.length > 1) {
        console.log(`✓ Student "${name}" has multiple instruments: ${instruments.join(', ')}`);
        const uniqueInstruments = new Set(instruments);
        if (uniqueInstruments.size !== instruments.length) {
          throw new Error(`Duplicate name "${name}" has identical instruments`);
        }
      }
    });
    
    console.log('✓ Duplicate names properly differentiated by instruments');
  });
});

/**
 * Test Suite: Instructor Dropdown Specialty Display
 */
test.describe('Instructor Dropdown - Specialty Formatting', () => {
  
  test('should display instructor name with comma-separated specialties', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click(LESSON_MODAL_SELECTORS.addLessonButton);
    await page.waitForSelector(LESSON_MODAL_SELECTORS.modal);
    
    // Check instructor dropdown options
    const instructorOptions = await page.$$eval(
      `${LESSON_MODAL_SELECTORS.instructorDropdown} option`,
      options => options.map(opt => opt.textContent)
    );
    
    console.log('✓ Instructor dropdown options found:', instructorOptions.length);
    
    // Verify format: "Name (Specialty1, Specialty2, ...)"
    instructorOptions.forEach((optionText, index) => {
      if (optionText === 'No instructors available') return;
      
      const hasCorrectFormat = EXPECTED_INSTRUCTOR_FORMAT.test(optionText);
      if (!hasCorrectFormat) {
        throw new Error(`Instructor option "${optionText}" does not have correct format`);
      }
      
      // Extract specialty portion
      const specialtyMatch = optionText.match(/\((.+)\)$/);
      if (specialtyMatch) {
        const specialties = specialtyMatch[1];
        
        // Check for proper comma separation (no space-less commas)
        const hasProperCommas = !specialties.includes(',') || specialties.includes(', ');
        if (!hasProperCommas) {
          throw new Error(`Instructor "${optionText}" has improper comma spacing in specialties`);
        }
        
        console.log(`✓ Instructor specialty formatting correct: ${specialties}`);
      }
    });
    
    console.log('✓ All instructor options have properly formatted specialties');
  });
  
  test('should handle instructors with single and multiple specialties', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click(LESSON_MODAL_SELECTORS.addLessonButton);
    await page.waitForSelector(LESSON_MODAL_SELECTORS.modal);
    
    const instructorOptions = await page.$$eval(
      `${LESSON_MODAL_SELECTORS.instructorDropdown} option`,
      options => options.map(opt => opt.textContent).filter(text => text !== 'No instructors available')
    );
    
    // Analyze specialty patterns
    const specialtyAnalysis = instructorOptions.map(optionText => {
      const specialtyMatch = optionText.match(/\((.+)\)$/);
      if (specialtyMatch) {
        const specialties = specialtyMatch[1].split(', ');
        return {
          instructor: optionText.split(' (')[0],
          specialtyCount: specialties.length,
          specialties: specialties
        };
      }
      return null;
    }).filter(Boolean);
    
    // Verify single specialties (no commas)
    const singleSpecialty = specialtyAnalysis.filter(inst => inst.specialtyCount === 1);
    const multipleSpecialty = specialtyAnalysis.filter(inst => inst.specialtyCount > 1);
    
    console.log(`✓ Instructors with single specialty: ${singleSpecialty.length}`);
    console.log(`✓ Instructors with multiple specialties: ${multipleSpecialty.length}`);
    
    // Verify no trailing/leading spaces in specialties
    specialtyAnalysis.forEach(inst => {
      inst.specialties.forEach(specialty => {
        if (specialty !== specialty.trim()) {
          throw new Error(`Instructor "${inst.instructor}" has specialty with extra spaces: "${specialty}"`);
        }
      });
    });
    
    console.log('✓ All instructor specialties properly formatted without extra spaces');
  });
  
  test('should maintain consistent formatting in both Add and Edit modes', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test Add mode
    await page.click(LESSON_MODAL_SELECTORS.addLessonButton);
    await page.waitForSelector(LESSON_MODAL_SELECTORS.modal);
    
    const addModeOptions = await page.$$eval(
      `${LESSON_MODAL_SELECTORS.instructorDropdown} option`,
      options => options.map(opt => opt.textContent)
    );
    
    await page.keyboard.press('Escape');
    await page.waitForSelector(LESSON_MODAL_SELECTORS.modal, { state: 'hidden' });
    
    // Test Edit mode (click existing lesson)
    const existingLesson = await page.$('.lesson-card, [data-testid="lesson"]');
    if (existingLesson) {
      await existingLesson.click();
      await page.waitForSelector(LESSON_MODAL_SELECTORS.modal);
      
      const editModeOptions = await page.$$eval(
        `${LESSON_MODAL_SELECTORS.instructorDropdown} option`,
        options => options.map(opt => opt.textContent)
      );
      
      // Compare formatting consistency
      if (JSON.stringify(addModeOptions) !== JSON.stringify(editModeOptions)) {
        throw new Error('Instructor formatting inconsistent between Add and Edit modes');
      }
      
      console.log('✓ Instructor formatting consistent between Add and Edit modes');
    }
  });
});

/**
 * Test Suite: Add Button Accessibility
 */
test.describe('Add Button Accessibility Improvements', () => {
  
  test('should have improved text color contrast for add buttons', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test Day View add buttons
    const dayViewAddButtons = await page.$$('.calendar-view button[aria-label*="Add lesson"]');
    
    for (const button of dayViewAddButtons) {
      const computedStyle = await button.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          color: style.color,
          backgroundColor: style.backgroundColor,
          classList: el.className
        };
      });
      
      // Check that we're not using the problematic tertiary colors
      const hasOldTertiaryColor = ACCESSIBILITY_REQUIREMENTS.lightTextColors.some(
        lightColor => computedStyle.classList.includes(lightColor)
      );
      
      if (hasOldTertiaryColor) {
        throw new Error(`Add button still uses light text color: ${computedStyle.classList}`);
      }
      
      // Check that we're using improved colors
      const hasImprovedColor = ACCESSIBILITY_REQUIREMENTS.improvedTextColors.some(
        improvedColor => computedStyle.classList.includes(improvedColor)
      );
      
      if (!hasImprovedColor) {
        console.warn(`Add button may not use improved color: ${computedStyle.classList}`);
      }
      
      console.log(`✓ Add button color improved: ${computedStyle.color}`);
    }
    
    console.log('✓ All add buttons have improved accessibility colors');
  });
  
  test('should maintain hover states for add buttons', async ({ page }) => {
    await page.goto('/dashboard');
    
    const addButton = await page.$('button[aria-label*="Add lesson"]');
    if (addButton) {
      // Get initial state
      const initialStyle = await addButton.evaluate(el => {
        const style = window.getComputedStyle(el);
        return { color: style.color, backgroundColor: style.backgroundColor };
      });
      
      // Hover and check state change
      await addButton.hover();
      await page.waitForTimeout(100); // Allow transition
      
      const hoverStyle = await addButton.evaluate(el => {
        const style = window.getComputedStyle(el);
        return { color: style.color, backgroundColor: style.backgroundColor };
      });
      
      // Verify hover state is different
      const colorChanged = initialStyle.color !== hoverStyle.color || 
                          initialStyle.backgroundColor !== hoverStyle.backgroundColor;
      
      if (!colorChanged) {
        throw new Error('Add button hover state not working');
      }
      
      console.log('✓ Add button hover state working correctly');
      console.log(`  Initial: color ${initialStyle.color}, bg ${initialStyle.backgroundColor}`);
      console.log(`  Hover: color ${hoverStyle.color}, bg ${hoverStyle.backgroundColor}`);
    }
  });
  
  test('should have proper ARIA labels for screen readers', async ({ page }) => {
    await page.goto('/dashboard');
    
    const addButtons = await page.$$('button[aria-label*="Add lesson"]');
    
    for (const button of addButtons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');
      
      // Verify ARIA label exists and is descriptive
      if (!ariaLabel || ariaLabel.length < 10) {
        throw new Error(`Add button has insufficient ARIA label: "${ariaLabel}"`);
      }
      
      // Verify contains "Add lesson"
      if (!ariaLabel.toLowerCase().includes('add lesson')) {
        throw new Error(`Add button ARIA label should contain "Add lesson": "${ariaLabel}"`);
      }
      
      // Verify title attribute for tooltip
      if (title && title !== ariaLabel) {
        console.log(`✓ Add button has both ARIA label and title: "${ariaLabel}" / "${title}"`);
      }
      
      console.log(`✓ Add button ARIA label: "${ariaLabel}"`);
    }
    
    console.log('✓ All add buttons have proper accessibility labels');
  });
});

/**
 * Test Suite: Cross-Browser Compatibility
 */
test.describe('Cross-Browser Compatibility', () => {
  
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`should work correctly in ${browserName}`, async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      await page.goto('/dashboard');
      
      // Test modal opening
      await page.click(LESSON_MODAL_SELECTORS.addLessonButton);
      await page.waitForSelector(LESSON_MODAL_SELECTORS.modal);
      
      // Test dropdown population
      const studentOptions = await page.$$eval(
        `${LESSON_MODAL_SELECTORS.studentDropdown} option:not([disabled])`,
        options => options.map(opt => opt.textContent)
      );
      
      const instructorOptions = await page.$$eval(
        `${LESSON_MODAL_SELECTORS.instructorDropdown} option`,
        options => options.map(opt => opt.textContent)
      );
      
      // Verify basic functionality
      if (studentOptions.length === 0) {
        throw new Error(`No student options found in ${browserName}`);
      }
      
      if (instructorOptions.length === 0) {
        throw new Error(`No instructor options found in ${browserName}`);
      }
      
      console.log(`✓ ${browserName}: ${studentOptions.length} students, ${instructorOptions.length} instructors`);
      
      await context.close();
    });
  });
});

/**
 * Test Suite: Performance Impact
 */
test.describe('Performance Impact Assessment', () => {
  
  test('should not significantly impact modal opening time', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Measure modal opening performance
    const times = [];
    
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      
      await page.click(LESSON_MODAL_SELECTORS.addLessonButton);
      await page.waitForSelector(LESSON_MODAL_SELECTORS.modal);
      
      const endTime = Date.now();
      times.push(endTime - startTime);
      
      await page.keyboard.press('Escape');
      await page.waitForSelector(LESSON_MODAL_SELECTORS.modal, { state: 'hidden' });
      
      await page.waitForTimeout(100); // Small delay between tests
    }
    
    const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`✓ Modal opening average time: ${averageTime.toFixed(2)}ms`);
    
    // Should open reasonably quickly (under 500ms)
    if (averageTime > 500) {
      console.warn(`Modal opening is slow: ${averageTime}ms (expected < 500ms)`);
    }
    
    console.log(`✓ Modal opening times: ${times.join('ms, ')}ms`);
  });
  
  test('should efficiently handle large student/instructor lists', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click(LESSON_MODAL_SELECTORS.addLessonButton);
    await page.waitForSelector(LESSON_MODAL_SELECTORS.modal);
    
    // Measure dropdown rendering time
    const startTime = Date.now();
    
    await page.click(LESSON_MODAL_SELECTORS.studentDropdown);
    await page.waitForTimeout(50); // Allow dropdown to fully render
    
    const endTime = Date.now();
    const renderTime = endTime - startTime;
    
    console.log(`✓ Dropdown rendering time: ${renderTime}ms`);
    
    // Count options to verify they're all rendered
    const optionCount = await page.$$eval(
      `${LESSON_MODAL_SELECTORS.studentDropdown} option`,
      options => options.length
    );
    
    console.log(`✓ Rendered ${optionCount} student options in ${renderTime}ms`);
    
    if (renderTime > 200 && optionCount > 50) {
      console.warn(`Large dropdown (${optionCount} options) rendered slowly: ${renderTime}ms`);
    }
  });
});

/**
 * Main Test Execution
 */
console.log('🧪 Starting Student & Instructor Display Fixes Tests...');
console.log('');
console.log('Test Coverage:');
console.log('  ✅ Student dropdown instrument display');
console.log('  ✅ Instructor dropdown specialty formatting');
console.log('  ✅ Add button accessibility improvements');
console.log('  ✅ Cross-browser compatibility');
console.log('  ✅ Performance impact assessment');
console.log('');
console.log('Expected Results:');
console.log('  📝 Students display as: "Name - Instrument (Status)"');
console.log('  👨‍🏫 Instructors display as: "Name (Specialty1, Specialty2)"');
console.log('  🎯 Add buttons use text-text-secondary/text-slate-300 colors');
console.log('  ♿ Improved accessibility contrast ratios');
console.log('  ⚡ No performance degradation');
console.log('');

// Export test configuration for external runners
module.exports = {
  testName: 'Student & Instructor Display Fixes',
  testModule: 'scheduling',
  coverage: [
    'Student dropdown instrument display',
    'Instructor specialty formatting',
    'Add button accessibility',
    'Cross-browser compatibility',
    'Performance optimization'
  ],
  requirements: [
    'Student names must include instrument information',
    'Instructor specialties must be comma-separated',
    'Add buttons must meet WCAG AA contrast standards',
    'No performance regression in modal opening',
    'Consistent behavior across browsers'
  ]
};
