#!/usr/bin/env mocha -R spec

import "mocha";
import {KenAll} from "../";

const TESTNAME = __filename.split("/").pop() as string;

describe(TESTNAME, () => {
    it("clean()", async () => {
        await new KenAll({logger: console}).clean();
    });
});
