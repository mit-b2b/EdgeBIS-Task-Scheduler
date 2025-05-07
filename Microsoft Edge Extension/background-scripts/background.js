const PROXY_URL = 'http://localhost:3001/proxy';
const STATUS_DESCRIPTIONS = {
    200: "Request successful.",
    201: "Resource created.",
    204: "No content returned.",
    400: "Bad request: The request could not be understood.",
    401: "Authentication failed!",
    403: "Authorization failed!",
    404: "No scheduler-task with the given identifier exists!",
    405: "Method not allowed.",
    422: "Unprocessable entity.",
    500: "Internal server error."
};

/**
 * Asynchronously creates a response object containing the status, body, and description
 * of the provided response.
 *
 * @function
 * @async
 * @param {Response} response - The response object to process.
 * @returns {Promise<Object>} A promise that resolves to an object containing:
 *  - `status` (number): The HTTP status code of the response.
 *  - `body` (string): The text content of the response body.
 *  - `description` (string): A description associated with the status code.
 *    This is retrieved from the STATUS_DESCRIPTIONS mapping or defaults to an empty string
 *    if no description is available.
 */
const createResponseObject = async (response) => {
    const body = await response.text();
    return {
        status: response.status,
        body,
        description: STATUS_DESCRIPTIONS[response.status] || "",
    };
};

/**
 * Handles a fetch operation by sending the result or error to a specified callback function.
 *
 * @param {string} url The URL to which the request is sent.
 * @param {Object} options The options object containing custom settings to be applied to the fetch request.
 * @param {Function} sendResponse The callback function to handle the response or error. It is invoked with an object containing either a `result` or an `error` property.
 */
const handleFetch = (url, options, sendResponse) => {
    fetch(url, options)
        .then(createResponseObject)
        .then(responseObject => sendResponse({ result: responseObject }))
        .catch(error => sendResponse({ error: error.toString() }));
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'executeTask') {
        const { scheme, basis_url, port, identifier, proxy, accessToken } = message.payload;
        const targetUrl = `${ scheme }://${ basis_url }:${ port }/api/scheduler-task/${ identifier }/execution`;

        if (proxy) {
            const requestBody = JSON.stringify({ targetUrl, identifier, accessToken });
            const options = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: requestBody
            };
            handleFetch(PROXY_URL, options, sendResponse);
        } else {
            const headers = new Headers();
            headers.set('Accept', 'application/json');
            headers.set('authorization', accessToken);

            handleFetch(targetUrl, { method: 'POST', headers }, sendResponse);
        }

        return true; // sendResponse asynchron nutzen
    }
});
