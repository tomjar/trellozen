function handleError(error) {
    var errObj = { type: "ERROR", logged: error };
    console.log(errObj);
}

// loading settings from local storage and setting the popup elements values
window.onload = function () {
    'use strict';
    browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {

        browser.runtime.sendMessage({ action: "parseboardid", obj: tabs[0].url }, function (sendparsemessage) {
            browser.storage.local.get("backgroundsBoardList", function (items) {

                for (var i = 0; i < items.backgroundsBoardList.length; i++) {
                    if (items.backgroundsBoardList[i].boardid === sendparsemessage.response) {
                        if (items.backgroundsBoardList[i].url !== '') {
                            document.getElementById('textTrelloBackgroundUrl').value = items.backgroundsBoardList[i].url;
                            return false;
                        }
                    }
                }
            });
        });
    });
};

// Due to the weird way that page action popups behave you cannot simply add a event listener to the button in question,
// basically you have to listen for any clicks coming from the popup and then determine if that thing that the user clicked 
// is the correct item, if so lets execute our logic!
document.addEventListener("click", function (event) {
    'use strict';
    if (event.target.id === "buttonSaveBackground") {
        saveBackground(event.target);
    }
});

/**
 * This function sends the necessary messages and call the logic which updates the background image and tiles for the current
 * Trello board.
 * @param {*} element the button that triggered the click
 */
function saveBackground(element) {
    'use strict';
    // getting the active tab
    browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        // getting the trello board id out of the url
        browser.runtime.sendMessage({ action: "parseboardid", obj: tabs[0].url }, function (sendparsemessage) {
            var trelloBoardId = sendparsemessage.response;
            if (trelloBoardId === '') {
                // no parsed trello boardId, just return
                handleError('No Trello boardId was parsed!');
            } else {
                // getting the storage array and adding the new bg image for this trello board
                browser.storage.local.get("backgroundsBoardList", function (items) {
                    var bgPath = document.getElementById('textTrelloBackgroundUrl').value,
                        boardBackgroundUrlObj = { url: bgPath, boardid: trelloBoardId };

                    if (boardBackgroundUrlObj.url === '') {
                        handleError('No image url was provided! Url was not saved for this board.');
                    } else {
                        items.backgroundsBoardList.push(boardBackgroundUrlObj);
                        browser.storage.local.set({ backgroundsBoardList: items.backgroundsBoardList }, function () {
                            var setBodyBgObj = { action: element.getAttribute("data-action"), backgroundpath: bgPath.value },
                                setBgTilesObj = { action: "setBoardTiles", backgroundpath: bgPath.value };

                            browser.tabs.sendMessage(tabs[0].id, setBodyBgObj);
                            browser.tabs.sendMessage(tabs[0].id, setBgTilesObj);
                        });
                    }
                });
            }
        });
    });
}