const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_URL = 'https://claudegod.narraite.xyz';
const CREDENTIALS = {
  username: 'chirag',
  password: 'CHIRAG1313vadercoder'
};

const OAUTH_CREDENTIALS = {
  environment_variables: '{"ANTHROPIC_API_KEY": ""}',
  credentials: '{"access_token": "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", "refresh_token": "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", "expires_at": 1751189261924}'
};

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'test-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Test results collector
let testResults = [];

function addTestResult(testName, status, details = '', screenshot = null) {
  testResults.push({
    test: testName,
    status,
    details,
    screenshot,
    timestamp: new Date().toISOString()
  });
  console.log(`${status === 'PASS' ? '✅' : '❌'} ${testName}: ${details}`);
}

async function captureScreenshot(page, name) {
  const filename = `${Date.now()}-${name.replace(/\s+/g, '-').toLowerCase()}.png`;
  const filepath = path.join(screenshotsDir, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  return filename;
}

async function checkConsoleErrors(page) {
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  page.on('pageerror', err => {
    consoleErrors.push(`Page Error: ${err.message}`);
  });
  
  return consoleErrors;
}

async function runTests() {
  console.log('🚀 Starting Async Code Application Tests...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Setup console error monitoring
  const consoleErrors = await checkConsoleErrors(page);
  
  try {
    // Test 1: Navigate to application
    console.log('📱 Test 1: Initial Navigation');
    await page.goto(TEST_URL);
    await page.waitForTimeout(3000);
    
    const initialScreenshot = await captureScreenshot(page, 'initial-load');
    addTestResult('Initial Navigation', 'PASS', `Successfully loaded ${TEST_URL}`, initialScreenshot);
    
    // Test 2: Authentication Flow
    console.log('🔐 Test 2: Authentication Flow');
    
    // Check if login form is present
    const loginForm = await page.locator('form').first();
    if (await loginForm.isVisible()) {
      // Fill login credentials
      await page.fill('input[name="username"], input[type="text"]', CREDENTIALS.username);
      await page.fill('input[name="password"], input[type="password"]', CREDENTIALS.password);
      
      const loginScreenshot = await captureScreenshot(page, 'login-form-filled');
      
      // Submit login
      await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');
      await page.waitForTimeout(3000);
      
      // Check if login was successful
      const currentUrl = page.url();
      const loginSuccess = !currentUrl.includes('login') && !await page.locator('form').first().isVisible();
      
      if (loginSuccess) {
        const dashboardScreenshot = await captureScreenshot(page, 'dashboard-after-login');
        addTestResult('Authentication Flow', 'PASS', 'Successfully logged in with SimpleAuth', dashboardScreenshot);
      } else {
        addTestResult('Authentication Flow', 'FAIL', 'Login failed or still showing login form');
      }
    } else {
      addTestResult('Authentication Flow', 'FAIL', 'Login form not found on initial load');
    }
    
    // Test 3: Settings Page OAuth Configuration
    console.log('⚙️ Test 3: Settings Page OAuth Configuration');
    
    // Navigate to settings
    try {
      await page.click('a[href*="settings"], a:has-text("Settings")');
      await page.waitForTimeout(2000);
      
      const settingsScreenshot = await captureScreenshot(page, 'settings-page');
      
      // Look for OAuth configuration fields
      const envVarsField = await page.locator('textarea[name*="environment"], textarea:has-text("ANTHROPIC_API_KEY")').first();
      const credentialsField = await page.locator('textarea[name*="credentials"], textarea:has-text("access_token")').first();
      
      if (await envVarsField.isVisible() && await credentialsField.isVisible()) {
        // Fill OAuth credentials
        await envVarsField.fill(OAUTH_CREDENTIALS.environment_variables);
        await credentialsField.fill(OAUTH_CREDENTIALS.credentials);
        
        const oauthFilledScreenshot = await captureScreenshot(page, 'oauth-credentials-filled');
        
        // Save settings
        await page.click('button:has-text("Save"), button[type="submit"]');
        await page.waitForTimeout(2000);
        
        // Check for success message or lack of error
        const errorMessage = await page.locator(':has-text("No authenticated user")').first();
        const hasError = await errorMessage.isVisible();
        
        if (!hasError) {
          addTestResult('Settings OAuth Configuration', 'PASS', 'OAuth credentials saved successfully without authentication errors', oauthFilledScreenshot);
        } else {
          addTestResult('Settings OAuth Configuration', 'FAIL', 'Still showing "No authenticated user" error after saving');
        }
      } else {
        addTestResult('Settings OAuth Configuration', 'FAIL', 'OAuth configuration fields not found on settings page');
      }
    } catch (error) {
      addTestResult('Settings OAuth Configuration', 'FAIL', `Error navigating to settings: ${error.message}`);
    }
    
    // Test 4: Mobile Responsiveness
    console.log('📱 Test 4: Mobile Responsiveness');
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileScreenshot = await captureScreenshot(page, 'mobile-viewport');
    
    // Check for hamburger menu
    const hamburgerMenu = await page.locator('button:has-text("☰"), button[aria-label*="menu"], .hamburger, .mobile-menu-toggle').first();
    const hasHamburgerMenu = await hamburgerMenu.isVisible();
    
    if (hasHamburgerMenu) {
      await hamburgerMenu.click();
      await page.waitForTimeout(1000);
      const mobileMenuScreenshot = await captureScreenshot(page, 'mobile-menu-open');
      addTestResult('Mobile Responsiveness', 'PASS', 'Mobile viewport responsive with working hamburger menu', mobileMenuScreenshot);
    } else {
      addTestResult('Mobile Responsiveness', 'PARTIAL', 'Mobile viewport set but hamburger menu not clearly identified', mobileScreenshot);
    }
    
    // Reset to desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Test 5: Database Integration
    console.log('🗄️ Test 5: Database Integration');
    
    try {
      // Navigate to projects page
      await page.click('a[href*="projects"], a:has-text("Projects")');
      await page.waitForTimeout(3000);
      
      const projectsScreenshot = await captureScreenshot(page, 'projects-page');
      
      // Check for 404 errors
      const is404 = await page.locator(':has-text("404"), :has-text("Not Found")').first().isVisible();
      
      if (!is404) {
        addTestResult('Database Integration', 'PASS', 'Projects page loaded successfully without 404 errors', projectsScreenshot);
      } else {
        addTestResult('Database Integration', 'FAIL', 'Projects page showing 404 error');
      }
    } catch (error) {
      addTestResult('Database Integration', 'FAIL', `Error accessing projects page: ${error.message}`);
    }
    
    // Test 6: General Functionality
    console.log('🔧 Test 6: General Functionality');
    
    // Test navigation links
    const navLinks = await page.locator('nav a, header a').all();
    let workingLinks = 0;
    
    for (let i = 0; i < Math.min(navLinks.length, 5); i++) {
      try {
        const link = navLinks[i];
        const href = await link.getAttribute('href');
        if (href && !href.startsWith('#')) {
          await link.click();
          await page.waitForTimeout(1000);
          workingLinks++;
        }
      } catch (error) {
        console.log(`Navigation link ${i} error: ${error.message}`);
      }
    }
    
    // Test logout functionality
    try {
      const logoutButton = await page.locator('button:has-text("Logout"), a:has-text("Logout"), button:has-text("Sign out")').first();
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.waitForTimeout(2000);
        
        const afterLogoutScreenshot = await captureScreenshot(page, 'after-logout');
        const backToLogin = await page.locator('form').first().isVisible();
        
        if (backToLogin) {
          addTestResult('General Functionality', 'PASS', `Navigation working (${workingLinks} links tested), logout successful`, afterLogoutScreenshot);
        } else {
          addTestResult('General Functionality', 'PARTIAL', `Navigation working (${workingLinks} links tested), logout button found but unclear if effective`);
        }
      } else {
        addTestResult('General Functionality', 'PARTIAL', `Navigation working (${workingLinks} links tested), logout button not found`);
      }
    } catch (error) {
      addTestResult('General Functionality', 'PARTIAL', `Navigation working (${workingLinks} links tested), logout test failed: ${error.message}`);
    }
    
  } catch (error) {
    addTestResult('Test Execution', 'FAIL', `Unexpected error during testing: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  // Generate test report
  console.log('\n📊 Test Report Summary:');
  console.log('========================');
  
  const passCount = testResults.filter(r => r.status === 'PASS').length;
  const failCount = testResults.filter(r => r.status === 'FAIL').length;
  const partialCount = testResults.filter(r => r.status === 'PARTIAL').length;
  
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`⚠️  Partial: ${partialCount}`);
  console.log(`📁 Screenshots saved to: ${screenshotsDir}`);
  
  // Save detailed report
  const reportPath = path.join(__dirname, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    summary: { passed: passCount, failed: failCount, partial: partialCount },
    tests: testResults,
    consoleErrors: consoleErrors
  }, null, 2));
  
  console.log(`📄 Detailed report saved to: ${reportPath}`);
  
  return testResults;
}

// Run the tests
runTests().catch(console.error);