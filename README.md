## How to Use the Coursera Chrome Extension

### Quiz Auto Fill
1. Download this repository and unzip it.
2. (Optional) Create an API key from [here](https://aistudio.google.com/app/apikey) and paste it into config.js. This will allow the extension to use AI answers to improve the accuracy rate.
3. (Optional) Build your own database using MongoDB and using Node.js to run a web API([Source code](https://github.com/erichung9060/Coursera_MongoDB_Web_API)). After that, paste the web API address and password into config.js.
4. Load the extension into Chrome (chrome://extensions/)
5. Go go a Coursera quiz page and open the extension. You will see suggested answers. You can click either `Fill` to auto select the options or `Fill and Submit` to auto select and submit the answers. Alternatively, you can trigger it by `Cmd + Shift + 0`.

### Video & Reading Auto-Complete
1. Find your UserId by following the instruction in [config.js](./config.js)
2. Open Coursera pages containing videos or reading lists, such as the example shown below.
![image](https://i.imgur.com/2jAwILD.png)
1. use `Cmd + Shift + 1` to trigger auto-complete videos and readings, or click the corresponding button in the extension.

## Features
1. You can change the answer to your choice. If it's correct, the extension will save it.
2. When you click the `Fill` or `Fill and Submit` button, this extension will replace your original answer. Please note that if you want to modify your original answer, do so after auto-fill the answers.
3. If it shows ✅, it means this is the correct answer. On the other hand, ⚠️ indicates that the answer is uncertain (answer by AI).
4. You can load the `View Feedback` page of previous quiz. The extension will record the correct answers from it.

## Contributors

1. Thanks, [Owen](https://github.com/owenowenisme), for merging the [Coursera-Auto-Complete](https://github.com/owenowenisme/Coursera-Auto-Complete).
2. Thanks, [Peter](https://github.com/peterxcli), for developing support for auto-completing ungraded lab items.

## Troubleshooting
1. If the suggested answers don't show on the pop-up page within 3 seconds, please reload the page.

## TODO
1. Add a delay after user clicks Fill or Submit until all questions receive a response from the AI.
2. Automatically retrive the answer instead of loading the view-feedback page.
