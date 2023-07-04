const { chromium } = require("playwright");

const MAX_RETRIES = 3;
const RETRY_DELAY = 3000; // 3 seconds

(async () => {
  let retryCount = 0;
  let continueLoop = true; // Flag to control the loop

  while (retryCount < MAX_RETRIES && continueLoop) {
    try {
      console.time("Time taken");
      console.log("Launching browser...");
      const browser = await chromium.launch({ headless: false });
      const page = await browser.newPage();
      await page.goto("https://email.ionos.com/");

      // Read email and password from authentication.json
      const fs = require("fs");
      const auth = JSON.parse(fs.readFileSync("authentication.json"));
      console.log("Authentication data read successfully!");

      // Extract email and password from the auth object
      const { email, password } = auth[0];
      console.log("Logging in...");

      // Fill in login form
      await page.waitForSelector("#login-form > span:nth-child(3) > label");
      await page.type("#login-form > span:nth-child(3) > label", email);
      await page.type("#login-form-password", password);
      await page.locator("button[type=submit]").click();

      console.log("Logged in successfully!");
      // Wait for email list to load
      await page.waitForSelector(".list-view.visible-selection");

      // Extract email information
      const emails = [];

      const processEmail = async (email, index) => {
        const subject = await email.$eval(".drag-title", (element) =>
          element.innerText.trim()
        );
        // Add a check to ensure the element exists before extracting its value
        const senderElement = await email.$(".from .person");
        const sender = senderElement
          ? await senderElement.innerText()
          : "Sender not found";
        const date = await email.$eval(".date", (element) =>
          element.getAttribute("datetime").trim()
        );

        await email.click();
        await page.waitForLoadState();

        let emailText = "";
        let attachmentText = "";

        try {
          const frameElement = await page.waitForSelector(".mail-detail-frame");
          const frame = await frameElement.contentFrame();
          emailText = await frame.$eval("body", (element) =>
            element.innerText.trim()
          );

          await page.waitForTimeout(1000);

          const hasAttachments = await page.evaluate(() => {
            const attachments = document.querySelector(
              ".attachments .toggle-details"
            );
            return attachments !== null;
          });
          if (hasAttachments) {
            const attachment = await page.$(".attachments .toggle-details");
            await attachment.click();
            await page.waitForLoadState();

            const attachmentList = await page.$$(".inline-items");

            for (const [index, attachment] of attachmentList.entries()) {
              const attachmentTitle = await attachment.$eval(
                ".item",
                (element) => element.getAttribute("title")
              );
              await page.waitForLoadState();
              console.log(attachmentTitle);

              const isResume = (attachmentTitle) => {
                const resumeWords = [
                  /cv/i,
                  /curriculum vitae/i,
                  /letter/i,
                  /resume/i,
                  /vitae/i
                ];
                return resumeWords.some((word) => word.test(attachmentTitle));
              };

              console.log(isResume(attachmentTitle));
              if (isResume(attachmentTitle)) {
                const attachmentButton = await attachment.$(".item");
                await attachmentButton.click();
                await page.waitForLoadState();

                const viewButton = page.getByRole("menuitem", { name: "View" });
                await viewButton.click();
                await page.waitForLoadState();

                await page.waitForSelector(".text-wrapper.user-select-text");
                const attachmentElement = await page.$(
                  ".text-wrapper.user-select-text"
                );
                attachmentText = await attachmentElement.innerText();
                await page.waitForTimeout(2000);

                const closeButton = await page.waitForSelector(
                  "#io-ox-core > div.io-ox-viewer.abs.viewer-dark-theme > div.viewer-toolbar.classic-toolbar-container.align-right > ul > li:nth-child(7) > a"
                );
                await closeButton.click();
                await page.waitForLoadState();
              }
            }
            console.log(attachmentText);
          }
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
          emailText,
          attachmentText: attachmentText || ""
        });
      };

      const processEmails = async () => {
        let emailList = await page.$$(".list-item.selectable");
        let currentIndex = 0;
        const maxEmails = 400;

        while (emailList.length > currentIndex && currentIndex < maxEmails) {
          const email = emailList[currentIndex];
          await processEmail(email, currentIndex);
          currentIndex++;

          if (currentIndex === emailList.length) {
            console.log("Getting more emails...");
            await page.evaluate(() => {
              const lastEmailElement = document.querySelector(
                ".list-item.selectable:last-child"
              );
              lastEmailElement.scrollIntoView();
            });
            await page.waitForTimeout(1000);
            emailList = await page.$$(".list-item.selectable");
          }
        }
      };

      await processEmails();
      console.log(`Total emails retrieved: ${emails.length}`);

      // Check for duplicates
      function removeDuplicates(data) {
        const uniqueItems = [];

        data.forEach((item) => {
          const isDuplicate = uniqueItems.some((uniqueItem) => {
            return (
              uniqueItem.subject === item.subject &&
              uniqueItem.sender === item.sender &&
              uniqueItem.date === item.date &&
              uniqueItem.detailText === item.detailText
            );
          });

          if (!isDuplicate) {
            uniqueItems.push(item);
          }
        });

        return uniqueItems;
      }

      const uniqueItems = removeDuplicates(emails);
      console.log(`Total unique emails retrieved: ${uniqueItems.length}`);

      // Save emails to file data.json
      const data = JSON.stringify(uniqueItems, null, 2);
      fs.writeFileSync("data.json", data);
      console.log("Data saved successfully!");

      // Close the browser
      await browser.close();
      console.log("Browser closed successfully!");
      console.timeEnd("Time taken");
      continueLoop = false;
    } catch (error) {
      console.log(`Error occurred: ${error.message}`);
      retryCount++;
      console.log(`Retrying in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }
})();
