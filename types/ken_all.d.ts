export interface KenAllOptions {
    logger?: {
        warn: (message: string) => void;
    };
}
export declare class KenAll {
    /**
     * fetch ZIP file
     */
    static fetchZip(option?: KenAllOptions): Promise<any>;
    /**
     * extract CSV file from ZIP file
     */
    static extractCSV(option?: KenAllOptions): Promise<any>;
    /**
     * parse raw CSV file
     */
    static parseRawCSV(option?: KenAllOptions): Promise<any>;
    /**
     * load CSV file from cache when available
     */
    static readCachedCSV(option?: KenAllOptions): Promise<any>;
    /**
     * parse CSV file
     */
    static readAll(option?: KenAllOptions): Promise<any>;
}
