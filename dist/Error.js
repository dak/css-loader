'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
class SyntaxError extends Error {
  constructor(err) {
    super(err);

    this.name = 'Syntax Error';
    this.message = '';

    if (err.line) {
      this.message += `\n\n[${err.line}:${err.column}] ${err.reason}`;
    }

    if (err.input.source) {
      this.message += `\n\n${err.showSourceCode()}\n`;
    }

    Error.captureStackTrace(this, this.constructor);
  }
}

exports.default = SyntaxError;