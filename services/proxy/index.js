const express = require("express");
const proxy = require("express-http-proxy");
const cors = require("cors");
const { expressjwt: jwt } = require("express-jwt");

const config = require("../../pkg/config");

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));

app.use(
  jwt({
    secret: config.getSection("security").jwt_secret,
    algorithms: ["HS256"],
  }).unless({
    path: [
      "/api/v1/auth/login",
      "/api/v1/auth/register",
      "/api/v1/auth/refreshToken",
      "/api/v1/auth/forgotPassword",
      "/api/v1/auth/resetPassword"
    ],
  })
);

app.use(function (err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    res.status(401).send("Invalid token...");
  } else {
    next(err);
  }
});

app.use(
  "/api/v1/storage",
  proxy("http://127.0.0.1:10001", {
    proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
      proxyReqOpts.headers.id = srcReq.auth.id;
      return proxyReqOpts;
    },
    limit: '5mb',
    proxyReqPathResolver: (req) => {
      const path = `/api/v1/storage${req.url}`;
      console.log("[Proxy] Forwarding to:", path);
      console.log("reqUrl", req.url)
      return path;
    },
  })
);
// http://localhost:3000/api/v1/storage

app.use(
  "/api/v1/auth",
  proxy("http://127.0.0.1:10002", {
    proxyReqPathResolver: (req) => {
      const path = `/api/v1/auth${req.url}`;
      console.log("[Proxy] Forwarding to:", path);
      console.log("reqUrl", req.url)
      return path;
    },
  })
);
// http://localhost:3000/api/v1/auth

app.use(
  "/api/v1/posts",
  proxy("http://127.0.0.1:10003", {
    proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
      proxyReqOpts.headers.id = srcReq.auth.id;
      return proxyReqOpts;
    },
    proxyReqPathResolver: (req) => {
      const path = `/api/v1/posts${req.url}`;
      console.log("[Proxy] Forwarding to:", path);
      console.log("reqUrl", req.url)
      return path;
    },
  })
);
// http://localhost:3000/api/v1/posts

app.use(
  "/api/v1/cars",
  proxy("http://127.0.0.1:10004", {
    proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
      proxyReqOpts.headers.id = srcReq.auth.id;
      return proxyReqOpts;
    },
    proxyReqPathResolver: (req) => {
      const path = `/api/v1/cars${req.url}`;
      console.log("[Proxy] Forwarding to:", path);
      console.log("reqUrl", req.url)
      return path;
    },
  })
);

// http://localhost:3000/api/v1/cars

const PORT = process.env.PORT || config.getSection("services").proxy.port;

app.listen(PORT, (err) => {
  if (err) {
    console.log(err);
    return err;
  }
  console.log("Service [proxy] successfully started on port", PORT);
});
