// Synthesis
var synth = window.speechSynthesis;
// Recognition
var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
var grammar = "#JSGF V1.0;";
var recognition = new SpeechRecognition();
var speechRecognitionList = new SpeechGrammarList();
speechRecognitionList.addFromString(grammar, 1);
recognition.grammars = speechRecognitionList;
recognition.continuous = false;
recognition.lang = "en-US";
recognition.interimResults = false;
recognition.maxAlternatives = 1;

const urlParams = new URLSearchParams(window.location.search);
var hook = urlParams.get("hook");

var listening = false;
var mic = document.querySelector("#mic");
var resultText = document.querySelector("#result");
var url = "https://5e8c8104e61fbd00164aed46.mockapi.io/pipelines/speak";

function speak(text) {
  if (synth.speaking) {
    console.error("speechSynthesis.speaking");
    return;
  }
  var utterThis = new SpeechSynthesisUtterance(text);
  synth.speak(utterThis);
}

function appendParagraph(text, type = "speech") {
  var node = document.createElement("P");
  var textnode = document.createTextNode(text);
  node.appendChild(textnode);
  node.classList.add(type);
  resultText.appendChild(node);
}

function processResponse(data) {
  var respond = "No response";
  if ("speech_synthesize" in data) {
    respond = data.speech_synthesize;
  }

  speak(respond);
  appendParagraph(respond, "response");
}

async function triggerHook(payload = {}) {
  const prompt = window.confirm(`Send ${payload.speech_recognised} ?`);
  if (prompt) {
    fetch(hook || url, {
      method: "POST",
      mode: hook ? "no-cors" : "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        processResponse(data);
      })
      .catch((error) => {
        speak(error);
        appendParagraph(error, "error");
      });
  }
  else{
    appendParagraph("Not Sent");
  }
}

mic.onclick = function () {
  if (listening === false) {
    listening = true;
    mic.classList.add("active");
    recognition.start();
  } else {
    recognition.stop();
    listening = false;
    mic.classList.remove("active");
  }
};

recognition.onresult = function (event) {
  var lastResult = event.results[event.results.length - 1][0];
  var result = lastResult.transcript.toLowerCase().trim();

  appendParagraph(result);
  triggerHook({ speech_recognised: result });
};

recognition.onspeechend = function () {
  listening = false;
  recognition.stop();
  mic.classList.remove("active");
};

recognition.onnomatch = function (event) {
  appendParagraph("I didn't recognise this.", "error");
};

recognition.onerror = function (event) {
  appendParagraph("Error occurred in recognition: " + event.error, "error");
};
