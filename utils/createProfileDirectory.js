const playwright = require('playwright');

(async()=>{
    const chromium = await playwright['chromium'];
    const userDataDir = './user_profiles/';
    const context = await chromium.launchPersistentContext(userDataDir, { headless: false });
    let page = await context.newPage();
    page.goto("https://www.gmail.com");
})();