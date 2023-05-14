const pino = require("pino");
// const pretty = require("pino-pretty");
const logrotate = require("logrotate-stream");

const logrotateStream = logrotate({
  file: "/var/log/foclean-back/http.log",
  size: "1m",
  keep: 3,
  compress: true,
});
// const prettyStream = pretty({
//   destination: logrotateStream,
// });
const logger = pino(
  {
    level: "trace",
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    },
  },
  logrotateStream
);

const getExpressFullUrl = (req) => {
  return `${req.protocol}://${req.get("host") + req.originalUrl}`;
};
const isMultipart = (headers) => {
  const contentTypeHeader = headers["content-type"] || headers["Content-Type"];
  if (!contentTypeHeader) return false;
  else return contentTypeHeader.includes("multipart");
};
const getMultipartData = (fields, files) => {
  let multipartData = {};

  if (Object.keys(fields).length !== 0) {
    Object.entries(fields).forEach(([key, value]) => {
      multipartData[key] = value;
    });
  }
  if (Object.keys(files).length !== 0) {
    Object.entries(files).forEach(([key, value]) => {
      multipartData[key] = value;
    });
  }

  return multipartData;
};

const logRequest = async (request, express = true) => {
  let session, direction, method, url, headers, body;
  session = request.headers.session;
  method = request.method.toUpperCase();
  url = request.url;
  headers = request.headers;

  if (express) {
    direction = "Nuxt -> Express";
    url = getExpressFullUrl(request);
    body = getMultipartData(request.fields, request.files);
  } else {
    direction = "Express -> AI";
    body = "restream Nuxt request data";
  }

  if (!isMultipart(headers)) body = request.data;

  console.log(direction);
  console.log(` ${method} REQUEST ${url}\n`);

  let log = {
    session,
    type: "REQUEST",
    direction,
    method,
    url,
    headers,
    body,
    // time
  };
  logger.trace(log);
  // logger.trace(request);
  return request;
};

const logResponse = (response, express = true) => {
  let session, direction, method, url, status, headers, body;
  // express && console.log(response.req.body);
  if (express) {
    session = response.req.session;
    direction = "Express -> Nuxt";
    method = response.req.method.toUpperCase();
    status = response.statusCode;
    url = getExpressFullUrl(response.req);
    headers = response.getHeaders();
    body = "restream AI response data";
  } else {
    session = response.request.getHeaders().session;
    direction = "AI -> Express";
    method = response.config.method.toUpperCase();
    status = response.status;
    url = response.config.url;
    headers = response.headers;
    body = response.data;
  }
  if (!isMultipart(headers)) {
    if (express) body = response.data;
    else body = response.data;
  }
  console.log(direction);
  console.log(` ${method} RESPONSE ${status} ${url}\n`);

  if (!isMultipart(headers)) {
    if (express) body = response.req.resBody;
    else body = response.data;
  }

  let log = {
    session,
    type: "RESPONSE",
    direction,
    method,
    url,
    status,
    headers,
    body,
    // time
  };

  logger.trace(log);
  // logger.trace(response);
  return response;
};

module.exports = { logRequest, logResponse };
