"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var fs = require("fs");
var iconv = require("iconv-lite");
var JSZip = require("jszip");
var promisen = require("promisen");
var zipURL = "http://www.post.japanpost.jp/zipcode/dl/kogaki/zip/ken_all.zip";
var tmpPath = __dirname.replace(/[^\/]*\/?$/, "tmp/");
var zipPath = tmpPath + "ken_all.zip";
var csvName = "KEN_ALL.CSV";
var jsonPath = tmpPath + "ken_all.json";
var removeKanaSuffix = new RegExp("(ｲｶﾆｹｲｻｲｶﾞﾅｲﾊﾞｱｲ|.*ﾉﾂｷﾞﾆﾊﾞﾝﾁｶﾞｸﾙﾊﾞｱｲ|\(.*?\))$");
var removeTextSuffix = new RegExp("(以下に掲載がない場合|.*に番地がくる場合|（.*?）)$");
var readFile = promisen.denodeify(fs.readFile.bind(fs));
var writeFile = promisen.denodeify(fs.writeFile.bind(fs));
var access = promisen.denodeify(fs.access.bind(fs));
var KenAll = /** @class */ (function () {
    function KenAll() {
    }
    /**
     * fetch ZIP file
     */
    KenAll.fetchZip = function (option) {
        var logger = option && option.logger;
        var req = {
            method: "GET",
            url: zipURL,
            responseType: "arraybuffer"
        };
        if (logger)
            logger.warn("loading: " + zipURL);
        return axios_1.default(req).then(function (res) {
            return res.data;
        });
    };
    /**
     * extract CSV file from ZIP file
     */
    KenAll.extractCSV = function (option) {
        var logger = option && option.logger;
        return access(zipPath).catch(function () {
            return KenAll.fetchZip(option).then(function (data) {
                if (logger)
                    logger.warn("writing: " + zipPath);
                return writeFile(zipPath, data);
            });
        }).then(function () {
            if (logger)
                logger.warn("reading: " + zipPath);
            return readFile(zipPath).then(function (data) {
                return JSZip.loadAsync(data).then(function (zip) {
                    return zip.file(csvName).async("arraybuffer");
                }).then(function (data) {
                    var buffer = Buffer.from(data);
                    return iconv.decode(buffer, "CP932");
                });
            });
        });
    };
    /**
     * parse raw CSV file
     */
    KenAll.parseRawCSV = function (option) {
        return KenAll.extractCSV(option).then(function (data) {
            return data.split(/\r?\n/).filter(function (line) {
                return !!line;
            }).map(function (line) {
                return line.split(",").map(function (col) {
                    return col.replace(/^"(.*)"/, "$1");
                });
            });
        }).then(function (array) {
            var index = {};
            return array.filter(function (row) {
                var zip = row[2];
                var prev = index[zip];
                // same city
                if (prev && prev[0] === row[0]) {
                    // continued line
                    var open_1 = prev[8].split("（").length;
                    var close_1 = prev[8].split("）").length;
                    if (open_1 > close_1) {
                        prev[5] += row[5];
                        prev[8] += row[8];
                        return false;
                    }
                }
                index[zip] = row;
                return true;
            });
        });
    };
    /**
     * load CSV file from cache when available
     */
    KenAll.readCachedCSV = function (option) {
        var logger = option && option.logger;
        return access(jsonPath).catch(function () {
            return KenAll.parseRawCSV(option).then(function (data) {
                if (logger)
                    logger.warn("writing: " + jsonPath);
                var json = JSON.stringify(data).replace(/],/g, "],\n");
                return writeFile(jsonPath, json);
            });
        }).then(function () {
            if (logger)
                logger.warn("reading: " + jsonPath);
            return readFile(jsonPath).then(function (data) {
                return JSON.parse(data);
            });
        });
    };
    /**
     * parse CSV file
     */
    KenAll.readAll = function (option) {
        return KenAll.readCachedCSV(option).then(function (array) {
            array.forEach(function (row) {
                if (row[5]) {
                    row[5] = row[5].replace(removeKanaSuffix, "");
                }
                if (row[8]) {
                    row[8] = row[8].replace(removeTextSuffix, "");
                    row[8] = row[8].replace(/第?[０-９]*地割([、～].*?[０-９]*地割)?$/, "");
                }
            });
            return array;
        });
    };
    return KenAll;
}());
exports.KenAll = KenAll;
