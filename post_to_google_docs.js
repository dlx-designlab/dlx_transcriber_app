// Post to Google Docs
const CLIENT_ID = '38760503662-jaauvfppj7v0qg4u4qg3t5q84nq169ij.apps.googleusercontent.com'; // Get this from the Google Cloud Console
let DOC_ID = '1ckg-wugPQHujglYWTzJmhgDdW4HDKm95hgnth7UIfDA';    // Get this from the Google Doc URL

const SCOPES = 'https://www.googleapis.com/auth/documents';

let tokenClient;
let gapiInited = false;
let gisInited = false;

// Initialize UI state if elements exist
const authBtn = document.getElementById('authorize-button');
const signoutBtn = document.getElementById('signout-button');
const postTranslationBtn = document.getElementById('post-translation-button');
const docIdInput = document.getElementById('docIdInput');

if (authBtn) authBtn.style.display = 'block';
if (signoutBtn) signoutBtn.style.display = 'none';
if (postTranslationBtn) postTranslationBtn.style.display = 'none';
if (docIdInput) {
    // Set default to current DOC_ID and keep synchronized
    docIdInput.value = DOC_ID;
    docIdInput.addEventListener('change', () => {
        const value = (docIdInput.value || '').trim();
        if (value) {
            DOC_ID = value;
            console.log('Google Doc ID set to:', DOC_ID);
        }
    });
}


function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    await gapi.client.init({
        discoveryDocs: ['https://docs.googleapis.com/$discovery/rest?version=v1'],
    });
    gapiInited = true;
    maybeEnableButtons();
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // defined later
    });
    gisInited = true;
    maybeEnableButtons();
}

function maybeEnableButtons() {
    if (gapiInited && gisInited && authBtn) {
        authBtn.style.visibility = 'visible';
        authBtn.style.display = 'block';
    }
}

if (authBtn) authBtn.onclick = handleAuthClick;
if (signoutBtn) signoutBtn.onclick = handleSignoutClick;
if (postTranslationBtn) postTranslationBtn.onclick = handlePostTranslationClick;

function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
    if (signoutBtn) signoutBtn.style.display = 'block';
    if (authBtn) authBtn.style.display = 'none';
    if (postTranslationBtn) postTranslationBtn.style.display = 'inline-block';
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
    if (authBtn) authBtn.style.display = 'block';
    if (signoutBtn) signoutBtn.style.display = 'none';
    if (postTranslationBtn) postTranslationBtn.style.display = 'none';
    }
}

async function postTextToDoc(textToPost) {
    try {
        const doc = await gapi.client.docs.documents.get({
            documentId: DOC_ID,
        });

        const docLength = doc.result.body.content.slice(-1)[0].endIndex;

        await gapi.client.docs.documents.batchUpdate({
            documentId: DOC_ID,
            resource: {
                requests: [
                    {
                        insertText: {
                            text: textToPost + '\n',
                            location: {
                                index: docLength - 1,
                            },
                        },
                    },
                ],
            },
        });

        console.log('Text successfully posted to the google document!');
    } catch (err) {
        console.error('Error posting to document:', err);
        alert('An error occurred. See the console for details.');
    }
}

async function handlePostTranslationClick() {
    const translationTextarea = document.getElementById('translationDiv');
    const textToPost = translationTextarea && translationTextarea.value ? translationTextarea.value : '';
    if (!textToPost) {
        alert('Translation is empty!');
        return;
    }
    await postTextToDoc(textToPost);
}
