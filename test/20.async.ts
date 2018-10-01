#!/usr/bin/env mocha -R spec

import "mocha";
import {KenAll, KenAllColumns as C, KenAllRow} from "../lib/ken_all";

const assert = require("assert");

const TESTNAME = __filename.split("/").pop() as string;

describe(TESTNAME, () => {
    it("readAll()", async () => {
        const options = {logger: console};
        const data = await KenAll.readAll(options);

        const row = data.filter(row => row[C.郵便番号] === "1000001").pop() as KenAllRow;
        assert(row, "1000001 should exist");
        assert.strictEqual(row[C.都道府県名], "東京都");
        assert.strictEqual(row[C.市区町村名], "千代田区");
        assert.strictEqual(row[C.町域名], "千代田");
    });
});
