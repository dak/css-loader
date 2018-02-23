'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = loader;

var _options = require('./options.json');

var _options2 = _interopRequireDefault(_options);

var _loaderUtils = require('loader-utils');

var _schemaUtils = require('schema-utils');

var _schemaUtils2 = _interopRequireDefault(_schemaUtils);

var _postcss = require('postcss');

var _postcss2 = _interopRequireDefault(_postcss);

var _url = require('./plugins/url');

var _url2 = _interopRequireDefault(_url);

var _import = require('./plugins/import');

var _import2 = _interopRequireDefault(_import);

var _Error = require('./Error');

var _Error2 = _interopRequireDefault(_Error);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Loader Defaults
const DEFAULTS = {
  url: true,
  import: true,
  sourceMap: false
};

// import runtime from './runtime';

// TODO(michael-ciniawsky)
// replace with postcss-icss-{url, import}
/* eslint-disable
import/first,
import/order,
no-shadow,
no-param-reassign
*/
function loader(css, map, meta) {
  // Loader Mode (Async)
  const cb = this.async();
  const file = this.resourcePath;

  // Loader Options
  const options = Object.assign({}, DEFAULTS, (0, _loaderUtils.getOptions)(this));

  (0, _schemaUtils2.default)(_options2.default, options, 'CSS Loader');

  if (options.sourceMap) {
    if (map && typeof map !== 'string') {
      map = JSON.stringify(map);
    }
  } else {
    map = false;
  }

  const plugins = [];

  // URL Plugin
  if (options.url) {
    plugins.push((0, _url2.default)(options));
  }

  // Import Plugin
  if (options.import) {
    plugins.push((0, _import2.default)(options));
  }

  if (meta) {
    const { ast } = meta;
    // Reuse CSS AST (PostCSS AST e.g 'postcss-loader')
    // to avoid reparsing the CSS
    if (ast && ast.type === 'postcss') {
      css = ast.root;
    }
  }

  map = options.sourceMap ? {
    prev: map || false,
    inline: false,
    annotation: false,
    sourcesContent: true
  } : false;

  return (0, _postcss2.default)(plugins).process(css, {
    from: `/css-loader!${file}`,
    map,
    to: file
  }).then(({ css, map, messages }) => {
    if (meta && meta.messages) {
      messages = messages.concat(meta.messages);
    }

    // CSS Imports
    let imports = messages.filter(msg => msg.type === 'import' ? msg : false).reduce((imports, msg) => {
      try {
        msg = typeof msg.import === 'function' ? msg.import() : msg.import;

        imports += msg;
      } catch (err) {
        // TODO(michael-ciniawsky)
        // revisit (CSSImportsError)
        this.emitError(err);
      }

      return imports;
    }, '');

    // CSS Exports
    let exports = messages.filter(msg => msg.type === 'export' ? msg : false).reduce((exports, msg) => {
      try {
        msg = typeof msg.export === 'function' ? msg.export() : msg.export;

        exports += msg;
      } catch (err) {
        // TODO(michael-ciniawsky)
        // revisit (CSSExportsError)
        this.emitError(err);
      }

      return exports;
    }, '');

    imports = imports ? `// CSS Imports\n${imports}\n` : false;
    exports = exports ? `// CSS Exports\n${exports}\n` : false;
    css = `// CSS\nexport default \`${css}\``;

    // TODO(michael-ciniawsky)
    // triage if and add CSS runtime back
    const result = [imports, exports, css].filter(Boolean).join('\n');

    cb(null, result, map ? map.toJSON() : null);

    return null;
  }).catch(err => {
    err = err.name === 'CssSyntaxError' ? new _Error2.default(err) : err;

    cb(err);

    return null;
  });
}