module.exports = {
  default: {
    requireModule: ['tsx/cjs'],
    require: ['features/steps/**/*.ts'],
    paths: ['features/**/*.feature'],
    format: ['progress-bar', ['html', 'reports/cucumber.html']],
    formatOptions: { snippetInterface: 'async-await' },
  },
};
