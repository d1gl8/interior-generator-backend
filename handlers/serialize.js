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

module.exports = { getExpressFullUrl, isMultipart, getMultipartData };

// const reqInfo = (req) => {
//   console.log("url", req.url);
//   console.log("params", req.params);
//   console.log("query", req.query);
//   console.log("route", req.route);
//   console.log("cookies", req.cookies);
//   console.log("headers", req.headers);
//   console.log("accepts", req.accepts);
//   console.log("ip", req.ip);
//   console.log("hostname", req.hostname);
//   console.log("path", req.path);
//   console.log("xhr", req.xhr);
//   console.log("protocol", req.protocol);
//   console.log("secure", req.secure);
// };
