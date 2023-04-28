let contentScriptReady = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "contentScriptReady") {
    contentScriptReady = true;
    chrome.runtime.sendMessage({ message: "contentScriptReady" });
    chrome.tabs.sendMessage(tabs[0].id, { message: "contentScriptReady" });
  } else if (request.message === "startRecordingRequest") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (contentScriptReady) {
        chrome.tabs.sendMessage(tabs[0].id, { message: "startRecording" });
      } else {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            files: ["content.js"],
          },
          () => {
            setTimeout(() => {
              chrome.tabs.sendMessage(tabs[0].id, { message: "startRecording" });
            }, 500);
          }
        );
      }
    });
  } else if (request.message === "stopRecordingRequest") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { message: "stopRecording" });
    });
  }
});
