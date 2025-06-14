module.exports = {
  env: {
    node: true,
    es2022: true,
    jest: true          // Jest 전역(describe, it, expect) 허용
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'script' // CommonJS(require) 환경
  },
  extends: [
    'airbnb-base',
    'plugin:prettier/recommended'
  ],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
    'no-console': 'off'
  },
  globals: {
    require: 'readonly',
    module: 'readonly',
    process: 'readonly',
    __dirname: 'readonly'
  }
};