'use strict';
const express = require('express');
const validateSchema = require('../../middleware/validate-schema');
const schemas = require('../../utils/request-schemas');
const controller = require('./controller')

const router = express.Router();

router.post(
    '/metadata',
    validateSchema.validateReqBody(schemas.getPRMetadata),
    (req, res) => {
        controller.getPRMetadata(res, req.body);
    }
);

module.exports = router;