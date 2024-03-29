const { isDev } = require("./index");
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
  try {
    let type, direction, ip, method, url, headers, body;
    const { hash, session } = request.metadata;
    method = request.method.toUpperCase();
    headers = request.headers;

    type = "REQUEST";

    if (express) {
      direction = "CLIENT";
      ip = request.socket.remoteAddress;
      url = getExpressFullUrl(request);
      body = getMultipartData(request.fields, request.files);
    } else {
      direction = "BACKEND";
      ip = "express server ip address";
      url = request.baseURL + request.url;
      body = "resend client request data";
    }

    if (!isMultipart(headers)) body = request.data;

    console.log(" " + direction + " " + type);
    console.log(`  ${method} ${url}\n`);

    let log = {
      hash,
      session,
      direction,
      type,
      ip,
      method,
      url,
      headers,
      body,
    };
    logger.trace(log);
    return request;
  } catch (err) {
    console.log("request logger error", err);
  }
};

const logResponse = async (response, express = true) => {
  try {
    let type, direction, method, url, status, headers, body, responseTime;
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

    type = "RESPONSE";

    if (express) {
      direction = "CLIENT";
      method = response.req.method.toUpperCase();
      status = response.statusCode;
      url = getExpressFullUrl(response.req);
      headers = response.getHeaders();
      body = "resend AI response data";
      await getResponseFinish();
    } else {
      direction = "BACKEND";
      method = response.config.method.toUpperCase();
      status = response.status;
      url = response.config.baseURL + response.config.url;
      headers = response.headers;
      body = response.data;
    }

    response.req?.resBody && (body = response.req.resBody);

    if (status !== 200) {
      type = "ERROR RESPONSE";
      express && (body = response.body);
    }

    console.log(" " + direction + " " + type);
    console.log(`  ${method} ${status} ${url}`);
    console.log(`  response time ${responseTime / 1000} sec\n`);

    let log = {
      hash,
      session,
      direction,
      type,
      method,
      url,
      status,
      headers,
      body,
      responseTime,
    };

    logger.trace(log);
    return response;
  } catch (err) {
    console.log("response logger error", err);
  }
};

module.exports = { logRequest, logResponse };
