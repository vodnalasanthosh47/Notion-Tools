import express from "express";
import morgan from "morgan";
import { dirname, sep } from "path";
import dotenv from 'dotenv';
import { fileURLToPath } from "url";
import { promises as fs } from 'fs';
import { checkIfENVIsSetup, createSemesterPage, createCoursePage, checkIfSemesterExists, createNotionClient, getBlockChildren, extractAcads_and_Semester_PageIDs, updateCGPA } from "./notion_api_functions.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 3000;
var notionClient = null;
if (checkIfENVIsSetup()) {
    notionClient = createNotionClient();
}

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
    var ENV_Setup = checkIfENVIsSetup();
    if (!ENV_Setup) {
        console.log("Environment variables not set up. Redirecting to /setup");
        return res.redirect("/setup");
    }
    res.sendFile(__dirname + "/public/home.html");
});

app.get("/add-semester", (req, res) => {
    res.sendFile(__dirname + "/public/add_semester.html");
});

app.get("/setup", (req, res) => {
    res.render("setup.ejs");
});

app.post("/setup-form", async (req, res) => {
    var secrets = "";
    var successful;

    var initial_secrets = `\NOTION_API_KEY="${req.body.notionToken}"`;
    initial_secrets += `\nNOTION_PARENT_LINK="${req.body.notionDatabaseLink}"`;
    if (req.body.unsplashAccessKey) initial_secrets += `\nUNSPLASH_ACCESS_KEY="${req.body.unsplashAccessKey}"`;
    if (req.body.unsplashSecretKey) initial_secrets += `\nUNSPLASH_SECRET_KEY="${req.body.unsplashSecretKey}"`;
    await fs.writeFile('secrets.env', initial_secrets, 'utf8');
    dotenv.config({ path: './secrets.env', override: true });
    try {
        const response = await extractAcads_and_Semester_PageIDs(req.body.notionDatabaseLink);
        successful = true;

        var secrets = "";
        secrets += `\nACADS_DATABASE_ID="${response[1]}"`;
        secrets += `\nSEMESTER_VIEW_DATABASE_ID="${response[0]}"`;
    }
    catch (error) {
        console.error('Error during setup:', error);
        successful = false;
    }
    finally {
        await fs.appendFile('secrets.env', secrets, 'utf8');
        dotenv.config({ path: './secrets.env', override: true });
    }

    if (!successful) {
        res.render("setup.ejs", { isFormSuccessful: "no" });
    }
    else {
        res.render("setup.ejs", { isFormSuccessful: "yes" });
    }
});

app.post("/add-semester-form", async (req, res) => {
    // defining error catching variables
    var semesterAlreadyExists = false;
    var semesterCreated = false;
    var numCoursesAdded = 0;
    var coursesAdded = [];

    // task 1: create a semester page in Notion if it doesn't already exist
    try {
        // Check if the semester already exists
        semesterAlreadyExists = await checkIfSemesterExists(req.body.semester, notionClient);
        if (!semesterAlreadyExists) {
            await createSemesterPage(req.body.semester, req.body.courses, notionClient);
            semesterCreated = true;
        }
        else {
            console.log(`Semester ${req.body.semester} already exists. Not creating a new semester page.`);
        }
    }
    catch (error) {
        console.error('Error adding semester:', error);
        return res.status(500).render("added_semester.ejs", 
                                        {semesterAlreadyExists: false,
                                        semesterCreated: false,
                                        numCoursesAdded: 0,
                                        numCoursesFailedToAdd: req.body.courses.length,
                                        coursesAdded: [],
                                        errorMessage: error.message
                                        }
        );
    }

    var errorMessages = [];

    // task 2: create course pages in Notion
    if (req.body.courses !== undefined) {
        console.log(req.body);
        for (const course of req.body.courses) {
            try {
                var isPageCreated = await createCoursePage(req.body.semester, course, notionClient);
                console.log("isPageCreated:", isPageCreated);
                if (isPageCreated) {
                    numCoursesAdded++;
                    coursesAdded.push(course.name);
                }
            } catch (error) {
                console.error('Error creating course page of ' + course.name + ':', error);
                errorMessages.push('Error creating course page of ' + course.name + ': ' + error.message);
            }
        }
    }
    // task 3: render a confirmation page
    var numCoursesSent = (req.body.courses === undefined) ? 0 : req.body.courses.length;
    res.render("added_semester.ejs", 
                {semesterAlreadyExists: semesterAlreadyExists,
                 semesterCreated: semesterCreated,
                 numCoursesAdded: numCoursesAdded,
                 numCoursesFailedToAdd: numCoursesSent - numCoursesAdded,
                 coursesAdded: coursesAdded,
                 errorMessage: errorMessages.join(';\n')
                });
});

app.get("/calculate-cgpa", async (req, res) => {
    res.render("calculated_cgpa.ejs");
});

app.post("/calculate-cgpa", async (req, res) => {
    let { overallCGPA, semesterWideData } = await updateCGPA(notionClient);
    res.render("calculated_cgpa.ejs", { overallCGPA: overallCGPA, semesterWideData: semesterWideData });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

