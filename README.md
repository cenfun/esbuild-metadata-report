# esbuild-metadata-report
> Metadata Report for esbuild

[![](https://img.shields.io/npm/v/esbuild-metadata-report)](https://www.npmjs.com/package/esbuild-metadata-report)
[![](https://badgen.net/npm/dw/esbuild-metadata-report)](https://www.npmjs.com/package/esbuild-metadata-report)
![](https://img.shields.io/github/license/cenfun/esbuild-metadata-report)

## Preview
- [https://cenfun.github.io/esbuild-metadata-report/](https://cenfun.github.io/esbuild-metadata-report/)


## Install
```
npm i esbuild-metadata-report
```

## Usage

- As esbuild plugin
```js
const metadataReport = require('esbuild-metadata-report');
await esbuild.build({

    // required metafile is true
    metafile: true,

    plugins: [
        metadataReport({
            name: 'Metadata Report',
            outputFile: './metadata-reports/index.html'
        })
    ]
});

```
- As a function
```js
const metadataReport = require('esbuild-metadata-report');
const res = await esbuild.build({

    // required metafile is true
    metafile: true

});

const htmlPath = metadataReport({
    metadata: res.metafile,
    name: 'Metadata Report',
    outputFile: './metadata-reports/index.html'
});

```