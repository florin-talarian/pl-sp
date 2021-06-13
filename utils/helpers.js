
let BASE_TIME_OUT = 0;
if (process.env.THROTTLE){
    // add extra if we throttle
    BASE_TIME_OUT = BASE_TIME_OUT + parseInt(process.env.THROTTLE) + 2000;
}

module.exports.waitForSelector = async function waitForSelector(selector, timeout=8000){
    let elem = null;
    try{
        elem = await page.waitForSelector(selector, {timeout: timeout + BASE_TIME_OUT})
    }catch(err){
    }
    return elem
}