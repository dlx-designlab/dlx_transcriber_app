// status fields and start button in UI
var phraseDiv;
var startRecognizeOnceAsyncButton;
var stopRecognizeAsyncButton;

// subscription key and region for speech services.
var azureKey, serviceRegion, audioSource;
var SpeechSDK;
var recognizer;
var isRecognizing = false;
var currentStream; // Store the current media stream
var fullTranscription = ""; // Accumulates all finalized recognized text

// Audio context for volume detection
var audioContext;
var analyser;
var microphone;
var dataArray;
var volumeAnimationId;

document.addEventListener("DOMContentLoaded", function () {
  startRecognizeOnceAsyncButton = document.getElementById("startRecognizeOnceAsyncButton");
  stopRecognizeAsyncButton = document.getElementById("stopRecognizeAsyncButton");
  azureKey = document.getElementById("azureKey");
  serviceRegion = document.getElementById("serviceRegion");
  audioSource = document.getElementById("audioSource");
  phraseDiv = document.getElementById("phraseDiv");
  const translationDiv = document.getElementById("translationDiv");
  const openaiKeyInput = document.getElementById("openaiKey");
  const clearOutputButton = document.getElementById("clearOutputButton");

  if (clearOutputButton) {
    clearOutputButton.addEventListener("click", function () {
      if (phraseDiv) phraseDiv.value = "";
      if (translationDiv) translationDiv.value = "";
      // Also clear the accumulated transcription context
      fullTranscription = "";
    });
  }

  startRecognizeOnceAsyncButton.addEventListener("click", function () {
    if (isRecognizing) return;
    
    startRecognizeOnceAsyncButton.disabled = true;
    startRecognizeOnceAsyncButton.classList.add("loading");
    stopRecognizeAsyncButton.disabled = false;
    isRecognizing = true;

    if (azureKey.value === "" || azureKey.value === "API Key") {
      alert("Please enter your Azure Speech API key!");
      resetButtons();
      return;
    }
    
    // Initialize audio context for volume detection
    initializeVolumeDetection();
    
    var speechConfig = SpeechSDK.SpeechConfig.fromSubscription(azureKey.value, serviceRegion.value);
    speechConfig.speechRecognitionLanguage = "ja-JP"; // Set the language to Japanese
    
    // Create audio configuration based on selected source
    var audioConfig;
    if (audioSource.value === "browser") {
      // Use browser audio capture
      initializeBrowserAudio().then(function(stream) {
        currentStream = stream;
        audioConfig = SpeechSDK.AudioConfig.fromStreamInput(stream);
        startRecognition(speechConfig, audioConfig);
      }).catch(function(error) {
        console.error("Error initializing browser audio:", error);
        alert("Failed to capture browser audio. Please try microphone instead.");
        resetButtons();
      });
      return; // Exit early since we'll handle recognition in the promise
    } else {
      // Use microphone
      audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    }
    
    startRecognition(speechConfig, audioConfig);
  });

  function initializeBrowserAudio() {
    return navigator.mediaDevices.getDisplayMedia({ 
      video: true, 
      audio: true 
    });
  }

  async function translateText(japaneseText, contextText) {
    try {
      if (!openaiKeyInput || !openaiKeyInput.value) {
        // No OpenAI key provided;
        console.warn("No OpenAI API key provided; skipping translation.");
        return;
      }
      const apiKey = openaiKeyInput.value.trim();
      if (!apiKey) return;

      // Build prompt with optional context before the latest segment
      const userContent = contextText && contextText.trim().length
        ? "Context (previous transcription):\n" + contextText +
          "\n\nTranslate this New segment:\n" + japaneseText
        : "Translate the following Text. Return only the translation.\n\n" + japaneseText;

      console.log("Sending for translation:\n", userContent);
      
      // Send translation request to OpenAI API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + apiKey
        },
        body: JSON.stringify({
          model: "gpt-5-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a professional translator assistant. Expert in Translating presentations, speeches and meetings. " +
                "Translate from Japanese to natural, fluent English. Do not add any additional information or comments. " +
                "Return only the translation."
            },
            { role: "user", content: userContent }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("OpenAI API error:", errText);
        return;
      }

      const data = await response.json();
      const translated = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
        ? data.choices[0].message.content.trim()
        : "";
      if (translated && translationDiv) {
        // Append translated text with a blank line for readability
        const needsNewline = translationDiv.value && !translationDiv.value.endsWith("\n");
        translationDiv.value += (needsNewline ? "\n" : "") + translated + "\n\n";
        translationDiv.scrollTop = translationDiv.scrollHeight;

        // Post just the newly translated segment to Google Doc if available and authorized
        try {
          if (typeof postTextToDoc === 'function' && window.gapi && gapi.client && gapi.client.getToken && gapi.client.getToken()) {
            // Fire-and-forget; log any errors
            postTextToDoc(translated).catch(err => console.error('Posting translation failed:', err));
          }
        } catch (e) {
          // Swallow errors to avoid disrupting transcription flow
          console.warn('Google posting not available yet:', e);
        }
      }
    } catch (err) {
      console.error("Translation failed:", err);
    }
  }

  function startRecognition(speechConfig, audioConfig) {
    recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

    // Event for partial results (while speaking)
    recognizer.recognizing = function (s, e) {
      var lastLine = phraseDiv.value.split('\n');
      lastLine[lastLine.length - 1] = e.result.text;
      phraseDiv.value = lastLine.join('\n');
    };

    // Event for final results (when speech segment is complete)
    recognizer.recognized = function (s, e) {
      if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
        // Replace the last line with final result and add a new line
        var lines = phraseDiv.value.split('\n');
        lines[lines.length - 1] = e.result.text;
        lines.push(''); // Add new empty line for next recognition
        phraseDiv.value = lines.join('\n');

        // Scroll to bottom
        phraseDiv.scrollTop = phraseDiv.scrollHeight;
        
        window.console.log("Recognized: " + e.result.text);

        // Send final recognized text for translation with context
        translateText(e.result.text, fullTranscription);

        // After translation request, append latest text to the accumulator
        fullTranscription += (fullTranscription ? "\n" : "") + e.result.text;
      }
    
    };

    // Event for session stopped
    recognizer.sessionStopped = function (s, e) {
      window.console.log("Session stopped.");
      resetButtons();
    };

    // Event for errors
    recognizer.canceled = function (s, e) {
      window.console.log("Recognition canceled: " + e.errorDetails);
      if (e.reason === SpeechSDK.CancellationReason.Error) {
        phraseDiv.value += "\nError: " + e.errorDetails + "\n";
      }
      resetButtons();
    };

    // Start continuous recognition
    recognizer.startContinuousRecognitionAsync(
      function () {
        window.console.log("Continuous recognition started.");
      },
      function (err) {
        window.console.log("Error starting recognition: " + err);
        phraseDiv.value += "\nError starting recognition: " + err + "\n";
        resetButtons();
      }
    );
  }

  stopRecognizeAsyncButton.addEventListener("click", function () {
    if (!isRecognizing) return;
    
    stopRecognizeAsyncButton.disabled = true;
    
    if (recognizer) {
      recognizer.stopContinuousRecognitionAsync(
        function () {
          window.console.log("Continuous recognition stopped.");
          recognizer.close();
          recognizer = undefined;
          resetButtons();
        },
        function (err) {
          window.console.log("Error stopping recognition: " + err);
          recognizer.close();
          recognizer = undefined;
          resetButtons();
        }
      );
    }
  });

  function resetButtons() {
    const volumeContainer = document.getElementById("volumeContainer");
    
    startRecognizeOnceAsyncButton.disabled = false;
    startRecognizeOnceAsyncButton.classList.remove("loading");
    stopRecognizeAsyncButton.disabled = true;
    volumeContainer.classList.remove("active");
    isRecognizing = false;
    
    // Stop volume detection
    stopVolumeDetection();
    
    // Clean up browser audio stream if it exists
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      currentStream = null;
    }
  }

  function initializeVolumeDetection() {
    var stream;
    if (audioSource.value === "browser" && currentStream) {
      // Use the browser audio stream for volume detection
      stream = currentStream;
      setupVolumeDetection(stream);
    } else {
      // Use microphone for volume detection
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function(micStream) {
          setupVolumeDetection(micStream);
        })
        .catch(function(err) {
          console.error('Error accessing microphone for volume detection:', err);
        });
    }
  }

  function setupVolumeDetection(stream) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
      
      microphone.connect(analyser);
      
      // Show volume container
      document.getElementById("volumeContainer").classList.add("active");
      
      // Start volume monitoring
      updateVolumeIndicator();
    } catch (err) {
      console.error('Error setting up volume detection:', err);
    }
  }

  function updateVolumeIndicator() {
    if (!analyser || !isRecognizing) return;
    
    analyser.getByteFrequencyData(dataArray);
    
    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    const volumePercent = Math.min(Math.round((average / 128) * 100), 100);
    
    // Update volume bar
    const volumeBar = document.getElementById("volumeBar");
    
    volumeBar.style.width = volumePercent + "%";
    
    // Continue monitoring
    volumeAnimationId = requestAnimationFrame(updateVolumeIndicator);
  }

  function stopVolumeDetection() {
    if (volumeAnimationId) {
      cancelAnimationFrame(volumeAnimationId);
      volumeAnimationId = null;
    }
    
    if (microphone) {
      microphone.disconnect();
      microphone = null;
    }
    
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
      audioContext = null;
    }
    
    analyser = null;
    dataArray = null;
  }

  if (!!window.SpeechSDK) {
    SpeechSDK = window.SpeechSDK;
    startRecognizeOnceAsyncButton.disabled = false;

    document.getElementById('content').style.display = 'block';
    document.getElementById('warning').style.display = 'none';
  }
});
