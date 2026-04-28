import express, { Request, Response } from "express";

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req: Request, res: Response)=> {
    return res.render("index");
});

app.listen(3000, () => {
    console.log("Server started at http://localhost:3000")
});