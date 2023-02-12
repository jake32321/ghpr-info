'use strict';
const config = require('./config.json');
const { version } = require('./package.json');
const app = require('./app');

const port = process.env.PORT || config.port;

app.listen(port, () => {
    console.log(`GitHub PR API [v${version}]`);
    console.log(`Application listening on port ${port}`);
});
