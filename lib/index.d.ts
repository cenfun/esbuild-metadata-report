import type { Plugin, Metafile } from 'esbuild';

declare namespace metadataReport {

    export interface MetadataReportOptions {
        name?: string;
        outputFile?: string;
        metadata?: Metafile;
    }

    export function metadataReport(options: MetadataReportOptions): Plugin | string

}

declare function metadataReport(options: metadataReport.MetadataReportOptions): Plugin | string

export = metadataReport;
