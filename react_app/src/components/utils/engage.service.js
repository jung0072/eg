// This file will be used to make fetch requests to the engage platform
const DEFAULT_OPTIONS = {
    resourceName: 'default',
    id: 1,
    method: 'GET'
}; // add any security/ api options in here

// For caching requests we will use a map with an expiration date of 1 hour for now
const cache = new Map();
const cacheExpiration = 60 * 5; // 5 minutes to avoid the leaderboard from repeating the same data

/**
 * @typedef {Object} APIOptions
 * Check out Engage API for more info {@link }
 * @property {string} absoluteURL an override to specify the full url for an Engage/ insightScope Resource
 * @property {number} userID the id of the user making the request
 * @property {string} resourceName the name of the resource you are accessing and what we will save it in the cache under
 */

/**
 * Get or Post the data from/ to the supplied route
 * @param {APIOptions} options
 * @returns {Object} JSON Response from the Engage API
 */
export default async function getEngageData(options) {
    // grab the id after merging the default options for the api and the
    // set options by params onto an empty object
    const { id, absoluteURL, resourceName, method, requestBody } = Object.assign({}, DEFAULT_OPTIONS, options);
    // get the entry from the cache that is stored under the key of the id
    const cacheEntry = cache.get(`${id}-${resourceName}`);
    if (cacheEntry && !isExpired(cacheEntry?.time)) {
        return cacheEntry.data; // return the cached entry if it passes the checks
    }

    // if we do not have a cached item lets preform the fetch
    const data = await fetchEngageData({ id, absoluteURL, method, requestBody });
    cache.set(id, { data, time: Date.now() });

    return data;
}

async function fetchEngageData({ id, absoluteURL, method, requestBody }) {
    // create the headers needed for this request and build the request, add the user JWT to the request
    let headerParams = new Headers();
    headerParams.append('Accept', 'application/json, text/plain, */*');
    headerParams.append('Authorization', `Bearer ${getUserJWT()}`);

    // change to using the supplied method instead of hardcoded get
    const request = new Request(absoluteURL, {
        headers: headerParams,
        method: method,
        body: (method === 'POST') ? requestBody : null
    });

    // preform the fetch or a return an error with the response text
    const response = await fetch(request);
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
}

/**
 * Helper function to check cache expiry
 * @param {number} cacheTime UNIX timestamp in seconds
 */
const isExpired = (cacheTime) => {
    const currentTimeInSeconds = Math.round(Date.now() / 1000);
    const timePassed = currentTimeInSeconds - cacheTime;
    return timePassed > (cacheExpiration || 300); // default to 5 minutes if no expiration is set
};

const getUserJWT = () => {
    return 'JWT_TOKEN'
}
