export declare type KenAllRow = string[];
export interface KenAllLogger {
    warn: (message: string) => void;
}
export interface KenAllOptions {
    logger?: KenAllLogger;
}
export declare class KenAll {
    private readonly logger?;
    constructor(options?: KenAllOptions);
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
     * parse CSV file
     */
    readAll(): Promise<KenAllRow[]>;
    /**
     * parse CSV file
     */
    static readAll(options?: KenAllOptions): Promise<KenAllRow[]>;
}
