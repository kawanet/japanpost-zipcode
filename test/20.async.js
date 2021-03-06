#!/usr/bin/env mocha -R spec
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const ken_all_1 = require("../lib/ken_all");
const assert = require("assert");
const TESTNAME = __filename.split("/").pop();
describe(TESTNAME, () => {
    let data;
    it("readAll()", () => __awaiter(this, void 0, void 0, function* () {
        data = yield ken_all_1.KenAll.readAll({ logger: console });
    }));
    it("0600000", () => {
        const row = data.filter(row => row[2 /* 郵便番号 */] === "0600000").pop();
        assert(row, "0600000 should exist");
        assert.strictEqual(row[6 /* 都道府県名 */], "北海道");
        assert.strictEqual(row[7 /* 市区町村名 */], "札幌市中央区");
        assert.strictEqual(row[8 /* 町域名 */], ""); //「以下に掲載がない場合」
    });
    it("1000001", () => {
        const row = data.filter(row => row[2 /* 郵便番号 */] === "1000001").pop();
        assert(row, "1000001 should exist");
        assert.strictEqual(row[6 /* 都道府県名 */], "東京都");
        assert.strictEqual(row[7 /* 市区町村名 */], "千代田区");
        assert.strictEqual(row[8 /* 町域名 */], "千代田");
    });
    it("9013601", () => {
        const row = data.filter(row => row[2 /* 郵便番号 */] === "9013601").pop();
        assert(row, "9013601 should exist");
        assert.strictEqual(row[6 /* 都道府県名 */], "沖縄県");
        assert.strictEqual(row[7 /* 市区町村名 */], "島尻郡渡名喜村");
        assert.strictEqual(row[8 /* 町域名 */], ""); // 渡名喜村一円
    });
});
