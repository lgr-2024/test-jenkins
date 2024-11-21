const fs = require("fs");
const yaml = require("js-yaml");
const github = require("@actions/github");
const axios = require("axios");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const configPath = "./.github/review-config.yaml";
const reviewConfig = fs.readFileSync(configPath, "utf8");
const reviewConfigObj = yaml.load(reviewConfig);
// const API_URL = reviewConfigObj.API_URL;
const minReviewers = reviewConfigObj.minReviewers;

const prCreator = github.context.payload.pull_request.user.login;

async function main() {
	// const { data: reviewers } = await axios.get(`${API_URL}/reviewers`);
	// const { data: availableReviewers } = await axios.get(`${API_URL}/reviewers/available`);
	const reviewers = [
		{ githubName: "khj-dev", telegramId: "6091937590", name: "김현진" },
		{ githubName: "lgr-2024", telegramId: "6851873549", name: "임경락" },
		{ githubName: "leein-dev", telegramId: "517915719", name: "이인" },
		{ githubName: "jeongjun-dev", telegramId: "1343181442", name: "주정준" }
	];
	const availableReviewers = [
		{ githubName: "khj-dev", telegramId: "6091937590", name: "김현진" },
		{ githubName: "lgr-2024", telegramId: "6851873549", name: "임경락" },
		{ githubName: "jeongjun-dev", telegramId: "1343181442", name: "주정준" }
	];
	console.log("Available reviewers:", availableReviewers);
	const selectedReviewers = selectRandomReviewers(availableReviewers);

	if (prCreator) {
		const myToken = process.env.GITHUB_TOKEN;
		const octokit = github.getOctokit(myToken);

		// PR에 assignee로 PR 생성자 할당
		await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/assignees", {
			owner: github.context.repo.owner,
			repo: github.context.repo.repo,
			issue_number: github.context.issue.number,
			assignees: [prCreator]
		});

		// PR에 이미 리뷰어가 지정되어 있는지 확인
		const existingReviewers = await octokit.request(
			"GET /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers",
			{
				owner: github.context.repo.owner,
				repo: github.context.repo.repo,
				pull_number: github.context.issue.number
			}
		);

		// 이미 리뷰어가 지정되어 있다면 기존 리뷰어에게 Telegram 메시지 전송 후 종료
		if (existingReviewers.data.users.length !== 0) {
			const existingReviewerLogins = existingReviewers.data.users.map((user) => user.login);

			reviewers.filter((reviewer) => {
				if (existingReviewerLogins.includes(reviewer.githubName)) {
					sendDirectTelegramMessage(reviewer, "reopen");
				}
			});

			return;
		}

		// 리뷰어가 지정되어 있지 않다면 새로운 리뷰어 지정
		selectedReviewers.forEach(async (reviewer) => {
			await octokit.request("POST /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers", {
				owner: github.context.repo.owner,
				repo: github.context.repo.repo,
				pull_number: github.context.issue.number,
				reviewers: [reviewer.githubName]
			});

			await sendDirectTelegramMessage(reviewer, "open");
		});
	}
}

function selectRandomReviewers(reviewers) {
	// prCreator를 제외한 후보 리뷰어 필터링
	const candidateReviewers = reviewers.filter((person) => person.githubName !== prCreator);

	// Fisher-Yates Shuffle 알고리즘을 사용해 candidateReviewers 배열 Shuffle
	for (let i = candidateReviewers.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[candidateReviewers[i], candidateReviewers[j]] = [candidateReviewers[j], candidateReviewers[i]];
	}

	// 섞인 배열에서 minReviewers만큼 리뷰어 선택
	if (candidateReviewers.length < minReviewers) {
		return candidateReviewers;
	}
	return candidateReviewers.slice(0, minReviewers);
}

async function sendDirectTelegramMessage(reviewer, type) {
	const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
	const prLink = `PR 링크: ${github.context.payload.pull_request.html_url}`;
	const text =
		type === "open"
			? `안녕하세요, ${reviewer.name}님! 오늘의 리뷰어로 선정되셨습니다. PR 리뷰 부탁드립니다. 🙏🏻\n${prLink}`
			: `안녕하세요, ${reviewer.name}님! PR이 재 오픈 되었습니다. 수정사항을 확인 하시고 재리뷰 부탁드립니다. 🙏🏻\n${prLink}`;

	const data = {
		chat_id: reviewer.telegramId,
		text
	};

	try {
		const response = await axios.post(url, data);
		console.log("Telegram message sent:", response.data);
	} catch (error) {
		console.error("Failed to send Telegram message:", error);
	}
}

main();
