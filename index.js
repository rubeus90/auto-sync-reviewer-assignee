const core = require('@actions/core')
const github = require('@actions/github')
const context = github.context

async function run() {
    try {
        const token = core.getInput("token", {required: true})
        const octokit = github.getOctokit(token)

        const { data: pullRequest } = await octokit.rest.pulls.get({
            owner: context.repo.owner,
            repo: context.repo.repo,
            pull_number: 123,
            pull_number: context.payload.pull_request.number,
        });

        core.info(context.eventName)
        core.info(pullRequest.assignees)
        core.info(pullRequest.requested_reviewers)
    } catch (error) {
        core.setFailed(error.message)
    }
}