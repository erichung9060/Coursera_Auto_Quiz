## How to use
1. Download this repository and unzip it.
2. (Optional) Create an API key from [here](https://aistudio.google.com/app/apikey) and paste it into config.js. This will allow the extension to use AI answers to improve the accuracy rate.
3. (Optional) Build your own database using MongoDB and using Node.js to run a web API([Source code](https://github.com/erichung9060/Coursera_MongoDB_Web_API)). Finally, paste the web API address and password into config.js.
4. Load the extension into Chrome (chrome://extensions/)
5. Go go a Coursera quiz page and click this extension. You will see suggested answers, and you can click either "Fill" to select the options or "Fill and Submit" to automatically choose and submit the answers.

## Feature
1. You can change the answer to your choice. If it's correct, the extension will record it.
2. When you click the "Fill" or "Fill and Submit" button, this extension will replace your original answer. Please note that if you want to modify your original answer, do so after clicking the button.
3. If it shows ✅, it means this is the correct answer. On the other hand, ⚠️ indicates that the answer is uncertain.
4. You can load the "View Feedback" page, and this extension will learn the correct answers from it. Please wait until the extension shows the correct answers before exiting the page.

## Troubleshooting
1. If the suggested answers don't show on the pop-up page within 3 seconds, please reload the page.
