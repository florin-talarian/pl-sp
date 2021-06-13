require('module-alias/register')
const fs = require('fs');
const path = require('path');
const Mocha = require('mocha');
require('./utils/hooks.js');
Sh = require("./utils/s_api");
Gmail = require("./utils/g_api");
const { resolve } = require('path');
const { readdir } = require('fs').promises;
const util = require('util');
const exec  = util.promisify(require('child_process').exec);
const AWS = require('aws-sdk');
AWS.config.region = 'us-east-1';
const lambda = new AWS.Lambda();

var argv = require('minimist')(process.argv.slice(2));
// Use non-default Mocha test directory.
const testDir = "./tests";

// FOR ADDING ALL TEST FILES TO MOCHA RUNNER
async function getSpecFiles(dir) {
    const dirents = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map((dirent) => {
        const res = resolve(dir, dirent.name);
        return dirent.isDirectory() ? getSpecFiles(res) : res;
    }));
    let results = Array.prototype.concat(...files);
    return results
}

async function addFilesToMocha(mocha, dir){
    let files = await getSpecFiles(dir);
    for (let i = 0; i < files.length; i++){
        let file = files[i];
        console.log("add file: ",file);
        mocha.addFile(file);
    }
}

async function listTest() {
    try {
        let { stdout, stderr } = await exec('node listTests.js', {cwd: "./utils/"});
        stdout = stdout.replace(/(\r\n|\n|\r)/gm, "");
        let timedStr = stdout.split("testsStructure:  ")[1].trim();
        let testsJson = JSON.parse(timedStr);
        return testsJson.allTests
    } catch (e) {
        console.error(e);
        return false
    }
}


async function main(match="", reporter="list"){
    console.log("main");
    if (argv.remote){
        let tests = await listTest();
        let test1 = tests[0];
        console.log("test1: ",test1);
        await invokeLambda(test1);
    }else{
        let options = {
            reporter: reporter,
            timeout: 120000,
            grep: match ? match: argv.match,
            rootHooks: {beforeAll(done) {done()}}
        };
        console.log("process.env.HEADLESS: ",process.env.HEADLESS);
        console.log("process.env.LOG: ",process.env.LOG);
        console.log("options: ",options);
        const mocha = new Mocha(options);
        await addFilesToMocha(mocha, testDir);
        console.log("after addFilesToMocha");
        await mocha.run(function(failures) {
            console.log("finished, failures: ",failures);
            process.exitCode = failures ? 1 : 0; // exit with non-zero status if there were failures
        });
    }
}

console.log("Runner starts");
console.log(argv);

module.exports.main = main;


if (require.main === module) {
    console.log('called directly');
    (async ()=>{
        main();
    })()
} else {
    console.log('required as a module');
}



