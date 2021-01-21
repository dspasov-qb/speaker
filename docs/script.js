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

var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
var wavesurfer, context, processor;

var myDynamicManifest = {
  "name": "Speaker",
  "short_name": "Speaker",
  "description": "Client for Pipelines Speech channel",
  "lang": "en-US",
  "start_url": `https://dspasov-qb.github.io/speaker/?hook=${urlParams.get("hook")}`,
  "display": "standalone",
  "theme_color": "#1c2c17",
  "icons": [
    {
      "src": "images/speech.svg",
      "sizes": "48x48 192x192 512x512",
      "type": "image/svg+xml"
    }
  ],
  "background_color": "#111111"
}

const stringManifest = JSON.stringify(myDynamicManifest);
const blob = new Blob([stringManifest], {type: 'application/json'});
const manifestURL = URL.createObjectURL(blob);
document.querySelector('#my-manifest-placeholder').setAttribute('href', manifestURL);
document.querySelector('#msapplication-starturl').setAttribute('content', `https://dspasov-qb.github.io/speaker/?hook=${urlParams.get("hook")}`);

// Init & load
document.addEventListener("DOMContentLoaded", function () {
  var micBtn = document.querySelector("#mic");

  micBtn.onclick = function () {
    if (wavesurfer === undefined) {
      if (isSafari) {
        // Safari 11 or newer automatically suspends new AudioContext's that aren't
        // created in response to a user-gesture, like a click or tap, so create one
        // here (inc. the script processor)
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        context = new AudioContext();
        processor = context.createScriptProcessor(1024, 1, 1);
      }

      // Init wavesurfer
      wavesurfer = WaveSurfer.create({
        container: "#waveform",
        waveColor: "white",
        interact: false,
        cursorWidth: 0,
        audioContext: context || null,
        audioScriptProcessor: processor || null,
        plugins: [
          WaveSurfer.microphone.create({
            bufferSize: 4096,
            numberOfInputChannels: 1,
            numberOfOutputChannels: 1,
            constraints: {
              video: false,
              audio: true,
            },
          }),
        ],
      });

      wavesurfer.microphone.on("deviceReady", function () {
        console.info("Device ready!");
      });
      wavesurfer.microphone.on("deviceError", function (code) {
        console.warn("Device error: " + code);
      });
      wavesurfer.on("error", function (e) {
        console.warn(e);
      });
      wavesurfer.microphone.start();
    } else {
      // start/stop mic on button click
      if (wavesurfer.microphone.active) {
        wavesurfer.microphone.stop();
      } else {
        wavesurfer.microphone.start();
      }
    }

    // сад
    var hookUrl;

    try {
      var hookUrl = new URL(window.atob(urlParams.get("hook")));
      if (!(hookUrl.protocol === "http:" || hookUrl.protocol === "https:")) {
        hookUrl = undefined;
        console.warn("Hook is not a valid url");
      }
    } catch (e) {
      console.warn(e);
    }

    var listening = false;
    var conversation_id = null;

    var mic = document.querySelector("#mic");
    var resultText = document.querySelector("#result");

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
    var hookUrl;
    var prevTranscript = null;
    var listening = false;
    var conversation_id = null;
    var mic = document.querySelector("#mic");
    var resultText = document.querySelector("#result");

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
            speakAndWrite(respond, "error");
          });
      } else {
        speakAndWrite("Hook is not a valid url", "error");
      }
    }

    function confirmTranscript(transcript) {
      if (!prevTranscript) {
        prevTranscript = transcript;
        speakAndWrite(`Do you want to send "${transcript}"?`, "response", true);
      } else {
        if (
          ["yes", "yes please", "ok", "send", "yeah", "hell yeah"].includes(
            transcript
          )
        ) {
          triggerHook({ transcript: prevTranscript, conversation_id });
        } else {
          speakAndWrite("Didn't send it.");
        }
        prevTranscript = null;
      }
    }

    recognition.onresult = function (event) {
      var lastResult = event.results[event.results.length - 1][0];
      var result = lastResult.transcript.toLowerCase().trim();
      appendParagraph(result);
      confirmTranscript(result);
    };

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
            speakAndWrite(respond, "error");
          });
      } else {
        speakAndWrite("Hook is not a valid url", "error");
      }
    }

    var prevPayload = false;
    recognition.onresult = function (event) {
      var lastResult = event.results[event.results.length - 1][0];
      var result = lastResult.transcript.toLowerCase().trim();

      appendParagraph(result);

      const payload = { transcript: result, conversation_id: conversation_id };
      if (!prevPayload) {
        prevPayload = payload;
        speakAndWrite(
          `Do you want to send, "${payload.transcript}"?`,
          "response",
          true
        );
      } else {
        const answer = payload.transcript;
        if (answer === "yes") {
          triggerHook(payload);
        } else {
          speakAndWrite("Did not send");
        }

        prevPayload = false;
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
  };
});
