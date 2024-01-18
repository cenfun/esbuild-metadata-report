# esbuild-metadata-report
> Metadata Report for esbuild

## Preview


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