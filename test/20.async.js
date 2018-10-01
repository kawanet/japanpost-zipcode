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
    it("readAll()", () => __awaiter(this, void 0, void 0, function* () {
        const options = { logger: console };
        const data = yield ken_all_1.KenAll.readAll(options);
        const row = data.filter(row => row[2 /* 郵便番号 */] === "1000001").pop();
        assert(row, "1000001 should exist");
        assert.strictEqual(row[6 /* 都道府県名 */], "東京都");
        assert.strictEqual(row[7 /* 市区町村名 */], "千代田区");
        assert.strictEqual(row[8 /* 町域名 */], "千代田");
    }));
});
