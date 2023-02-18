#!/usr/bin/env mocha -R spec

import "mocha";
import {strict as assert} from "assert";
import {KenAll} from "../";

const TESTNAME = __filename.split("/").pop() as string;

describe(TESTNAME, () => {
    it("modifiedAt", async () => {
        const modified = await new KenAll({logger: console}).modifiedAt();
        assert.ok(modified instanceof Date);
    });
});
