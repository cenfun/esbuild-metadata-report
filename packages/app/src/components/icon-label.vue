<script setup>
import {
    computed, onMounted, ref, useSlots, watch
} from 'vue';

import decodeIcons from '../core/icons.js';

const context = require.context('../images/icons', true, /\.svg$/);
const icons = decodeIcons(context);

const props = defineProps({
    icon: {
        type: String,
        default: ''
    },
    label: {
        type: String,
        default: ''
    },
    size: {
        type: String,
        default: ''
    },
    gap: {
        type: String,
        default: ''
    },
    button: {
        type: Boolean,
        default: true
    },
    primary: {
        type: Boolean,
        default: false
    }
});

const el = ref(null);

const classMap = computed(() => {
    const list = ['emr-icon-label', 'vui-flex-row'];
    if (props.button) {
        list.push('emr-icon-label-button');
        if (props.primary) {
            list.push('emr-icon-label-primary');
        }
    }
    return list;
});

const styleMap = computed(() => {
    const st = {};
    if (props.size) {
        st['--emr-icon-size'] = props.size;
    }
    if (props.gap) {
        st['--emr-icon-gap'] = props.gap;
    }
    return st;
});

const getSlot = function() {
    const slots = useSlots();
    const fun = slots.default;
    if (typeof fun === 'function') {
        return fun();
    }
};

const labelContent = computed(() => {
    return props.label || getSlot();
});

const showIcon = () => {

    if (!props.icon) {
        return;
    }

    const svg = icons[props.icon];

    if (!svg) {
        return;
    }
    const $el = el.value;

    $el.innerHTML = svg;
};

onMounted(() => {
    showIcon();
});

watch(() => props.icon, () => {
    showIcon();
});

</script>

<template>
  <div
    :class="classMap"
    :style="styleMap"
  >
    <div
      v-if="props.icon"
      ref="el"
      class="emr-icon-label-icon"
    />
    <label v-if="labelContent">
      <slot>{{ props.label }}</slot>
    </label>
  </div>
</template>

<style lang="scss">
.emr-icon-label {
    --emr-icon-size: 16px;
    --emr-icon-gap: 3px;

    position: relative;
    gap: var(--emr-icon-gap);
}

.emr-icon-label-icon {
    display: block;
    width: var(--emr-icon-size);
    height: var(--emr-icon-size);
    background-repeat: no-repeat;
    background-position: center center;
    background-size: var(--emr-icon-size) var(--emr-icon-size);
}

.emr-icon-label-button {
    cursor: pointer;
    opacity: 0.8;
    user-select: none;

    label {
        white-space: nowrap;
        cursor: pointer;
    }
}

.emr-icon-label-button:hover {
    opacity: 1;
}

.emr-icon-label-primary {
    opacity: 1;
}

.emr-icon-label-primary:hover {
    color: #0a58ca;
}

</style>
