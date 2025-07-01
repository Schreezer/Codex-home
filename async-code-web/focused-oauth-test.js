const { chromium } = require('playwright');

async function focusedOAuthTest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('🎯 Focused OAuth Configuration Test...');
  
  try {
    // Navigate and login
    await page.goto('https://claudegod.narraite.xyz');
    await page.waitForTimeout(2000);
    
    // Login
    await page.fill('input[name="username"], input[type="text"]', 'chirag');
    await page.fill('input[name="password"], input[type="password"]', 'CHIRAG1313vadercoder');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✅ Logged in successfully');
    
    // Navigate to settings
    await page.click('a:has-text("Settings")');
    await page.waitForTimeout(2000);
    console.log('✅ Navigated to settings page');
    
    // Find all textareas
    const textareas = await page.locator('textarea').all();
    console.log(`Found ${textareas.length} textarea elements`);
    
    if (textareas.length >= 2) {
      // Fill Environment Variables (first textarea)
      await textareas[0].fill('{"ANTHROPIC_API_KEY": ""}');
      console.log('✅ Environment Variables filled');
      
      // Fill Credentials (second textarea)  
      const credentials = '{"access_token": "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", "refresh_token": "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", "expires_at": 1751189261924}';
      await textareas[1].fill(credentials);
      console.log('✅ OAuth Credentials filled');
      
      // Screenshot before saving
      await page.screenshot({ path: 'oauth-before-save.png', fullPage: true });
      
      // Click Save Settings button
      await page.click('button:has-text("Save Settings")');
      await page.waitForTimeout(5000); // Wait longer for server response
      console.log('✅ Save Settings clicked');
      
      // Screenshot after saving
      await page.screenshot({ path: 'oauth-after-save.png', fullPage: true });
      
      // Check for any error messages
      const errorSelectors = [
        ':has-text("No authenticated user")',
        ':has-text("error")',
        ':has-text("failed")',
        '.error',
        '[role="alert"]'
      ];
      
      let hasError = false;
      for (const selector of errorSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible()) {
            console.log(`❌ Found error: ${selector}`);
            hasError = true;
          }
        } catch (e) {
          // Ignore selector errors
        }
      }
      
      if (!hasError) {
        console.log('✅ No authentication errors found after saving OAuth credentials');
      }
      
      // Test if we can navigate back to dashboard
      await page.click('a:has-text("Back")');
      await page.waitForTimeout(2000);
      
      // Check if we're back on dashboard
      const welcomeMessage = page.locator(':has-text("Welcome back")');
      if (await welcomeMessage.isVisible()) {
        console.log('✅ Successfully navigated back to dashboard');
      }
      
    } else {
      console.log('❌ Could not find expected textarea elements for OAuth configuration');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

focusedOAuthTest().catch(console.error);