// Minimal ESLint flat config shim to avoid requiring the project's ESM config
// This avoids ESM/CJS loader issues when running eslint under a package with
// "type": "module". The project also has .eslintrc.cjs which is the
// canonical config used by editors/CI.
module.exports = [];
