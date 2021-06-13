global.chai = require('chai');
global.path = require('path');
global.retry = require('retry-assert');
global.helpers = require('@helpers');
global.s_api = require('@s_api')
global.g_api = require('@g_api')
global.expect = chai.expect;
global.assert = chai.assert;
global.pjson = require('./../package.json');

exports.mochaHooks = {

    beforeEach(done) {
        done();
    },

    beforeAll(done) {
        done();
    }
};