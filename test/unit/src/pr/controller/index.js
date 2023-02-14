'use strict';
const rewire = require('rewire');
const { describe, it } = require('mocha');
const sinon = require('sinon');
const controller = rewire('../../../../../src/pr/controller');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const { expect } = chai;

describe('pr: controller', () => {
    describe('private', () => {
        describe('parseGHURL', () => {
            it('should be able to parse out the pathname from the given repository URL', () => {
                const expectedPath = '/test/test2';
                const url = `https://a.url.com${expectedPath}`;

                const pathname = controller._private.parseGHURL(url);
                expect(pathname).equals(expectedPath);
            });

            describe('when an invalid URL is passed', () => {
                it('should fail with an error indicating the provided URL is invalid', () => {
                    const expectedPath = '/test';
                    const url = `https://a.url.com${expectedPath}`;

                    expect(() => controller._private.parseGHURL(url)).throws(/Invalid GitHub project URL/);
                });
            });
        });

        describe('fetchRawPRMetadata', () => {
            let fetchStub;
            let jsonStub;
            const fetchTmp = controller.__get__('fetch');
            const expectedPath = '/testOrg/testRepo';
            const expectedJson = [ { data: 123 }, {  data: 456 } ];

            let result;
            beforeEach(async () => {
                jsonStub = sinon.stub().returns(expectedJson);
                fetchStub = sinon.stub().resolves({ json: jsonStub });
                controller.__set__('fetch', fetchStub);

                result = await controller._private.fetchRawPRMetadata(expectedPath);
            });

            beforeEach(() => {
                controller.__set__('fetch', fetchTmp);
            });

            it('should call "fetch" with the expected full URL', () => {
                expect(fetchStub.calledOnceWith('https://api.github.com/repos/testOrg/testRepo/pulls')).equals(true);
            });

            it('should return the expected JSON', () => {
                expect(result).deep.equals(expectedJson);
            });
        });

        describe('fetchCommitCount', () => {
            let fetchStub;
            let jsonStub;
            const fetchTmp = controller.__get__('fetch');
            const expectedCommitsURL = 'https://api.github.com/repos/testOrg/testRepo/commits';
            const expectedJson = [ { commit: 123 }, {  commit: 456 } ];

            let result;
            beforeEach(async () => {
                jsonStub = sinon.stub().returns(expectedJson);
                fetchStub = sinon.stub().resolves({ json: jsonStub });
                controller.__set__('fetch', fetchStub);

                result = await controller._private.fetchCommitCount(expectedCommitsURL);
            });

            beforeEach(() => {
                controller.__set__('fetch', fetchTmp);
            });

            it('should call "fetch" with the expected full URL', () => {
                expect(fetchStub.calledOnceWith(expectedCommitsURL)).equals(true);
            });

            it('should return the expected JSON', () => {
                expect(result).deep.equals(expectedJson.length);
            });
        });

        describe('sanitizePRMetadata', () => {
            const expectedCommitCount = 10;
            const expectedCommitOne = {
                commit_url: 'https://api.github.com/pr/one/data',
                id: 1,
                number: 1,
                title: "PR ONE",
                author: "Octocat"
            };
            const expectedCommitTwo = {
                commit_url: 'https://api.github.com/pr/two/data',
                id: 2,
                number: 2,
                title: "PR TWO",
                author: "Tacotco"
            };
            const expectedMetadata = [ expectedCommitOne, expectedCommitTwo ];

            let fetchCommitCountStub;
            let result;
            const setup = async function(opts = {}) {
                const { resolvesCount = true } = opts;

                fetchCommitCountStub = sinon.stub(controller._private, 'fetchCommitCount').resolves(resolvesCount ? expectedCommitCount : 0);
                result = await controller._private.sanitizePRMetadata(expectedMetadata);
            }

            const restore = function() {
                fetchCommitCountStub.restore();
            };

            beforeEach(() => setup());
            afterEach(restore);

            it('should be able to sanitize data into the expected format', () => {
                console.log(result)
            });
        });
    });

});