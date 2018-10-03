"use strict";
// ken_all
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const fs = require("fs");
const iconv = require("iconv-lite");
const JSZip = require("jszip");
const tmpDir = __dirname.replace(/[^\/]*\/?$/, "tmp/");
const removeKanaSuffix = new RegExp("(ｲｶﾆｹｲｻｲｶﾞﾅｲﾊﾞｱｲ|.*ﾉﾂｷﾞﾆﾊﾞﾝﾁｶﾞｸﾙﾊﾞｱｲ|\(.*?\))$");
const removeTextSuffix = new RegExp("(以下に掲載がない場合|.*に番地がくる場合|（.*?）)$");
const removeChiwariSuffix = new RegExp("第?[０-９]*地割([、～].*?[０-９]*地割)?$");
const removeIchienSuffix = new RegExp("(.+[市区町村])(一円)$");
// fs.promise
const readFile = (path) => new Promise((ok, ng) => fs.readFile(path, (err, res) => (err ? ng(err) : ok(res))));
const writeFile = (path, data) => new Promise((ok, ng) => fs.writeFile(path, data, err => (err ? ng(err) : ok())));
const access = (path) => new Promise((ok, ng) => fs.access(path, err => (err ? ng(err) : ok())));
const defaultOptions = {
    logger: undefined,
    url: "http://www.post.japanpost.jp/zipcode/dl/kogaki/zip/ken_all.zip",
    zip: "ken_all.zip",
    csv: "KEN_ALL.CSV",
    json: "ken_all.json",
    tmpDir: tmpDir,
};
/**
 * 郵便番号データダウンロード（読み仮名データの促音・拗音を小書きで表記するもの）（全国一括）
 */
class KenAll {
    constructor(options) {
        // TS7017: Element implicitly has an 'any' type because type 'KenAllOptions' has no index signature.
        const that = this;
        for (const key in defaultOptions) {
            const k = key;
            that[k] = options && options[k] || defaultOptions[k];
        }
    }
    /**
     * console.warn
     */
    debug(message) {
        if (this.logger)
            this.logger.warn(message);
    }
    /**
     * fetch ZIP file
     */
    fetchZip() {
        return __awaiter(this, void 0, void 0, function* () {
            const req = {
                method: "GET",
                url: this.url,
                responseType: "arraybuffer"
            };
            this.debug("loading: " + this.url);
            const res = yield axios_1.default(req);
            return res.data;
        });
    }
    /**
     * extract CSV file from ZIP file
     */
    extractCSV() {
        return __awaiter(this, void 0, void 0, function* () {
            const zipPath = this.tmpDir + "ken_all.zip";
            try {
                yield access(zipPath);
            }
            catch (e) {
                const data = yield this.fetchZip();
                this.debug("writing: " + zipPath);
                yield writeFile(zipPath, data);
            }
            this.debug("reading: " + zipPath);
            const data = yield readFile(zipPath);
            const zip = yield JSZip.loadAsync(data);
            const ab = yield zip.file(this.csv).async("arraybuffer");
            const buffer = Buffer.from(ab);
            return iconv.decode(buffer, "CP932");
        });
    }
    /**
     * parse raw CSV file
     */
    parseRawCSV() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.extractCSV();
            const rows = data.split(/\r?\n/)
                .filter(line => line)
                .map(line => line.split(",")
                .map(col => col.replace(/^"(.*)"/, "$1")));
            const index = {};
            return rows.filter(row => {
                const zip = row[2 /* 郵便番号 */];
                const prev = index[zip];
                // same city
                if (prev && prev[0] === row[0]) {
                    // continued line
                    const open = prev[8 /* 町域名 */].split("（").length;
                    const close = prev[8 /* 町域名 */].split("）").length;
                    if (open > close) {
                        prev[5 /* 町域名カナ */] += row[5 /* 町域名カナ */];
                        prev[8 /* 町域名 */] += row[8 /* 町域名 */];
                        return false;
                    }
                }
                index[zip] = row;
                return true;
            });
        });
    }
    /**
     * load CSV file from cache when available
     */
    readCachedCSV() {
        return __awaiter(this, void 0, void 0, function* () {
            const jsonPath = this.tmpDir + "ken_all.json";
            try {
                yield access(jsonPath);
            }
            catch (e) {
                const data = yield this.parseRawCSV();
                this.debug("writing: " + jsonPath);
                const json = JSON.stringify(data).replace(/],/g, "],\n");
                yield writeFile(jsonPath, json);
            }
            this.debug("reading: " + jsonPath);
            const data = yield readFile(jsonPath);
            return JSON.parse(data + "");
        });
    }
    /**
     * normalize
     */
    normalize(row) {
        if (row[5 /* 町域名カナ */]) {
            row[5 /* 町域名カナ */] = row[5 /* 町域名カナ */].replace(removeKanaSuffix, "");
        }
        if (row[8 /* 町域名 */]) {
            row[8 /* 町域名 */] = row[8 /* 町域名 */].replace(removeTextSuffix, "");
            row[8 /* 町域名 */] = row[8 /* 町域名 */].replace(removeChiwariSuffix, "");
            row[8 /* 町域名 */] = row[8 /* 町域名 */].replace(removeIchienSuffix, "");
        }
    }
    /**
     * parse CSV file
     */
    readAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield this.readCachedCSV();
            rows.forEach(row => this.normalize(row));
            return rows;
        });
    }
    /**
     * parse CSV file
     */
    static readAll(options) {
        return __awaiter(this, void 0, void 0, function* () {
            return new KenAll(options).readAll();
        });
    }
}
exports.KenAll = KenAll;
