'use strict';
const Joi = require('@hapi/joi');

const getPRMetadata = Joi.object().keys({
    repositoryURL: Joi.string().uri().required()
});

module.exports = { getPRMetadata };