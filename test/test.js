const esbuild = require('esbuild');
const metadataReport = require('../lib');

const metadata = require('./metadata.json');

const generate = async () => {

    // as function
    const htmlPath = metadataReport({
        ... metadata,
        outputFile: 'docs/index.html'
    });

    console.log('html path', htmlPath);

    // as plugin
    await esbuild.build({
        entryPoints: ['lib/index.js'],
        outfile: '.temp/metadata-report.js',
        metafile: true,
        bundle: true,
        target: 'node16',
        platform: 'node',
        plugins: [
            metadataReport({
                name: 'metadata report with esbuild plugin',
                // json: true,
                outputFile: './docs/plugin.html'
            })
        ]
    });

};

generate();
