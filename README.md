# facebook-group-member-scraper

Node/Puppeteer script to scrape facebook groups and return users who match RegEx in a .csv or .json file. **Successfully Scraped 55k+ Member Groups**

**Instructions:**

1. Clone repo and navigate to the "api" folder. Frontend is just React Source Code

2. Run "npm i" to install packages

3. Set credentials for FaceBook account in .env.local

4. Verify that the "pathToBrowserExecutable" variable in the "api/api.js" file is the correct path.

5. Run "npm run dev" to start the server. The server by default uses port :3000 at localhost:3000 . You can change this, and the whitelisted urls in "index.js"

6. Open the url http://localhost:3000 in your browser, enter the facebook group url (EG: https://www.facebook.com/groups/000000000000000/) and the RegEx to test for below.

7. Hit the "Scrape" button and wait until done, .csv file with contents will be generated in the "outputs" folder.

8. Settings can be found in "api/api.js"

