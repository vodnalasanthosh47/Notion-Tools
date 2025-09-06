import express from "express";
import morgan from "morgan";
import { dirname, sep } from "path";
import { fileURLToPath } from "url";
import { promises as fs } from 'fs';
import { checkIfENVIsSetup, createSemesterPage, createCoursePage, checkIfSemesterExists, createNotionClient, getBlockChildren, extractAcads_and_Semester_PageIDs } from "./notion_api_functions.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 3000;
const notionClient = createNotionClient();

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
        res.redirect("/setup");
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
    console.log("Setup form submitted:", req.body);
    var secrets = "";
    var successful;
    try {
        const response = await extractAcads_and_Semester_PageIDs(req.body.notionDatabaseLink);
        successful = true;

        secrets += `\nNOTION_TOKEN=${req.body.notionToken}`;
        secrets += `\nNOTION_PARENT_LINK=${req.body.notionDatabaseLink}`;
        secrets += `\nNOTION_ACADS_DATABASE_ID=${response[1]}`;
        secrets += `\nSEMESTER_VIEW_DATABASE_ID=${response[0]}`;
        if (req.body.unsplashAccessKey) secrets += `\nUNSPLASH_ACCESS_KEY=${req.body.unsplashAccessKey}`;
        if (req.body.unsplashSecretKey) secrets += `\nUNSPLASH_SECRET_KEY=${req.body.unsplashSecretKey}`;
    }
    catch (error) {
        console.error('Error during setup:', error);
        successful = false;
    }
    finally {
        await fs.writeFile('secrets.env', secrets, 'utf8');
    }
    
    if (!successful) {
        res.status(500).render("setup.ejs", { anchor: "setup-form", isFormSuccessful: false });
    }
    else {
        res.status(200).render("setup.ejs", { anchor: "setup-form", isFormSuccessful: true });
    }
    
    res.redirect("/add-semester");
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
        req.body.courses.forEach(course => {
            try {
                var isPageCreated = createCoursePage(req.body.semester, course, notionClient);
                if (isPageCreated) {
                    numCoursesAdded++;
                    coursesAdded.push(course.name);
                }
            } catch (error) {
                console.error('Error creating course page of ' + course.name + ':', error);
                errorMessages.push('Error creating course page of ' + course.name + ': ' + error.message);
            }
        });
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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

