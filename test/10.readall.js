#!/usr/bin/env mocha -R spec
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const ken_all_1 = require("../lib/ken_all");
const assert = require("assert");
const TESTNAME = __filename.split("/").pop();
describe(TESTNAME, () => {
    it("readAll()", function () {
        this.timeout(60000);
        const options = { logger: console };
        return ken_all_1.KenAll.readAll(options).then((data) => {
            assert(data.length > 100000, "should have 100,000 records at least");
            assert(data.filter(row => row.length > 10).length, "should have more than 100,000 records which have more than 10 columns");
        });
    });
});
