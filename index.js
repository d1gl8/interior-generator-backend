require("dotenv").config();
const isDev = process.env.NODE_ENV === "dev";
module.exports = { isDev };

const express = require("express");
const cors = require("cors");
const formidableMiddleware = require("express-formidable");
const port = process.env.EXPRESS_PORT;
const router = require("./router");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(formidableMiddleware());

app.use(router);

app.listen(port, () => {
  console.log(`Artixel express server starting on port ${port}`);
});
