import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import { dirname, sep } from "path";
import { fileURLToPath } from "url";

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
    res.sendFile(__dirname + "/public/add_semester.html");
});

app.post("/add-semester", (req, res) => {
    console.log("Received semester data:", req.body);
    res.status(200).json(req.body);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(__dirname);
});

export default app;
