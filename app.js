'use strict';
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const swaggerUI = require('swagger-ui-express');
const oas = require('./docs/docs.json');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/docs', swaggerUI.serve, swaggerUI.setup(oas));

// Add in routes
require('./routes')(app);

module.exports = app;