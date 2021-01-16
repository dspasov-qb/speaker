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

var started = false;
var hint = document.querySelector('#hint');
var resultText = document.querySelector('#result');

document.body.onclick = function() {
  if (started === false) {
    started = true;
    recognition.start();
    hint.textContent = 'Listening ...'
  } else {
    recognition.stop();
    started = false;
  }
}

recognition.onresult = function(event) {
  var lastResult = event.results[event.results.length - 1][0];
  var result = lastResult.transcript.toLowerCase().trim();

  var node = document.createElement("P");                 // Create a <li> node
  var textnode = document.createTextNode(result);         // Create a text node
  node.appendChild(textnode);                              // Append the text to <li>
  resultText.appendChild(node);
  hint.textContent = "Click to start";

}

recognition.onspeechend = function() {
  console.log('stop');
  recognition.stop();
}

recognition.onnomatch = function(event) {
  hint.textContent = "I didn't recognise that result.";
}

recognition.onerror = function(event) {
  hint.textContent = 'Error occurred in recognition: ' + event.error;
}
