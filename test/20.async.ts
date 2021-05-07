#!/usr/bin/env mocha -R spec

import "mocha";
import {strict as assert} from "assert";
import {KenAll, KenAllColumns as C, KenAllRow} from "../";

const TESTNAME = __filename.split("/").pop() as string;

describe(TESTNAME, () => {
    let data: KenAllRow[];

    it("readAll()", async () => {
        data = await KenAll.readAll({logger: console});
    });

    it("0600000", () => {
        const row = data.filter(row => row[C.郵便番号] === "0600000").pop() as KenAllRow;
        assert(row, "0600000 should exist");
        assert.strictEqual(row[C.都道府県名], "北海道");
        assert.strictEqual(row[C.市区町村名], "札幌市中央区");
        assert.strictEqual(row[C.町域名], ""); //「以下に掲載がない場合」
    });

    it("1000001", () => {
        const row = data.filter(row => row[C.郵便番号] === "1000001").pop() as KenAllRow;
        assert(row, "1000001 should exist");
        assert.strictEqual(row[C.都道府県名], "東京都");
        assert.strictEqual(row[C.市区町村名], "千代田区");
        assert.strictEqual(row[C.町域名], "千代田");
    });

    it("9013601", () => {
        const row = data.filter(row => row[C.郵便番号] === "9013601").pop() as KenAllRow;
        assert(row, "9013601 should exist");
        assert.strictEqual(row[C.都道府県名], "沖縄県");
        assert.strictEqual(row[C.市区町村名], "島尻郡渡名喜村");
        assert.strictEqual(row[C.町域名], ""); // 渡名喜村一円
    });
});
