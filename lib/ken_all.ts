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
const removeChiwariSuffix = new RegExp("第?[０-９]*地割([、～].*?[０-９]*地割)?$");

// fs.promise
const readFile = (path: string): Promise<Buffer> => new Promise((ok, ng) => fs.readFile(path, (err, res: Buffer) => (err ? ng(err) : ok(res))));
const writeFile = (path: string, data: ArrayBuffer | string): Promise<void> => new Promise((ok, ng) => fs.writeFile(path, data, err => (err ? ng(err) : ok())));
const access = (path: string): Promise<void> => new Promise((ok, ng) => fs.access(path, err => (err ? ng(err) : ok())));

export type KenAllRow = string[];

export interface KenAllLogger {
    warn: (message: string) => void;
}

export interface KenAllOptions {
    logger?: KenAllLogger;
}

export class KenAll {
    private readonly logger?: KenAllLogger;

    constructor(options?: KenAllOptions) {
        this.logger = options && options.logger;
    }

    protected debug(message: string): void {
        if (this.logger) this.logger.warn(message);
    }

    /**
     * fetch ZIP file
     */

    async fetchZip(): Promise<ArrayBuffer> {
        const req = {
            method: "GET",
            url: zipURL,
            responseType: "arraybuffer"
        };

        this.debug("loading: " + zipURL);
        const res = await axios(req);
        return res.data;
    }

    /**
     * extract CSV file from ZIP file
     */

    async extractCSV(): Promise<string> {
        try {
            await access(zipPath);
        } catch (e) {
            const data = await this.fetchZip();
            this.debug("writing: " + zipPath);
            await writeFile(zipPath, data);
        }

        this.debug("reading: " + zipPath);
        const data = await readFile(zipPath);
        const zip = await JSZip.loadAsync(data);
        const ab = await zip.file(csvName).async("arraybuffer");
        const buffer = Buffer.from(ab);
        return iconv.decode(buffer, "CP932");
    }

    /**
     * parse raw CSV file
     */

    private async parseRawCSV(): Promise<KenAllRow[]> {
        const data = await this.extractCSV();

        const rows = data.split(/\r?\n/)
            .filter(line => line)
            .map(line => line.split(",")
                .map(col => col.replace(/^"(.*)"/, "$1")));

        const index: { [zip: string]: KenAllRow } = {};
        return rows.filter(row => {
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
    }

    /**
     * load CSV file from cache when available
     */

    private async readCachedCSV(): Promise<KenAllRow[]> {
        try {
            await access(jsonPath);
        } catch (e) {
            const data = await this.parseRawCSV();
            this.debug("writing: " + jsonPath);
            const json = JSON.stringify(data).replace(/],/g, "],\n");
            await writeFile(jsonPath, json);
        }

        this.debug("reading: " + jsonPath);
        const data = await readFile(jsonPath);
        return JSON.parse(data + "");
    }

    /**
     * parse CSV file
     */

    public async readAll(): Promise<KenAllRow[]> {
        const rows = await this.readCachedCSV();

        rows.forEach(row => {
            if (row[5]) {
                row[5] = row[5].replace(removeKanaSuffix, "");
            }
            if (row[8]) {
                row[8] = row[8].replace(removeTextSuffix, "");
                row[8] = row[8].replace(removeChiwariSuffix, "");
            }
        });

        return rows;
    }

    /**
     * parse CSV file
     */

    public static async readAll(options?: KenAllOptions): Promise<KenAllRow[]> {
        return new KenAll(options).readAll();
    }
}
