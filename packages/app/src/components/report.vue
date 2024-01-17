<script setup>
import {
    watch, inject, shallowReactive
} from 'vue';

import { components } from 'vine-ui';

const { VuiFlex } = components;

const state = inject('state');

const data = shallowReactive({

});

const showReport = () => {
    const list = state.flyoverData;

    if (!list) {
        data.list = null;
        return;
    }

    // console.log('list', list);

    const cloneList = [].concat(list);

    data.head = cloneList.shift();
    data.list = cloneList;


};


watch(() => state.flyoverData, (v) => {
    showReport();
});

</script>

<template>
  <div
    v-if="data.list"
    class="emr-report"
  >
    <VuiFlex
      direction="row"
      padding="10px"
      class="emr-report-head"
      wrap
    >
      <div>
        <b>{{ data.head.title }}</b> <span class="emr-path">{{ data.head.path }}</span>
      </div>
    </VuiFlex>

    <div class="emr-dep-list">
      <div
        v-for="(item, i) in data.list"
        :key="i"
        class="emr-dep-item"
      >
        <div
          v-if="item.contains"
          class="emr-contains"
        >
          <span class="emr-code">{{ item.contains }}</span>
        </div>
        <div :class="item.contains?'emr-contains-icon':''">
          <b>{{ item.title }}</b> <span class="emr-path">{{ item.path }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.emr-report {
    position: relative;
    height: 100%;
}

.emr-report-head {
    width: 100%;
    border-bottom: 1px solid #dae9fa;
    background-color: #eef6ff;
    cursor: default;

    a {
        word-break: break-all;
    }
}

.emr-path {
    padding: 0 3px;
    font-family: var(--font-monospace);
    border-radius: 3px;
    background-color: #eee;
}

.emr-code {
    font-family: var(--font-monospace);
    font-style: italic;
}

.emr-contains {
    margin-top: -5px;
    padding-bottom: 10px;
}

.emr-contains-icon {
    padding-left: 20px;
    background-image: url("../images/arrow-right-bottom.svg");
    background-repeat: no-repeat;
    background-position: left center;
    background-size: 16px 16px;
}

.emr-dep-item {
    margin-top: 10px;
    padding: 0 10px;
}

</style>
