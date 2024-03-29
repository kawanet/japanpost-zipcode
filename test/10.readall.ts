#!/usr/bin/env mocha -R spec

import "mocha";
import {strict as assert} from "assert";
import {KenAll, KenAllRow} from "../";

const TESTNAME = __filename.split("/").pop() as string;

describe(TESTNAME, () => {
    it("readAll()", function () {
        this.timeout(60000);

        const options = {logger: console};
        return KenAll.readAll(options).then((data: KenAllRow[]) => {
            assert(data.length > 100000, "should have 100,000 records at least");
            assert(data.filter(row => row.length > 10).length, "should have more than 100,000 records which have more than 10 columns")
        });
    });
});
