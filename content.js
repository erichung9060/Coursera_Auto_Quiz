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


// auto complete reading and video part

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'getHTML') {
      var videoItemId = [];
      var readingItemId = [];
      var ungradedLabItemId = [];
      var dict = {};
      document.querySelectorAll('[data-testid="named-item-list-list"]').forEach(function (aa) {
        aa.querySelectorAll('li').forEach(function (a) {
          var xpathEvaluator = new XPathEvaluator();
          var result = xpathEvaluator.evaluate(
            './div/a',
            a,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          );
          if (!result.singleNodeValue) {
            return;
          }
          dict = JSON.parse(result.singleNodeValue.getAttribute('data-click-value'));
  
          if (dict.href.split('/')[3] === 'lecture') {
            videoItemId.push(dict.href.split('/')[4]);
          }
          if (dict.href.split('/')[3] === 'supplement') {
            readingItemId.push(dict.href.split('/')[4]);
          }
          if (dict.href.split('/')[3] === 'ungradedLab') {
            ungradedLabItemId.push(dict.href.split('/')[4]);
          }
        });
      });
      courseName = JSON.parse(
        document
          .querySelector('[data-testid="named-item-list-list"] li div a')
          .getAttribute('data-click-value')
      ).href.split('/')[2];
      courseId = dict.course_id;
      videoItemId.forEach((id) => {
        fetch(
          `https://www.coursera.org/api/opencourse.v1/user/${userId}/course/${courseName}/item/${id}/lecture/videoEvents/ended?autoEnroll=false`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              authority: 'www.coursera.org',
              accept: '*/*',
              'accept-language': 'en',
              'cache-control': 'no-cache',
              'content-type': 'application/json; charset=UTF-8',
              dnt: '1',
              origin: 'https://www.coursera.org',
              pragma: 'no-cache',
              referer: `https://www.coursera.org/api/opencourse.v1/user/${userId}/course/${courseName}/item/${id}/lecture/videoEvents/ended?autoEnroll=false`,
              'sec-ch-ua': '"Not A(Brand";v="99", "Microsoft Edge";v="121", "Chromium";v="121"',
              'sec-ch-ua-mobile': '?1',
              'sec-ch-ua-platform': '"Android"',
              'sec-fetch-dest': 'empty',
              'sec-fetch-mode': 'cors',
              'sec-fetch-site': 'same-origin',
              'user-agent':
                'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36 Edg/121.0.0.0',
            },
            body: JSON.stringify({
              contentRequestBody: {},
            }),
          }
        )
          .then((response) => response.json())
          .then((data) => console.log(data))
          .catch((error) => console.error('Error:', error));
      });
      readingItemId.forEach((id) => {
        fetch(`https://www.coursera.org/api/onDemandSupplementCompletions.v1`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            authority: 'www.coursera.org',
            accept: '*/*',
            'accept-language': 'en',
            'cache-control': 'no-cache',
            'content-type': 'application/json; charset=UTF-8',
            dnt: '1',
            origin: 'https://www.coursera.org',
            pragma: 'no-cache',
            referer: '',
            'sec-ch-ua': '"Not A(Brand";v="99", "Microsoft Edge";v="121", "Chromium";v="121"',
            'sec-ch-ua-mobile': '?1',
            'sec-ch-ua-platform': '"Android"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent':
              'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36 Edg/121.0.0.0',
          },
          body: JSON.stringify({
            userId: userId,
            courseId: courseId,
            itemId: id,
          }),
        })
          .then((response) => response.json())
          .then((data) => console.log(data))
          .catch((error) => console.error('Error:', error));
      });
      ungradedLabItemId.forEach((id) => {
        const workspaceId = `${userId}~${courseId}~${id}`;
        fetch(`https://www.coursera.org/api/onDemandLearnerWorkspaces.v1/?action=launch&id=${workspaceId}`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            authority: 'www.coursera.org',
            accept: '*/*',
            'accept-language': 'en',
            'cache-control': 'no-cache',
            'content-type': 'application/json; charset=UTF-8',
            dnt: '1',
            origin: 'https://www.coursera.org',
            pragma: 'no-cache',
            referer: '',
            'sec-ch-ua': '"Not A(Brand";v="99", "Microsoft Edge";v="121", "Chromium";v="121"',
            'sec-ch-ua-mobile': '?1',
            'sec-ch-ua-platform': '"Android"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent':
              'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36 Edg/121.0.0.0',
          },
          body: JSON.stringify({
            action: 'launch',
            id: workspaceId,
          }),
        });
      });
      sendResponse('ok');
      setTimeout(function () {
        location.reload();
      }, 1000);
      return true;
    }
  });
  