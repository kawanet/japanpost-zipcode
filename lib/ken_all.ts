// ken_all

import axios from "axios"
import * as fs from "fs"
import * as iconv from "iconv-lite"
import * as JSZip from "jszip"

const zipURL = "http://www.post.japanpost.jp/zipcode/dl/kogaki/zip/ken_all.zip";
const tmpPath = __dirname.replace(/[^\/]*\/?$/, "tmp/");
const zipPath = tmpPath + "ken_all.zip";
const csvName = "KEN_ALL.CSV";
const jsonPath = tmpPath + "ken_all.json";

const removeKanaSuffix = new RegExp("(ｲｶﾆｹｲｻｲｶﾞﾅｲﾊﾞｱｲ|.*ﾉﾂｷﾞﾆﾊﾞﾝﾁｶﾞｸﾙﾊﾞｱｲ|\(.*?\))$");
const removeTextSuffix = new RegExp("(以下に掲載がない場合|.*に番地がくる場合|（.*?）)$");

// fs.promise
const readFile = (path: string): Promise<Buffer> => new Promise((ok, ng) => fs.readFile(path, (err, res: Buffer) => (err ? ng(err) : ok(res))));
const writeFile = (path: string, data): Promise<void> => new Promise((ok, ng) => fs.writeFile(path, data, err => (err ? ng(err) : ok())));
const access = (path: string): Promise<void> => new Promise((ok, ng) => fs.access(path, err => (err ? ng(err) : ok())));

export interface KenAllOptions {
    logger?: { warn: (message: string) => void };
}

export class KenAll {
    /**
     * fetch ZIP file
     */

    static fetchZip(option?: KenAllOptions) {
        const logger = option && option.logger;

        const req = {
            method: "GET",
            url: zipURL,
            responseType: "arraybuffer"
        };

        if (logger) logger.warn("loading: " + zipURL);
        return axios(req).then(res => {
            return res.data;
        });
    }

    /**
     * extract CSV file from ZIP file
     */

    static extractCSV(option?: KenAllOptions) {
        const logger = option && option.logger;
        return access(zipPath).catch(() => {
            return KenAll.fetchZip(option).then(data => {
                if (logger) logger.warn("writing: " + zipPath);
                return writeFile(zipPath, data);
            });
        }).then(() => {
            if (logger) logger.warn("reading: " + zipPath);
            return readFile(zipPath).then(data => {
                return JSZip.loadAsync(data).then(zip => {
                    return zip.file(csvName).async("arraybuffer");
                }).then(data => {
                    const buffer = Buffer.from(data);
                    return iconv.decode(buffer, "CP932");
                });
            });
        });
    }

    /**
     * parse raw CSV file
     */

    static parseRawCSV(option?: KenAllOptions) {
        return KenAll.extractCSV(option).then((data) => {
            return data.split(/\r?\n/).filter(line => {
                return !!line;
            }).map(line => {
                return line.split(",").map(col => {
                    return col.replace(/^"(.*)"/, "$1");
                });
            });
        }).then(array => {
            const index = {};
            return array.filter(row => {
                const zip = row[2];
                const prev = index[zip];
                // same city
                if (prev && prev[0] === row[0]) {
                    // continued line
                    const open = prev[8].split("（").length;
                    const close = prev[8].split("）").length;
                    if (open > close) {
                        prev[5] += row[5];
                        prev[8] += row[8];
                        return false;
                    }
                }
                index[zip] = row;
                return true;
            });
        })
    }

    /**
     * load CSV file from cache when available
     */

    static readCachedCSV(option?: KenAllOptions) {
        const logger = option && option.logger;

        return access(jsonPath).catch(() => {
            return KenAll.parseRawCSV(option).then(data => {
                if (logger) logger.warn("writing: " + jsonPath);
                const json = JSON.stringify(data).replace(/],/g, "],\n");
                return writeFile(jsonPath, json);
            });
        }).then(() => {
            if (logger) logger.warn("reading: " + jsonPath);
            return readFile(jsonPath).then(data => {
                return JSON.parse(data + "");
            });
        });
    }

    /**
     * parse CSV file
     */

    static readAll(option?: KenAllOptions) {
        return KenAll.readCachedCSV(option).then(array => {

            array.forEach(row => {
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
    }
}
