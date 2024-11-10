var Statements = []
var Options = []
var Feedback = []
var MultiChoice = []
var UserChoice = []
var useAIanswer = false
var useDBanswer = false
var Url = ""

importScripts('config.js');

function getStorageData(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get([key], function (result) {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            resolve(result[key]);
        });
    });
}

function setStorageData(key, data) {
    return new Promise(async (resolve, reject) => {
        let storageData = await getStorageData(key);
        if (sameArray(data, storageData)) return resolve(false);

        chrome.storage.local.set({ [key]: data }, function () {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            console.log("Stored to Local : ", data)
            resolve(true);
        });
    });
}

function deleteCurrent() {
    chrome.storage.local.remove(Statements);
}

function sameArray(arr1, arr2) {
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
    if (arr1.length !== arr2.length) return false;

    for (let i = 0; i < arr1.length; i++) {
        const isArr1ElementArray = Array.isArray(arr1[i]);
        const isArr2ElementArray = Array.isArray(arr2[i]);

        if (isArr1ElementArray && isArr2ElementArray) {
            if (!sameArray(arr1[i], arr2[i])) {
                return false;
            }
        } else if (isArr1ElementArray !== isArr2ElementArray || arr1[i] !== arr2[i]) {
            return false;
        }
    }
    return true;
}

function emptyArray(arr) {
    if (!arr.length) return true;
    for (let item of arr) {
        if (typeof item == 'boolean') return false;
        if (item.length) return false;
    }
    return true;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (API_KEY == "Your_Gooele_Gemini_API_Key") useAIanswer = false;
    else useAIanswer = true;

    if (DB_API_URL == "Your_DB_Address") useDBanswer = false;
    else useDBanswer = true;

    if (request.header == "sent questions") {
        processing_data(request.Statements, request.Options, request.MultiChoice, request.UserChoice, request.Feedback, request.Url)
        sendResponse({ status: "successfully get questions" });
    } else if (request.header == "get questions") {
        sendResponse({ Statements: Statements, Options: Options, MultiChoice: MultiChoice });
    } else {
        sendResponse({ status: "unknown header" });
    }
});

async function processing_data(statements, options, multiChoice, userChoice, feedback, url) {
    Url = url

    let need_processing_questions = true;
    if (emptyArray(multiChoice)) need_processing_questions = false;
    if (sameArray(statements, Statements) && sameArray(options, Options)) need_processing_questions = false;

    if (sameArray(statements, Statements)) { // same question
        if (!emptyArray(options)) Options = JSON.parse(JSON.stringify(options));
        if (!emptyArray(multiChoice)) MultiChoice = JSON.parse(JSON.stringify(multiChoice));
        if (!emptyArray(userChoice)) UserChoice = JSON.parse(JSON.stringify(userChoice));

    } else { // different question
        Statements = JSON.parse(JSON.stringify(statements));
        Options = JSON.parse(JSON.stringify(options));
        MultiChoice = JSON.parse(JSON.stringify(multiChoice));
        UserChoice = JSON.parse(JSON.stringify(userChoice));
    }

    let need_processing_answers = true;
    if (emptyArray(feedback) || emptyArray(UserChoice)) need_processing_answers = false;
    if (sameArray(feedback, Feedback)) need_processing_answers = false;

    Feedback = JSON.parse(JSON.stringify(feedback));

    if (need_processing_answers) await processing_answers();
    if (need_processing_questions) await processing_questions();
}


async function processing_questions() {
    console.log("--------------------processing_questions--------------------");

    for (let i = 0; i < Statements.length; i++) {
        console.log("Load Q" + (i + 1));

        let storageData = await getStorageData(Statements[i]);
        if (storageData && storageData[0].startsWith("Correct:")) continue; // has correct answer

        if (useDBanswer) {
            let DBAnswer = await queryDB(Statements[i]);
            if (DBAnswer) {
                console.log("Store Q" + (i + 1) + " by DB");
                await setStorageData(Statements[i], DBAnswer);
                continue;
            }else{
                console.log("Not found in DB");
            }
        }
        if (storageData) continue;

        if (useAIanswer && MultiChoice[i][0] != true) { // fill-in or singleChoice question
            console.log("Store Q" + (i + 1) + " by AI");
            let AI_Answer = await askAI(Statements[i], Options[i], MultiChoice[i][0]);
            await setStorageData(Statements[i], AI_Answer);
        } else { // multiChoice
            console.log("Store Q" + (i + 1));
            await setStorageData(Statements[i], Options[i]);
        }
    }
}

async function processing_answers() {
    console.log("--------------------processing_answers--------------------");

    for (let i = 0; i < Feedback.length; i++) {
        if (MultiChoice[i][0] == null) continue;

        let storageData = await getStorageData(Statements[i]);
        if (!storageData) storageData = Options[i];

        if (MultiChoice[i][0] == true) { // multiple Choice
            if (Feedback[i].length == 1) { // no answer options
                if (Feedback[i][0].includes("Correct")) {

                    let new_answer = UserChoice[i].map(str => "Correct:" + str);
                    console.log("Q" + (i + 1) + " Get correct answer");
                    let insert_suc = await setStorageData(Statements[i], new_answer);
                    if (insert_suc) await insertDB(Statements[i], new_answer);

                } else if (Feedback[i][0].includes("Incorrect")) {

                    new_answer = Options[i];
                    if (new_answer.length > 1 && useAIanswer) {
                        console.log("Q" + (i + 1) + " Update answer by AI");
                        let AI_Answer = await askAI(Statements[i], new_answer, MultiChoice[i][0]);
                        
                        await setStorageData(Statements[i], AI_Answer);
                    } else {
                        console.log("Q" + (i + 1) + " Update answer");
                        await setStorageData(Statements[i], new_answer);
                    }
                }

            } else { // partical correct
                let new_answer = []
                for (let j = 0; j < Feedback[i].length; j++) {
                    if (Feedback[i][j].includes("Correct")) {
                        new_answer.push(UserChoice[i][j]);
                    }
                }
                new_answer = new_answer.map(str => "Correct:" + str);
                console.log("Q" + (i + 1) + " Get correct answer");
                let insert_suc = await setStorageData(Statements[i], new_answer);
                if (insert_suc) await insertDB(Statements[i], new_answer);
            }

        } else if (MultiChoice[i][0] == false) {
            if (Feedback[i][0].includes("Correct")) {

                let new_answer = UserChoice[i].map(str => "Correct:" + str);
                console.log("Q" + (i + 1) + " Get correct answer");
                let insert_suc = await setStorageData(Statements[i], new_answer);
                if (insert_suc) await insertDB(Statements[i], new_answer);

            } else if (Feedback[i][0].includes("Incorrect")) {
                let new_answer = storageData.filter(item => item !== UserChoice[i][0]);

                if (new_answer.length == 1) {
                    new_answer = new_answer.map(str => "Correct:" + str);
                    console.log("Q" + (i + 1) + " Get correct answer");
                    let insert_suc = await setStorageData(Statements[i], new_answer);
                    if (insert_suc) await insertDB(Statements[i], new_answer);

                } else if (useAIanswer) {
                    console.log("Q" + (i + 1) + " Update answer by AI");
                    let AI_Answer = await askAI(Statements[i], new_answer, MultiChoice[i][0]);
                    await setStorageData(Statements[i], AI_Answer);

                } else {
                    console.log("Q" + (i + 1) + " Update answer");
                    await setStorageData(Statements[i], new_answer);

                }
            }
        } else if (MultiChoice[i][0] == "fill-in") {
            if (Feedback[i][0].includes("Correct")) {

                let new_answer = UserChoice[i].map(str => "Correct:" + str);
                console.log("Q" + (i + 1) + " Get correct answer");
                let insert_suc = await setStorageData(Statements[i], new_answer);
                if (insert_suc) await insertDB(Statements[i], new_answer);

            } else if (Feedback[i][0].includes("Incorrect")) {

                if (useAIanswer) {
                    console.log("Q" + (i + 1) + " Update answer by AI");
                    let AI_Answer = await askAI(Statements[i], Options[i], MultiChoice[i][0]);
                    await setStorageData(Statements[i], AI_Answer);
                } else {
                    console.log("Q" + (i + 1) + " Update answer");
                    await setStorageData(Statements[i], "unknown");
                }

            }
        }
    }

    setTimeout(() => {
        Feedback = []
        console.log("reset answer")
    }, 3000);
}



async function askAI(statement, options, multichoice, retry = 1) {
    let message = statement + "\n"

    if (typeof multichoice == 'boolean') {
        for (let i = 0; i < options.length; i++) {
            message += "options" + i + " : " + options[i] + "\n";
        }
        if (multichoice) message += "This is a multiple-choice question; you can choose multiple answers.\n";
        message += "Only output the number of the correct options; do not explain.\n"
    } else {
        message += "This is a fill-in question. Just tell me the final answer. Don't output other symbols, and don't explain.\n";
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

    const body = {
        contents: [
            {
                parts: [
                    { text: message }
                ]
            }
        ],
    };
    
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    try {
        const data = await response.json();
        console.log(data)
        const AIrespone = data.candidates[0].content.parts[0].text.trim()

        let new_options = []
        if (multichoice == 'fill-in') {
            new_options.push(AIrespone);

        } else if (multichoice) {
            let index = AIrespone.split(',').map(item => parseInt(item.trim(), 10));
            for (let idx of index) {
                if (!isNaN(idx) && 0 <= idx && idx < options.length) {
                    new_options.push(options[idx]);
                }
            }
        } else {
            let idx = parseInt(AIrespone, 10)

            new_options = options.slice();
            if (!isNaN(idx) && 0 <= idx && idx < options.length) {
                let AIanswer = new_options.splice(idx, 1)[0];
                new_options.unshift(AIanswer);
            }
        }
        return new_options;
    } catch (error) {
        console.error('Error:', error);

        if (retry >= 5) {
            if (multichoice == 'fill-in') options = ["unknown"]
            return options;
        } else {
            await delay(retry * 2000);
            return await askAI(statement, options, multichoice, retry + 1);
        }

    }
}

async function queryDB(statement) {
    try {
        const response = await fetch(`${DB_API_URL}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question: statement,
                password: DB_PASSWORD,
                url: Url
            }),
            signal: AbortSignal.timeout(3000)
        });
        const data = await response.json();

        if (!response.ok) {
            console.error(`DB HTTP error! status: ${response.status}`, data);
            console.log(data);

            return null;
        } else if (data.answer) {
            return await JSON.parse(data.answer);
        } else {
            return null;
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

async function insertDB(statement, answer) {
    try {
        const response = await fetch(`${DB_API_URL}/insert`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question: statement,
                answer: JSON.stringify(answer),
                password: DB_PASSWORD,
                url: Url
            }),
            signal: AbortSignal.timeout(3000)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`DB HTTP error! status: ${response.status}`, data);
            return false;
        } else {
            console.log("Stored to DB : ", data)
            return true;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
