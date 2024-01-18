<script setup>
import {
    shallowReactive, onMounted, reactive, provide, watch, watchEffect
} from 'vue';
import { components, generateTooltips } from 'vine-ui';

import { Grid } from 'turbogrid';
import inflate from 'lz-utils/inflate';
import { microtask, debounce } from 'async-tick';

import hash from './core/hash.js';
import store from './core/store.js';

import Util from './utils/util.js';

import Flyover from './components/flyover.vue';
import Report from './components/report.vue';
import IconLabel from './components/icon-label.vue';

import faviconIcon from './images/icons/esbuild.svg';

const {
    VuiFlex,
    VuiInput,
    VuiRadio,
    VuiTooltip,
    VuiLoading
} = components;

// ===============================================================================================
// do not use reactive for grid data
const state = shallowReactive({
    title: 'Metadata Report',

    dataType: 'flat',

    keywords: '',

    windowWidth: window.innerWidth,

    // flyover detail
    flyoverVisible: false,
    flyoverWidth: '60%',
    flyoverTitle: '',
    flyoverComponent: '',
    flyoverData: null,

    grid: null,
    gridDataCache: {},

    initializing: true

});

provide('state', state);

const tooltip = reactive({
    visible: false,
    target: null,
    text: '',
    html: false
});

watchEffect(() => {
    let t = state.title;
    if (state.flyoverVisible) {
        t = `${Util.getSourceName(state.flyoverTitle)} - ${t}`;
    }
    document.title = t;
});

// ===============================================================================================

const hideTooltip = () => {
    tooltip.visible = false;
    tooltip.target = null;
    tooltip.text = '';
};

let timeout_tooltip;
const showTooltip = (target, text) => {
    clearTimeout(timeout_tooltip);

    if (Util.isTouchDevice()) {
        hideTooltip();
        return;
    }

    if (!text) {
        hideTooltip();
        return;
    }

    tooltip.target = target;
    tooltip.text = text;
    tooltip.visible = true;

    timeout_tooltip = setTimeout(() => {
        hideTooltip();
    }, 2000);
};

const initTooltip = () => {
    generateTooltips((target, text) => {
        showTooltip(target, text);
    }, (target) => {
        hideTooltip();
    });
};

const isNodeTruncated = (node) => {
    if (!node) {
        return false;
    }
    // name and url
    node = node.querySelector('.tg-tree-name') || node;
    // console.log(node.clientWidth, node.scrollWidth);
    if (node.clientWidth < node.scrollWidth) {
        // console.log('isNodeTruncated');
        return true;
    }
    return false;
};

// ===============================================================================================

const initFlyoverSize = () => {
    state.windowWidth = window.innerWidth;

    let flyoverWidth = '60%';
    if (state.windowWidth < 600) {
        flyoverWidth = '100%';
    } else if (state.windowWidth < 800) {
        flyoverWidth = '80%';
    }
    state.flyoverWidth = flyoverWidth;
};

const hideFlyover = () => {
    state.flyoverVisible = false;
    state.flyoverData = null;
};

const showFlyover = (rowItem) => {
    state.flyoverData = rowItem.list;
    state.flyoverTitle = rowItem.path;
    state.flyoverVisible = true;
    hash.set('page', rowItem.path);
};

const displayFlyoverWithHash = () => {

    const page = hash.get('page');
    if (page) {
        const grid = state.grid;
        if (grid) {
            const rowItem = grid.getRowItemBy('path', page);
            if (rowItem) {
                grid.scrollRowIntoView(rowItem);
                grid.setRowSelected(rowItem);
                showFlyover(rowItem);
                return;
            }
        }
    }

    hideFlyover();

};

const onRowClick = (grid, rowItem, columnItem) => {
    if (rowItem.isSummary || rowItem.subs) {
        return;
    }

    grid.setRowSelected(rowItem);

    if (state.flyoverVisible) {
        showFlyover(rowItem);
        return;
    }
    if (columnItem.id === 'name') {
        showFlyover(rowItem);
    }
};

// ===============================================================================================

const bindGridEvents = (grid) => {

    grid.bind('onCellMouseEnter', (e, d) => {
        const { cellNode } = d;
        if (isNodeTruncated(cellNode)) {
            showTooltip(d.e.target, cellNode.innerText);
        }
    }).bind('onCellMouseLeave', (e, d) => {
        hideTooltip();
    });

    grid.bind('onClick', (e, d) => {

        const {
            cellNode, rowItem, columnItem
        } = d;

        // for row
        if (cellNode) {
            onRowClick(grid, rowItem, columnItem);
        }

    });

    grid.bind('onFirstUpdated', (e) => {
        displayFlyoverWithHash();
    });
};

// ===============================================================================================

const mergeSingleSubGroups = (item) => {

    if (!item.subs) {
        return;
    }
    if (item.subs.length === 1) {
        const sub = item.subs[0];
        if (!sub.subs) {
            return;
        }
        item.name = [item.name, sub.name].filter((it) => it).join('/');
        item.subs = sub.subs;
        mergeSingleSubGroups(item);
        return;
    }

    item.subs.forEach((sub) => {
        mergeSingleSubGroups(sub);
    });

};

// calculate groups
const calculateGroups = (list, group, totalBytes) => {
    if (!list) {
        return;
    }

    if (typeof group.bytes !== 'number') {
        group.bytes = 0;
        group.iBytes = 0;
    }

    list.forEach((item) => {
        // sub group
        if (typeof item.bytes !== 'number') {
            calculateGroups(item.subs, item, totalBytes);
        }

        group.bytes += item.bytes;
        group.iBytes += item.iBytes;

    });

    group.percent = Util.PNF(group.bytes, totalBytes);

};

const getGroupRows = (outputItem, inputs, depTree) => {
    let groups = [];

    const flatRows = getFlatRows(outputItem, inputs, depTree);

    flatRows.forEach((row) => {
        const sourcePath = row.name;
        const pathList = sourcePath.split('/');

        const lastName = pathList.pop();

        let subs = groups;
        pathList.forEach((key) => {
            const item = subs.find((it) => it.name === key && it.subs);
            if (item) {
                subs = item.subs;
                return;
            }
            const sub = {
                name: key,
                subs: []
            };
            subs.push(sub);
            subs = sub.subs;
        });

        subs.push({
            ... row,
            name: lastName
        });

    });

    const group = {
        subs: groups
    };
    mergeSingleSubGroups(group);

    if (group.name) {
        groups = [group];
    }

    calculateGroups(groups, {}, outputItem.bytes);

    return groups;
};

const getFlatRows = (outputItem, inputs, depTree) => {
    const flatRows = [];
    Object.keys(outputItem.inputs).forEach((k) => {
        const item = outputItem.inputs[k];
        const inputItem = inputs[k] || {};
        const list = depTree[k] || [];
        flatRows.push({
            name: k,
            path: k,
            percent: Util.PNF(item.bytesInOutput, outputItem.bytes),
            bytes: item.bytesInOutput,
            iBytes: inputItem.bytes,
            iFormat: inputItem.format,
            list
        });
    });

    return flatRows;
};

const getSubImports = (flatRows, inputs, p) => {

    const input = inputs[p];
    if (!input) {
        // ignore external imports
        return;
    }

    const imports = input.imports;
    if (!imports.length) {
        // no dependencies
        return;
    }

    const subImports = imports.filter((it) => inputs[it.path]);
    if (!subImports.length) {
        // ignore external imports
        return;
    }

    const subs = subImports.map((item) => {
        const row = flatRows.find((it) => it.path === item.path);
        if (row.tg_added) {
            // stop loop
            return;
        }

        row.tg_added = true;
        const rowImports = getSubImports(flatRows, inputs, item.path);
        if (rowImports) {
            return {
                name: item.path,
                collapsed: true,
                subs: [row, rowImports]
            };
        }

        // no sub dependencies
        return row;
    }).filter((it) => it);

    if (!subs.length) {
        return;
    }

    if (subs.length > 1) {
        return {
            name: 'Imports',
            subs
        };
    }

    return subs[0];

};

const getTreeRows = (outputItem, inputs, depTree) => {
    const flatRows = getFlatRows(outputItem, inputs, depTree);
    const entryPoint = outputItem.entryPoint;

    const entryRow = flatRows.find((it) => it.path === entryPoint);
    entryRow.tg_added = true;

    const subs = [entryRow];

    const subImports = getSubImports(flatRows, inputs, entryPoint);
    if (subImports) {
        subs.push(subImports);
    }

    calculateGroups(subs, {}, outputItem.bytes);

    return subs;
};

const getOutputSubs = (outputItem, inputs, depTree) => {
    if (state.dataType === 'tree') {
        return getTreeRows(outputItem, inputs, depTree);
    }

    if (state.dataType === 'group') {
        return getGroupRows(outputItem, inputs, depTree);
    }

    return getFlatRows(outputItem, inputs, depTree);
};

// ===============================================================================================

const generateDepTree = (depTree, inputs, imports, list) => {
    imports.forEach((item) => {

        // {path: 'index.js', kind: 'import-statement', original: 'convert-source-map'}

        const input = inputs[item.path];
        if (!input) {
            // ignore external imports
            return;
        }

        const info = {
            path: item.path,
            title: '',
            contains: `${item.kind} ${JSON.stringify(item.original)}`
        };

        const newList = [... list, info];

        // already added
        if (!depTree[item.path]) {
            depTree[item.path] = newList;
        }

        if (input.imports) {
            generateDepTree(depTree, inputs, input.imports, newList);
        }

    });
};

const getGridRows = () => {

    const key = ['grid', state.dataType].join('-');
    // console.log(key);

    const cacheRows = state.gridDataCache[key];
    if (cacheRows) {
        return cacheRows;
    }

    const { metadata } = state.reportData;

    const { inputs, outputs } = metadata;

    const rows = Object.keys(outputs).map((k) => {
        const outputItem = outputs[k];

        const entryPoint = outputItem.entryPoint;
        const depTree = {};
        const list = [{
            path: k,
            title: 'Output file'
        }, {
            path: entryPoint,
            title: 'Entry point'
        }];

        depTree[entryPoint] = list;

        const imports = inputs[entryPoint].imports;
        generateDepTree(depTree, inputs, imports, list);
        // console.log(depTree);

        const subs = getOutputSubs(outputItem, inputs, depTree);
        // console.log(subs);

        return {
            name: k,
            bytes: outputItem.bytes,
            subs
        };

    });

    state.gridDataCache[key] = rows;

    return rows;
};


const getGridData = () => {

    const columns = [{
        id: 'name',
        name: 'Name',
        width: 500,
        maxWidth: 1230,
        classMap: 'emr-column-name'
    }, {
        id: 'percent',
        name: '%',
        type: 'number',
        formatter: 'percent'
    }, {
        id: 'chart',
        name: '',
        width: 110,
        formatter: 'chart'
    }, {
        id: 'bytes',
        name: 'Output Bytes',
        type: 'number',
        width: 100,
        formatter: 'bytes'
    }, {
        id: 'iBytes',
        name: 'Input Bytes',
        type: 'number',
        width: 100,
        formatter: 'bytes'
    }, {
        id: 'iFormat',
        name: 'Input Format',
        align: 'center',
        width: 100
    }];

    const rows = getGridRows();

    return {
        columns,
        rows
    };

};

// ===============================================================================================

const searchHandler = (rowItem) => {

    if (rowItem.tg_frozen) {
        return true;
    }

    const keywords = state.keywords.trim().toLowerCase();
    if (!keywords) {
        return true;
    }
    const keywordList = keywords.split(/\s+/g);
    const value = rowItem.name;
    for (const item of keywordList) {
        if (value.indexOf(item) !== -1) {
            return true;
        }
        if (value.toLowerCase().indexOf(item.toLowerCase()) !== -1) {
            return true;
        }
    }
};

const initGrid = () => {
    const grid = new Grid('.emr-grid');
    state.grid = grid;
    bindGridEvents(grid);

    let rowNumber = 1;
    const options = {
        bindWindowResize: true,
        scrollbarRound: true,
        textSelectable: false,
        collapseAllVisible: true,
        rowHeight: 36,
        selectMultiple: false,
        sortField: 'bytes',
        sortAsc: false,
        sortOnInit: true,
        frozenRowHoverable: true,
        rowFilter: searchHandler,
        rowNumberVisible: true,
        rowNumberFilter: (rowItem) => {
            if (!rowItem.isSummary && !rowItem.subs) {
                return rowNumber++;
            }
        },
        rowNotFound: 'No Results'
    };

    // no frozen in mini size
    if (state.windowWidth < 800) {
        options.frozenColumn = -1;
    }


    grid.setFormatter({

        chart: (v, rowItem) => {
            v = rowItem.percent;
            if (typeof v === 'number') {
                return Util.generatePercentChart(v);
            }
            return '';
        },
        percent: (v) => {
            if (typeof v === 'number') {
                return Util.PF(v, 100, 2);
            }
            return v;
        },

        bytes: (v) => {
            if (typeof v === 'number') {
                return Util.BF(v);
            }
            return v;
        }

    });
    grid.setOption(options);
    grid.setData(getGridData());
    grid.render();
};

const renderGrid = () => {
    if (state.grid) {
        state.grid.setData(getGridData());
        state.grid.render();
    }
};

const updateGrid = () => {
    if (state.grid) {
        state.grid.update();
    }
};

// ===============================================================================================

const initStore = () => {
    const mapping = {
        'true': true,
        'false': false
    };
    ['dataType'].forEach((item) => {
        // default empty string
        const v = store.get(item);
        // console.log(item, v);
        if (!v) {
            return;
        }
        if (Util.hasOwn(mapping, v)) {
            state[item] = mapping[v];
            return;
        }
        // console.log(item, v);
        state[item] = v;
    });
};

const setFavicon = () => {
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
        favicon.href = faviconIcon;
    }
};

const init = async () => {
    setFavicon();
    initStore();

    const reportStr = await inflate(window.reportData);
    const reportData = JSON.parse(reportStr);
    console.log(reportData);

    // for export all data JSON able
    state.reportData = reportData;
    if (reportData.name) {
        state.title = reportData.name;
    }

    initTooltip();

    initFlyoverSize();

    initGrid();

    state.initializing = false;
};


onMounted(() => {
    init();
});

watch(() => state.dataType, (v) => {
    store.set('dataType', v);
    renderGrid();
});

const updateGridAsync = debounce(updateGrid, 200);
watch([
    () => state.keywords
], () => {
    updateGridAsync();
});

window.addEventListener('popstate', microtask(() => {
    displayFlyoverWithHash();
}));

window.addEventListener('resize', () => {
    state.windowWidth = window.innerWidth;
    if (state.windowWidth < 600) {
        state.flyoverWidth = '100%';
    }
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
        state.flyoverVisible = false;
    }
});

window.addEventListener('message', (e) => {
    const data = e.data;
    if (data && typeof data === 'object') {
        Object.assign(state, data);
    }
});

</script>

<template>
  <div class="emr vui-flex-column">
    <VuiFlex
      class="emr-header"
      padding="10px"
      gap="10px"
      shrink
    >
      <VuiFlex
        gap="10px"
        wrap
      >
        <div class="emr-title">
          <a href="./">{{ state.title }}</a>
        </div>
      </VuiFlex>

      <div class="vui-flex-auto" />

      <div class="emr-about">
        <a
          href="https://github.com/cenfun/esbuild-metadata-report"
          target="_blank"
          title="ESBuild Metadata Report"
        ><IconLabel
          class="emr-icon-esbuild"
          icon="esbuild"
        /></a>
      </div>
    </VuiFlex>

    <VuiFlex
      class="emr-filter"
      padding="10px"
      gap="10px"
      wrap
    >
      <div class="emr-search-holder vui-flex-auto">
        <VuiFlex
          gap="10px"
          shrink
        >
          <div class="emr-search">
            <VuiInput
              v-model="state.keywords"
              width="100%"
              :class="state.keywords?'emr-search-keywords':''"
            />
            <IconLabel
              class="emr-search-icon"
              icon="search"
              :button="false"
            />
            <IconLabel
              v-if="state.keywords"
              class="emr-search-clear"
              icon="close"
              @click="state.keywords = ''"
            />
          </div>

          <VuiRadio
            v-model="state.dataType"
            name="dataType"
            value="flat"
            label="Flat"
          />
          <VuiRadio
            v-model="state.dataType"
            name="dataType"
            value="group"
            label="Group"
          />
          <VuiRadio
            v-model="state.dataType"
            name="dataType"
            value="tree"
            label="Tree"
          />
        </VuiFlex>
      </div>
    </VuiFlex>

    <div class="emr-grid vui-flex-auto" />

    <Flyover>
      <Report />
    </Flyover>

    <VuiTooltip
      :class="tooltip.classMap"
      :visible="tooltip.visible"
      :target="tooltip.target"
      :text="tooltip.text"
      :html="tooltip.html"
    />

    <VuiLoading
      :visible="state.initializing"
      size="l"
      center
    />
  </div>
</template>

<style lang="scss">
html {
    height: 100%;
}

body {
    --font-monospace: sfmono-regular, menlo, monaco, consolas, "Liberation Mono", "Courier New", monospace;
    --bg-failed: #fff0ef;
    --bg-flaky: #fcf7de;
    --color-passed: green;
    --color-failed: #d00;
    --color-flaky: orange;
    --color-skipped: gray;

    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    color: #333;
    font-size: 14px;
    font-family: arial, sans-serif;
    overflow: hidden;
}

svg {
    display: block;
}

a {
    color: #0d6efd;
    text-decoration: underline;
}

a:hover {
    color: #0a58ca;
}

a:not([href], [class]),
a:not([href], [class]):hover {
    color: inherit;
    text-decoration: none;
}

.emr {
    width: 100%;
    height: 100%;
    overflow: hidden;

    .emr-searchable b {
        color: red;
    }
}

/*
icon
*/

.emr-icon {
    display: block;
    width: 20px;
    height: 20px;
    background-repeat: no-repeat;
    background-position: center center;
    background-size: 20px 20px;
    cursor: pointer;
    opacity: 0.8;
    overflow: hidden;
}

.emr-icon:hover {
    opacity: 1;
}

.emr-header {
    color: #fff;
    background-color: #24292f;

    .emr-title {
        font-size: 18px;
        line-height: 22px;
        white-space: nowrap;
        text-overflow: ellipsis;

        a {
            color: #fff;
            text-decoration: none;
        }
    }
}

.emr-filter {
    border-bottom: 1px solid #ddd;
}

.emr-search-holder {
    min-width: 150px;
}

.emr-search {
    position: relative;
    width: 100%;
    max-width: 350px;
    padding: 5px;

    input {
        height: 30px;
        padding-right: 30px;
        padding-left: 30px;
        border-radius: 10px;
    }
}

.emr-search-icon {
    position: absolute;
    top: 50%;
    left: 13px;
    color: gray;
    transform: translate(0, -50%);
}

.emr-search-clear {
    position: absolute;
    top: 50%;
    right: 13px;
    transform: translate(0, -50%);
}

.emr-search-keywords {
    input {
        border-color: #80bdff;
        outline: 0;
        box-shadow: 0 0 0 0.2rem rgb(0 123 255 / 25%);
    }
}

.emr-column-name {
    cursor: pointer;
}

.emr-column-name:hover {
    text-decoration: underline;
}

.emr-percent-chart {
    position: relative;
    display: inline-block;
    width: 100%;
    height: 15px;
    box-sizing: border-box;
    border: 1px solid #888;
    border-radius: 3px;
    background-color: #fff;
    overflow: hidden;
}

.emr-percent-chart::after {
    position: absolute;
    top: 0;
    left: 0;
    content: "";
    width: var(--emr-percent);
    height: 100%;
    background-color: #999;
}

.tg-turbogrid {
    .tg-group {
        .emr-column-name {
            text-decoration: none;
            cursor: default;
        }
    }
}
</style>
