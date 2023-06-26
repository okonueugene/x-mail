const { chromium } = require("playwright");

const MAX_RETRIES = 3;
const RETRY_DELAY = 3000; // 3 seconds

(async () => {
  let retryCount = 0;

  while (retryCount < MAX_RETRIES) {
    try {
      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto("https://email.ionos.com/");
      // Read email and password from authentication.json
      const fs = require("fs");
      const auth = JSON.parse(fs.readFileSync("authentication.json"));
      console.log(auth);
      // Extract email and password from the auth object
      const { email, password } = auth[0];

      // Fill in login form
      await page.waitForSelector("#login-form > span:nth-child(3) > label");
      await page.type("#login-form > span:nth-child(3) > label", email);
      await page.type("#login-form-password", password);
      await page.locator("button[type=submit]").click();
      // Wait for email list to load
      await page.waitForSelector(".list-view.visible-selection");

      // Extract email information
      const emailList = await page.$$(".list-item.selectable");

      const emails = [];
      for (const [index, email] of emailList.entries()) {
        const subject = await email.$eval(".drag-title", (element) =>
          element.innerText.trim()
        );
        const sender = await email.$eval(".from .person", (element) =>
          element.innerText.trim()
        );
        const date = await email.$eval(".date", (element) =>
          element.getAttribute("datetime").trim()
        );

        await email.click();

        // Wait for the detail pane to load
        await page.waitForLoadState();

        let emailText = "";
        try {
          const frameElement = await page.waitForSelector(".mail-detail-frame");
          const frame = await frameElement.contentFrame();
          emailText = await frame.$eval("body", (element) =>
            element.innerText.trim()
          );
        } catch (error) {
          console.log(
            `Error occurred while retrieving email text: ${error.message}`
          );
        }

        emails.push({
          index,
          subject,
          sender,
          date,
          detailText: emailText
        });
      }

      console.log(emails);

      // const filteredEmails = emails.filter((email) => {
      //   // Read subject and sender from filters.json
      //   const filters = JSON.parse(fs.readFileSync("filters.json"));
      //   const { subject, sender } = filters[0];
      //   console.log(subject, sender);

      //   // Create a regular expression with the sender and subject
      //   const senderRegex = new RegExp(sender, "i");
      //   const subjectRegex = new RegExp(subject, "i");

      //   // Check if the sender or subject is an empty string
      //   const isSubjectEmpty = subject === "";
      //   const isSenderEmpty = sender === "";

      //   // Check if the sender or subject matches the regular expression
      //   const subjectMatch = isSubjectEmpty
      //     ? false
      //     : subjectRegex.test(email.subject);
      //   const senderMatch = isSenderEmpty
      //     ? false
      //     : senderRegex.test(email.sender);
      //   console.log(subjectMatch, senderMatch);

      //   // Update the email object with the match information
      //   email.subjectMatch = subjectMatch;
      //   email.senderMatch = senderMatch;

      //   // Return only emails that (email.subjectMatch && email.senderMatch) ||email.subjectMatch ||email.senderMatch
      //   return (email.subjectMatch && email.senderMatch) || email.subjectMatch;
      // });

      // console.log(filteredEmails);

      // Write filtered emails to data.json file
      const jsonData = JSON.stringify(emails, null, 2);
      fs.writeFile("data.json", jsonData, { flag: "w" }, (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log("Data saved successfully!");
        }
      });
      var ionosScriptExecuted = true;

      await browser.close();
      break;
    } catch (error) {
      console.log(`Error occurred: ${error.message}`);
      retryCount++;
      console.log(`Retrying in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }
})();
