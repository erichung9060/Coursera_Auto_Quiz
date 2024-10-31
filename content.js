let Options = []
let Statements = []
let MultiChoice = []
let UserChoice = []
let Feedback = []
let Url = ""

function GetQuestion() {
    var QBlock = document.querySelectorAll('div.rc-FormPartsQuestion.css-1629yt7');
    if (!QBlock.length) QBlock = document.querySelectorAll('div.css-dqaucz');
    if (!QBlock.length) return false;

    QBlock = Array.from(QBlock).filter(function (element) {
        return element.querySelector('div.css-4s48ix');
    });

    Options = []
    Statements = []
    MultiChoice = []
    UserChoice = []
    Feedback = []

    let QCount = 1
    QBlock.forEach(QBlock => {
        let statement = GetStatement(QBlock)
        Statements.push(QCount + statement)

        let options = GetOptions(QBlock, check = false)
        Options.push(options)

        let multiChoice = GetMultiChoice(QBlock)
        MultiChoice.push(multiChoice)

        let userChoice = GetOptions(QBlock, GetUserChoice = true)
        UserChoice.push(userChoice)

        let feedback = GetFeedback(QBlock)
        Feedback.push(feedback)

        QCount++;
    });
    Url = window.location.href.replace(/(attempt|view-attempt|view-feedback|view-submission)$/, '');

    return true;
}

function GetStatement(QBlock) {
    let StatementBlock = QBlock.querySelector('div.css-4s48ix').querySelectorAll('span');

    let statement = "";
    StatementBlock.forEach(span => {
        if (span.querySelectorAll('span').length === 0 && span.innerText != "") {
            statement += span.innerText;
        }
    });
    return statement;
}


function GetMultiChoice(QBlock) {
    let multiChoice = []
    const checkboxes = QBlock.querySelectorAll('input[type="checkbox"]');
    const radio = QBlock.querySelectorAll('input[type="radio"]');

    const fillinbox = QBlock.querySelector('input[type="text"], input[type="number"]');
    const answerfillinbox = QBlock.querySelector('div[data-testid="readOnlyText"], div.css-ou8fzx');

    if (checkboxes.length) multiChoice.push(true);
    else if (radio.length) multiChoice.push(false);
    else if (fillinbox || answerfillinbox) multiChoice.push("fill-in");

    return multiChoice;
}

function GetOptions(QBlock, GetUserChoice) {
    let options = []
    const radios = QBlock.querySelectorAll('input[type="radio"]');
    const checkboxes = QBlock.querySelectorAll('input[type="checkbox"]');
    const fillinbox = QBlock.querySelector('input[type="text"], input[type="number"]');
    const answerfillinbox = QBlock.querySelector('div[data-testid="readOnlyText"], div.css-ou8fzx');

    if (checkboxes.length) {
        checkboxes.forEach(checkbox => {
            const spanText = checkbox.nextElementSibling.innerText;
            if (GetUserChoice) {
                if (checkbox.checked) options.push(spanText);
            } else {
                options.push(spanText);
            }
        });

    } else if (radios.length) {
        radios.forEach(radio => {
            const spanText = radio.nextElementSibling.innerText;
            if (GetUserChoice) {
                if (radio.checked) options.push(spanText);
            } else {
                options.push(spanText);
            }
        });
    } else if (answerfillinbox) {
        if (GetUserChoice) {
            options.push(answerfillinbox.innerText);
        }
    } else if (fillinbox) {
        if (GetUserChoice) {
            if (fillinbox.value.length) options.push(fillinbox.value);
        }
    }
    return options;
}

function GetFeedback(QBlock) {
    let feedback = []
    const GradeFeedback = QBlock.querySelectorAll('div.css-8atqhb');
    GradeFeedback.forEach(answer => {
        const spanText = answer.innerText;
        feedback.push(spanText);
    });
    return feedback;
}


let debounceTimeout = null;

const observer = new MutationObserver(async () => {
    if (!GetQuestion()) return;

    if (debounceTimeout) return;
    debounceTimeout = setTimeout(async () => {
        console.log("Sent Data : ")
        console.log(Statements)
        console.log(Options)
        console.log(MultiChoice)
        console.log(UserChoice)
        console.log(Feedback)
        console.log(Url)
        
        try {
            chrome.runtime.sendMessage({ header: "sent questions", Statements: Statements, Options: Options, MultiChoice: MultiChoice, UserChoice: UserChoice, Feedback: Feedback, Url: Url });
        } catch (error) {
            console.log(error)
        }

        debounceTimeout = null;
    }, 1000);
});

observer.observe(document.body, { childList: true, subtree: true });