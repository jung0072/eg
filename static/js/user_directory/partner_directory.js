var lastData;

document.addEventListener('DOMContentLoaded', () => {
    const pageTitle = document.querySelector(".page-title").textContent;
    console.log(`This is the current page: ${pageTitle}`);
    // just adding the listeners to the buttons, if we are on the researcher/patient directory page
    if (pageTitle === "Researcher Directory" || "Patient Directory") {

        function addListeners() {
            //targeting the elements
            const patientButton = document.querySelector(".patient-select");
            const researcherButton = document.querySelector(".researcher-select");
            const searchValue = document.querySelector(".search-bar #search");
            const sortBy = document.querySelector(".sort-by-div #sort-by");

            //adding an active class to the page the user is in
            if (pageTitle === "Researcher Directory") {
                researcherButton?.classList.add("active");
            } else {
                patientButton?.classList.add("active");
            }

            //adding click listeners and adding/removing the class to the active page to the buttons
            researcherButton?.addEventListener("click", event => {
                event.currentTarget.classList.add("active");
                patientButton?.classList.remove("active");
            });

            patientButton?.addEventListener("click", event => {
                event.currentTarget.classList.add("active");
                researcherButton.classList.remove("active");
            });

            //adding a listener to the searchBar to filter the array of researchers
            searchValue.addEventListener("input", event => {
                filterCards(event);
            });

            sortBy.addEventListener("change", event => {
                displayCards(lastData);
            });

        }

        function displayCards(data) {
            // Sort the data
            let sortMethod = document.querySelector(".sort-by-div #sort-by").value;
            if (sortMethod === "role") data.sort((a, b) => a.role > b.role);
            else if (sortMethod === "location") data.sort((a, b) => a.city > b.city);
            else data.sort((a, b) => a.first_name + a.last_name > b.first_name + b.last_name);

            //this function is responsible to display the cards on the page
            document.querySelector(".researchers-list").innerHTML = data.map(researcher => {
                return `<div class="researcher-card content-card">
                <img class="card-picture" alt="profile avatar" src="/app/profile/${researcher.username}/image/" >
                <div class="card-information">
                <div class="card-header">
                    <p class="researcher-title"> ${researcher.first_name}  ${researcher.last_name}. </p>
                    <p class="researcher-role"> ${researcher.role} - ${researcher.city} </p>
                </div>
                <div class="card-content">
                    <p class="researcher-interests-title" >Research Interests: </p>
                    <div class="researcher-interests">
                            ${researcher.research_interests.map(interest => {
                    return `<div class="interest-chips">
                                <p>${interest}</p>
                            </div>`;
                }).join('')}
                        <p>More...</p>
                    </div>
                </div>
                <div class="card-footer buttons-container">
                    <button class="action main researcher-card-button1">Send Message</button>
                    <a href="/app/profile/${researcher.user}/">
                        <button class="action main researcher-card-button2">View Profile</button>
                    </a>
                </div>
            </div>
            </div>`;
            }).join(' ');
        }

        function filterCards(ev) {
            //this is a callback function that will be called to filter the cards
            // by what the user types on the search bar
            const searchValue = ev.currentTarget.value.toLowerCase();
            // filtering the users by first or last name
            const filteredData = lastData.filter(researcher => {
                return (
                    researcher.first_name.toLowerCase().includes(searchValue) ||
                    researcher.last_name.toLowerCase().includes(searchValue) ||
                    researcher.city.toLowerCase().includes(searchValue) ||
                    researcher.role.toLowerCase().includes(searchValue) ||
                    researcher.research_interests.map(interest => interest.toLowerCase())
                        .includes(searchValue)
                );
            });

            // re-rendering the list of cards on the page
            displayCards(filteredData);
        }

        //parsing the json that is fetched from the DB
        // TODO: request the data from the backend
        const requestHeaders = (pageTitle === "Researcher Directory")
            ? {}
            : { 'X-REQUEST-PATIENT-LIST': true };

        sendFetchRequest({
            url: '/app/partner_directory',
            method: 'GET',
            headers: requestHeaders,
            callback: ({ data }) => {
                if (data) {
                    addListeners();
                    //displaying the cards once the page loads and we have data to being displayed.
                    lastData = data;
                    displayCards(data);
                }
            },
            onFail: (error) => {
                console.error("There was an error retrieving the User Directory List", error);
            }
        });

    }
});
