
# ────────────────────────────
# Dockerfile
# ────────────────────────────
FROM node:18-alpine

# 1) 앱 디렉터리 생성
WORKDIR /usr/src/app

# 2) 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm ci --omit=dev

# 3) 소스 코드 복사
COPY . .

# 4) 환경 변수(포트) 설정
ENV PORT=3000

# 5) 앱 실행
CMD ["npm", "run", "start"]