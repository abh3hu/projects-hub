const { createApp } = require('./src/app');
const { getConfig } = require('./src/config');

const config = getConfig();
const app = createApp(config);

app.listen(config.port, '0.0.0.0', () => {
  console.log(`projects-hub listening on http://0.0.0.0:${config.port}`);
});
