/**
 * japanpost-zipcode
 *
 * @see https://www.npmjs.com/package/japanpost-zipcode
 */

import {promises as fs} from "fs"
import * as iconv from "iconv-cp932"
import * as JSZip from "jszip"
import fetch from "node-fetch";
import * as os from "os";

import {KenAll as KenAllClass, KenAllColumns as C, KenAllLogger, KenAllOptions} from "../";

const removeKanaSuffix = new RegExp("(ｲｶﾆｹｲｻｲｶﾞﾅｲﾊﾞｱｲ|.*ﾉﾂｷﾞﾆﾊﾞﾝﾁｶﾞｸﾙﾊﾞｱｲ|\(.*?\))$");
const removeTextSuffix = new RegExp("(以下に掲載がない場合|.*に番地がくる場合|（.*?）)$");
const removeChiwariSuffix = new RegExp("第?[０-９]*地割([、～].*?[０-９]*地割)?$");
const removeIchienSuffix = new RegExp("(.+[市区町村])(一円)$");

export type KenAllRow = string[];

/**
 * @see https://www.post.japanpost.jp/zipcode/dl/readme.html
 */

const defaultOptions: KenAllOptions = {
    logger: undefined,
    url: "https://www.post.japanpost.jp/zipcode/dl/kogaki/zip/ken_all.zip",
    zip: "ken_all.zip",
    csv: "KEN_ALL.CSV",
    json: "ken_all.json",
    tmpDir: os.tmpdir()?.replace(/\/?$/, "/"),
};

/**
 * 郵便番号データダウンロード（読み仮名データの促音・拗音を小書きで表記するもの）（全国一括）
 */

export class KenAll implements KenAllClass {
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

    protected tmpZip(): string {
        return this.tmpDir + "ken_all.zip";
    }

    protected tmpJson(): string {
        return this.tmpDir + "ken_all.json";
    }

    /**
     * console.warn
     */

    debug(message: string): void {
        if (this.logger) this.logger.warn(message);
    }

    /**
     * fetch ZIP file
     */

    async fetchZip(): Promise<Buffer> {
        this.debug("loading: " + this.url);
        const res = await fetch(this.url);
        return Buffer.from(await res.arrayBuffer());
    }

    /**
     * Open ZIP file
     */

    private async openZip(): Promise<JSZip> {
        const zipPath = this.tmpZip();

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
        return await JSZip.loadAsync(data);
    }

    /**
     * extract CSV file from ZIP file
     */

    async extractCSV(): Promise<string> {
        const zip = await this.openZip();
        const ab = await zip.file(this.csv)?.async("arraybuffer")!!;
        const buffer = Buffer.from(ab);
        return iconv.decode(buffer);
    }

    /**
     * get the last modified time of CSV in ZIP
     */

    async modifiedAt(): Promise<Date> {
        const zip = await this.openZip();
        const modified = zip.file(this.csv)?.date!!;
        this.debug("modified: " + JSON.stringify(modified));
        return modified;
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
        const jsonPath = this.tmpJson();

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

    private normalize(row: KenAllRow): void {
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
     * remove temporary files
     */

    async clean(): Promise<void> {
        const removeFile = async (path: string) => {
            try {
                await fs.access(path);
                this.debug("removing: " + path);
                await fs.rm(path);
            } catch (e) {
                //
            }
        }

        await removeFile(this.tmpZip());
        await removeFile(this.tmpJson());
    }

    /**
     * parse CSV file
     */

    public static async readAll(options?: KenAllOptions): Promise<KenAllRow[]> {
        return new KenAll(options).readAll();
    }
}
