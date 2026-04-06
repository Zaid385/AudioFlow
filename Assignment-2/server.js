let express = require("express");

let app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", function (req, res) {
    return res.render("index");
});

app.listen(3000, function () {
    console.log("Server started at http://localhost:30000")
});