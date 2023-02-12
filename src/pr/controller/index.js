'use strict';
const url = require('url');
const fetch = require('node-fetch-commonjs');
const Boom = require('@hapi/boom');

const factory = { _private: {} };

factory._private.parseGHURL = function (repositoryURL) {
    const { pathname } = url.parse(repositoryURL);
    const repoAndUser = pathname.split('/');
    repoAndUser.shift(); // Drop 0th empty index for '/'.

    if(repoAndUser.length !== 2) {
        throw Boom.badData('Invalid GitHub project URL');
    }

    return pathname;
};

factory._private.fetchRawPRMetadata = async function (repoOwnerPath) {
    const gitHubAPIURL = `https://api.github.com/repos${repoOwnerPath}/pulls`;
    const prs = await fetch(gitHubAPIURL);
    return prs.json();
};

factory._private.fetchCommitCount = async function(commitsURL) {
    const commits = await fetch(commitsURL);
    const commitsJSON = await commits.json();
    return commitsJSON.length;
};

factory._private.sanitizePRMetadata = async function (metadata) {
    const sanitizedData = [];
    for (const prMeta of metadata) {
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

factory.getPRMetadata = async function (res, { repositoryURL }) {
    try {
        const userRepoPath = factory._private.parseGHURL(repositoryURL);
        const rawPRMetatdata = await factory._private.fetchRawPRMetadata(userRepoPath);

        if(typeof rawPRMetatdata[Symbol.iterator] !== 'function') { // If data is not itterable, must be a rate limit or some other error.
            const message = rawPRMetatdata.message ? `Error: ${rawPRMetatdata.message}` : '';
            throw new Error(`Failed to request metadata. ${message}`);
        }

        const sanitizedData = await factory._private.sanitizePRMetadata(rawPRMetatdata);

        res.json(sanitizedData);
    } catch (err) {
        if (!Boom.isBoom(err)) {
            const boomErr = Boom.internal();
            boomErr.output.payload.message = err.message;
            err = boomErr;
        }

        const { payload } = err.output;
        res.status(payload.statusCode).send(payload);
    }
};

module.exports = factory;