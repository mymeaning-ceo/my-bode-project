# 베이스 이미지
FROM node:18-alpine

# 앱 디렉터리
WORKDIR /usr/src/app

# 의존성 설치
COPY package*.json ./
RUN npm ci --omit=dev \
    && addgroup -S app && adduser -S app -G app

# 소스 복사
COPY . .

# 환경 변수
ENV PORT=3080

# 루트 권한 제거
USER app

# 실행 명령
CMD ["npm", "run", "start"]