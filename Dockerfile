FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm install --silent
COPY src ./src
RUN npm run build

FROM node:20-alpine
RUN apk add --no-cache curl
ENV NODE_ENV production
WORKDIR /app
COPY package*.json ./
RUN npm install --production --silent
COPY --from=builder /app/dist ./dist
COPY public ./public
COPY getdb ./
EXPOSE 3000
CMD ["npm", "start"]
