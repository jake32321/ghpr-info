'use strict';
const url = require('url');
const fetch = require('node-fetch-commonjs');
const Boom = require('@hapi/boom');

const factory = { _private: {} };

/**
 * Parses and validates the given URL provided in the request body to ensure it fits the expected format.
 * @param {URL} repositoryURL URL for the GitHub repository to fetch metadata from.
 * @returns {String} The path containing the owner/org and repository name.
 */
factory._private.parseGHURL = function (repositoryURL) {
    const { pathname } = url.parse(repositoryURL);
    const repoAndOrg = pathname.split('/');
    repoAndOrg.shift(); // Drop 0th empty index for '/'.

    if(repoAndOrg.length !== 2) {
        throw Boom.badData('Invalid GitHub project URL');
    }

    return pathname;
};

/**
 * Fetches the raw pull request metadata from GitHub.
 * @param {String} repoOwnerPath Path containing the owner/org and the name of the repository.
 * @returns {Object} Raw JSON object containing the pull request metadata.
 */
factory._private.fetchRawPRMetadata = async function (repoOwnerPath) {
    const gitHubAPIURL = `https://api.github.com/repos${repoOwnerPath}/pulls`;
    const prs = await fetch(gitHubAPIURL);
    return prs.json();
};

/**
 * Fetches the pull request commits and returns the amount made on the pull request.
 * @param {URL} commitsURL GitHub REST API URL for fetching request commit information.
 * @returns {Number} The count of commits made for an individual pull request.
 */
factory._private.fetchCommitCount = async function(commitsURL) {
    const commits = await fetch(commitsURL);
    const commitsJSON = await commits.json();
    return commitsJSON.length;
};

/**
 * Finalize the pull request metadata in the expected format for the controller response.
 * @param {Object} metadata Itterable JSON array containing the raw pull request metadata.
 * @returns {Array} Collection of sanitized request metadata.
 */
factory._private.sanitizePRMetadata = async function (metadata) {
    const sanitizedData = [];
    for (const prMeta of metadata) {
        console.log(factory._private.fetchCommitCount)
        let commitCount = await factory._private.fetchCommitCount(prMeta.commits_url);

        if (!commitCount) {
            throw new Error(`Failed to fetch commits for PR: ${prMeta.id}`);
        }

        sanitizedData.push({
            id: prMeta.id,
            number: prMeta.number,
            title: prMeta.title,
            author: prMeta.user.login,
            commits: commitCount
        });
    }

    return sanitizedData;
};

/**
 * Controller function to get metadata from repository's pull requests.
 * @param {Object} res Response object provided to the controller function. This should come from Express.js.
 * @param {Object} body Request object body. 
 * @returns {void}
 */
factory.getPRMetadata = async function (res, body) {
    try {
        const userRepoPath = factory._private.parseGHURL(body.repositoryURL);
        const rawPRMetatdata = await factory._private.fetchRawPRMetadata(userRepoPath);

        if(typeof rawPRMetatdata[Symbol.iterator] !== 'function') { // If data is not itterable, must be a rate limit or some other error.
            const message = rawPRMetatdata.message ? `Error: ${rawPRMetatdata.message}` : '';
            throw new Error(`Failed to request metadata. ${message}`);
        }

        if (!rawPRMetatdata.length) { // Stop now if there isn't any PR metadata to process.
            res.json([]);
        }

        const sanitizedData = await factory._private.sanitizePRMetadata(rawPRMetatdata);

        res.json(sanitizedData);
    } catch (err) {
        if (!Boom.isBoom(err)) { // Standardize error messages that might not fit Boom formatting.
            const boomErr = Boom.internal(); // Anything not already formatted as a Boom error is unexpected behavior. Treat it as so.
            boomErr.output.payload.message = err.message;
            err = boomErr;
        }

        const { payload } = err.output;
        res.status(payload.statusCode).send(payload);
    }
};

module.exports = factory;