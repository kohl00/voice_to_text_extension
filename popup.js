document.addEventListener('DOMContentLoaded', () => {
    const startRecording = document.getElementById("startRecording");
    const stopRecording = document.getElementById("stopRecording");
    const status = document.getElementById("status");
    const transcript = document.getElementById("transcript");
    const editText = document.getElementById("editText");
    const fillInput = document.getElementById("fillInput");
    const formInputsList = document.getElementById("formInputsList");

    let contentScriptReady = false;

    startRecording.addEventListener("click", () => {
      if (contentScriptReady) {
        chrome.runtime.sendMessage({ message: "startRecording" });
      } else {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ["content.js"],
          });
        });
      }
    });

    // Request form inputs from the content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { message: "getFormInputs" }, (response) => {
      const formInputsList = document.getElementById("formInputsList");

      // Populate the formInputsList select field
      response.forEach((label, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = label;
        formInputsList.appendChild(option);
      });
    });
  });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.message === "contentScriptReady") {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              chrome.tabs.sendMessage(tabs[0].id, { message: "getFormInputs" }, (response) => {
                const formInputsList = document.getElementById("formInputsList");
        
                response.forEach((label, index) => {
                  const option = document.createElement("option");
                  option.value = index;
                  option.textContent = label;
                  formInputsList.appendChild(option);
                });
              });
            });
          } else if (request.message === "stopRecording") {
          stopRecording.disabled = false;
          startRecording.disabled = true;
          status.textContent = "Stopped";
        } else if (request.message === "updateTranscript") {
          transcript.textContent = request.transcript;
        } else if (request.message === "recordingStopped") {
          stopRecording.disabled = true;
          startRecording.disabled = false;
          status.textContent = "Start recording to fill the input";
        }
        else if (request.message === "formInputsList") {
            formInputsList.innerHTML = request.options;
        }
      });

  // Request the form input elements list from the content script
  chrome.runtime.sendMessage({ message: "getFormInputsListRequest" });

  startRecording.addEventListener("click", () => {
    chrome.runtime.sendMessage({ message: "startRecordingRequest" });
  });

  stopRecording.addEventListener("click", () => {
    chrome.runtime.sendMessage({ message: "stopRecordingRequest" });
  });
  
    stopRecording.addEventListener("click", () => {
      chrome.runtime.sendMessage({ message: "stopRecording" });
    });
  
    editText.addEventListener("click", () => {
      transcript.readOnly = false;
    });
  
    fillInput.addEventListener("click", () => {
        const selectedIndex = formInputsList.value;
        const transcript = document.getElementById("transcript").value;
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, { message: "fillInputRequest", selectedIndex, transcript });
        });
    });
  
    function fillFormInput() {
      // This function will be serialized and executed in the content script
      const text = document.getElementById("transcript").value;
      chrome.runtime.sendMessage({ message: "fillInput", text });
    }
  
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.message === "recordingStarted") {
        status.innerText = "Recording";
        startRecording.disabled = true;
        stopRecording.disabled = false;
      } else if (request.message === "recordingStopped") {
        status.innerText = "Idle";
        startRecording.disabled = false;
        stopRecording.disabled = true;
      } else if (request.message === "transcriptUpdate") {
        transcript.value = request.transcript;
        editText.disabled = false;
        fillInput.disabled = false;
      }
      else if (request.message === "fillInputRequest") {
        const selectedIndex = request.selectedIndex;
        const formInputs = Array.from(document.querySelectorAll("input, textarea, [contenteditable]"));
        const selectedInput = formInputs[selectedIndex];
        if (selectedInput) {
          selectedInput.value = transcript;
        }
      }
    });
  });
  