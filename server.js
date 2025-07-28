import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import { dirname, sep } from "path";
import { fileURLToPath } from "url";
import { createSemesterPage, createCoursePage } from "./notion_api_functions.js";

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

app.get("/", (req, res) => {
    res.redirect("/add-semester");
});

app.get("/add-semester", (req, res) => {
    res.sendFile(__dirname + "/public/add_semester.html");
});

app.post("/add-semester", (req, res) => {
    console.log("Received semester data:", req.body);
    // task 1: create a new semester page in Notion
    createSemesterPage(req.body.semester, req.body.courses);

    // task 2: create course pages in Notion
    req.body.courses.forEach(course => {
        createCoursePage(req.body.semester, course);
    });
    // task 3: render a confirmation page
    res.render("added_semester.ejs", 
                { semester_num: req.body.semester, num_courses: req.body.numCourses });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

