'use strict';
const express = require('express');

// JSON docs 
const oas = require('./docs/docs.json');

// Application level middleware
const bodyParser = require('body-parser');
const swaggerUI = require('swagger-ui-express');
const requestLogger = require('./middleware/request-logger');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(requestLogger);
app.use('/docs', swaggerUI.serve, swaggerUI.setup(oas));

// Add in routes
require('./routes')(app);

module.exports = app;