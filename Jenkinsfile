pipeline {
    agent any
    
    environment {
        TELEGRAM_BOT_TOKEN = credentials('telegram-bot-token')
        PR_NOTICE_TELEGRAM_ID = credentials('pr-notice-telegram-id')
        GITHUB_TOKEN = credentials('github-token-2')
        NODE_VERSION = '22'
        PNPM_VERSION = '9'
    }
    
    stages {
        stage('Connection') {
            steps {
                echo '연결되어 있는가?'
            }
        }
    }
}