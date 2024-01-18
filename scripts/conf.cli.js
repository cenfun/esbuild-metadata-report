// starfall-cli config
// https://github.com/cenfun/starfall-cli

const fs = require('fs');
const path = require('path');

const beforeApp = (item, Util) => {

    const EC = require('eight-colors');
    const { deflateSync } = require('lz-utils');

    const jsonDataPath = path.resolve(__dirname, '../test/metadata.json');
    const metadataStr = fs.readFileSync(jsonDataPath).toString('utf-8');
    const reportDataCompressed = deflateSync(metadataStr);
    const reportDataStr = `window.reportData = '${reportDataCompressed}';`;


    const dataFile = 'metadata-data.js';
    const jsPath = path.resolve(item.buildPath, dataFile);
    const distDir = path.dirname(jsPath);
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, {
            recursive: true
        });
    }

    fs.writeFileSync(jsPath, reportDataStr);

    EC.logGreen(`created metadata file: ${dataFile}`);

    if (!item.dependencies.files.includes(jsPath)) {
        item.dependencies.files.unshift(jsPath);
    }

    return 0;
};

module.exports = {

    precommit: {
        gitHook: false,
        enable: 'lint + build'
    },

    build: {

        vendors: ['app'],

        before: (item, Util) => {

            if (item.production) {
                item.devtool = false;
            }

            if (item.name === 'app') {
                return beforeApp(item, Util);
            }

            return 0;
        },

        afterAll: (results, Util) => {

            const production = results.jobList[0].production;
            if (!production) {
                return 0;
            }

            const EC = require('eight-colors');

            const toPath = path.resolve(__dirname, '../lib/packages');

            // only clean if build all
            const totalComponents = fs.readdirSync(path.resolve(__dirname, '../packages'));
            if (results.jobList.length === totalComponents.length && fs.existsSync(toPath)) {
                fs.readdirSync(toPath).forEach((f) => {
                    const jsPath = path.resolve(toPath, f);
                    fs.rmSync(jsPath, {
                        force: true
                    });
                    EC.logRed(`removed ${jsPath}`);
                });
            }

            if (!fs.existsSync(toPath)) {
                fs.mkdirSync(toPath);
            }

            const distList = [];
            let code = 0;

            EC.log('get workspace packages dist files ...');
            // sometimes only on job
            results.jobList.forEach((job) => {
                const distPath = path.resolve(job.buildPath, `${job.fullName}.js`);
                if (!fs.existsSync(distPath)) {
                    EC.logRed(`ERROR: Not found dist: ${distPath}`);
                    code = 1;
                    return;
                }
                distList.push(distPath);
            });

            if (code) {
                return code;
            }

            let index = 1;
            const rows = [];

            distList.forEach((distPath) => {

                if (!distPath) {

                    rows.push({
                        innerBorder: true
                    });

                    return;
                }

                const stat = fs.statSync(distPath);

                const filename = path.basename(distPath);
                const toJs = path.resolve(toPath, filename);
                fs.cpSync(distPath, toJs);
                EC.logGreen(`copied ${toJs}`);

                rows.push({
                    index,
                    name: EC.green(filename),
                    size: stat.size
                });
                index += 1;

            });

            let total = 0;
            rows.forEach((it) => {
                if (it.size) {
                    total += it.size;
                }
            });

            rows.push({
                innerBorder: true
            });
            rows.push({
                total: true,
                index: '',
                name: 'Total',
                size: total
            });

            EC.log('packages files:');

            const overSizeColors = {
                red: 500 * 1024,
                orange: 200 * 1024
            };

            Util.CG({
                columns: [{
                    id: 'index',
                    name: 'No.',
                    align: 'right'
                }, {
                    id: 'name',
                    name: 'Runtime packages'
                }, {
                    id: 'size',
                    name: 'Size',
                    align: 'right',
                    formatter: function(v, rowData) {
                        const sizeH = Util.BF(v);
                        if (rowData.total) {
                            return sizeH;
                        }
                        if (v > overSizeColors.red) {
                            return Util.addColor(sizeH, 'red');
                        }
                        if (v > overSizeColors.orange) {
                            return Util.addColor(sizeH, 'orange');
                        }
                        return sizeH;
                    }
                }],
                rows: rows
            });

            return code;
        }

    },

    pack: {
        after: (item, Util) => {

            return 0;
        }
    }

};
