import { cryptoUtils } from '../background-scripts/cryptoUtils.js';

const DOM_ELEMENTS = {
    cardsContainer: document.getElementById('cardsContainer'),
    openManageBtn: document.getElementById('openManageBtn'),
    statusMessage: document.getElementById('statusMessage'),
};

const MESSAGES = {
    startRequest: 'Starte Request...',
    success: '✔ Ausführung erfolgreich',
    errorPrefix: '✖ Fehler: ',
    unknownError: '✖ Unbekannter Fehler',
    noTasks: 'Keine aktiven Tasks vorhanden',
};


/**
 * Loads hosts from local storage and passes them to the provided callback.
 *
 * @param {Function} callback - A function to execute once the hosts are loaded. The function receives the retrieved hosts as an argument.
 * @return {void} This function does not return a value.
 */
function loadHosts(callback) {
    chrome.storage.local.get(['edgeBISHosts'], async (res) => {
        const hosts = res.edgeBISHosts || [];

        // Carry out the warm-up (the function checks itself whether it has already been carried out)
        await warmupConnections(hosts);

        // Call the callback to render the hosts
        callback(hosts);
    });
}

/**
 * Creates and returns a new DOM element with the specified tag and options.
 *
 * @param {string} tag The tag name of the element to create (e.g., 'div', 'span').
 * @param {Object} [options={}] An optional configuration object for the element.
 * @param {Object} [options.attributes] An object containing attributes to set on the element (e.g., { id: 'myId', title: 'My Title' }).
 * @param {string} [options.className] The class name(s) to assign to the element.
 * @param {string} [options.innerHTML] The HTML content to set as the innerHTML of the element.
 * @param {string} [options.textContent] The text content to set as the textContent of the element.
 * @param {Object} [options.style] An object containing CSS style properties to apply to the element.
 * @param {Object} [options.events] An object where the keys are event types and the values are event handler functions to attach (e.g., { click: handleClick }).
 * @return {HTMLElement} The newly created DOM element.
 */
function createElement(tag, options = {}) {
    const element = document.createElement(tag);

    Object.assign(element, options.attributes || {});

    if (options.className) element.className = options.className;
    if (options.innerHTML) element.innerHTML = options.innerHTML;
    if (options.textContent) element.textContent = options.textContent;
    if (options.style) Object.assign(element.style, options.style);
    if (options.events) {
        Object.entries(options.events).forEach(([event, handler]) =>
            element.addEventListener(event, handler)
        );
    }
    return element;
}


/**
 * Creates a card element containing information and an executable button.
 *
 * @param {Object} item - The object containing properties for the card.
 * @param {string} item.name - The name to display on the card.
 * @param {string} item.identifier - The identifier of the task.
 * @param {boolean} item.isActive - Whether the task is active.
 * @param {string} accessToken - The encrypted accessToken from the parent host.
 * @param {string} fullUrl - The full URL from the parent host.
 * @return {HTMLElement} The DOM element representing the card.
 */
function generateCardElement(item, accessToken, fullUrl) {
    const card = createElement('div', { className: 'card' });
    const row = createElement('div', { className: 'card-row' });

    // Item with host information for execution
    const enrichedItem = {
        ...item,
        accessToken: accessToken,
        fullUrl: fullUrl
    };

    const execButton = createElement('button', {
        className: 'btn-icon',
        innerHTML: `<?xml version="1.0" encoding="utf-8"?><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 122.88 118.66" style="enable-background:new 0 0 122.88 118.66" xml:space="preserve"><g><path d="M16.68,22.2c-1.78,2.21-3.43,4.55-5.06,7.46C5.63,40.31,3.1,52.39,4.13,64.2c1.01,11.54,5.43,22.83,13.37,32.27 c2.85,3.39,5.91,6.38,9.13,8.97c11.11,8.93,24.28,13.34,37.41,13.22c13.13-0.13,26.21-4.78,37.14-13.98 c3.19-2.68,6.18-5.73,8.91-9.13c6.4-7.96,10.51-17.29,12.07-27.14c1.53-9.67,0.59-19.83-3.07-29.66 c-3.49-9.35-8.82-17.68-15.78-24.21C96.7,8.33,88.59,3.76,79.2,1.48c-2.94-0.71-5.94-1.18-8.99-1.37c-3.06-0.2-6.19-0.13-9.4,0.22 c-2.01,0.22-3.46,2.03-3.24,4.04c0.22,2.01,2.03,3.46,4.04,3.24c2.78-0.31,5.49-0.37,8.14-0.2c2.65,0.17,5.23,0.57,7.73,1.17 c8.11,1.96,15.1,5.91,20.84,11.29c6.14,5.75,10.85,13.12,13.94,21.43c3.21,8.61,4.04,17.51,2.7,25.96 C113.59,75.85,110,84,104.4,90.96c-2.47,3.07-5.12,5.78-7.91,8.13c-9.59,8.07-21.03,12.15-32.5,12.26 c-11.47,0.11-23-3.76-32.76-11.61c-2.9-2.33-5.62-4.98-8.13-7.97c-6.92-8.22-10.77-18.09-11.66-28.2 c-0.91-10.37,1.32-20.99,6.57-30.33c1.59-2.82,3.21-5.07,5.01-7.24l0.53,14.7c0.07,2.02,1.76,3.6,3.78,3.52 c2.02-0.07,3.6-1.76,3.52-3.78l-0.85-23.42c-0.07-2.02-1.76-3.6-3.78-3.52c-0.13,0-0.25,0.02-0.37,0.03l0,0l-22.7,3.19 c-2,0.28-3.4,2.12-3.12,4.13c0.28,2,2.12,3.4,4.13,3.12L16.68,22.2L16.68,22.2z"/></g></svg>`,
        events: { click: () => executeTask(enrichedItem), },
    });

    const infoWrapper = createElement('div', { className: 'info-wrapper' });
    infoWrapper.append(
        createElement('h2', {
            textContent: item.name || 'Kein Name',
            style: { margin: 0, fontSize: '12px' },
        })
    );

    row.append(execButton, infoWrapper);
    card.appendChild(row);
    return card;
}

/**
 * Renders a list of tasks into the DOM by appending cards to the container.
 * It filters active tasks and displays them. If no active tasks are available,
 * a "no tasks" message is displayed.
 *
 * @param {Array} hosts - The array of host objects to be rendered. Each task must include an `isActive` property.
 * @return {void} This function does not return a value.
 */
function renderCards(hosts) {
    const { cardsContainer } = DOM_ELEMENTS;

    // Alle Tasks aus allen Hosts extrahieren und in einem einzigen Array zusammenführen
    const allTasks = [];

    if (Array.isArray(hosts)) {
        hosts.forEach(host => {
            if (host?.tasks && Array.isArray(host.tasks)) {
                // Füge jedem Task den Bezug zum übergeordneten Host hinzu
                host.tasks.forEach(task => {
                    allTasks.push({
                        task: task,
                        hostAccessToken: host.accessToken,
                        hostFullUrl: `${host.scheme}://${host.basisUrl}:${host.port}`
                    });
                });
            }
        });
    }

    const hasActiveTasks = allTasks.some(item => item.task.isActive);

    cardsContainer.innerHTML = hasActiveTasks
        ? ''
        : `<div class="no-tasks-container">${ MESSAGES.noTasks }</div>`;

    allTasks
        .filter((item) => item.task.isActive)
        .forEach((item) => cardsContainer.appendChild(
            generateCardElement(item.task, item.hostAccessToken, item.hostFullUrl)
        ));
}


/**
 * Executes a task, decrypting the access token and sending the payload
 * to a Chrome runtime message handler. Updates the status message based on the result or error response.
 *
 * @param {Object} task - The task containing the necessary task data.
 * @param {string} task.accessToken - The encrypted access token required for the task.
 * @param {string} task.fullUrl - The full URL for the task execution.
 * @param {string} task.identifier - The identifier of the task.
 * @param {string} task.name - The name of the task.
 * @return {void} This function does not return any value.
 */
function executeTask(task) {
    const { statusMessage } = DOM_ELEMENTS;
    statusMessage.textContent = MESSAGES.startRequest;

    try {
        const decryptedToken = cryptoUtils.decryptToken(task.accessToken);
        const payload = { ...task, accessToken: decryptedToken };

        chrome.runtime.sendMessage({ action: 'executeTask', payload }, (response) => {
            if (response?.result) {
                statusMessage.textContent =
                    response.result.status < 300
                        ? MESSAGES.success
                        : `${ MESSAGES.errorPrefix }${ response.result.status }`;
            } else if (response?.error) {
                console.log(response.error)
                statusMessage.textContent = `${ MESSAGES.errorPrefix }${ response.error }`;
            } else {
                statusMessage.textContent = MESSAGES.unknownError;
            }
        });
    } catch (error) {
        console.error('Fehler beim Ausführen des Tasks:', error);
        statusMessage.textContent = `${ MESSAGES.errorPrefix }${ error.message }`;
    }
}


/**
 * Performs a "warmup" of the Service Worker and the API connection.
 * This helps to resolve problems with initialization after a browser restart.
 *
 * @param {Object[]} hosts - Array of available hosts
 * @return {Promise<void>}
 */
async function warmupConnections(hosts) {
    const { statusMessage } = DOM_ELEMENTS;

    // Check whether the warm-up has already been performed in this browser session
    const result = await chrome.storage.session.get(['warmupPerformedInSession']);
    if (result.warmupPerformedInSession) {
        return; // Warm-up has already been carried out in this session
    }


    if (!hosts || hosts.length === 0) {
        statusMessage.textContent = "Keine Hosts verfügbar für Warmup";
        // Nevertheless, mark as completed
        await chrome.storage.session.set({ warmupPerformedInSession: true });
        return;
    }

    // Select the first active host with tasks for the warmup
    const hostWithTasks = hosts.find(host =>
        host.tasks && Array.isArray(host.tasks) && host.tasks.some(task => task.isActive)
    );

    if (!hostWithTasks) {
        statusMessage.textContent = "Keine aktiven Tasks für Warmup gefunden";
        // Nevertheless, mark as completed
        await chrome.storage.session.set({ warmupPerformedInSession: true });
        return;
    }

    try {
        // Construct the URL for a harmless GET request
        const fullUrl = `${hostWithTasks.scheme}://${hostWithTasks.basisUrl}:${hostWithTasks.port}`;
        const warmupUrl = `${fullUrl}/api/scheduler-task?size=1`;
        const decryptedToken = cryptoUtils.decryptToken(hostWithTasks.accessToken);

        statusMessage.textContent = "API-Verbindung wird initialisiert...";

        // Send a GET request to initialize the service worker
        const response = await fetch(warmupUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': decryptedToken
            }
        });

        if (response.ok) {
            statusMessage.textContent = "API-Verbindung bereit";
            // Clear the status message after 2 seconds so that it is not displayed permanently
            setTimeout(() => {
                statusMessage.textContent = "";
            }, 2000);
        } else {
            statusMessage.textContent = `${MESSAGES.errorPrefix}API-Initialisierung fehlgeschlagen: ${response.status}`;
        }
    } catch (error) {
        statusMessage.textContent = `${MESSAGES.errorPrefix}API-Initialisierung fehlgeschlagen: ${error.message}`;
    } finally {
        // Mark as completed regardless of the result
        await chrome.storage.session.set({ warmupPerformedInSession: true });
    }
}


// Add event for "Edit tasks"
DOM_ELEMENTS.openManageBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('../manage/manage.html') });
});

// When charging: Retrieve and render cards
loadHosts(renderCards);