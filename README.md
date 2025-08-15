# 🎙️ DLX Transcriber & Translator 🌐

A web app for real-time transcription (Azure Speech) and translation (OpenAI), with one-click posting to Google Docs.

## ✨ Features

- Live transcription via Azure Speech SDK (Japanese input configured)
- Translation via OpenAI Chat Completions (appends each segment to the right pane)
- Google login (OAuth) and one-click “Post” of the translation to a Google Doc
- Auto-post: when logged in, each new translated segment is posted to the selected Google Doc
- Editable Google Doc ID field to target a different document on the fly


## 🌐 Hosted

You can access the app via GitHub Pages:
https://dlx-designlab.github.io/dlx_transcriber_app/

## 🔑 Credentials

- Azure Speech API Key and Region
- OpenAI API Key
- Google OAuth Client ID and Google Doc ID

These credentials can be obtained from a DLX IT administrator. The Google Doc ID can be pasted into the “Google Doc ID” field to override the default at runtime.

## 🚀 Usage

1. Open the app (locally or via GitHub Pages).
2. Enter your Azure Speech API key and region.
3. Optionally enter your OpenAI API key for translation.
4. Choose the audio source (Microphone or Browser Audio).
5. Click START to begin transcription; STOP to end; Clear Text to reset both panes.
6. For Google Docs posting:
	- Click “Login DLX Gmail” and complete the Google sign-in.
	- (Optional) Paste a different Google Doc ID in the input for posting.
	- Click “Post” to append the current translation, or let auto-post push each segment.

Notes:
- Browser Audio mode uses screen capture with audio permissions.
- Auto-post requires an active Google login and edit access to the target Doc.

## 🖥️ Local Development

Run a simple local server from the project directory, then open the printed URL:

Using Python 3:
```bash
python3 -m http.server
```

Using Node.js:
```bash
npx http-server
```

## 🛠️ Tech stack

- HTML, CSS, JavaScript
- Microsoft Azure Cognitive Services Speech SDK
- OpenAI Chat Completions API
- Google Docs API + Google Identity Services (OAuth)
