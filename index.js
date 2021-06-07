const core = require('@actions/core')
const github = require('@actions/github')

async function execute() {
    try {
        const token = core.getInput("token", {required: true})
        let excludeList = core.getInput("exclude").split(",")

        const octokit = github.getOctokit(token)

        const context = github.context
        const owner = context.repo.owner
        const repo = context.repo.repo
        const pull_number = context.payload.pull_request.number
        const issue_number = context.issue.number

        // Fetch pull request info
        const { data: pullRequest } = await octokit.rest.pulls.get({owner, repo, pull_number});
        const assigneeLogins = pullRequest.assignees.map(assignee => assignee.login)
        const reviewerLogins = pullRequest.requested_reviewers.map(reviewer => reviewer.login)

        // Add the author of the pull request to the exclude list, since they can't be a reviewer
        excludeList.push(context.actor)

        // Add and remove reviewers/assignees when there's a difference between the 2 lists
        core.info('Workflow triggered on action : ' + context.payload.action)
        core.info('Current reviewers : [' + reviewerLogins + ']')
        core.info('Current assignees : [' + assigneeLogins + ']')
        core.info('Will ignore these users : [' + excludeList + ']')
        switch(context.payload.action) {
            case 'assigned':
            case 'unassigned':
                const reviewersToAdd = assigneeLogins.filter(login => !excludeList.includes(login) && !reviewerLogins.includes(login))
                if (reviewersToAdd.length > 0) {
                    core.info('Request to add reviewers : [' + reviewersToAdd + ']')
                    await octokit.rest.pulls.requestReviewers({owner, repo, pull_number, reviewers: reviewersToAdd})
                    core.info('Reviewers added : [' + reviewersToAdd + ']')
                } else {
                    core.info('No reviewer to be added')
                }
                const reviewersToRemove = reviewerLogins.filter(login => !excludeList.includes(login) && !assigneeLogins.includes(login))
                if (reviewersToRemove.length > 0) {
                    core.info('Request to remove reviewers : [' + reviewersToRemove + ']')
                    await octokit.rest.pulls.removeRequestedReviewers({owner, repo, pull_number, reviewers: reviewersToRemove})
                    core.info('Reviewers removed : [' + reviewersToRemove + ']')
                } else {
                    core.info('No reviewer to be removed')
                }
                break
            case 'review_requested':
            case 'review_request_removed':
                const assigneesToAdd = reviewerLogins.filter(login => !excludeList.includes(login) && !assigneeLogins.includes(login))
                if (assigneesToAdd.length > 0) {
                    core.info('Request to add assignees : [' + assigneesToAdd + ']')
                    await octokit.rest.issues.addAssignees({owner, repo, issue_number, assignees: assigneesToAdd})
                    core.info('Assignees added : [' + assigneesToAdd + ']')
                } else {
                    core.info('No assignees to be added')
                }
                const assigneesToRemove = assigneeLogins.filter(login => !excludeList.includes(login) && !reviewerLogins.includes(login))
                if (assigneesToRemove.length > 0) {
                    core.info('Request to remove assignees : [' + assigneesToRemove + ']')
                    await octokit.rest.issues.removeAssignees({owner, repo, issue_number, assignees: assigneesToRemove})
                    core.info('Assignees removed: [' + assigneesToRemove + ']')
                } else {
                    core.info('No assignees to be removed')
                }
                break
        }
    } catch (error) {
        core.setFailed(error.message)
    }
}

execute()