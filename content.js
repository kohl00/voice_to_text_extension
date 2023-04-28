(function () {
    if (window.contentScriptExecuted) return;
    window.contentScriptExecuted = true;

let recognition;
let targetInput;

// Initialize SpeechRecognition
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    chrome.runtime.sendMessage({ message: "recordingStarted" });
  };

  recognition.onresult = (event) => {
    let interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    chrome.runtime.sendMessage({ message: "transcriptUpdate", transcript: interimTranscript });
  };

  recognition.onend = () => {
    chrome.runtime.sendMessage({ message: "recordingStopped" });
  };
}

initSpeechRecognition();

let recognitionRunning = false;
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "startRecording") {
      // Request microphone access
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          if (!recognitionRunning) {
            recognition.start();
            recognitionRunning = true;
            targetInput = document.activeElement; // Store the active input element
          }
        })
        .catch((error) => {
          console.log("Error accessing the microphone:", error);
        });
    } else if (request.message === "stopRecording") {
        recognition.stop();
        recognitionRunning = false;
    } else if (request.message === "fillInput") {
      if (targetInput) {
        targetInput.value = request.text;
      }
    }
    else if (request.message === "fillInputRequest") {
        const selectedIndex = request.selectedIndex;
        const transcript = request.transcript;
        const formInputs = Array.from(document.querySelectorAll("input, textarea, [contenteditable]"));
        const selectedInput = formInputs[selectedIndex];
        if (selectedInput) {
          selectedInput.value = transcript;
        }
      }
      else if (request.message === "getFormInputsListRequest") {
        const formInputs = Array.from(document.querySelectorAll("form input, form textarea, form [contenteditable]"));
        const seen = new Set();
        const options = formInputs
            .filter(input => {
                const identifier = input.name || input.id;
                if (identifier && !seen.has(identifier)) {
                    seen.add(identifier);
                    return true;
                }
                return false;
            })
            .map((input, index) => `<option value="${index}">${input.name || input.id || `Input ${index + 1}`}</option>`)
            .join("");
        chrome.runtime.sendMessage({ message: "formInputsList", options });
    }    
      else if (request.message === "getFormInputs") {
        const formInputs = Array.from(document.querySelectorAll("input, textarea, [contenteditable]"));
        const inputLabels = formInputs.map((input, index) => `${index + 1}: ${input.tagName.toLowerCase()} (${input.name || input.id || 'Unnamed'})`);
        sendResponse(inputLabels);
      }
  });

  chrome.runtime.sendMessage({ message: "contentScriptReady" });
  
})();
//chrome.runtime.sendMessage({ message: "contentScriptReady" });
