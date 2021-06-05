# Auto sync reviewers and assignees
A Github Action to automatically sync the reviewers with the assignees on a pull request

## Inputs

### `token`

**Required** Github token of your repository

### `exclude`

List of Github logins to be ignored during synchronization, separated by a comma

## Example usage

Create action file

`.github/workflows/sync-reviewers-assignees.yml`

```yaml
name: "Sync reviewers and assignees"
on:
  pull_request:
    types: [review_requested,review_request_removed,assigned,unassigned]

jobs:
  sync_reviewers_assignees:
    runs-on: ubuntu-latest
    steps:
    - uses: rubeus90/auto-sync-reviewer-assignee@v1.0
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
        exclude: 'user1,user2'
```
