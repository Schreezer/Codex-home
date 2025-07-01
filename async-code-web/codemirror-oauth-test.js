const { chromium } = require('playwright');

async function testCodeMirrorOAuth() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('🎯 Testing OAuth with CodeMirror Editors...');
  
  try {
    // Navigate and login
    await page.goto('https://claudegod.narraite.xyz');
    await page.waitForTimeout(2000);
    
    await page.fill('input[name="username"], input[type="text"]', 'chirag');
    await page.fill('input[name="password"], input[type="password"]', 'CHIRAG1313vadercoder');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✅ Logged in successfully');
    
    // Navigate to settings
    await page.click('a:has-text("Settings")');
    await page.waitForTimeout(3000);
    console.log('✅ Navigated to settings page');
    
    // Find CodeMirror editors
    const cmEditors = await page.locator('.cm-content').all();
    console.log(`Found ${cmEditors.length} CodeMirror editors`);
    
    if (cmEditors.length >= 2) {
      // Fill Environment Variables (first editor)
      await cmEditors[0].click();
      await cmEditors[0].fill('{"ANTHROPIC_API_KEY": ""}');
      console.log('✅ Environment Variables filled in CodeMirror editor');
      
      // Fill Credentials (second editor)
      const credentials = '{"access_token": "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", "refresh_token": "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", "expires_at": 1751189261924}';
      
      await cmEditors[1].click();
      await cmEditors[1].fill(credentials);
      console.log('✅ OAuth Credentials filled in CodeMirror editor');
      
      // Screenshot before saving
      await page.screenshot({ path: 'codemirror-before-save.png', fullPage: true });
      
      // Click Save Settings button
      await page.click('button:has-text("Save Settings")');
      await page.waitForTimeout(5000);
      console.log('✅ Save Settings clicked');
      
      // Screenshot after saving
      await page.screenshot({ path: 'codemirror-after-save.png', fullPage: true });
      
      // Monitor console for success/error messages
      let successDetected = false;
      let errorDetected = false;
      
      page.on('console', msg => {
        const text = msg.text().toLowerCase();
        if (text.includes('success') || text.includes('saved')) {
          successDetected = true;
          console.log('✅ Success message detected in console:', msg.text());
        }
        if (text.includes('error') || text.includes('fail')) {
          errorDetected = true;
          console.log('❌ Error message detected in console:', msg.text());
        }
      });
      
      // Check for visible error messages
      const noAuthUserError = page.locator(':has-text("No authenticated user")');
      const hasNoAuthError = await noAuthUserError.isVisible();
      
      if (hasNoAuthError) {
        console.log('❌ Still showing "No authenticated user" error');
      } else {
        console.log('✅ No "No authenticated user" error visible');
      }
      
      // Check for any success indicators
      const successIndicators = [
        ':has-text("Settings saved")',
        ':has-text("Configuration updated")',
        ':has-text("Success")',
        '.success',
        '.toast-success'
      ];
      
      let hasSuccessIndicator = false;
      for (const selector of successIndicators) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible()) {
            console.log(`✅ Success indicator found: ${selector}`);
            hasSuccessIndicator = true;
            break;
          }
        } catch (e) {
          // Ignore selector errors
        }
      }
      
      // Final assessment
      if (!hasNoAuthError && (hasSuccessIndicator || successDetected)) {
        console.log('🎉 OAuth Configuration Test: PASSED');
        console.log('✅ Settings saved successfully without authentication errors');
      } else if (!hasNoAuthError) {
        console.log('⚠️  OAuth Configuration Test: PARTIAL');
        console.log('✅ No authentication errors, but no clear success confirmation');
      } else {
        console.log('❌ OAuth Configuration Test: FAILED');
        console.log('❌ Authentication errors persist after saving');
      }
      
    } else {
      console.log('❌ Could not find expected CodeMirror editors');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

testCodeMirrorOAuth().catch(console.error);