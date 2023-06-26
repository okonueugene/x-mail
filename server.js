const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");

// Serve static files from the root folder
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/emails", (req, res) => {
  res.sendFile(path.join(__dirname, "emails.html"));
});
// Parse JSON bodies
app.use(bodyParser.json());
//use fs module
const fs = require("fs");

app.post("/save-authentication", (req, res) => {
  const jsonData = JSON.stringify(req.body, null, 2); // Convert the JSON data to a string

  // Write JSON data to authentication.json or create the file if it doesn't exist
  fs.writeFile("authentication.json", jsonData, { flag: "w" }, (err) => {
    if (err) {
      console.error(err);
      res
        .status(500)
        .send("An error occurred while saving authentication data.");
    } else {
      res.send("Authentication data saved successfully!");
    }
  });
});
// Route to execute ionos.js
app.get("/execute-ionos", (req, res) => {
  const { spawn } = require("child_process");
  const child = spawn("node", ["ionos.js"]);

  child.stdout.on("data", (data) => {
    console.log(`stdout:\n${data}`);
  });

  child.on("close", (code) => {
    console.log(`ionos.js exited with code ${code}`);
    res.status(200).send("ionos.js executed successfully");
  });
});

// Route to empty data.json
app.get("/delete-data", (req, res) => {
  fs.writeFile("data.json", "[]", { flag: "w" }, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send("An error occurred while deleting data.json");
    } else {
      res.status(200).send("data.json deleted successfully");
    }
  });
});

// Route to empty authentication.json
app.get("/delete-authentication", (req, res) => {
  fs.writeFile("authentication.json", "[]", { flag: "w" }, (err) => {
    if (err) {
      console.error(err);
      res
        .status(500)
        .send("An error occurred while deleting authentication.json");
    } else {
      res.status(200).send("authentication.json deleted successfully");
    }
  });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
