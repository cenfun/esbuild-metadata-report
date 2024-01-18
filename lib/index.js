const fs = require('fs');
const path = require('path');
const EC = require('eight-colors');
const deflateSync = require('lz-utils/deflate-sync');

const defaultOptions = require('./default/options.js');

const generateReport = (options) => {
    options = {
        ... defaultOptions,
        ... options
    };

    const reportData = {
        name: options.name,
        metadata: options.metadata
    };

    const reportDataCompressed = deflateSync(JSON.stringify(reportData));
    const reportDataStr = `window.reportData = '${reportDataCompressed}';`;

    const jsLib = fs.readFileSync(path.resolve(__dirname, 'packages/esbuild-metadata-report-app.js')).toString('utf-8');

    const htmlStr = [
        '<script>',
        reportDataStr,
        jsLib,
        '</script>'
    ].join('\n');

    // html
    const htmlPath = path.resolve(options.outputFile);
    const htmlDir = path.dirname(htmlPath);
    if (!fs.existsSync(htmlDir)) {
        fs.mkdirSync(htmlDir, {
            recursive: true
        });
    }

    const template = fs.readFileSync(path.resolve(__dirname, 'default/template.html')).toString('utf-8');

    const html = template.replace('{title}', reportData.name).replace('{content}', htmlStr);

    fs.writeFileSync(htmlPath, html);

    return htmlPath;
};


const metadataReport = function(options = {}) {
    if (options.metadata) {
        return generateReport(options);
    }
    return {
        name: 'metadata-report',
        setup: (build) => {
            build.onEnd((res) => {
                const { metafile, errors } = res;
                if (!metafile) {
                    if (errors && errors.length) {
                        return;
                    }
                    EC.logRed("Not found metadata, please check if the option 'metafile' is 'true'");
                    return;
                }
                options.metadata = metafile;
                generateReport(options);
            });
        }
    };
};

module.exports = metadataReport;
