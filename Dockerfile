FROM node:14-alpine

WORKDIR /usr/src/app
ADD ./ ./

# Install dependencies
RUN npm install

CMD node ./index.js --config-file=/config/config.json --log-folder=/logs
