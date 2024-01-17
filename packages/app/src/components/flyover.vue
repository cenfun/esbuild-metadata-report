<script setup>
import { inject } from 'vue';
import { components } from 'vine-ui';
import hash from '../core/hash.js';

import IconLabel from './icon-label.vue';

const { VuiFlex, VuiFlyover } = components;

const state = inject('state');

// remove tag till flyover animation end
const onFlyoverEnd = () => {
    if (!state.flyoverVisible) {
        hash.remove('page');
    }
};

const onFlyoverResize = (width) => {
    state.flyoverWidth = width;
};

</script>

<template>
  <VuiFlyover
    ref="flyover"
    position="right"
    :visible="state.flyoverVisible"
    :width="state.flyoverWidth"
    min-width="350"
    @end="onFlyoverEnd"
    @resize="onFlyoverResize"
  >
    <div class="emr-flyover-main vui-flex-column">
      <VuiFlex
        gap="10px"
        padding="10px"
        class="emr-flyover-header"
      >
        <IconLabel
          icon="arrow-right"
          size="20px"
          @click="state.flyoverVisible=false"
        />
        <div class="emr-flyover-title vui-flex-auto">
          {{ state.flyoverTitle }}
        </div>
        <IconLabel
          icon="close"
          size="20px"
          @click="state.flyoverVisible=false"
        />
      </VuiFlex>
      <div class="emr-flyover-content vui-flex-auto">
        <slot />
      </div>
    </div>
  </VuiFlyover>
</template>

<style lang="scss">
.emr-flyover-icon {
    position: absolute;
    top: 0;
    right: 0;
    width: 20px;
    height: 100%;
}

.emr-flyover-main {
    height: 100%;
    overflow: hidden;
}

.emr-flyover-header {
    color: #fff;
    background-color: #005ba4;
}

.emr-flyover-title {
    font-weight: bold;
    font-size: 16px;
    line-height: 22px;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.emr-flyover-content {
    overflow: auto;
}

</style>
