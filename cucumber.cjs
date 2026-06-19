module.exports = {
  default: {
    requireModule: ['tsx/cjs'],
    require: ['features/steps/**/*.ts'],
    paths: ['features/**/*.feature'],
    format: ['progress'],
    formatOptions: { snippetInterface: 'async-await' },
  },
};
