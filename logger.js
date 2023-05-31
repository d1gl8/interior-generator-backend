const { isDev } = require("./index");
const { networkInterfaces } = require("os");
const pino = require("pino");
const pretty = require("pino-pretty");
const logrotate = require("logrotate-stream");
const {
  getExpressFullUrl,
  isMultipart,
  getMultipartData,
} = require("./handlers/serialize");

const file = isDev ? "./logs/http.log" : "/var/log/foclean-back/http.log";
const logrotateStream = logrotate({
  file,
  size: "1m",
  keep: 5,
  compress: true,
});
const prettyStream = pretty({
  destination: logrotateStream,
});
const pinoTransport = isDev ? prettyStream : logrotateStream;

const logger = pino(
  {
    level: "trace",
    formatters: {
      level: (label) => {
        return { context: "http" };
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    },
  },
  pinoTransport
);

const logRequest = (request, express = true) => {
  let direction, ip, method, url, headers, body;
  const { hash, session } = request.metadata;
  method = request.method.toUpperCase();
  headers = request.headers;

  if (express) {
    direction = "Nuxt -> Express";
    ip = request.socket.remoteAddress;
    url = getExpressFullUrl(request);
    body = getMultipartData(request.fields, request.files);
  } else {
    direction = "Express -> AI";
    ip = "networkInterfaces().en0[1].address";
    url = request.baseURL + request.url;
    body = "restream Nuxt request data";
  }

  if (!isMultipart(headers)) body = request.data;

  console.log(" " + direction);
  console.log(`  ${method} REQUEST ${url}\n`);

  let log = {
    hash,
    session,
    direction,
    ip,
    type: "REQUEST",
    method,
    url,
    headers,
    body,
  };
  logger.trace(log);
  return request;
};

const logResponse = async (response, express = true) => {
  let direction, method, url, status, headers, body, responseTime;
  const { hash, session, start } = express
    ? response.req.metadata
    : response.config.metadata;
  responseTime = Date.now() - start;
  const getResponseFinish = () => {
    return new Promise((res, rej) => {
      response.once("finish", () => {
        responseTime = Date.now() - start;
        res();
      });
    });
  };

  if (express) {
    direction = "Express -> Nuxt";
    method = response.req.method.toUpperCase();
    status = response.statusCode;
    url = getExpressFullUrl(response.req);
    headers = response.getHeaders();
    body = "restream AI response data";
    await getResponseFinish();
  } else {
    direction = "AI -> Express";
    method = response.config.method.toUpperCase();
    status = response.status;
    url = response.config.baseURL + response.config.url;
    headers = response.headers;
    body = response.data;
  }

  console.log(" " + direction);
  console.log(`  ${method} RESPONSE ${status} ${url}`);
  console.log(`  response time ${responseTime / 1000} sec\n`);

  if (!isMultipart(headers)) {
    if (express) body = response.req.resBody;
    else body = response.data;
  }

  let log = {
    hash,
    session,
    direction,
    type: "RESPONSE",
    method,
    url,
    status,
    headers,
    body,
    responseTime,
  };

  logger.trace(log);
  return response;
};

module.exports = { logRequest, logResponse };
