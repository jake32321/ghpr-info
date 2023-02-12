'use strict';
const Boom = require('@hapi/boom');
const pr = require('../src/pr/routes');

module.exports = function (app) {
    app.use('/pr', pr);

    app.use('*', (_, res) => {
        const { payload } = Boom.notFound().output;
        res.status(payload.statusCode).json(payload);
    });
};