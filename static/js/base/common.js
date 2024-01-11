const csrftoken = getCookie('csrftoken');

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function sendGETRequest({url, data, callback, onError, args = [], timeOut = 6000}) {
    // create a new AbortController for the request, if the timeOut is set then set a timeout
    const fetchController = new AbortController();
    const timeoutId = timeOut ? setTimeout(() => fetchController.abort(), timeOut) : null;

    const request = new Request(url, {
        method: 'GET',
        body: data,
        headers: {'X-CSRFToken': csrftoken}
    });

    // make the request then using the response as json execute the callback and clear out the timeout
    fetch(request, {signal: fetchController.signal})
        .then(response => response.json())
        .then(data => callback(data, ...args))
        .then(() => clearTimeout(timeoutId))
        .catch(onError);
}
