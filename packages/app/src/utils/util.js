import { Util as GridUtil } from 'turbogrid';

const Util = {
    ... GridUtil,

    isTouchDevice: function() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
    },

    getSourceName: (sourcePath = '') => {
        const pathList = sourcePath.split('/');
        const lastName = pathList.pop();
        const dir = pathList.pop();

        // with extname
        const index = lastName.lastIndexOf('.');
        if (index !== -1) {
            const ext = lastName.slice(index + 1);
            const reg = /^[a-z0-9]+$/;
            if (reg.test(ext)) {
                return lastName;
            }
        }

        // with parent dir
        if (dir) {
            return `${dir}/${lastName}`;
        }
        return lastName;
    },

    generatePercentChart: function(percent) {
        return `<div style="--emr-percent:${percent}%;" class="emr-percent-chart"></div>`;
    },

    // percent
    PF: function(v, t = 1, digits = 1, unit = '%', space = '') {
        v = Util.toNum(v);
        t = Util.toNum(t);
        let per = 0;
        if (t) {
            per = v / t;
        }
        const perStr = (per * 100).toFixed(digits);
        if (unit) {
            return perStr + space + unit;
        }
        return parseFloat(perStr);
    },

    PSF: function(v, t = 1, digits = 1) {
        return Util.PF(v, t, digits, '%', ' ');
    },

    PNF: function(v, t = 1, digits = 1) {
        return Util.PF(v, t, digits, '');
    },

    // byte
    BF: function(v, places = 1, space = '') {
        v = Util.toNum(v, true);
        if (v === 0) {
            return `0${space}B`;
        }
        let prefix = '';
        if (v < 0) {
            v = Math.abs(v);
            prefix = '-';
        }

        const base = 1024;
        const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        for (let i = 0, l = units.length; i < l; i++) {
            const min = Math.pow(base, i);
            const max = Math.pow(base, i + 1);
            if (v > min && v < max) {
                const unit = units[i];
                v = prefix + (v / min).toFixed(places) + space + unit;
                break;
            }
        }
        return v;
    },

    BSF: function(v, places = 1) {
        return Util.BF(v, places, ' ');
    }
};

export default Util;
