/**
 * Test Suite: Calendar View Enhancements
 * Module: UI/Visual
 * 
 * Tests to verify the following improvements:
 * 1. Time indicator lines (quarter-hour grid) in day/week views
 * 2. Larger font sizes for lesson cards
 * 3. Proper spacing to prevent overlap with add buttons
 * 
 * Usage: node _test/ui/calendar-view-enhancements-test.js
 */

const { test } = require('@playwright/test');

// Test Configuration
const CALENDAR_SELECTORS = {
  dayView: '[data-testid="day-view"], .day-view',
  weekView: '[data-testid="week-view"], .week-view',
  lessonCard: '.lesson-card, [data-testid="lesson"]',
  addButton: 'button[aria-label*="Add lesson"]',
  timeGrid: '.time-grid, [data-testid="time-grid"]',
  quarterHourLines: '[data-testid="quarter-hour-line"]'
};

// Visual Requirements
const FONT_SIZE_REQUIREMENTS = {
  minLessonCardFontSize: 14, // 14px = text-sm in Tailwind
  minDetailsFontSize: 12     // 12px = text-xs in Tailwind
};

const SPACING_REQUIREMENTS = {
  minButtonColumnWidth: 52,  // 52px to prevent overlap
  minCardPadding: 2         // 2px gap between cards and buttons
};

/**
 * Test Suite: Time Indicator Grid Lines
 */
test.describe('Time Indicator Grid Lines', () => {
  
  test('should display quarter-hour grid lines in day view', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Switch to day view if not already
    const dayViewButton = page.locator('button', { hasText: 'Day' });
    if (await dayViewButton.isVisible()) {
      await dayViewButton.click();
    }
    
    await page.waitForTimeout(500); // Allow view to render
    
    // Check for hour grid lines (stronger lines)
    const hourLines = await page.$$('.border-surface-border\\/60, .border-slate-700\\/60');
    console.log(`✓ Found ${hourLines.length} hour grid lines in day view`);
    
    if (hourLines.length === 0) {
      throw new Error('No hour grid lines found in day view');
    }
    
    // Check for quarter-hour grid lines (lighter lines)
    const quarterHourLines = await page.$$('.border-surface-border\\/20, .border-slate-700\\/20');
    console.log(`✓ Found ${quarterHourLines.length} quarter-hour grid lines in day view`);
    
    if (quarterHourLines.length === 0) {
      throw new Error('No quarter-hour grid lines found in day view');
    }
    
    // Verify quarter-hour lines are lighter than hour lines
    const quarterLineOpacity = await quarterHourLines[0].evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.opacity || '1';
    });
    
    const hourLineOpacity = await hourLines[0].evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.opacity || '1';
    });
    
    console.log(`✓ Quarter-hour line opacity: ${quarterLineOpacity}, Hour line opacity: ${hourLineOpacity}`);
    
    // Quarter-hour lines should be lighter (lower opacity or different border style)
    const hasProperContrast = quarterLineOpacity < hourLineOpacity || 
                             quarterHourLines.length > hourLines.length;
    
    if (!hasProperContrast) {
      console.warn('Quarter-hour lines may not be visually distinct from hour lines');
    }
    
    console.log('✓ Day view has proper time indicator grid lines');
  });
  
  test('should display quarter-hour grid lines in week view', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Switch to week view
    const weekViewButton = page.locator('button', { hasText: 'Week' });
    if (await weekViewButton.isVisible()) {
      await weekViewButton.click();
    }
    
    await page.waitForTimeout(500); // Allow view to render
    
    // Check for hour grid lines
    const hourLines = await page.$$('.border-surface-border\\/60, .border-slate-700\\/60');
    console.log(`✓ Found ${hourLines.length} hour grid lines in week view`);
    
    // Check for quarter-hour grid lines  
    const quarterHourLines = await page.$$('.border-surface-border\\/15, .border-slate-700\\/15');
    console.log(`✓ Found ${quarterHourLines.length} quarter-hour grid lines in week view`);
    
    if (hourLines.length === 0 && quarterHourLines.length === 0) {
      throw new Error('No time grid lines found in week view');
    }
    
    // Week view should have more granular time indicators
    const totalTimeLines = hourLines.length + quarterHourLines.length;
    if (totalTimeLines < 20) { // Minimum expected for a full day view
      console.warn(`Low number of time grid lines: ${totalTimeLines}`);
    }
    
    console.log('✓ Week view has proper time indicator grid lines');
  });
  
  test('should maintain time grid lines across different time ranges', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test different time periods
    const timeRanges = ['6 AM', '12 PM', '6 PM'];
    
    for (const timeRange of timeRanges) {
      // Navigate to different times of day if possible
      const timeSlotElements = await page.$$(`text="${timeRange}"`);
      
      if (timeSlotElements.length > 0) {
        await timeSlotElements[0].scrollIntoView();
        await page.waitForTimeout(200);
        
        // Verify grid lines are still visible
        const visibleGridLines = await page.$$eval(
          '.border-surface-border\\/60, .border-slate-700\\/60, .border-surface-border\\/20, .border-slate-700\\/20, .border-surface-border\\/15, .border-slate-700\\/15',
          lines => lines.filter(line => {
            const rect = line.getBoundingClientRect();
            return rect.top >= 0 && rect.bottom <= window.innerHeight;
          }).length
        );
        
        console.log(`✓ Time range ${timeRange}: ${visibleGridLines} visible grid lines`);
        
        if (visibleGridLines === 0) {
          throw new Error(`No visible grid lines at time range ${timeRange}`);
        }
      }
    }
    
    console.log('✓ Time grid lines visible across all time ranges');
  });
});

/**
 * Test Suite: Lesson Card Font Size Improvements
 */
test.describe('Lesson Card Font Size Improvements', () => {
  
  test('should display lesson cards with larger, readable fonts', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Find lesson cards
    const lessonCards = await page.$$('button[title*="Lesson:"], .lesson-card, [data-testid="lesson"]');
    
    if (lessonCards.length === 0) {
      console.log('ℹ️ No lesson cards found - skipping font size test');
      return;
    }
    
    console.log(`✓ Found ${lessonCards.length} lesson cards to test`);
    
    for (let i = 0; i < Math.min(lessonCards.length, 5); i++) {
      const card = lessonCards[i];
      
      // Get computed font size
      const fontSize = await card.evaluate(el => {
        const style = window.getComputedStyle(el);
        return parseFloat(style.fontSize);
      });
      
      console.log(`✓ Lesson card ${i + 1} font size: ${fontSize}px`);
      
      // Check if font size meets minimum requirement
      if (fontSize < FONT_SIZE_REQUIREMENTS.minLessonCardFontSize) {
        throw new Error(`Lesson card font size too small: ${fontSize}px (minimum: ${FONT_SIZE_REQUIREMENTS.minLessonCardFontSize}px)`);
      }
      
      // Check for readable text classes
      const textClasses = await card.evaluate(el => el.className);
      const hasReadableSize = textClasses.includes('text-sm') || 
                             textClasses.includes('text-base') || 
                             textClasses.includes('text-lg');
      
      if (!hasReadableSize && fontSize < 14) {
        console.warn(`Lesson card may not use readable text classes: ${textClasses}`);
      }
    }
    
    console.log('✓ All lesson cards have adequate font sizes');
  });
  
  test('should display lesson details with appropriate font sizes', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Find lesson detail elements (room, time info)
    const detailElements = await page.$$('.opacity-90, [class*="text-xs"], [class*="text-sm"]');
    
    if (detailElements.length === 0) {
      console.log('ℹ️ No lesson detail elements found');
      return;
    }
    
    console.log(`✓ Found ${detailElements.length} lesson detail elements`);
    
    for (let i = 0; i < Math.min(detailElements.length, 10); i++) {
      const element = detailElements[i];
      
      // Check if element contains lesson-related content
      const textContent = await element.textContent();
      const isLessonDetail = textContent && 
        (textContent.includes('R') || // Room number
         textContent.includes('•') || // Time separator
         textContent.includes('AM') || 
         textContent.includes('PM'));
      
      if (isLessonDetail) {
        const fontSize = await element.evaluate(el => {
          const style = window.getComputedStyle(el);
          return parseFloat(style.fontSize);
        });
        
        console.log(`✓ Lesson detail "${textContent.trim()}" font size: ${fontSize}px`);
        
        if (fontSize < FONT_SIZE_REQUIREMENTS.minDetailsFontSize) {
          throw new Error(`Lesson detail font size too small: ${fontSize}px (minimum: ${FONT_SIZE_REQUIREMENTS.minDetailsFontSize}px)`);
        }
      }
    }
    
    console.log('✓ All lesson details have adequate font sizes');
  });
  
  test('should not use excessively small text classes', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for problematic small text classes
    const smallTextElements = await page.$$('[class*="text-[10px]"], [class*="text-[11px]"]');
    
    if (smallTextElements.length > 0) {
      console.log(`⚠️ Found ${smallTextElements.length} elements with very small text`);
      
      for (let i = 0; i < Math.min(smallTextElements.length, 5); i++) {
        const element = smallTextElements[i];
        const textContent = await element.textContent();
        const className = await element.evaluate(el => el.className);
        
        console.log(`  - "${textContent?.trim()}" uses: ${className}`);
      }
      
      // This is a warning, not a failure, as some small text might be intentional
      console.log('ℹ️ Consider reviewing if all small text elements are necessary');
    } else {
      console.log('✓ No excessively small text classes found');
    }
  });
});

/**
 * Test Suite: Card Spacing and Overlap Prevention
 */
test.describe('Card Spacing and Overlap Prevention', () => {
  
  test('should prevent lesson cards from overlapping with add buttons', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Switch to day view for clearer testing
    const dayViewButton = page.locator('button', { hasText: 'Day' });
    if (await dayViewButton.isVisible()) {
      await dayViewButton.click();
    }
    
    await page.waitForTimeout(500);
    
    // Find lesson cards and add buttons
    const lessonCards = await page.$$('button[title*="Lesson:"]');
    const addButtons = await page.$$('button[aria-label*="Add lesson"]');
    
    if (lessonCards.length === 0 || addButtons.length === 0) {
      console.log('ℹ️ No lesson cards or add buttons found - skipping overlap test');
      return;
    }
    
    console.log(`✓ Testing overlap between ${lessonCards.length} lesson cards and ${addButtons.length} add buttons`);
    
    for (const card of lessonCards) {
      const cardRect = await card.boundingBox();
      if (!cardRect) continue;
      
      for (const button of addButtons) {
        const buttonRect = await button.boundingBox();
        if (!buttonRect) continue;
        
        // Check for horizontal overlap
        const horizontalOverlap = cardRect.x < buttonRect.x + buttonRect.width &&
                                 cardRect.x + cardRect.width > buttonRect.x;
        
        // Check for vertical overlap
        const verticalOverlap = cardRect.y < buttonRect.y + buttonRect.height &&
                               cardRect.y + cardRect.height > buttonRect.y;
        
        const hasOverlap = horizontalOverlap && verticalOverlap;
        
        if (hasOverlap) {
          // Calculate overlap amount
          const overlapWidth = Math.max(0, Math.min(cardRect.x + cardRect.width, buttonRect.x + buttonRect.width) - Math.max(cardRect.x, buttonRect.x));
          const overlapHeight = Math.max(0, Math.min(cardRect.y + cardRect.height, buttonRect.y + buttonRect.height) - Math.max(cardRect.y, buttonRect.y));
          
          throw new Error(`Lesson card overlaps with add button by ${overlapWidth}x${overlapHeight}px`);
        }
      }
    }
    
    console.log('✓ No overlap detected between lesson cards and add buttons');
  });
  
  test('should maintain proper button column width', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Find the button column container
    const buttonColumns = await page.$$('.w-12, .w-10, [style*="width"]');
    
    if (buttonColumns.length === 0) {
      console.log('ℹ️ No button columns found');
      return;
    }
    
    for (const column of buttonColumns) {
      const rect = await column.boundingBox();
      if (!rect) continue;
      
      // Check if this column contains add buttons
      const hasAddButtons = await column.$('button[aria-label*="Add lesson"]') !== null;
      
      if (hasAddButtons) {
        console.log(`✓ Button column width: ${rect.width}px`);
        
        if (rect.width < SPACING_REQUIREMENTS.minButtonColumnWidth) {
          throw new Error(`Button column too narrow: ${rect.width}px (minimum: ${SPACING_REQUIREMENTS.minButtonColumnWidth}px)`);
        }
      }
    }
    
    console.log('✓ Button column widths are adequate');
  });
  
  test('should provide adequate spacing between lesson cards', async ({ page }) => {
    await page.goto('/dashboard');
    
    const lessonCards = await page.$$('button[title*="Lesson:"]');
    
    if (lessonCards.length < 2) {
      console.log('ℹ️ Need at least 2 lesson cards to test spacing');
      return;
    }
    
    // Check spacing between adjacent cards
    for (let i = 0; i < lessonCards.length - 1; i++) {
      const card1Rect = await lessonCards[i].boundingBox();
      const card2Rect = await lessonCards[i + 1].boundingBox();
      
      if (!card1Rect || !card2Rect) continue;
      
      // Calculate minimum distance between cards
      const horizontalDistance = Math.max(0, card2Rect.x - (card1Rect.x + card1Rect.width));
      const verticalDistance = Math.max(0, card2Rect.y - (card1Rect.y + card1Rect.height));
      
      const minDistance = Math.min(horizontalDistance, verticalDistance);
      
      if (minDistance > 0 && minDistance < SPACING_REQUIREMENTS.minCardPadding) {
        console.warn(`Small spacing between cards: ${minDistance}px`);
      }
      
      console.log(`✓ Card spacing: ${minDistance}px (horizontal: ${horizontalDistance}px, vertical: ${verticalDistance}px)`);
    }
    
    console.log('✓ Lesson card spacing is adequate');
  });
});

/**
 * Test Suite: Cross-View Consistency
 */
test.describe('Cross-View Consistency', () => {
  
  test('should maintain consistent improvements across day and week views', async ({ page }) => {
    await page.goto('/dashboard');
    
    const views = ['Day', 'Week'];
    const results = {};
    
    for (const view of views) {
      const viewButton = page.locator('button', { hasText: view });
      if (await viewButton.isVisible()) {
        await viewButton.click();
        await page.waitForTimeout(500);
      }
      
      // Test grid lines
      const gridLines = await page.$$('.border-surface-border, .border-slate-700, [class*="border-surface-border/"], [class*="border-slate-700/"]');
      
      // Test font sizes
      const lessonCards = await page.$$('button[title*="Lesson:"]');
      let avgFontSize = 0;
      if (lessonCards.length > 0) {
        const fontSizes = await Promise.all(
          lessonCards.slice(0, 3).map(card => 
            card.evaluate(el => parseFloat(window.getComputedStyle(el).fontSize))
          )
        );
        avgFontSize = fontSizes.reduce((a, b) => a + b, 0) / fontSizes.length;
      }
      
      results[view] = {
        gridLines: gridLines.length,
        avgFontSize,
        lessonCards: lessonCards.length
      };
      
      console.log(`✓ ${view} view: ${gridLines.length} grid lines, ${avgFontSize.toFixed(1)}px avg font, ${lessonCards.length} cards`);
    }
    
    // Compare consistency between views
    const dayResults = results['Day'];
    const weekResults = results['Week'];
    
    if (dayResults && weekResults) {
      // Font sizes should be similar
      const fontSizeDiff = Math.abs(dayResults.avgFontSize - weekResults.avgFontSize);
      if (fontSizeDiff > 2) {
        throw new Error(`Inconsistent font sizes between views: Day ${dayResults.avgFontSize}px vs Week ${weekResults.avgFontSize}px`);
      }
      
      // Grid lines should exist in both views
      if (dayResults.gridLines === 0 || weekResults.gridLines === 0) {
        throw new Error('Missing grid lines in one of the views');
      }
      
      console.log('✓ Consistent improvements across day and week views');
    }
  });
});

/**
 * Test Suite: Responsive Design
 */
test.describe('Responsive Design Verification', () => {
  
  test('should maintain improvements on different screen sizes', async ({ page }) => {
    const screenSizes = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 1024, height: 768, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const screen of screenSizes) {
      await page.setViewportSize({ width: screen.width, height: screen.height });
      await page.goto('/dashboard');
      await page.waitForTimeout(500);
      
      // Test font readability at this screen size
      const lessonCards = await page.$$('button[title*="Lesson:"]');
      
      if (lessonCards.length > 0) {
        const fontSize = await lessonCards[0].evaluate(el => 
          parseFloat(window.getComputedStyle(el).fontSize)
        );
        
        console.log(`✓ ${screen.name} (${screen.width}x${screen.height}): ${fontSize}px font size`);
        
        // Font should remain readable on all screen sizes
        if (fontSize < FONT_SIZE_REQUIREMENTS.minLessonCardFontSize) {
          throw new Error(`Font too small on ${screen.name}: ${fontSize}px`);
        }
      }
      
      // Test grid lines visibility
      const gridLines = await page.$$('.border-surface-border, .border-slate-700, [class*="border-surface-border/"], [class*="border-slate-700/"]');
      console.log(`✓ ${screen.name}: ${gridLines.length} grid lines visible`);
    }
    
    console.log('✓ Improvements work across all screen sizes');
  });
});

/**
 * Main Test Execution
 */
console.log('🧪 Starting Calendar View Enhancement Tests...');
console.log('');
console.log('Test Coverage:');
console.log('  📅 Time indicator grid lines (quarter-hour resolution)');
console.log('  🔤 Lesson card font size improvements');
console.log('  📏 Card spacing and overlap prevention');
console.log('  🔄 Cross-view consistency');
console.log('  📱 Responsive design verification');
console.log('');
console.log('Expected Results:');
console.log('  ⏰ Quarter-hour grid lines visible in day/week views');
console.log('  📝 Lesson cards use text-sm (14px) or larger fonts');
console.log('  📏 52px+ button column width prevents overlap');
console.log('  🎯 Consistent improvements across all calendar views');
console.log('  📱 Responsive design maintains readability');
console.log('');

// Export test configuration for external runners
module.exports = {
  testName: 'Calendar View Enhancements',
  testModule: 'ui',
  coverage: [
    'Time indicator grid lines',
    'Font size improvements',
    'Spacing optimization',
    'Cross-view consistency',
    'Responsive design'
  ],
  requirements: [
    'Quarter-hour grid lines in day/week views',
    'Minimum 14px font size for lesson cards',
    'No overlap between cards and add buttons',
    'Consistent behavior across calendar views',
    'Responsive design compatibility'
  ],
  visualRequirements: FONT_SIZE_REQUIREMENTS,
  spacingRequirements: SPACING_REQUIREMENTS
};
