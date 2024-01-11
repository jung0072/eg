const addResearchProjectFormApp = {
    init: () => {
        const submitButton = document.getElementById('add-research-project-form-button');
        if (submitButton) {
            submitButton.addEventListener('click', addResearchProjectFormApp.submitAddProjectForm);
        }

        addResearchProjectFormApp.requestCities();
    },
    requestCities: () => {
        sendFetchRequest({
            url: `/app/city_list/`,
            method: 'GET',
            headers: {
                'X-CSRFToken': globalValues.CSRF_TOKEN,
                'Accept': 'application/json',
            },
            callback: (response) => {
                // first create an array from the response
                const cityList = Array.from(response?.cities);

                // set the new choices for the countries and the cities
                const countryInput = document.getElementById('id_icu_country');
                const countryOption = addResearchProjectFormApp.createOption('Canada', cityList[0]?.countryId, true);
                countryInput.appendChild(countryOption);

                // loop through all of the cities and create the options and append them to the select input as a fragment
                const cityInput = document.getElementById('id_icu_city');
                const formFragment = document.createDocumentFragment();

                cityList.forEach(city => {
                    formFragment.appendChild(addResearchProjectFormApp.createOption(
                        city.name, city.cityId, false
                    ));
                });
                cityInput.appendChild(formFragment);
            },
            onFail: (error) => {
                console.error("There was an error retrieving the list of cities", error);
            }
        });
    },
    submitAddProjectForm: (clickEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();

        const addProjectFormNode = document.getElementById('add-research-project-form');
        if (addProjectFormNode) {
            addProjectFormNode.submit();
        }
    },
    createOption: (title, value, isSelected) => {
        let optionNode = document.createElement('option');
        optionNode.textContent = title;
        optionNode.value = value;
        optionNode.selected = isSelected;
        return optionNode;
    }
};

document.addEventListener('DOMContentLoaded', addResearchProjectFormApp.init);