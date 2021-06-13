class YammSideBar {
    constructor(page) {
      this.page = page;
      this.yammIframe = false;
    };

    getYammIframe = async ()=>{
        let iframeElement = await this.page.$(".script-application-sidebar-content iframe");
        let frame = await iframeElement.contentFrame();
        for (let i =0; i <6; i++){
            try{
                await frame.waitForSelector('#warning-bar-table', {timeout: 1000});
                console.log("Found Yamm side bar frame")
                this.yammIframe = frame;
                return frame
            }catch(err){
                iframeElement = await frame.$("iframe")
                frame = await iframeElement.contentFrame();
            };
        };
        return false
    };

    
};

module.exports.YammSideBar = YammSideBar;
