
const retry = require('retry-assert')
global.chai = require('chai');
expect = chai.expect;

class MenuBar {
    constructor(page) {
      this.page = page;
    }

    clickAddOns = async ()=>{
		await retry()
		  .fn(async () => {
		  	await this.page.click('#docs-extensions-menu');
		  	await this.page.waitForTimeout(700);
		  })
		  .until(async() => {
		  	let isVisible = await this.page.isVisible('//span[contains(text(), "Yet Another Mail Merge")]')
		  	expect(isVisible).toEqual(true)
		  })    	
    	
    	await this.page.waitForSelector('//span[contains(text(), "Yet Another Mail Merge")]');
    }

    clickYamm = async ()=>{
    	await this.page.click('//span[contains(text(), "Yet Another Mail Merge")]')
    	await this.page.waitForSelector('//div[contains(text(), "Start Mail Merge")]');
    }

    startYamm = async ()=>{
    	await this.page.click('//div[contains(text(), "Start Mail Merge")]')
    	await this.page.waitForTimeout(5000);
		return true
    }

    activateYamm = async ()=>{
		await this.clickAddOns()
		await page.waitForTimeout(2000)
		await this.clickYamm()
		await page.waitForTimeout(2000)
		await this.startYamm()
		await page.waitForTimeout(7000)
    }
}

module.exports.MenuBar = MenuBar;
