'use strict';
const schemas = require('../../../utils/request-schemas');
const { describe, it } = require('mocha');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const { expect } = chai

describe('request-schemas', () => {
    describe('getPRMetadata', () => {
        it('should validate', async () => {
            const validRequestBody = { repositoryURL: "https://dummyurl.com" };
            const result = await schemas.getPRMetadata.validate(validRequestBody);
            expect(result.value.repositoryURL).to.exist;
            expect(result.value.repositoryURL).equals(validRequestBody.repositoryURL);
        });

        describe('when the repository URL is missing from the request body', () => {
            it('should return an error that "repositoryURL" is required', async () => {
                const invalidRequestBody = { };
                await expect(schemas.getPRMetadata.validateAsync(invalidRequestBody)).rejectedWith(/is required/);
            });
        });

        describe('when the repository URL is not a properly formatted URL', () => {
            it('should return an error that "repositoryURL" is an invalid URL', async () => {
                const invalidRequestBody = { repositoryURL: "test" };
                await expect(schemas.getPRMetadata.validateAsync(invalidRequestBody)).rejectedWith(/must be a valid uri/);
            });
        });
    });
});