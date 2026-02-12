
const core = require("@actions/core");
const github = require("@actions/github");
const axios = require("axios");

async function run() {
  try {
    const token = process.env.GITHUB_TOKEN;
    const octokit = github.getOctokit(token);
    const context = github.context;

    const { owner, repo } = context.repo;

    // Only run if workflow failed
    if (context.payload.workflow_run.conclusion !== "failure") {
      console.log("Workflow did not fail. Skipping.");
      return;
    }

    console.log("Workflow failed. Running CommanderD...");

    // TEMP: For MVP we use basic failure message
    const failureMessage = `
Workflow: ${context.payload.workflow_run.name}
Conclusion: ${context.payload.workflow_run.conclusion}
Branch: ${context.payload.workflow_run.head_branch}
Commit: ${context.payload.workflow_run.head_sha}
    `;

    const backendUrl = core.getInput("backend_url");

    // Send to your backend
    const response = await axios.post(`${backendUrl}/api/analyze`, {
      logs: failureMessage,
    });

    const explanation = response.data.explanation;

    // If PR exists, comment
    if (context.payload.workflow_run.pull_requests.length > 0) {
      const prNumber = context.payload.workflow_run.pull_requests[0].number;

      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: `## ❌ CommanderD Analysis\n\n${explanation}`,
      });

      console.log("Comment posted successfully.");
    } else {
      console.log("No PR associated with this workflow.");
    }

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
