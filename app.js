// Creating authentication.json file
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("authForm");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const authData = {
      email: email,
      password: password
    };

    const jsonData = JSON.stringify([authData], null, 2);

    // Send JSON data to server endpoint for file writing
    const response = await fetch("/save-authentication", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: jsonData
    });

    if (response.ok) {
      alert("Authentication data saved successfully!");
      form.reset();
      // Execute ionos.js script via GET request
      fetch("/execute-ionos")
        .then((response) => {
          if (response.ok) {
            console.log("ionos.js executed successfully");
          } else {
            console.error("Failed to execute ionos.js");
          }
        })
        .catch((error) => {
          console.error("An error occurred:", error);
          alert("An error occurred while executing ionos.js");
        });
      //execute post request to empty data.json
      fetch("/delete-data", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      })
        .then((response) => {
          if (response.ok) {
            // Redirect to the emails page after ionos script execution
            window.location.href = "/emails";
          }
        })
        .catch((error) => {
          console.error("An error occurred:", error);
          alert("An error occurred while deleting data.json");
        });
    } else {
      alert("Failed to save authentication data.");
      form.reset();
    }
  });
});
