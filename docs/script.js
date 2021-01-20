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

// Variables
const urlParams = new URLSearchParams(window.location.search);
var hookUrl;
var prevTranscript = null;
var listening = false;
var conversation_id = null;
var mic = document.querySelector("#mic");
var resultText = document.querySelector("#result");
var settings = {
  alwaysAsk: true
};
var commands = {
  'alwaysask': () => {
    settings.alwaysAsk = true;
    speakAndWrite('I will always ask for confirmation before sending transcript to the server.');
  },
  'neverask': () => {
    settings.alwaysAsk = false;
    speakAndWrite('I will never ask for confirmation before sending transcript to the server.');
  },
};

// Hook url
try {
  var hookUrl = new URL(window.atob(urlParams.get("hook")));
  if (!(hookUrl.protocol === "http:" || hookUrl.protocol === "https:")) {
    hookUrl = undefined;
    console.warn("Hook is not a valid url");
  }
} catch (e) {
  console.warn(e);
}

function toggleRecognition(switchOn) {
  if (listening === false) {
    listening = true;
    mic.classList.add("active");
    recognition.start();
  } else {
    recognition.stop();
    listening = false;
    mic.classList.remove("active");
  }
}

mic.onclick = toggleRecognition;

function speak(text, listenOnEnd = false) {
  if (synth.speaking) {
    console.error("speechSynthesis.speaking");
    return;
  }
  var utterThis = new SpeechSynthesisUtterance(text);
  if (listenOnEnd) {
    utterThis.onend = function (event) {
      toggleRecognition();
    };
  }
  synth.speak(utterThis);
}

function appendParagraph(text, type = "speech") {
  var node = document.createElement("P");
  var textnode = document.createTextNode(text);
  node.appendChild(textnode);
  node.classList.add(type);
  resultText.appendChild(node);
}

function speakAndWrite(string, type = "response", listenOnEnd = false) {
  speak(string, listenOnEnd);
  appendParagraph(string, type);
}

function processResponse(data) {
  var respond = "No response";
  if ("speech_synthesise" in data) {
    respond = data.speech_synthesise;
  }
  if ("conversation_id" in data) {
    conversation_id = data.conversation_id;
  }

  speakAndWrite(respond);
}

async function triggerHook(payload = {}) {
  if (hookUrl) {
    fetch(hookUrl.href, {
      method: "POST",
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
        speakAndWrite(error.message, 'error');
      });
  } else {
    speakAndWrite("Hook is not a valid url", "error");
  }
}

function confirmTranscript(transcript) {
  if (!prevTranscript) {
    prevTranscript = transcript;
    speakAndWrite(
      `Do you want to send "${transcript}"?`,
      "response",
      true
    );
  } else {
    if (['yes', 'yes please', 'ok', 'send', 'yeah', 'hell yeah'].includes(transcript)) {
      triggerHook({ transcript: prevTranscript, conversation_id });
    } else {
      speakAndWrite("Didn't send it.");
    }
    prevTranscript = null;
  }
}

recognition.onresult = function (event) {
  var lastResult = event.results[event.results.length - 1][0];
  var transcript = lastResult.transcript.toLowerCase().trim();
  appendParagraph(transcript);
  var command = transcript.replace(' ', '');
  if (command in commands) {
    commands[command]();
  } else {
    if (settings.alwaysAsk) {
      confirmTranscript(transcript);
    } else {
      triggerHook({ transcript: transcript, conversation_id });
    }
  }
};

recognition.onspeechend = function () {
  toggleRecognition();
};

recognition.onnomatch = function (event) {
  appendParagraph("I didn't recognise this.", "error");
  toggleRecognition();
};

recognition.onerror = function (event) {
  appendParagraph("Error occurred in recognition: " + event.error, "error");
  toggleRecognition();
};
