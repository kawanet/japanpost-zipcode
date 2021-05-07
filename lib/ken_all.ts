// ken_all

import axios from "axios"
import {promises as fs} from "fs"
import * as iconv from "iconv-lite"
import * as JSZip from "jszip"

const tmpDir = __dirname.replace(/[^\/]*\/?$/, "tmp/");

const removeKanaSuffix = new RegExp("(ｲｶﾆｹｲｻｲｶﾞﾅｲﾊﾞｱｲ|.*ﾉﾂｷﾞﾆﾊﾞﾝﾁｶﾞｸﾙﾊﾞｱｲ|\(.*?\))$");
const removeTextSuffix = new RegExp("(以下に掲載がない場合|.*に番地がくる場合|（.*?）)$");
const removeChiwariSuffix = new RegExp("第?[０-９]*地割([、～].*?[０-９]*地割)?$");
const removeIchienSuffix = new RegExp("(.+[市区町村])(一円)$");

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
    zip: string;
    csv: string;
    json: string;
    tmpDir: string;

    constructor(options?: KenAllOptions) {
        const that = this as any;
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

    async fetchZip(): Promise<Buffer> {
        this.debug("loading: " + this.url);
        const res = await axios.get<ArrayBuffer>(this.url, {
            responseType: "arraybuffer"
        });
        return Buffer.from(res.data);
    }

    /**
     * extract CSV file from ZIP file
     */

    async extractCSV(): Promise<string> {
        const zipPath = this.tmpDir + "ken_all.zip";

        try {
            await fs.access(zipPath);
        } catch (e) {
            const data = await this.fetchZip();
            this.debug("writing: " + zipPath);
            await fs.writeFile(zipPath, data);
        }

        this.debug("reading: " + zipPath);
        const data = await fs.readFile(zipPath);
        if (!data) return Promise.reject(`empty: ${zipPath}`);
        const zip = await JSZip.loadAsync(data);
        const ab = await zip.file(this.csv)?.async("arraybuffer");
        const buffer = Buffer.from(ab!!);
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
            await fs.access(jsonPath);
        } catch (e) {
            const data = await this.parseRawCSV();
            this.debug("writing: " + jsonPath);
            const json = JSON.stringify(data).replace(/],/g, "],\n");
            await fs.writeFile(jsonPath, json);
        }

        this.debug("reading: " + jsonPath);
        const data = await fs.readFile(jsonPath);
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
            row[C.町域名] = row[C.町域名].replace(removeIchienSuffix, "");
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
