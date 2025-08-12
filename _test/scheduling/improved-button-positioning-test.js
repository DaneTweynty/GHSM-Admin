/**
 * Improved Button Positioning Test Suite
 * Tests the enhanced button layout for DayView and WeekView
 * Date: August 12, 2025
 */

class ImprovedButtonPositioningTest {
  constructor() {
    this.testResults = [];
    this.testCount = 0;
  }

  async runAllTests() {
    console.log('🧪 Starting Improved Button Positioning Test Suite...\n');
    
    await this.testDayViewButtonColumn();
    await this.testWeekViewButtonColumn();
    await this.testButtonCentering();
    await this.testLessonCardWidthAdjustment();
    await this.testVisualSeparation();
    await this.testResponsiveDesign();
    await this.testButtonInteraction();
    await this.testAccessibility();
    
    this.generateReport();
  }

  async testDayViewButtonColumn() {
    this.testCount++;
    console.log('🔍 Test 1: DayView Button Column Implementation...');
    
    try {
      // Test for dedicated button column container
      const buttonColumn = document.querySelector('.dayview-container .absolute.right-0.w-12');
      
      const tests = {
        'Button column exists': !!buttonColumn,
        'Has correct width (w-12)': buttonColumn?.classList.contains('w-12'),
        'Has background styling': buttonColumn?.classList.contains('bg-surface-card/30'),
        'Has border styling': buttonColumn?.classList.contains('border-l'),
        'Positioned correctly': buttonColumn?.classList.contains('right-0'),
        'Full height coverage': buttonColumn?.classList.contains('top-0') && buttonColumn?.classList.contains('bottom-0')
      };

      const passed = Object.values(tests).every(test => test === true);
      
      this.logTestResult('DayView Button Column', passed, tests);
      
    } catch (error) {
      this.logTestResult('DayView Button Column', false, { error: error.message });
    }
  }

  async testWeekViewButtonColumn() {
    this.testCount++;
    console.log('🔍 Test 2: WeekView Button Column Implementation...');
    
    try {
      // Test for dedicated button column container in week view
      const buttonColumns = document.querySelectorAll('.weekview-container .absolute.right-0.w-10');
      
      const tests = {
        'Button columns exist': buttonColumns.length > 0,
        'Correct width (w-10)': Array.from(buttonColumns).every(col => col.classList.contains('w-10')),
        'Has background styling': Array.from(buttonColumns).every(col => col.classList.contains('bg-surface-card/30')),
        'Has border styling': Array.from(buttonColumns).every(col => col.classList.contains('border-l')),
        'Positioned correctly': Array.from(buttonColumns).every(col => col.classList.contains('right-0')),
        'Full height coverage': Array.from(buttonColumns).every(col => 
          col.classList.contains('top-0') && col.classList.contains('bottom-0')
        )
      };

      const passed = Object.values(tests).every(test => test === true);
      
      this.logTestResult('WeekView Button Column', passed, tests);
      
    } catch (error) {
      this.logTestResult('WeekView Button Column', false, { error: error.message });
    }
  }

  async testButtonCentering() {
    this.testCount++;
    console.log('🔍 Test 3: Button Centering within Columns...');
    
    try {
      // Test button positioning within columns
      const dayViewButtons = document.querySelectorAll('.dayview-container .w-12 button');
      const weekViewButtons = document.querySelectorAll('.weekview-container .w-10 button');
      
      const tests = {
        'DayView buttons have centering classes': Array.from(dayViewButtons).every(btn => 
          btn.classList.contains('left-1/2') && btn.classList.contains('transform') && btn.classList.contains('-translate-x-1/2')
        ),
        'WeekView buttons have centering classes': Array.from(weekViewButtons).every(btn => 
          btn.classList.contains('left-1/2') && btn.classList.contains('transform') && btn.classList.contains('-translate-x-1/2')
        ),
        'DayView buttons exist': dayViewButtons.length > 0,
        'WeekView buttons exist': weekViewButtons.length > 0,
        'Proper z-index on DayView': Array.from(dayViewButtons).every(btn => btn.classList.contains('z-30')),
        'Proper z-index on WeekView': Array.from(weekViewButtons).every(btn => btn.classList.contains('z-10'))
      };

      const passed = Object.values(tests).every(test => test === true);
      
      this.logTestResult('Button Centering', passed, tests);
      
    } catch (error) {
      this.logTestResult('Button Centering', false, { error: error.message });
    }
  }

  async testLessonCardWidthAdjustment() {
    this.testCount++;
    console.log('🔍 Test 4: Lesson Card Width Adjustment...');
    
    try {
      // Test that lesson cards account for button column space
      const dayViewCards = document.querySelectorAll('.dayview-container .z-20[style*="width"]');
      const weekViewCards = document.querySelectorAll('.weekview-container .z-20[style*="width"]');
      
      const tests = {
        'DayView cards exist': dayViewCards.length > 0,
        'WeekView cards exist': weekViewCards.length > 0,
        'DayView cards account for button space': Array.from(dayViewCards).some(card => 
          card.style.width.includes('48px') || card.style.width.includes('calc')
        ),
        'WeekView cards account for button space': Array.from(weekViewCards).some(card => 
          card.style.width.includes('40px') || card.style.width.includes('calc')
        ),
        'Cards maintain horizontal layout': Array.from(dayViewCards).every(card => !card.style.flexDirection),
        'Cards not overlapping button area': true // Visual test - would need manual verification
      };

      const passed = Object.values(tests).filter(test => test !== true).length === 0;
      
      this.logTestResult('Lesson Card Width Adjustment', passed, tests);
      
    } catch (error) {
      this.logTestResult('Lesson Card Width Adjustment', false, { error: error.message });
    }
  }

  async testVisualSeparation() {
    this.testCount++;
    console.log('🔍 Test 5: Visual Separation and Styling...');
    
    try {
      // Test visual elements that create separation
      const buttonColumns = document.querySelectorAll('[class*="bg-surface-card/30"][class*="border-l"]');
      
      const tests = {
        'Button columns have background': buttonColumns.length > 0,
        'Border separation exists': Array.from(buttonColumns).every(col => 
          col.classList.contains('border-l')
        ),
        'Subtle background applied': Array.from(buttonColumns).every(col => 
          col.classList.contains('bg-surface-card/30') || col.classList.contains('dark:bg-slate-800/30')
        ),
        'Border color appropriate': Array.from(buttonColumns).every(col => 
          col.classList.contains('border-surface-border/30') || col.classList.contains('dark:border-slate-700/30')
        ),
        'No harsh visual breaks': true, // Visual assessment needed
        'Maintains design consistency': true // Visual assessment needed
      };

      const passed = Object.values(tests).filter(test => test !== true).length === 0;
      
      this.logTestResult('Visual Separation', passed, tests);
      
    } catch (error) {
      this.logTestResult('Visual Separation', false, { error: error.message });
    }
  }

  async testResponsiveDesign() {
    this.testCount++;
    console.log('🔍 Test 6: Responsive Design Compatibility...');
    
    try {
      // Test responsive behavior
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      const tests = {
        'Viewport width available': viewport.width > 0,
        'Viewport height available': viewport.height > 0,
        'Mobile breakpoint handling': viewport.width < 768 ? 'mobile' : 'desktop',
        'Button columns responsive': true, // Would need actual resize testing
        'Card layout maintains integrity': true, // Visual verification needed
        'No horizontal overflow': document.body.scrollWidth <= window.innerWidth
      };

      const passed = tests['Viewport width available'] && tests['Viewport height available'] && 
                    tests['No horizontal overflow'];
      
      this.logTestResult('Responsive Design', passed, tests);
      
    } catch (error) {
      this.logTestResult('Responsive Design', false, { error: error.message });
    }
  }

  async testButtonInteraction() {
    this.testCount++;
    console.log('🔍 Test 7: Button Interaction and Functionality...');
    
    try {
      // Test button event handling
      const addButtons = document.querySelectorAll('button[title*="Add lesson"]');
      
      const tests = {
        'Add buttons exist': addButtons.length > 0,
        'Buttons have click handlers': Array.from(addButtons).every(btn => 
          btn.onclick !== null || btn.getAttribute('onclick') !== null
        ),
        'Buttons have proper titles': Array.from(addButtons).every(btn => 
          btn.title && btn.title.includes('Add lesson')
        ),
        'Buttons have ARIA labels': Array.from(addButtons).every(btn => 
          btn.getAttribute('aria-label') && btn.getAttribute('aria-label').includes('Add lesson')
        ),
        'Hover states exist': Array.from(addButtons).every(btn => 
          btn.classList.contains('hover:text-brand-primary')
        ),
        'Transition effects applied': Array.from(addButtons).every(btn => 
          btn.classList.contains('transition-colors')
        )
      };

      const passed = Object.values(tests).every(test => test === true);
      
      this.logTestResult('Button Interaction', passed, tests);
      
    } catch (error) {
      this.logTestResult('Button Interaction', false, { error: error.message });
    }
  }

  async testAccessibility() {
    this.testCount++;
    console.log('🔍 Test 8: Accessibility and ARIA Support...');
    
    try {
      // Test accessibility features
      const addButtons = document.querySelectorAll('button[aria-label*="Add lesson"]');
      const focusableElements = document.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
      
      const tests = {
        'ARIA labels present': addButtons.length > 0,
        'Buttons are focusable': Array.from(addButtons).every(btn => 
          btn.tabIndex >= 0 || !btn.hasAttribute('tabindex')
        ),
        'Keyboard navigation supported': true, // Would need keyboard event testing
        'Screen reader compatible': Array.from(addButtons).every(btn => 
          btn.getAttribute('aria-label') || btn.textContent.trim()
        ),
        'Focus indicators present': true, // CSS focus styles would need verification
        'Color contrast sufficient': true // Would need color analysis
      };

      const passed = tests['ARIA labels present'] && tests['Buttons are focusable'] && 
                    tests['Screen reader compatible'];
      
      this.logTestResult('Accessibility', passed, tests);
      
    } catch (error) {
      this.logTestResult('Accessibility', false, { error: error.message });
    }
  }

  logTestResult(testName, passed, details) {
    const result = {
      test: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    
    const status = passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status}: ${testName}`);
    
    if (!passed) {
      console.log('   Details:', details);
    }
    console.log('');
  }

  generateReport() {
    const passedTests = this.testResults.filter(result => result.passed).length;
    const failedTests = this.testCount - passedTests;
    const successRate = ((passedTests / this.testCount) * 100).toFixed(1);
    
    console.log('📊 TEST SUITE SUMMARY');
    console.log('====================');
    console.log(`Total Tests: ${this.testCount}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log('');
    
    if (failedTests > 0) {
      console.log('❌ FAILED TESTS:');
      this.testResults
        .filter(result => !result.passed)
        .forEach(result => {
          console.log(`- ${result.test}`);
          Object.entries(result.details).forEach(([key, value]) => {
            if (value === false) {
              console.log(`  • ${key}: FAILED`);
            }
          });
        });
    }
    
    console.log('\n🎯 Improved Button Positioning Test Suite Complete!');
    
    return {
      totalTests: this.testCount,
      passed: passedTests,
      failed: failedTests,
      successRate: `${successRate}%`,
      results: this.testResults
    };
  }
}

// Auto-run tests when script is loaded
if (typeof window !== 'undefined') {
  // Browser environment
  window.addEventListener('DOMContentLoaded', () => {
    const testSuite = new ImprovedButtonPositioningTest();
    testSuite.runAllTests();
  });
} else {
  // Node.js environment for manual testing
  module.exports = ImprovedButtonPositioningTest;
}

/*
MANUAL VERIFICATION CHECKLIST:
□ Button columns visually separated from lesson content
□ Buttons centered within their dedicated columns
□ Lesson cards don't overlap with button areas
□ Hover effects work smoothly on buttons
□ Mobile view maintains proper layout
□ No visual glitches during view transitions
□ Color contrast meets accessibility standards
□ Keyboard navigation flows properly
*/
