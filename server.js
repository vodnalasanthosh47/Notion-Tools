import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import { dirname, sep } from "path";
import { fileURLToPath } from "url";
import { test_console_log } from "./notion_api_functions.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 3000;

function separatorMiddleware(req, res, next) {
    console.log("\n\n----------------------------------------");
    next();
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("dev"));
app.use(express.static("public"));
app.use(separatorMiddleware);

app.get("/add-semester", (req, res) => {
    res.sendFile(__dirname + "/public/add_semester.html");
});

app.post("/add-semester", (req, res) => {
    console.log("Received semester data:", req.body);
    res.render("added_semester.ejs", 
                { semester_num: req.body.semester, num_courses: req.body.numCourses });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  test_console_log();
});

