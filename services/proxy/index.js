const express = require("express");
const proxy = require("express-http-proxy");
const cors = require("cors");
const { expressjwt: jwt } = require("express-jwt");

const config = require("../../pkg/config");

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));


app.use(express.static('uploads_events'))
app.use(express.static('uploads_users'))

// TBC
app.use(
  jwt({
    secret: config.getSection("security").jwt_secret,
    algorithms: ["HS256"],
  }).unless({
    path: [
      "/api/v1/auth/login",
      "/api/v1/auth/register",
      "/api/v1/auth/forgotPassword",
      "/api/v1/auth/resetPassword",
      { url: '/api/v1/events', methods: ['GET'] },
      { url: /^\/api\/v1\/events\/[0-9a-z]{5,}$/, methods: ['GET'] }
    ]
  })
);

app.use(function (err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    res.status(401).send(`Invalid token...${err}`);
  } else {
    next(err);
  }
});

app.use(
  "/api/v1/upload",
  proxy("http://127.0.0.1:10001", {
    proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
      proxyReqOpts.headers = { ...proxyReqOpts.headers, ...srcReq.auth };
      return proxyReqOpts;
    },
    limit: '10mb', //same as in upload handlers
    proxyReqPathResolver: (req) => {
      const path = `/api/v1/upload${req.url}`;
      console.log("[Proxy] Forwarding to:", path);
      console.log("reqUrl", req.url)
      return path;
    },
  })
);
// http://localhost:8080/api/v1/upload

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
// http://localhost:8080/api/v1/auth

app.use(
  "/api/v1/ecommerce",
  proxy("http://127.0.0.1:10003", {
    proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
      proxyReqOpts.headers = { ...proxyReqOpts.headers, ...srcReq.auth };
      return proxyReqOpts;
    },
    proxyReqPathResolver: (req) => {
      const path = `/api/v1/ecommerce${req.url}`;
      console.log("[Proxy] Forwarding to:", path);
      console.log("reqUrl", req.url)
      return path;
    },
  })
);
// http://localhost:8080/api/v1/ecommerce

app.use(
  "/api/v1/events",
  proxy("http://127.0.0.1:10004", {
    proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
      proxyReqOpts.headers = { ...proxyReqOpts.headers, ...srcReq.auth };
      return proxyReqOpts;
    },
    proxyReqPathResolver: (req) => {
      const path = `/api/v1/events${req.url}`;
      console.log("[Proxy] Forwarding to:", path);
      console.log("reqUrl", req.url)
      return path;
    },
  })
);

// http://localhost:8080/api/v1/events


app.use(
  "/api/v1/users",
  proxy("http://127.0.0.1:10005", {
    proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
      proxyReqOpts.headers = { ...proxyReqOpts.headers, ...srcReq.auth };
      return proxyReqOpts;
    },
    proxyReqPathResolver: (req) => {
      const path = `/api/v1/users${req.url}`;
      console.log("[Proxy] Forwarding to:", path);
      console.log("reqUrl", req.url)
      return path;
    },
  })
);

// http://localhost:8080/api/v1/users

app.listen(config.getSection("services").proxy.port, (err) => {
  if (err) {
    console.log(err);
    return err;
  }
  console.log("Service [proxy] successfully started on port", config.getSection("services").proxy.port);
});
