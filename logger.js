const pino = require("pino");

const fileTransport = pino.transport({
  target: "pino-pretty",
  options: { destination: `./http.log` },
});
const loggerHttp = require("pino-http")(
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

const logRequest = (request) => {
  let log = {
    type: "REQUEST",
    method: request.method?.toUpperCase(),
    url: request.url,
    // body: request.data,
    headers: request.headers,
  };
  if (request.get) {
    log = {
      session: request.get("session"),
      ...log,
    };
  }
  // logger.trace(log);
  logger.trace(request);
  return request;
};

const logResponse = (response) => {
  // console.log("RESPONSE", response._header);
  let log = {
    type: "RESPONSE",
    status: response.statusCode,
    headers: response.headers,
    body: response.data,
  };
  // if (response.get) {
  //   log = {
  //     session: response.get("session"),
  //     ...log,
  //   };
  // }
  // logger.trace(log);
  logger.trace(response);
  return response;
};

module.exports = { logRequest, logResponse, loggerHttp };
