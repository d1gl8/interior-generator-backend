require("dotenv").config();
const axios = require("axios");

const outFetch = axios.create({
  baseURL: process.env.API_PRODUCTION_URL + "/api",
  //   timeout: 3000,
  // headers: {'X-Custom-Header': 'foobar'}
});

module.exports = { outFetch };
