'use strict';
const logger = require('express-pino-logger');
const uuid = require('uuid');

module.exports = logger({
    genReqId: uuid.v4
});