# 🎙️ DLX Transcriber & Translator 🌐

A simple web-based application for real-time speech transcription using the Azure Speech SDK.

## ✨ Features

*   🎤 Transcribe speech from a microphone or browser audio.
*   🇯🇵 Supports Japanese language transcription.
*   📊 Visual feedback for microphone volume level.

## 🚀 How to Use

1.  Clone this repository.
2.  From the project directory, run a simple local web server.
3.  Open `index.html` in a web browser (e.g., by navigating to `http://localhost:8000` - see how to launch a server below).
4.  Enter your Azure Speech API key and the corresponding region.
5.  Select the audio source (Microphone or Browser Audio).
6.  Click "Start Transcription" to begin.
7.  The transcribed text will appear in the text area.

**Note:** This app needs to run on a localhost server or be deployed on a cloud server to work.

### 🖥️ Running a Local Server

**🐍 Using Python:**
If you have Python 3, run the following command in your terminal:
```bash
python3 -m http.server
```

**🟩 Using Node.js:**
If you have Node.js, you can use the `http-server` package. Run this command:
```bash
npx http-server
```
This will start a server, and you can access the application at the URL provided in the terminal.

## 🛠️ Technologies

*   HTML
*   CSS
*   JavaScript
*   Microsoft Azure Cognitive Services Speech SDK
