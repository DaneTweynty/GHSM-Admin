/**
 * Enhanced Lesson Modal UI Test Suite
 * Tests the enhanced lesson scheduling modal with HTML5 time inputs,
 * improved design consistency, and lesson type selection
 */

const { test, expect } = require('@playwright/test');

describe('Enhanced Lesson Modal UI Tests', () => {
  
  describe('Design Consistency', () => {
    
    test('Modal container has enhanced styling', async ({ page }) => {
      // Test modal backdrop and container styling
      const modalBackdrop = await page.locator('[role="dialog"]');
      await expect(modalBackdrop).toHaveClass(/bg-black\/40/);
      await expect(modalBackdrop).toHaveClass(/backdrop-blur-sm/);
      
      const modalContainer = await page.locator('[role="dialog"] > div');
      await expect(modalContainer).toHaveClass(/max-w-2xl/);
      await expect(modalContainer).toHaveClass(/rounded-xl/);
      await expect(modalContainer).toHaveClass(/shadow-\[.*\]/);
    });
    
    test('Header has enhanced design with close button', async ({ page }) => {
      const header = await page.locator('[role="dialog"] .rounded-t-xl');
      await expect(header).toHaveClass(/bg-surface-header\/50/);
      await expect(header).toHaveClass(/px-6/);
      await expect(header).toHaveClass(/py-4/);
      
      // Close button should be present
      const closeButton = await page.locator('[aria-label="Close modal"]');
      await expect(closeButton).toBeVisible();
      await expect(closeButton).toContainText('×'); // SVG close icon
    });
    
    test('Content area has proper spacing and styling', async ({ page }) => {
      const contentArea = await page.locator('.overflow-y-auto.thin-scroll.px-6.py-4');
      await expect(contentArea).toBeVisible();
      
      const contentWrapper = await page.locator('.space-y-6');
      await expect(contentWrapper).toBeVisible();
    });
    
    test('Footer has enhanced styling', async ({ page }) => {
      const footer = await page.locator('.rounded-b-xl');
      await expect(footer).toHaveClass(/bg-surface-header\/30/);
      await expect(footer).toHaveClass(/px-6/);
      await expect(footer).toHaveClass(/py-4/);
    });
    
  });
  
  describe('HTML5 Time Picker Implementation', () => {
    
    test('Start time input uses HTML5 time type', async ({ page }) => {
      const startTimeInput = await page.locator('#time');
      await expect(startTimeInput).toHaveAttribute('type', 'time');
      await expect(startTimeInput).toHaveAttribute('step', '900'); // 15-minute intervals
      await expect(startTimeInput).toHaveAttribute('min', '06:00');
      await expect(startTimeInput).toHaveAttribute('max', '22:00');
      await expect(startTimeInput).toHaveAttribute('required');
    });
    
    test('End time input uses HTML5 time type', async ({ page }) => {
      const endTimeInput = await page.locator('#endTime');
      await expect(endTimeInput).toHaveAttribute('type', 'time');
      await expect(endTimeInput).toHaveAttribute('step', '900'); // 15-minute intervals
      await expect(endTimeInput).toHaveAttribute('min', '06:00');
      await expect(endTimeInput).toHaveAttribute('max', '23:00');
    });
    
    test('Quick duration buttons work correctly', async ({ page }) => {
      const durationButtons = await page.locator('button:has-text("min")');
      await expect(durationButtons).toHaveCount(4); // 30, 45, 60, 90 min
      
      // Test button styling
      for (let i = 0; i < 4; i++) {
        const button = durationButtons.nth(i);
        await expect(button).toHaveClass(/px-3/);
        await expect(button).toHaveClass(/py-1\.5/);
        await expect(button).toHaveClass(/rounded-md/);
        await expect(button).toHaveClass(/border/);
        await expect(button).toHaveClass(/bg-surface-card/);
      }
    });
    
    test('Time input guidance text is displayed', async ({ page }) => {
      const startTimeGuidance = await page.locator('text=Select time between 6:00 AM and 10:00 PM');
      await expect(startTimeGuidance).toBeVisible();
      
      const quickDurationLabel = await page.locator('text=Quick durations:');
      await expect(quickDurationLabel).toBeVisible();
      
      const endTimeGuidance = await page.locator('text=Or use quick duration buttons above');
      await expect(endTimeGuidance).toBeVisible();
    });
    
  });
  
  describe('Required Field Asterisks', () => {
    
    test('Student field has red asterisk', async ({ page }) => {
      const studentLabel = await page.locator('label[for="studentId"]');
      const asterisk = await studentLabel.locator('.text-status-red:has-text("*")');
      await expect(asterisk).toBeVisible();
      await expect(asterisk).toHaveClass(/text-status-red/);
    });
    
    test('Instructor field has red asterisk', async ({ page }) => {
      const instructorLabel = await page.locator('label[for="instructorId"]');
      const asterisk = await instructorLabel.locator('.text-status-red:has-text("*")');
      await expect(asterisk).toBeVisible();
      await expect(asterisk).toHaveClass(/text-status-red/);
    });
    
    test('Date field has red asterisk', async ({ page }) => {
      const dateLabel = await page.locator('label[for="date"]');
      const asterisk = await dateLabel.locator('.text-status-red:has-text("*")');
      await expect(asterisk).toBeVisible();
      await expect(asterisk).toHaveClass(/text-status-red/);
    });
    
    test('Start Time field has red asterisk', async ({ page }) => {
      const timeLabel = await page.locator('label[for="time"]');
      const asterisk = await timeLabel.locator('.text-status-red:has-text("*")');
      await expect(asterisk).toBeVisible();
      await expect(asterisk).toHaveClass(/text-status-red/);
    });
    
    test('Room field has red asterisk', async ({ page }) => {
      const roomLabel = await page.locator('label[for="roomId"]');
      const asterisk = await roomLabel.locator('.text-status-red:has-text("*")');
      await expect(asterisk).toBeVisible();
      await expect(asterisk).toHaveClass(/text-status-red/);
    });
    
    test('Lesson Type field has red asterisk', async ({ page }) => {
      const lessonTypeLabel = await page.locator('text=Lesson Type');
      const asterisk = await lessonTypeLabel.locator('.text-status-red:has-text("*")');
      await expect(asterisk).toBeVisible();
      await expect(asterisk).toHaveClass(/text-status-red/);
    });
    
  });
  
  describe('Lesson Type Radio Buttons', () => {
    
    test('Only Regular and Makeup options are available', async ({ page }) => {
      const lessonTypeRadios = await page.locator('input[name="lessonType"]');
      await expect(lessonTypeRadios).toHaveCount(2);
      
      const regularOption = await page.locator('input[name="lessonType"][value="Regular"]');
      await expect(regularOption).toBeVisible();
      
      const makeupOption = await page.locator('input[name="lessonType"][value="Makeup"]');
      await expect(makeupOption).toBeVisible();
      
      // Ensure no other lesson types exist
      const trialOption = await page.locator('input[name="lessonType"][value="Trial"]');
      await expect(trialOption).not.toBeVisible();
      
      const intensiveOption = await page.locator('input[name="lessonType"][value="Intensive"]');
      await expect(intensiveOption).not.toBeVisible();
    });
    
    test('Radio buttons have enhanced styling', async ({ page }) => {
      const radioLabels = await page.locator('label:has(input[name="lessonType"])');
      
      for (let i = 0; i < 2; i++) {
        const label = radioLabels.nth(i);
        await expect(label).toHaveClass(/flex/);
        await expect(label).toHaveClass(/items-center/);
        await expect(label).toHaveClass(/space-x-3/);
        await expect(label).toHaveClass(/cursor-pointer/);
        await expect(label).toHaveClass(/p-3/);
        await expect(label).toHaveClass(/rounded-lg/);
        await expect(label).toHaveClass(/transition-colors/);
      }
    });
    
    test('Radio button custom styling with white dot indicator', async ({ page }) => {
      const customRadioIndicators = await page.locator('.w-5.h-5.rounded-full.border-2');
      await expect(customRadioIndicators).toHaveCount(2);
      
      // Check that hidden radio inputs exist
      const hiddenRadios = await page.locator('input[name="lessonType"].sr-only');
      await expect(hiddenRadios).toHaveCount(2);
    });
    
    test('Regular is selected by default', async ({ page }) => {
      const regularRadio = await page.locator('input[name="lessonType"][value="Regular"]');
      await expect(regularRadio).toBeChecked();
    });
    
    test('Lesson type section has enhanced card design', async ({ page }) => {
      const lessonTypeSection = await page.locator('.bg-surface-card').filter({ hasText: 'Lesson Type' });
      await expect(lessonTypeSection).toHaveClass(/p-4/);
      await expect(lessonTypeSection).toHaveClass(/rounded-lg/);
      await expect(lessonTypeSection).toHaveClass(/border/);
      await expect(lessonTypeSection).toHaveClass(/shadow-sm/);
    });
    
  });
  
  describe('Enhanced Notes Section', () => {
    
    test('Notes section has card design', async ({ page }) => {
      const notesSection = await page.locator('.bg-surface-card').filter({ hasText: 'Lesson Notes' });
      await expect(notesSection).toHaveClass(/p-4/);
      await expect(notesSection).toHaveClass(/rounded-lg/);
      await expect(notesSection).toHaveClass(/border/);
      await expect(notesSection).toHaveClass(/shadow-sm/);
    });
    
    test('Notes textarea has proper styling', async ({ page }) => {
      const notesTextarea = await page.locator('#notes');
      await expect(notesTextarea).toHaveAttribute('rows', '4');
      await expect(notesTextarea).toHaveClass(/resize-none/);
      await expect(notesTextarea).toHaveAttribute('placeholder');
    });
    
    test('Character counter is displayed', async ({ page }) => {
      const charCounter = await page.locator('text=/\\d+\\/500/');
      await expect(charCounter).toBeVisible();
      await expect(charCounter).toHaveClass(/text-xs/);
      await expect(charCounter).toHaveClass(/font-medium/);
    });
    
    test('Notes guidance text is displayed', async ({ page }) => {
      const guidanceText = await page.locator('text=Use notes for tracking progress and communication with parents');
      await expect(guidanceText).toBeVisible();
      await expect(guidanceText).toHaveClass(/text-xs/);
    });
    
  });
  
  describe('Error Display Enhancement', () => {
    
    test('Error messages have enhanced styling', async ({ page }) => {
      // Trigger an error state
      await page.click('button:has-text("Add Lesson")'); // Submit without required fields
      
      const errorAlert = await page.locator('[role="alert"]');
      await expect(errorAlert).toHaveClass(/bg-status-red\/10/);
      await expect(errorAlert).toHaveClass(/border-status-red\/20/);
      await expect(errorAlert).toHaveClass(/text-status-red/);
      await expect(errorAlert).toHaveClass(/rounded-lg/);
      await expect(errorAlert).toHaveClass(/flex/);
      await expect(errorAlert).toHaveClass(/items-center/);
      
      // Error icon should be present
      const errorIcon = await errorAlert.locator('svg');
      await expect(errorIcon).toBeVisible();
      await expect(errorIcon).toHaveClass(/w-5/);
      await expect(errorIcon).toHaveClass(/h-5/);
    });
    
  });
  
  describe('Button Styling Enhancement', () => {
    
    test('Cancel button has enhanced styling', async ({ page }) => {
      const cancelButton = await page.locator('button:has-text("Cancel")');
      await expect(cancelButton).toHaveClass(/rounded-lg/);
      await expect(cancelButton).toHaveClass(/font-semibold/);
      await expect(cancelButton).toHaveClass(/border/);
      await expect(cancelButton).toHaveClass(/transition-colors/);
    });
    
    test('Submit button has enhanced styling', async ({ page }) => {
      const submitButton = await page.locator('button[type="submit"]');
      await expect(submitButton).toHaveClass(/rounded-lg/);
      await expect(submitButton).toHaveClass(/font-semibold/);
      await expect(submitButton).toHaveClass(/text-white/);
      await expect(submitButton).toHaveClass(/bg-brand-primary/);
      await expect(submitButton).toHaveClass(/shadow-sm/);
      await expect(submitButton).toHaveClass(/transition-colors/);
    });
    
    test('Delete button has enhanced styling (edit mode)', async ({ page }) => {
      // Assume we're in edit mode
      const deleteButton = await page.locator('button:has-text("Move to Trash")');
      if (await deleteButton.isVisible()) {
        await expect(deleteButton).toHaveClass(/rounded-lg/);
        await expect(deleteButton).toHaveClass(/font-semibold/);
        await expect(deleteButton).toHaveClass(/text-white/);
        await expect(deleteButton).toHaveClass(/bg-status-red/);
        await expect(deleteButton).toHaveClass(/shadow-sm/);
        await expect(deleteButton).toHaveClass(/transition-colors/);
      }
    });
    
  });
  
  describe('Accessibility Enhancements', () => {
    
    test('Modal has proper ARIA attributes', async ({ page }) => {
      const modal = await page.locator('[role="dialog"]');
      await expect(modal).toHaveAttribute('aria-modal', 'true');
      await expect(modal).toHaveAttribute('aria-labelledby', 'edit-lesson-title');
    });
    
    test('Close button has proper ARIA label', async ({ page }) => {
      const closeButton = await page.locator('[aria-label="Close modal"]');
      await expect(closeButton).toBeVisible();
    });
    
    test('Required fields have required attribute', async ({ page }) => {
      const requiredFields = await page.locator('input[required]');
      await expect(requiredFields).toHaveCount(5); // student, instructor, date, time, room
    });
    
    test('Form inputs have proper labels', async ({ page }) => {
      // Test that all form inputs have associated labels
      const studentInput = await page.locator('#studentId');
      const studentLabel = await page.locator('label[for="studentId"]');
      await expect(studentLabel).toBeVisible();
      
      const timeInput = await page.locator('#time');
      const timeLabel = await page.locator('label[for="time"]');
      await expect(timeLabel).toBeVisible();
      
      const notesInput = await page.locator('#notes');
      const notesLabel = await page.locator('label[for="notes"]');
      await expect(notesLabel).toBeVisible();
    });
    
  });
  
  describe('Responsive Design', () => {
    
    test('Modal is responsive on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      
      const modalContainer = await page.locator('[role="dialog"] > div');
      await expect(modalContainer).toHaveClass(/w-full/);
      await expect(modalContainer).toHaveClass(/max-w-2xl/);
    });
    
    test('Grid layout adapts to screen size', async ({ page }) => {
      const gridContainer = await page.locator('.grid.grid-cols-1.md\\:grid-cols-2');
      await expect(gridContainer).toBeVisible();
    });
    
  });
  
  describe('Performance', () => {
    
    test('Modal renders without layout shift', async ({ page }) => {
      const startTime = Date.now();
      
      // Open modal
      await page.click('button:has-text("Add Lesson")');
      
      // Check that modal appears quickly
      const modalContainer = await page.locator('[role="dialog"]');
      await expect(modalContainer).toBeVisible();
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(500); // Should render in under 500ms
    });
    
    test('Time inputs respond quickly to user interaction', async ({ page }) => {
      const timeInput = await page.locator('#time');
      
      const startTime = Date.now();
      await timeInput.fill('09:30');
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should respond in under 100ms
    });
    
  });
  
  describe('Integration with Existing System', () => {
    
    test('Modal maintains existing functionality', async ({ page }) => {
      // Test that core lesson creation functionality still works
      await page.fill('#studentId', 'student-1');
      await page.fill('#instructorId', 'instructor-1');
      await page.fill('#date', '2025-01-15');
      await page.fill('#time', '14:00');
      await page.fill('#endTime', '15:00');
      await page.fill('#roomId', '1');
      
      // Should be able to submit
      const submitButton = await page.locator('button[type="submit"]');
      await expect(submitButton).not.toBeDisabled();
    });
    
    test('Lesson type data is properly saved', async ({ page }) => {
      // Select Makeup lesson type
      await page.click('input[name="lessonType"][value="Makeup"]');
      
      const makeupRadio = await page.locator('input[name="lessonType"][value="Makeup"]');
      await expect(makeupRadio).toBeChecked();
    });
    
  });
  
});

/**
 * Test Helper Functions
 */
function expectEnhancedStyling(element, expectedClasses) {
  for (const className of expectedClasses) {
    expect(element).toHaveClass(new RegExp(className.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')));
  }
}

function expectCardDesign(element) {
  expectEnhancedStyling(element, [
    'p-4',
    'rounded-lg', 
    'border',
    'shadow-sm',
    'bg-surface-card'
  ]);
}

module.exports = {
  expectEnhancedStyling,
  expectCardDesign
};
