// Synthesis
var synth = window.speechSynthesis;
// Recognition
var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList
var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent
var grammar = '#JSGF V1.0;'
var recognition = new SpeechRecognition();
var speechRecognitionList = new SpeechGrammarList();
speechRecognitionList.addFromString(grammar, 1);
recognition.grammars = speechRecognitionList;
recognition.continuous = false;
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 1;


const urlParams = new URLSearchParams(window.location.search);
var hook = urlParams.get("hook");

var listening = false;
var hint = document.querySelector('#hint');
var resultText = document.querySelector('#result');
var url = 'https://5e8c8104e61fbd00164aed46.mockapi.io/pipelines/speak';

function speak(text){
  if (synth.speaking) {
    console.error('speechSynthesis.speaking');
    return;
  }
  var utterThis = new SpeechSynthesisUtterance(text);
  synth.speak(utterThis);
}

function appendParagraph(text, type='speech') {
  var node = document.createElement("P");
  var textnode = document.createTextNode(text);
  node.appendChild(textnode);
  node.classList.add(type);
  resultText.appendChild(node);
}

function processResponse(data) {
  if ('speech_synthesize' in data) {
    var respond = data.speech_synthesize;
    speak(respond);
    appendParagraph(respond, 'response');
  }
}

async function sendData(payload = {}) {
  fetch(hook, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  }).then(response => {
    if (!response.ok) {
      throw new Error('Response was not ok');
    }
    return response.json();
  })
  .then(data => {
    processResponse(data);
  })
  .catch(error => {
    speak(error);
    appendParagraph(error, 'error');
  });
}

document.body.onclick = function() {
  if (listening === false) {
    listening = true;
    recognition.start();
    hint.textContent = 'Listening ...';
  } else {
    recognition.stop();
    listening = false;
    hint.textContent = "Click to start";
  }
}

recognition.onresult = function(event) {
  var lastResult = event.results[event.results.length - 1][0];
  var result = lastResult.transcript.toLowerCase().trim();

  appendParagraph(result);

  sendData({ speech_recognised: result });

  hint.textContent = "Click to start";
}

recognition.onspeechend = function() {
  recognition.stop();
}

recognition.onnomatch = function(event) {
  hint.textContent = "I didn't recognise this.";
}

recognition.onerror = function(event) {
  hint.textContent = 'Error occurred in recognition: ' + event.error;
}

