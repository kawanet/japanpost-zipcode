// ken_all

import axios from "axios"
import * as fs from "fs"
import * as iconv from "iconv-lite"
import * as JSZip from "jszip"

const tmpDir = __dirname.replace(/[^\/]*\/?$/, "tmp/");

const removeKanaSuffix = new RegExp("(ｲｶﾆｹｲｻｲｶﾞﾅｲﾊﾞｱｲ|.*ﾉﾂｷﾞﾆﾊﾞﾝﾁｶﾞｸﾙﾊﾞｱｲ|\(.*?\))$");
const removeTextSuffix = new RegExp("(以下に掲載がない場合|.*に番地がくる場合|（.*?）)$");
const removeChiwariSuffix = new RegExp("第?[０-９]*地割([、～].*?[０-９]*地割)?$");

// fs.promise
const readFile = (path: string): Promise<Buffer> => new Promise((ok, ng) => fs.readFile(path, (err, res: Buffer) => (err ? ng(err) : ok(res))));
const writeFile = (path: string, data: ArrayBuffer | string): Promise<void> => new Promise((ok, ng) => fs.writeFile(path, data, err => (err ? ng(err) : ok())));
const access = (path: string): Promise<void> => new Promise((ok, ng) => fs.access(path, err => (err ? ng(err) : ok())));

export type KenAllRow = string[];

/**
 * @see https://www.post.japanpost.jp/zipcode/dl/readme.html
 */

export const enum KenAllColumns {
    "全国地方公共団体コード" = 0,
    "旧郵便番号",
    "郵便番号",
    "都道府県名カナ",
    "市区町村名カナ",
    "町域名カナ",
    "都道府県名",
    "市区町村名",
    "町域名",
    "一町域が二以上の郵便番号で表される場合の表示",
    "小字毎に番地が起番されている町域の表示",
    "丁目を有する町域の場合の表示",
    "一つの郵便番号で二以上の町域を表す場合の表示",
    "更新の表示",
    "変更理由",
}

import C = KenAllColumns;

export interface KenAllLogger {
    warn: (message: string) => void;
}

export interface KenAllOptions {
    logger?: KenAllLogger;
    url?: string;
    zip?: string;
    csv?: string;
    json?: string;
    tmpDir?: string;
}

const defaultOptions: KenAllOptions = {
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

export class KenAll implements KenAllOptions {
    logger?: KenAllLogger;
    url: string;
    csv: string;
    tmpDir: string;

    constructor(options?: KenAllOptions) {
        // TS7017: Element implicitly has an 'any' type because type 'KenAllOptions' has no index signature.
        const that = this as KenAllOptions;
        for (const key in defaultOptions) {
            const k = key as keyof KenAllOptions;
            that[k] = options && options[k] || defaultOptions[k];
        }
    }

    /**
     * console.warn
     */

    protected debug(message: string): void {
        if (this.logger) this.logger.warn(message);
    }

    /**
     * fetch ZIP file
     */

    async fetchZip(): Promise<ArrayBuffer> {
        const req = {
            method: "GET",
            url: this.url,
            responseType: "arraybuffer"
        };

        this.debug("loading: " + this.url);
        const res = await axios(req);
        return res.data;
    }

    /**
     * extract CSV file from ZIP file
     */

    async extractCSV(): Promise<string> {
        const zipPath = this.tmpDir + "ken_all.zip";

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
        const ab = await zip.file(this.csv).async("arraybuffer");
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
            const zip = row[C.郵便番号];
            const prev = index[zip];
            // same city
            if (prev && prev[0] === row[0]) {
                // continued line
                const open = prev[C.町域名].split("（").length;
                const close = prev[C.町域名].split("）").length;
                if (open > close) {
                    prev[C.町域名カナ] += row[C.町域名カナ];
                    prev[C.町域名] += row[C.町域名];
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
        const jsonPath = this.tmpDir + "ken_all.json";

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
     * normalize
     */

    public normalize(row: KenAllRow): void {
        if (row[C.町域名カナ]) {
            row[C.町域名カナ] = row[C.町域名カナ].replace(removeKanaSuffix, "");
        }

        if (row[C.町域名]) {
            row[C.町域名] = row[C.町域名].replace(removeTextSuffix, "");
            row[C.町域名] = row[C.町域名].replace(removeChiwariSuffix, "");
        }
    }

    /**
     * parse CSV file
     */

    public async readAll(): Promise<KenAllRow[]> {
        const rows = await this.readCachedCSV();
        rows.forEach(row => this.normalize(row));
        return rows;
    }

    /**
     * parse CSV file
     */

    public static async readAll(options?: KenAllOptions): Promise<KenAllRow[]> {
        return new KenAll(options).readAll();
    }
}
