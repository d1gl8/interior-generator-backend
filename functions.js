const reqInfo = (req) => {
  console.log("url", req.url);
  console.log("params", req.params);
  console.log("query", req.query);
  console.log("route", req.route);
  console.log("cookies", req.cookies);
  console.log("headers", req.headers);
  console.log("accepts", req.accepts);
  console.log("ip", req.ip);
  console.log("hostname", req.hostname);
  console.log("path", req.path);
  console.log("xhr", req.xhr);
  console.log("protocol", req.protocol);
  console.log("secure", req.secure);
};

const errorHandler = (res, err) => {
  console.error("---------- ERROR ----------", err);
  res.status(500).send(err.toString());
};

module.exports = { reqInfo, errorHandler };
