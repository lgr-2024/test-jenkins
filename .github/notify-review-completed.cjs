const fs = require("fs");
const yaml = require("js-yaml");
// const github = require("@actions/github");
const axios = require("axios");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const configPath = "./.github/review-config.yaml";
const reviewConfig = fs.readFileSync(configPath, "utf8");
const reviewConfigObj = yaml.load(reviewConfig);
// const API_URL = reviewConfigObj.API_URL;
const minReviewers = reviewConfigObj.minReviewers;

const prCreator = github.context.payload.pull_request.user.login;

async function main() {
  const myToken = process.env.GITHUB_TOKEN;
  const octokit = github.getOctokit(myToken);

  // Pull Request의 리뷰 상태를 가져온다
  const { data: reviews } = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews",
    {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: github.context.payload.pull_request.number,
    }
  );

  console.log("Reviews:", reviews);

  // const { data: reviewers } = await axios.get(`${API_URL}/reviewers`);
  const reviewers = [
    { githubName: "khj-dev", telegramId: "6091937590", name: "김현진" },
    { githubName: "lgr-2024", telegramId: "6851873549", name: "임경락" },
    { githubName: "leein-dev", telegramId: "517915719", name: "이인" },
    { githubName: "jeongjun-dev", telegramId: "1343181442", name: "주정준" },
  ];
  const user = reviewers.find((reviewer) => reviewer.githubName === prCreator);
  const prLink = `PR 링크: ${github.context.payload.pull_request.html_url}`;

  const allReviewApproved =
    reviews.length >= minReviewers && reviews.every((review) => review.state === "APPROVED");
  if (allReviewApproved) {
    await sendTelegramMessage(
      user.telegramId,
      `안녕하세요, ${user.name}님! 작성하신 PR의 모든 리뷰가 통과되었습니다. 리뷰를 확인하고 Merge 부탁드립니다. 🙏🏻\n${prLink}`
    );
    return;
  }
  const lastReview = reviews[reviews.length - 1];
  if (lastReview.state === "COMMENTED" && lastReview.user.login !== prCreator) {
    await sendTelegramMessage(
      user.telegramId,
      `${user.name}님! 작성하신 PR에 남겨진 코멘트가 있습니다. 확인해주세요! 🧐\n${prLink}`
    );
  }
}

async function sendTelegramMessage(telegramId, text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const data = {
    chat_id: telegramId,
    text,
  };

  try {
    const response = await axios.post(url, data);
    console.log("Telegram message sent:", response.data);
  } catch (error) {
    console.error("Failed to send Telegram message:", error);
  }
}

main();
