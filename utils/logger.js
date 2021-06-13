// const callsites = require('callsites');

class LoggerMaker {
    constructor(fileName) {
        this.fileName = fileName;
    }

    log = function(message){
        let extra = arguments[1]
        if (this.fileName.indexOf("spec")>-1 || process.env.LOG){
            if (extra){
                console.log(message, extra)
            }else{
                console.log(message)
            }
        }else{
        }
    }

    error = function(errorMsg){
        if (this.fileName.indexOf("spec")>-1 || process.env.LOG){
            console.log(errorMsg)
        }else{
        }
    }
}

module.exports.LoggerMaker = LoggerMaker;