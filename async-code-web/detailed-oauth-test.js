const { chromium } = require('playwright');

async function testOAuthFunctionality() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('🔍 Testing OAuth Configuration in Detail...');
  
  try {
    // Navigate and login
    await page.goto('https://claudegod.narraite.xyz');
    await page.waitForTimeout(2000);
    
    // Login
    await page.fill('input[name="username"], input[type="text"]', 'chirag');
    await page.fill('input[name="password"], input[type="password"]', 'CHIRAG1313vadercoder');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Navigate to settings
    await page.click('a:has-text("Settings")');
    await page.waitForTimeout(2000);
    
    // Look for Claude Code Configuration section
    const claudeSection = page.locator(':has-text("Claude Code Configuration")');
    console.log('Claude Code Configuration section found:', await claudeSection.isVisible());
    
    // Test environment variables field
    const envVarsTextarea = page.locator('textarea').first();
    if (await envVarsTextarea.isVisible()) {
      console.log('Environment Variables textarea found');
      await envVarsTextarea.fill('{"ANTHROPIC_API_KEY": ""}');
      console.log('Environment Variables filled');
    }
    
    // Test credentials field
    const credentialsTextarea = page.locator('textarea').nth(1);
    if (await credentialsTextarea.isVisible()) {
      console.log('Credentials textarea found');
      const credentials = '{"access_token": "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", "refresh_token": "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", "expires_at": 1751189261924}';
      await credentialsTextarea.fill(credentials);
      console.log('Credentials filled');
    }
    
    // Save settings
    const saveButton = page.locator('button:has-text("Save Settings")');
    if (await saveButton.isVisible()) {
      console.log('Save Settings button found');
      await saveButton.click();
      await page.waitForTimeout(3000);
    }
    
    // Check for success/error messages
    const successMessage = page.locator('.success, .toast, :has-text("saved"), :has-text("updated")');
    const errorMessage = page.locator('.error, :has-text("error"), :has-text("failed")');
    
    console.log('Success message visible:', await successMessage.isVisible());
    console.log('Error message visible:', await errorMessage.isVisible());
    
    // Screenshot final state
    await page.screenshot({ path: 'oauth-test-final.png', fullPage: true });
    
  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    await browser.close();
  }
}

testOAuthFunctionality().catch(console.error);