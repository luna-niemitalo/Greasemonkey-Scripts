// ==UserScript==
// @name         AI Calendar Event Creator
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Draw a rectangle to select DOM elements and then use OpenAI API and Google Calendar API to create calendar events
// @require      https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.0.0/crypto-js.min.js
// @author       Luna
// @match        *://*/*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// ==/UserScript==
const credentials = {
    OpenAI_key: undefined,
    google: {
        CLIENT_ID: undefined,
        CLIENT_SECRET: undefined,
    },
};

const SCOPES = 'https://www.googleapis.com/auth/calendar.events';
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob'; // Add your OAuth redirect URI
const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const TOKEN_STORAGE_KEY = 'google_oauth_token';

const systemMessage = `
    You are a system that converts text into Google Calendar API compatible events.
    You ONLY EVER respond in JSON format.
    Result event template:
    {
        "summary": <String formatted event title>,
        "location": <String formatted real world location, including country>,
        "description": <HTML formatted event description, limit 8000 characters, try to use as much of the limit as you can, also when some information is a link to external page, try to preserve that so the link works even while formattng the text around it>,
        "start": {
            "dateTime": <iso formatted start time from when you can get into the event example: 2021-06-29T18:00:00>,
            "timeZone": <Timezone of the start time, Europe/Helsinki, unless otherwise specified in the data>,
        },
        "end": {
            "dateTime": <iso formatted end time of when all the stuff in the event has concluded example: 2021-06-29T18:00:00>,
            "timeZone": <Timezone of the end time, Europe/Helsinki, unless otherwise specified in the data>,
        }
    }
`;
const styles = `
    #overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.1); z-index: 9999;
    }
    .selection-rectangle {
        position: absolute; border: 2px dashed #000; background: rgba(0, 0, 255, 0.2);
    }
`;

let pageResults = [];
let akm = undefined;
let userPrompted = false;

let isDrawing;
let startX;
let startY;
let overlay;
let rect;

function createPopupNotification(message) {
    const notification = document.createElement('div');
    notification.style = `
        position: fixed; top: 10px; right: 10px; background-color: rgba(0, 0, 0, 0.8);
        color: white; padding: 10px; border-radius: 5px; z-index: 9999; max-width: 300px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.5); word-wrap: break-word;
    `;
    const messageContent = message.split(' ').map(word => {
        if (!word.startsWith('http://') && !word.startsWith('https://')) return word;
        try {
            const url = new URL(word);
            return `<a href="${url}" target="_blank" style="color: #0000ff; text-decoration: underline;">${url}</a>`;
        } catch {
            return word;
        }
    }).join(' ');
    notification.innerHTML = messageContent;
    document.body.appendChild(notification);
    setTimeout(() => document.body.removeChild(notification), 15000);
}
function convertToMarkdown(text, url) {
    return `[${text}](${url})`;
}


async function authenticate() {
    let token = JSON.parse(await GM.getValue(TOKEN_STORAGE_KEY, '{}'));

    if (token && token.expiry_date && token.expiry_date > Date.now()) {
        return token.access_token;
    }

    const authCode = await getAuthCode();
    token = await getToken(authCode);
    await GM.setValue(TOKEN_STORAGE_KEY, JSON.stringify(token));
    return token.access_token;
}
function getAuthCode() {
    return new Promise((resolve) => {
        const authUrl = `${AUTH_ENDPOINT}?client_id=${credentials.google.CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${SCOPES}`;
        window.open(authUrl, '_blank', 'width=500,height=600');
        resolve(prompt("Please enter the authorization token from the popup window:"));
    });
}
async function getToken(authCode) {
    const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code: authCode,
            client_id: credentials.google.CLIENT_ID,
            client_secret: credentials.google.CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code'
        })
    });
    const token = await response.json();
    token.expiry_date = Date.now() + (token.expires_in * 1000);
    return token;
}
async function getTokensAndAuthenticate() {
    if (!akm) akm = new ApiKeyManager();
    if (!credentials.OpenAI_key) credentials.OpenAI_key = await akm.getApiKey('openAI_key');
    if (!credentials.google.CLIENT_ID) credentials.google.CLIENT_ID = await akm.getApiKey('google_CLIENT_ID');
    if (!credentials.google.CLIENT_SECRET) credentials.google.CLIENT_SECRET = await akm.getApiKey('google_CLIENT_SECRET');
    authenticate();
    return userPrompted;
}


async function createEvent(eventProp) {
    try {
        const token = await authenticate();
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: eventProp
        });
        const event = await response.json();
        console.debug(event);
        return response.ok ? `Event created: ${event.htmlLink}` : `Error: ${event.error.message}`;
    } catch (error) {
        return `An error occurred: ${error}`;
    }
}


async function queryAi(data) {
    if (!credentials.OpenAI_key) return;
    const url = "https://api.openai.com/v1/chat/completions";
    const requestBody = {
        model: "gpt-4o",
        messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: data }
        ],
        "response_format": { type: "json_object" }
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${credentials.OpenAI_key}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error("Request failed with status " + response.status);
        }

        const responseData = await response.json();
        return responseData.choices[0].message.content;
    } catch (error) {
        console.error(error);
    }
}

function addOverlay() {
    const ol = document.createElement('div');
    ol.id = 'overlay';
    document.body.appendChild(ol);
    ol.addEventListener('mousedown', startDrawing);
    ol.addEventListener('mousemove', draw);
    ol.addEventListener('mouseup', endDrawing);
    overlay = ol;
}

function startDrawing(event) {
    isDrawing = true;
    startX = event.clientX; // Use clientX instead of pageX
    startY = event.clientY; // Use clientY instead of pageY
    const r = document.createElement('div');
    r.className = 'selection-rectangle';
    r.style.left = `${startX}px`;
    r.style.top = `${startY}px`;
    overlay.appendChild(r);
    rect = r;
}

function draw(event) {
    if (!isDrawing) return;
    const x = Math.min(event.clientX, startX); // Use clientX instead of pageX
    const y = Math.min(event.clientY, startY); // Use clientY instead of pageY
    const width = Math.abs(event.clientX - startX);
    const height = Math.abs(event.clientY - startY);
    rect.style.left = `${x}px`;
    rect.style.top = `${y}px`;
    rect.style.width = `${width}px`;
    rect.style.height = `${height}px`;
}

function getTextsFromValidElements(element, rectBounds, depth = 0) {
    if (depth !== 0) {
        const hasChildren = element.childNodes.length > 0;
        if (element.tagName === 'A') {
            return [element.outerHTML];
            return [convertToMarkdown(element.textContent, element.href)];
        }
        if (!hasChildren) {
            return element.textContent.trim().length > 0 ? [element.textContent.trim()] : [];
        }
    }
    if (typeof element.getBoundingClientRect !== 'function') {
        return [];
    }

    const elBounds = element.getBoundingClientRect();
    if (elBounds.left > rectBounds.right || elBounds.right < rectBounds.left ||
      elBounds.top > rectBounds.bottom || elBounds.bottom < rectBounds.top) {
        return [];
    }



    const children = Array.from(element.childNodes);
    return children.flatMap(child => getTextsFromValidElements(child, rectBounds, depth + 1));
}
function endDrawing() {
    isDrawing = false;
    const rectBounds = rect.getBoundingClientRect();
    console.table(rectBounds);
    const elements = Array.from(document.body.getElementsByTagName("*"));
    let selectedElements = elements.flatMap(element => getTextsFromValidElements(element, rectBounds));
    const set = new Set(selectedElements);
    pageResults = Array.from(set).join('\n');
    console.debug(pageResults);
    const sure = confirm('Do you want to proceed with the following data?\n' + pageResults);
    if (!sure) {
        overlay.remove();
        return;
    }

    queryAi(pageResults).then(aiResult => {
        console.info(aiResult);
        createEvent(aiResult).then(eventResult => createPopupNotification(eventResult));
    });
    overlay.remove();
}

class ApiKeyManager {
    constructor() {
        // TODO Change this, or prompt for it
        this.encryptionKey = "0000";
        return;
        this.encryptionKey = prompt("Enter encryption key: \n Warning, if this is your first time running this script, you will be prompted for several API keys in succession.");
        userPrompted = true;
    }

    encryptApiKey(apiKey) {
        return CryptoJS.AES.encrypt(apiKey, this.encryptionKey).toString();
    }

    decryptApiKey(encryptedApiKey) {
        const bytes = CryptoJS.AES.decrypt(encryptedApiKey, this.encryptionKey);
        return bytes.toString(CryptoJS.enc.Utf8);
    }

    async getApiKey(service) {
        const encryptedApiKey = await GM.getValue(service);
        if (encryptedApiKey) return this.decryptApiKey(encryptedApiKey);
        userPrompted = true;
        const apiKey = prompt(`Please enter your API key for: ${service}`);
        if (apiKey) {
            await this.setApiKey(service, apiKey);
            return apiKey;
        } else {
            alert('API key is required for this script to work.');
        }
    }

    async setApiKey(service, apiKey) {
        const encryptedApiKey = this.encryptApiKey(apiKey);
        await GM.setValue(service, encryptedApiKey);
    }
}

(function() {
    'use strict';
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.shiftKey && event.key === 'X') {

            getTokensAndAuthenticate().then(authenticated => {
                if (authenticated) {
                    userPrompted = false;
                    return;
                }
                addOverlay();
            });
        }
        if (event.key === 'Escape') overlay?.remove();
    });
})();
