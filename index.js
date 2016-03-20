var express = require("express");
var app = express();

app.use(express.static("public"));

app.use(function (req, res, next) {
    console.log("Got a request");
    next();
});

app.listen(8085, function () {
    console.log("Listening on port 8085");
});
