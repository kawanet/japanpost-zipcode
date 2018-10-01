#!/usr/bin/env mocha -R spec

import "mocha";
import {KenAll} from "../lib/ken_all";

const assert = require("assert");

const TESTNAME = __filename.split("/").pop() as string;

describe(TESTNAME, () => {
    it("readAll()", async () => {
        const options = {logger: console};
        const data = await KenAll.readAll(options);
        assert(data.length > 100000, "should have 100,000 records at least");
        assert(data.filter(row => row.length > 10).length, "should have more than 100,000 records which have more than 10 columns")
    });
});
