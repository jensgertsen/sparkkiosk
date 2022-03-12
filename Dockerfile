FROM node:12-buster-slim AS builder

WORKDIR /build
COPY . .
RUN apt-get update
RUN apt-get install -y git python3 build-essential
RUN npm install


FROM node:12-buster-slim
USER 1000
WORKDIR /build
COPY --from=builder /build .
EXPOSE 21214
CMD [ "node", "app.mjs"]