pipeline {
    agent any
    
    environment {
        TELEGRAM_BOT_TOKEN = credentials('telegram-bot-token')
        PR_NOTICE_TELEGRAM_ID = credentials('pr-notice-telegram-id')
        GITHUB_TOKEN = credentials('github-token')
        NODE_VERSION = '22'
        PNPM_VERSION = '9'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Conflict 체크') {
            steps {
                script {
                    def hasConflicts = sh(
                        script: '''
                            git fetch origin ${env.CHANGE_TARGET}:${env.CHANGE_TARGET}
                            git fetch origin ${env.CHANGE_BRANCH}:${env.CHANGE_BRANCH}
                            HAS_CONFLICTS=$(git merge-tree $(git merge-base main ${env.CHANGE_BRANCH}) main ${env.CHANGE_BRANCH} | grep "<<<<<<<" || true)
                            if [[ -z "$HAS_CONFLICTS" ]]; then
                                echo "false"
                            else
                                echo "true"
                            fi
                        ''',
                        returnStdout: true
                    ).trim()
                    env.CONFLICT_STATUS = hasConflicts
                }
            }
        }
        
        stage('의존성 설치') {
            steps {
                sh """
                    # Node.js 설치
                    . ~/.nvm/nvm.sh
                    nvm install ${NODE_VERSION}
                    nvm use ${NODE_VERSION}
                    
                    # pnpm 설치
                    npm install -g pnpm@${PNPM_VERSION}
                    
                    # .npmrc 설정
                    echo "@devtools-dev:registry=https://npm.pkg.github.com" >> ~/.npmrc
                    echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> ~/.npmrc
                    
                    # 의존성 설치
                    pnpm install
                """
            }
        }
        
        stage('빌드') {
            steps {
                sh 'pnpm --filter @devtools-dev/ui build-only'
            }
        }
        
        stage('테스트') {
            steps {
                script {
                    try {
                        sh 'pnpm run test'
                        env.TEST_STATUS = 'success'
                    } catch (Exception e) {
                        env.TEST_STATUS = 'failure'
                        currentBuild.result = 'UNSTABLE'
                    }
                }
            }
        }
        
        stage('알림 전송') {
            steps {
                script {
                    sh 'node ./.github/workflows/send-pr-telegram-msg.cjs'
                }
            }
        }
    }
    
    post {
        always {
            script {
                if (env.CHANGE_ID) {  // PR이 있는 경우에만
                    sh 'node ./.github/workflows/notify-review-completed.cjs'
                }
            }
        }
    }
}