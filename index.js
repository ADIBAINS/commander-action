
const core = require("@actions/core");
const github = require("@actions/github");
const axios = require("axios");

async function run() {
  try {
    
    const token = core.getInput("token");
    const octokit = github.getOctokit(token);
    const context = github.context;

    const { owner, repo } = context.repo;

    console.log("Workflow failed. Running CommanderD...");

    
console.log("Running CommanderD on pull request...");

const pr = context.payload.pull_request;
const prNumber = pr.number;

const backendUrl = core.getInput("backend_url");

// Simple message for MVP
const failureMessage = `
PR: #${prNumber}
Title: ${pr.title}
Branch: ${pr.head.ref}
Author: ${pr.user.login}
`;

// Send to backend
const response = await axios.post(backendUrl, {
  logs: failureMessage,
});

const explanation = response.data.explanation;

// Comment on PR
await octokit.rest.issues.createComment({
  owner,
  repo,
  issue_number: prNumber,
  body: `## ❌ CommanderD Analysis\n\n${explanation}`,
});

console.log("Comment posted successfully.");


 
} catch (error) {
  console.log("Full error:", error.response?.data || error.message);
  core.setFailed(error.message);
}
}

run();
