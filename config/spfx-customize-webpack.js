module.exports = configuration => {
  configuration.module = configuration.module || {};
  configuration.module.rules = configuration.module.rules || [];
  configuration.module.rules.push({ test: /\.md$/i, type: 'asset/source' });
};
