'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _postcss = require('postcss');

var _postcss2 = _interopRequireDefault(_postcss);

var _postcssValueParser = require('postcss-value-parser');

var _postcssValueParser2 = _interopRequireDefault(_postcssValueParser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable */
const plugin = 'postcss-icss-import';

const getArg = nodes => nodes.length !== 0 && nodes[0].type === 'string' ? nodes[0].value : _postcssValueParser2.default.stringify(nodes);

const getUrl = node => {
  if (node.type === 'function' && node.value === 'url') {
    return getArg(node.nodes);
  }
  if (node.type === 'string') {
    return node.value;
  }
  return '';
};

const parseImport = params => {
  const { nodes } = (0, _postcssValueParser2.default)(params);

  if (nodes.length === 0) {
    return null;
  }

  const url = getUrl(nodes[0]);

  if (url.trim().length === 0) {
    return null;
  }

  return {
    url,
    media: _postcssValueParser2.default.stringify(nodes.slice(1)).trim()
  };
};

const URL = /^\w+:\/\//;

const filter = (url, options) => {
  if (URL.test(url)) {
    return true;
  }

  if (url.startsWith('//')) {
    return true;
  }

  if (options.import instanceof RegExp) {
    return options.import.test(url);
  }

  if (typeof options.import === 'function') {
    return options.import(url);
  }

  return false;
};

const walkImports = (css, cb) => {
  css.each(node => {
    if (node.type === 'atrule' && node.name.toLowerCase() === 'import') {
      cb(node);
    }
  });
};

exports.default = _postcss2.default.plugin(plugin, options => (css, result) => {
  let idx = 0;

  walkImports(css, atrule => {
    if (atrule.nodes) {
      return result.warn('It looks like you didn\'t end your @import statement correctly.\nChild nodes are attached to it.', { node: atrule });
    }

    const parsed = parseImport(atrule.params);

    if (parsed === null) {
      return result.warn(`Unable to find URI in '${atrule.toString()}'`, {
        node: atrule
      });
    }

    let idx = 0;
    const url = parsed.url;

    if (!filter(url, options)) {
      atrule.remove();

      result.messages.push({
        type: 'import',
        plugin: 'postcss-icss-import',
        import: `import CSS__IMPORT__${idx} from '${url}';\n`
      });

      idx++;
    }
  });
});