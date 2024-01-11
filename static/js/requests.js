// TODO: use code linking to share common JS functionality like the following function
/**
 * This function is use to send a Fetch request and can also show a loader for the button or page at the same time
 * Usage,
 * All parameters must be supplied in an object sendFetchRequest({})
 * If you turn showPageLoader to true, then it will override showButtonLoader
 * If you turn showPageLoader to false, and want to showButtonLoader, then turn that to true and pass a selector like '#invite-button' or '.invite-button'
 * If both are false no loading indicators are shown
 *
 *
 * @param method the request method, can be GET, POST, PUT, UPDATE, DELETE (default GET)
 * @param headers any request specific headers you want to add as key value pairs in an object
 * @param url url to send fetch request to
 * @param data date to send in the request body
 * @param showPageLoader boolean to show page loader (default false)
 * @param showButtonLoader boolean to show button loader  (default false)
 * @param selector button selector(id or class)
 * @param callback callback function after success, has default argument for response as JSON from requests
 * @param onFail callback function if the fetch fails for any reason
 * @param args arguments that you want to pass to callback function
 * @param timeout a timeout in milliseconds that will abort the fetch if reached (default null)
 */
async function sendFetchRequest(
    {
        url,
        data = null,
        headers = {},
        method = 'GET',
        showPageLoader = false,
        showButtonLoader = false,
        selector = '',
        callback = null,
        onFail = null,
        args = [],
        timeOut = null
    }
) {
    // create a new AbortController for the request, if the timeOut is set then set a timeout
    const fetchController = new AbortController();
    const timeoutId = (timeOut) ? setTimeout(() => fetchController.abort(), timeOut) : null;

    // construct the request object then using the fetch API, send the request and execute the callback function
    const request = new Request(url, {
        method,
        headers,
        body: data
    });

    let responseData = null;

    // make the request then using the response as json execute the callback and clear out the timeout
    await fetch(request, { signal: fetchController.signal })
        .then(response => {
            responseData = response.json();
            return responseData;
        })
        .then(data => callback(data, ...args))
        .then(() => clearTimeout(timeoutId))
        .catch(onFail);
    return responseData;
}
