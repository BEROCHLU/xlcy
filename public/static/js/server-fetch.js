'use strict';
/**
 * Fetches a list of Excel files from the server and populates a dropdown select element with their names.
 *
 * @function
 * @name syncGetExcelList
 * @returns {Promise} A promise that resolves when the JSON data is available.
 */
function syncGetExcelList() {
    // Use the fetch API to make a GET request to the '/xlsxlist' endpoint on the server.
    return fetch('./index.php/static/uploads', { cache: 'no-store' })
        // Parse the response as JSON data.
        .then(response => {
            if (!response.ok) {
                // エラー時もレスポンスのJSONをパースし、phpのエラー文をスローする（JSONが壊れていれば自動でcatchに流れます）
                return response.json().then(errData => {
                    throw new Error(errData.error || 'Network response was not ok');
                });
            }
            return response.json();
        })
        // Once the JSON data is available, log it to the console and populate the select element with its values.
        .then(obj => {
            const select = document.querySelector('#xlsx_file');
            const arrStrFilename = [...obj.files].sort((a, b) => a.localeCompare(b));

            arrStrFilename.forEach(strFilename => {
                const option = new Option(strFilename, strFilename);
                select.add(option);
            });
            //console.log('syncGetExcelList');
        })
        // If there's an error fetching or parsing the data, log the error to the console.
        .catch(error => console.error("Error details:", error.message));
}