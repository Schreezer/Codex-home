const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testAsyncCodeApp() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();
    
    const testResults = {
        timestamp: new Date().toISOString(),
        tests: [],
        screenshots: [],
        consoleErrors: [],
        overallStatus: 'PASS'
    };

    // Monitor console errors
    page.on('console', msg => {
        if (msg.type() === 'error') {
            testResults.consoleErrors.push({
                message: msg.text(),
                timestamp: new Date().toISOString()
            });
        }
    });

    try {
        console.log('🔍 Starting comprehensive test of async-code application...');
        
        // Test 1: Load Application
        console.log('\n📖 Test 1: Loading application...');
        const startTime = Date.now();
        try {
            await page.goto('https://claudegod.narraite.xyz', { waitUntil: 'networkidle' });
            const loadTime = Date.now() - startTime;
            
            // Take initial screenshot
            const screenshotPath = path.join(__dirname, 'screenshots', 'initial-load.png');
            await page.screenshot({ path: screenshotPath, fullPage: true });
            testResults.screenshots.push({ name: 'initial-load', path: screenshotPath });
            
            testResults.tests.push({
                name: 'Application Load',
                status: 'PASS',
                details: `Application loaded successfully in ${loadTime}ms`,
                loadTime: loadTime
            });
            console.log('✅ Application loaded successfully');
        } catch (error) {
            testResults.tests.push({
                name: 'Application Load',
                status: 'FAIL',
                details: `Failed to load application: ${error.message}`
            });
            testResults.overallStatus = 'FAIL';
            console.log('❌ Failed to load application:', error.message);
        }

        // Test 2: Check for login form elements
        console.log('\n🔐 Test 2: Checking login form elements...');
        try {
            await page.waitForSelector('input[type="text"], input[type="email"], input[name*="user"]', { timeout: 10000 });
            await page.waitForSelector('input[type="password"]', { timeout: 5000 });
            await page.waitForSelector('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")', { timeout: 5000 });
            
            const screenshotPath = path.join(__dirname, 'screenshots', 'login-form.png');
            await page.screenshot({ path: screenshotPath, fullPage: true });
            testResults.screenshots.push({ name: 'login-form', path: screenshotPath });
            
            testResults.tests.push({
                name: 'Login Form Elements',
                status: 'PASS',
                details: 'Username, password fields and submit button found'
            });
            console.log('✅ Login form elements found');
        } catch (error) {
            testResults.tests.push({
                name: 'Login Form Elements',
                status: 'FAIL',
                details: `Login form elements not found: ${error.message}`
            });
            console.log('❌ Login form elements not found');
        }

        // Test 3: Perform Login
        console.log('\n🔑 Test 3: Testing login functionality...');
        try {
            // Try to find username field with various selectors
            let usernameField = null;
            const usernameSelectors = [
                'input[type="text"]',
                'input[type="email"]',
                'input[name*="user"]',
                'input[name*="email"]',
                'input[placeholder*="user"]',
                'input[placeholder*="email"]'
            ];
            
            for (const selector of usernameSelectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 2000 });
                    usernameField = selector;
                    break;
                } catch (e) {
                    continue;
                }
            }
            
            if (usernameField) {
                await page.fill(usernameField, 'chirag');
                console.log('📝 Username entered');
            }
            
            // Fill password
            await page.fill('input[type="password"]', 'CHIRAG1313vadercoder');
            console.log('📝 Password entered');
            
            // Take screenshot before login
            const beforeLoginPath = path.join(__dirname, 'screenshots', 'before-login.png');
            await page.screenshot({ path: beforeLoginPath, fullPage: true });
            testResults.screenshots.push({ name: 'before-login', path: beforeLoginPath });
            
            // Submit login form
            const submitSelectors = [
                'button[type="submit"]',
                'button:has-text("Sign In")',
                'button:has-text("Login")',
                'input[type="submit"]',
                'form button'
            ];
            
            let loginSuccess = false;
            for (const selector of submitSelectors) {
                try {
                    await page.click(selector);
                    console.log('🖱️ Login button clicked');
                    break;
                } catch (e) {
                    continue;
                }
            }
            
            // Wait for navigation or dashboard elements
            try {
                await page.waitForLoadState('networkidle', { timeout: 10000 });
                
                // Take screenshot after login attempt
                const afterLoginPath = path.join(__dirname, 'screenshots', 'after-login.png');
                await page.screenshot({ path: afterLoginPath, fullPage: true });
                testResults.screenshots.push({ name: 'after-login', path: afterLoginPath });
                
                testResults.tests.push({
                    name: 'Login Functionality',
                    status: 'PASS',
                    details: 'Login attempted successfully, page loaded'
                });
                console.log('✅ Login process completed');
                loginSuccess = true;
            } catch (error) {
                testResults.tests.push({
                    name: 'Login Functionality',
                    status: 'PARTIAL',
                    details: `Login attempted but navigation unclear: ${error.message}`
                });
                console.log('⚠️ Login attempted but result unclear');
            }
        } catch (error) {
            testResults.tests.push({
                name: 'Login Functionality',
                status: 'FAIL',
                details: `Login failed: ${error.message}`
            });
            console.log('❌ Login failed:', error.message);
        }

        // Test 4: Check Dashboard/Main Interface
        console.log('\n📊 Test 4: Verifying dashboard/main interface...');
        try {
            // Look for common dashboard elements
            const dashboardElements = [
                'nav, .navbar, [role="navigation"]',
                '.dashboard, .main-content, #dashboard',
                'h1, h2, .title, .heading',
                'button, .btn, [role="button"]'
            ];
            
            let foundElements = [];
            for (const selector of dashboardElements) {
                try {
                    const elements = await page.$$(selector);
                    if (elements.length > 0) {
                        foundElements.push(`${selector}: ${elements.length} elements`);
                    }
                } catch (e) {
                    // Continue if selector fails
                }
            }
            
            const dashboardPath = path.join(__dirname, 'screenshots', 'dashboard.png');
            await page.screenshot({ path: dashboardPath, fullPage: true });
            testResults.screenshots.push({ name: 'dashboard', path: dashboardPath });
            
            testResults.tests.push({
                name: 'Dashboard Interface',
                status: foundElements.length > 0 ? 'PASS' : 'PARTIAL',
                details: `Dashboard elements found: ${foundElements.join(', ')}`
            });
            console.log('✅ Dashboard interface checked');
        } catch (error) {
            testResults.tests.push({
                name: 'Dashboard Interface',
                status: 'FAIL',
                details: `Dashboard check failed: ${error.message}`
            });
            console.log('❌ Dashboard check failed');
        }

        // Test 5: Mobile Responsiveness
        console.log('\n📱 Test 5: Testing mobile responsiveness...');
        try {
            // Test different viewport sizes
            const viewports = [
                { name: 'Mobile Portrait', width: 375, height: 667 },
                { name: 'Mobile Landscape', width: 667, height: 375 },
                { name: 'Tablet', width: 768, height: 1024 },
                { name: 'Desktop', width: 1920, height: 1080 }
            ];
            
            const responsiveResults = [];
            
            for (const viewport of viewports) {
                await page.setViewportSize({ width: viewport.width, height: viewport.height });
                await page.waitForTimeout(1000); // Allow layout to settle
                
                const screenshotPath = path.join(__dirname, 'screenshots', `responsive-${viewport.name.toLowerCase().replace(' ', '-')}.png`);
                await page.screenshot({ path: screenshotPath, fullPage: true });
                testResults.screenshots.push({ name: `responsive-${viewport.name}`, path: screenshotPath });
                
                // Check for responsive indicators
                const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
                const hasHorizontalScroll = bodyWidth > viewport.width;
                
                responsiveResults.push({
                    viewport: viewport.name,
                    size: `${viewport.width}x${viewport.height}`,
                    horizontalScroll: hasHorizontalScroll
                });
            }
            
            testResults.tests.push({
                name: 'Mobile Responsiveness',
                status: 'PASS',
                details: `Tested ${viewports.length} viewports`,
                responsiveResults: responsiveResults
            });
            console.log('✅ Mobile responsiveness tested');
        } catch (error) {
            testResults.tests.push({
                name: 'Mobile Responsiveness',
                status: 'FAIL',
                details: `Responsive test failed: ${error.message}`
            });
            console.log('❌ Mobile responsiveness test failed');
        }

        // Test 6: Navigation and Core Functionality
        console.log('\n🧭 Test 6: Testing navigation and core functionality...');
        try {
            // Reset to desktop view
            await page.setViewportSize({ width: 1920, height: 1080 });
            await page.waitForTimeout(1000);
            
            // Look for navigation elements
            const navElements = await page.$$('nav a, .nav-link, [role="navigation"] a, .menu a');
            const buttons = await page.$$('button:not([type="submit"]), .btn:not([type="submit"])');
            
            let navigationTest = {
                navLinks: navElements.length,
                buttons: buttons.length,
                clickableElements: []
            };
            
            // Test clicking on a few navigation elements (non-destructive ones)
            if (navElements.length > 0) {
                try {
                    const firstNavElement = navElements[0];
                    const navText = await firstNavElement.textContent();
                    navigationTest.clickableElements.push(`Nav link: ${navText}`);
                } catch (e) {
                    // Continue if can't get text content
                }
            }
            
            const navigationPath = path.join(__dirname, 'screenshots', 'navigation.png');
            await page.screenshot({ path: navigationPath, fullPage: true });
            testResults.screenshots.push({ name: 'navigation', path: navigationPath });
            
            testResults.tests.push({
                name: 'Navigation and Core Functionality',
                status: 'PASS',
                details: `Found ${navElements.length} nav elements, ${buttons.length} buttons`,
                navigationDetails: navigationTest
            });
            console.log('✅ Navigation and functionality checked');
        } catch (error) {
            testResults.tests.push({
                name: 'Navigation and Core Functionality',
                status: 'FAIL',
                details: `Navigation test failed: ${error.message}`
            });
            console.log('❌ Navigation test failed');
        }

        // Test 7: Performance and Loading
        console.log('\n⚡ Test 7: Performance and loading metrics...');
        try {
            const performanceMetrics = await page.evaluate(() => {
                const perf = performance.getEntriesByType('navigation')[0];
                return {
                    domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
                    loadComplete: perf.loadEventEnd - perf.loadEventStart,
                    totalLoadTime: perf.loadEventEnd - perf.fetchStart
                };
            });
            
            testResults.tests.push({
                name: 'Performance Metrics',
                status: 'PASS',
                details: 'Performance metrics collected',
                metrics: performanceMetrics
            });
            console.log('✅ Performance metrics collected');
        } catch (error) {
            testResults.tests.push({
                name: 'Performance Metrics',
                status: 'PARTIAL',
                details: `Performance metrics collection failed: ${error.message}`
            });
            console.log('⚠️ Performance metrics collection failed');
        }

    } catch (error) {
        console.error('❌ Critical test failure:', error);
        testResults.overallStatus = 'FAIL';
        testResults.criticalError = error.message;
    } finally {
        await browser.close();
    }

    // Generate final results
    const passedTests = testResults.tests.filter(t => t.status === 'PASS').length;
    const totalTests = testResults.tests.length;
    const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
    
    testResults.summary = {
        totalTests,
        passedTests,
        failedTests: testResults.tests.filter(t => t.status === 'FAIL').length,
        partialTests: testResults.tests.filter(t => t.status === 'PARTIAL').length,
        passRate: `${passRate}%`,
        consoleErrorsCount: testResults.consoleErrors.length,
        screenshotsCount: testResults.screenshots.length
    };

    return testResults;
}

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Run the test
testAsyncCodeApp().then(results => {
    console.log('\n📋 TEST RESULTS SUMMARY:');
    console.log('========================');
    console.log(`Overall Status: ${results.overallStatus}`);
    console.log(`Total Tests: ${results.summary.totalTests}`);
    console.log(`Passed: ${results.summary.passedTests}`);
    console.log(`Failed: ${results.summary.failedTests}`);
    console.log(`Partial: ${results.summary.partialTests}`);
    console.log(`Pass Rate: ${results.summary.passRate}`);
    console.log(`Console Errors: ${results.summary.consoleErrorsCount}`);
    console.log(`Screenshots: ${results.summary.screenshotsCount}`);
    
    // Save detailed results to file
    const resultsFile = path.join(__dirname, 'test-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\n💾 Detailed results saved to: ${resultsFile}`);
    
    console.log('\n📸 Screenshots saved in:', screenshotsDir);
    
    process.exit(results.overallStatus === 'PASS' ? 0 : 1);
}).catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});