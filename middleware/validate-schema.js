'use strict';
const Boom = require('@hapi/boom');

const validateReqBody = function (schema) {
    return function (req, res, next) {
        console.log(req.body)
        const { error } = schema.validate(req.body);
        if (!error) {
            next();
        } else {
            const { payload } = Boom.badData().output;
            payload.message = error.message;
            res.status(payload.statusCode).json(payload);
        }
    };
};

module.exports = { validateReqBody };