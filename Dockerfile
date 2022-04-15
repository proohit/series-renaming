FROM node:14-alpine

WORKDIR /usr/src/app
ADD ./ ./

# Install dependencies
RUN npm install

CMD node ./index.js
