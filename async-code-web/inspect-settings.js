const { chromium } = require('playwright');

async function inspectSettings() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate and login
    await page.goto('https://claudegod.narraite.xyz');
    await page.waitForTimeout(2000);
    
    await page.fill('input[name="username"], input[type="text"]', 'chirag');
    await page.fill('input[name="password"], input[type="password"]', 'CHIRAG1313vadercoder');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Navigate to settings
    await page.click('a:has-text("Settings")');
    await page.waitForTimeout(3000);
    
    // Get page content and inspect
    const content = await page.content();
    
    // Look for specific form elements
    const textareas = await page.locator('textarea').count();
    const inputs = await page.locator('input').count();
    const forms = await page.locator('form').count();
    const codeElements = await page.locator('code, pre').count();
    
    console.log('Element counts:');
    console.log(`- Textareas: ${textareas}`);
    console.log(`- Inputs: ${inputs}`);
    console.log(`- Forms: ${forms}`);
    console.log(`- Code/Pre elements: ${codeElements}`);
    
    // Look for CodeMirror or Monaco editor
    const codeEditors = await page.locator('.cm-editor, .monaco-editor, [class*="codemirror"]').count();
    console.log(`- Code editors: ${codeEditors}`);
    
    // Check for specific text content
    const hasClaudeConfig = await page.locator(':has-text("Claude Code Configuration")').count();
    const hasEnvVars = await page.locator(':has-text("Environment Variables")').count();
    const hasCredentials = await page.locator(':has-text("Credentials")').count();
    
    console.log('Text content:');
    console.log(`- "Claude Code Configuration": ${hasClaudeConfig}`);
    console.log(`- "Environment Variables": ${hasEnvVars}`);
    console.log(`- "Credentials": ${hasCredentials}`);
    
    // Screenshot for visual inspection
    await page.screenshot({ path: 'settings-inspection.png', fullPage: true });
    
    // Try to find editable elements near the Claude Code Configuration
    const editableElements = await page.locator('.cm-content, .monaco-editor, textarea, input[type="text"], [contenteditable="true"]').all();
    console.log(`Found ${editableElements.length} potentially editable elements`);
    
    for (let i = 0; i < editableElements.length; i++) {
      try {
        const element = editableElements[i];
        const tagName = await element.evaluate(el => el.tagName);
        const className = await element.evaluate(el => el.className);
        console.log(`Element ${i}: ${tagName} with class: ${className}`);
      } catch (e) {
        console.log(`Element ${i}: Could not inspect`);
      }
    }
    
  } catch (error) {
    console.error('Inspection error:', error.message);
  } finally {
    await browser.close();
  }
}

inspectSettings().catch(console.error);