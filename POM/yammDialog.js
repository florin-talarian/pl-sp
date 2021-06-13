class YammDialog {

    constructor(page) {
      this.page = page;
      this.yammIframe = false;
    };

    getYammIframe = async ()=>{
        console.log("getYammIframe")
        await this.page.waitForSelector(".modal-dialog iframe");
        let iframeElement = await this.page.$(".modal-dialog iframe");
        let frame = await iframeElement.contentFrame();
        for (let i =0; i <6; i++){
            try{
                await frame.waitForSelector('div[id="adPanel"]', {timeout: 1000});
                console.log("Found Yamm frame")
                this.yammIframe = frame;
                return frame
            }catch(err){
                iframeElement = await frame.$("iframe")
                frame = await iframeElement.contentFrame();
            };
        };
        return false
    };

    clickContinue = async()=>{
        await this.yammIframe.waitForSelector('//button[contains(text(), "Continue")]');
        let continueButton = await this.yammIframe.$('//button[contains(text(), "Continue")]');
        await continueButton.click()
    };

    clickSendEmail = async()=>{
        await this.yammIframe.waitForSelector('#sendButton');
        let sendButton = await this.yammIframe.$('#sendButton');
        await sendButton.click();
    };

    fillName = async (name=false)=>{
        if (!name){
            name = "NAME TEST"
        };
        await this.yammIframe.waitForSelector("input#senderName_input");
        await this.yammIframe.fill('input#senderName_input', name);
    };

    uncheckTracking = async ()=>{
        await this.yammIframe.waitForSelector("#readReceiptCheckbox");
        let isChecked = await this.yammIframe.evaluate(async()=>{
            let isCheckedBool = window.getComputedStyle(document.querySelector("#readReceiptCheckbox"), ':after').getPropertyValue('background').indexOf('checkmark') > -1
            return isCheckedBool;
        });
        console.log("tracking is Checked: ",isChecked)
        if (isChecked){
            let checkbox = await this.yammIframe.$("#readReceiptCheckbox");
            await checkbox.click();            
        };
    };

    selectDraft = async(draftId)=>{
        if (draftId){
            console.log(`Select by draf it '${draftId}'`)
            await this.yammIframe.selectOption('select#drafts_list', draftId);
            await this.yammIframe.waitForTimeout(500);
        }else{
            throw("No darft id!")
        }
    };

    getAlertText = async()=>{
        await this.yammIframe.waitForSelector("#contextualAlert");
        let contextAlert = await this.yammIframe.$("#contextualAlert");
        let text = await contextAlert.textContent();
        return text
    };

    getMainPanelText = async()=>{
        let mainPanel = await this.yammIframe.$("#mainPanel");
        let text = await mainPanel.textContent();
        return text
    };

    clickCloseButton = async()=>{
        let closeButton = await this.yammIframe.$('//button[contains(text(), "Close")]');
        await closeButton.click()
    };

    waitForText = async (text)=>{
        await this.yammIframe.waitForSelector(`text=${text}`)
    }
};

module.exports.YammDialog = YammDialog;
