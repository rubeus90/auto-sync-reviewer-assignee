const core = require('@actions/core')
const github = require('@actions/github')

async function execute() {
    try {
        const token = core.getInput("token", {required: true})
        const octokit = github.getOctokit(token)

        const context = github.context
        const owner = context.repo.owner
        const repo = context.repo.repo
        const pull_number = context.payload.pull_request.number
        const issue_number = context.issue.number

        // Fetch pull request info
        const { data: pullRequest } = await octokit.rest.pulls.get({
            owner,
            repo,
            pull_number,
        });
        const assigneeLogins = pullRequest.assignees.map(assignee => assignee.login)
        const reviewerLogins = pullRequest.requested_reviewers.map(reviewer => reviewer.login)

        // Add and remove reviewers/assignees when there's a difference between the 2 lists
        switch(context.payload.action) {
            case 'assigned':
            case 'unassigned':
                const reviewersToAdd = assigneeLogins.filter(login => !reviewerLogins.includes(login))
                if (reviewersToAdd.length > 0) {
                    await octokit.rest.pulls.requestReviewers({
                        owner,
                        repo,
                        pull_number,
                        reviewers: reviewersToAdd,
                    })
                }
                const reviewersToRemove = reviewerLogins.filter(login => !assigneeLogins.includes(login))
                if (reviewersToRemove.length > 0) {
                    await octokit.rest.pulls.removeRequestedReviewers({
                        owner,
                        repo,
                        pull_number,
                        reviewers: reviewersToRemove,
                      })
                }
                break
            case 'review_requested':
            case 'review_request_removed':
                const assigneesToAdd = reviewerLogins.filter(login => !assigneeLogins.includes(login))
                if (assigneesToAdd.length > 0) {
                    await octokit.rest.issues.addAssignees({
                        owner,
                        repo,
                        issue_number,
                        assignees: assigneesToAdd,
                      })
                }
                const assigneesToRemove = assigneeLogins.filter(login => !reviewerLogins.includes(login))
                if (assigneesToRemove.length > 0) {
                    await octokit.rest.issues.removeAssignees({
                        owner,
                        repo,
                        issue_number,
                        assignees: assigneesToRemove,
                    })
                }
                break
        }
    } catch (error) {
        core.setFailed(error.message)
    }
}

execute()