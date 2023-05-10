const pino = require("pino");

const fileTransport = pino.transport({
  target: "pino-pretty",
  options: { destination: `./logs/http.log` },
});

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
  fileTransport
);

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
  // console.log(request);
  const direction = express
    ? "Request Nuxt to Express"
    : "Request Express to AI";

  const isMultipart =
    request.headers["content-type"]?.includes("multipart") ||
    request.headers["Content-Type"]?.includes("multipart");

  let log = {
    session: request.headers.session,
    direction,
    method: request.method?.toUpperCase(),
    url: request.url,
    body: (() => {
      if (!isMultipart) return request.data;
      else {
        return express
          ? getMultipartData(request.fields, request.files)
          : "stream from Nuxt request data";
      }
    })(),
    headers: request.headers,
  };
  logger.trace(log);
  // logger.trace(request);
  return request;
};

const logResponse = (response, express = true) => {
  // console.log(response);
  const direction = express
    ? "Response Express to Nuxt"
    : "Response AI to Express";
  let log = {
    // session: response.headers.session,
    direction,
    status: response.statusCode,
    headers: response.headers,
    body: express ? "stream from AI response data" : response.data,
  };
  logger.trace(log);
  // logger.trace(response);
  return response;
};

module.exports = { logRequest, logResponse };
