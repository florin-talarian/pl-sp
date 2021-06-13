// required variables were placed at /utils/hooks
const faker = require('faker');
const MenuBar = require('./../POM/menuBar.js');
const YammDialog = require('./../POM/yammDialog.js');
const YammSideBar = require('./../POM/yammSideBar.js');
const playwright = require('playwright');

const BASE_URL = 'https://www.gmail.com';
let browser, chromium, context, webMock, aRequest, sh;

describe('Yamm', () => {

    beforeEach(async () => {
        // create the gmail draft
        console.log("pjson.mainEmail: ",pjson.mainEmail);
        console.log(`pjson.usersEmails[0]: `,pjson.usersEmails[0]);
        gm = new Gmail.Gmail(pjson.mainEmail);
        await gm.init();
        // our second gmail account
        gm2 = new Gmail.Gmail(pjson.usersEmails[0]);
        await gm2.init()

        res = await gm.createDraft('', gm.emailAddress, `subject ${gm.uuid}` , `email message.\ndraft id ${gm.uuid}`);
        // console.log("res: ",res)
        console.log("Gmail draft uuid: ",gm.uuid);
        console.log("Draft id: ", gm.draftId);
        // create the spreadsheet
        sh = new Sh.Spreadsheet(pjson.mainEmail);
        await sh.init();
        await sh.createSpreadsheetDoc();
        console.log("Spreadsheet id is: ",sh.spreadsheetId);

        const userDataDir = './user_profiles/';
        chromium = await playwright['chromium'];
        context = await chromium.launchPersistentContext(userDataDir, { headless: process.env.HEADLESS ? true: false });
        global.page = await context.newPage();
        mb = new MenuBar.MenuBar(page)
        yammDialog = new YammDialog.YammDialog(page)
        yammSideBar = new YammSideBar.YammSideBar(page)
        await page.goto(`https://docs.google.com/spreadsheets/d/${sh.spreadsheetId}/edit#gid=0`);
        await page.waitForTimeout(2000)
    });

    afterEach(async function() {
        console.log("Start after each");

        console.log("Delete draft");
        await gm.deleteDraft();

        console.log("Close browser");
        await context.close();

        console.log("Delete googlesheet");
        await sh.deleteGooglesheet();

        console.log("Delete emails");
        await gm.deleteEmailByPartialSubject(gm.uuid);
        await gm2.deleteEmailByPartialSubject(gm.uuid);

        console.log("After each finished", this.currentTest)
    });

    it('Activate mail merge, 2 correct email', async() => {

        let headerRow = ['Email Address', 'Full Name', 'Prefix', 'First Name', 'Last Name', 'Nickname', 'Company Phone', 'Merge status'];
        // use the gmail acount email
        f1 = faker.name.firstName()
        l1 = faker.name.lastName()
        f2 = faker.name.firstName()
        l2 = faker.name.lastName()
        let firstRow = {
            'Email Address': gm.emailAddress,
            'Full Name': `${f1} ${l1}`,
            'Prefix': 'Sir',
            'First Name': f1,
            'Last Name': l1,
            'Nickname': '',
            'Company Phone': '',
            'Merge status': ''
        };
        let secondRow = {
            'Email Address': gm2.emailAddress,
            'Full Name': `${f2} ${l2}`,
            'Prefix': 'Sir',
            'First Name': f2,
            'Last Name': l2,
            'Nickname': '',
            'Company Phone': '',
            'Merge status': ''
        };
        console.log("Set the header row and the first row");
        await sh.setRows(headerRow, [firstRow, secondRow])

        console.log("Activate Yamm plug in");
        await mb.activateYamm();
        
        console.log("Get the correct iframe");
        await yammDialog.getYammIframe();
        
        console.log("Click continue");
        await yammDialog.clickContinue();
        
        console.log("Fill sender name");
        let firstName = faker.name.firstName()
        await yammDialog.fillName(firstName)

        console.log("Select draft");
        await yammDialog.selectDraft(gm.draftId);

        console.log("Uncheck tracking");
        await yammDialog.uncheckTracking();

        console.log("Send emails");
        await yammDialog.clickSendEmail();

        console.log("Wait for process to finish");
        await yammDialog.waitForText('All emails have been sent');
        
        console.log("Assert message");
        let alertMessage = await yammDialog.getAlertText();
        console.log("alertMessage: ",alertMessage)
        //  'All emails have been sent!' but it's: You can use standard sheet filters to process only specific rows!open_in_new
        assert(alertMessage=='All emails have been sent!', `Success message should be: 'All emails have been sent!' but it's: ${alertMessage}`);

        console.log("Assert email count");
        let text = await yammDialog.getMainPanelText();
        assert(text.indexOf('2 emails sent.') >-1, `Success message should be: '2 emails sent.' but it's: ${text}`);

        console.log("Close dialog");
        await yammDialog.clickCloseButton();

        console.log("Assert merge status");
        let mergeStatus1 = await sh.getCellValue("H2");
        let mergeStatus2 = await sh.getCellValue("H3");
        assert(mergeStatus1=="EMAIL_SENT", `Merge status 'EMAIL_SENT' was expected but it was '${mergeStatus1}' instead`);
        assert(mergeStatus2=="EMAIL_SENT", `Merge status 'EMAIL_SENT' was expected but it was '${mergeStatus2}' instead`);

        console.log("Assert emails were received")
        // we send the uuid in the subject so we assert email existence by it
        let emailUUID = gm.uuid;
        let emailExist1 = await gm.emailExistByPartialSubject(emailUUID)
        let emailExist2 = await gm2.emailExistByPartialSubject(emailUUID)
        assert(emailExist1==true, `Email with subject including '${emailUUID}' was expected to be recived at email '${gm.emailAddress}' but it did not arrive`);
        assert(emailExist2==true, `Email with subject including '${emailUUID}' was expected to be recived at email '${gm2.emailAddress}' but it did not arrive`);
    });
})