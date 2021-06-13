const Mocha = require('mocha');
require('./hooks.js');
const { resolve } = require('path');
const { readdir } = require('fs').promises;


var argv = require('minimist')(process.argv.slice(2));
// Use non-default Mocha test directory.
const testDir = "./../tests";

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
        mocha.addFile(file);
    }
}

// FOR MAPPING TEST AS JSON
let suites = 0;
let tests = 0;
let pending = 0;
let allTests = [];
function mapSuite(suite) {
    suites += +!suite.root;
    return {
        title: suite.root ? '(root)' : suite.title,
        suites: suite.suites.map(mapSuite),
        tests: suite.tests.map(mapTest)
    };
}

function mapTest(test) {
    ++tests;
    pending += +test.pending;
    allTests.push(test.title);
    return {
        title: test.title,
        pending: test.pending
    };
}

async function main(){
    let options = {
        reporter: 'list',
        timeout: 120000,
        rootHooks: {beforeAll(done) {
                let root = mapSuite(this.test.parent);
                let testsStructure = {suites, tests, pending, root, allTests};
                console.log("testsStructure: ",JSON.stringify(testsStructure));
                process.exit(0);
                done();
            }}
    };
    console.log("options list tests: ",options);
    const mocha = new Mocha(options);
    await addFilesToMocha(mocha, testDir);
    mocha.run(function(failures) {
        process.exitCode = failures ? 1 : 0; // exit with non-zero status if there were failures
    });
    // process.exit(0);
}

console.log("List tests starts");
console.log(argv);

(async ()=>{
    main();
})()


