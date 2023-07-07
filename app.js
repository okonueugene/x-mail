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
      // Redirect to filters page
      window.location.href = "/filters";
    } else {
      alert("Failed to save authentication data.");
      form.reset();
    }
  });
});
