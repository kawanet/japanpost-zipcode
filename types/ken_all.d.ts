export declare type KenAllRow = string[];
/**
 * @see https://www.post.japanpost.jp/zipcode/dl/readme.html
 */
export declare const enum KenAllColumns {
    "全国地方公共団体コード" = 0,
    "旧郵便番号" = 1,
    "郵便番号" = 2,
    "都道府県名カナ" = 3,
    "市区町村名カナ" = 4,
    "町域名カナ" = 5,
    "都道府県名" = 6,
    "市区町村名" = 7,
    "町域名" = 8,
    "一町域が二以上の郵便番号で表される場合の表示" = 9,
    "小字毎に番地が起番されている町域の表示" = 10,
    "丁目を有する町域の場合の表示" = 11,
    "一つの郵便番号で二以上の町域を表す場合の表示" = 12,
    "更新の表示" = 13,
    "変更理由" = 14
}
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
/**
 * 郵便番号データダウンロード（読み仮名データの促音・拗音を小書きで表記するもの）（全国一括）
 */
export declare class KenAll implements KenAllOptions {
    logger?: KenAllLogger;
    url: string;
    csv: string;
    tmpDir: string;
    constructor(options?: KenAllOptions);
    /**
     * console.warn
     */
    protected debug(message: string): void;
    /**
     * fetch ZIP file
     */
    fetchZip(): Promise<ArrayBuffer>;
    /**
     * extract CSV file from ZIP file
     */
    extractCSV(): Promise<string>;
    /**
     * parse raw CSV file
     */
    private parseRawCSV;
    /**
     * load CSV file from cache when available
     */
    private readCachedCSV;
    /**
     * normalize
     */
    normalize(row: KenAllRow): void;
    /**
     * parse CSV file
     */
    readAll(): Promise<KenAllRow[]>;
    /**
     * parse CSV file
     */
    static readAll(options?: KenAllOptions): Promise<KenAllRow[]>;
}
