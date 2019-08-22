/*jslint indent: 2 */
/*global browser, document, setTimeout, console*/


/**
 * This function retrieves the trello board id from the url provided.
 * @param {*} url the browsers current trello board url
 * @param {*} callback the send response is a callback function that sends back the boardid
 */
function parseTrelloBoardId(url, callback) {
    'use strict';
    var trelloBoardId = '',
        patt = new RegExp(/https:\/\/*.trello.com\/b\/([\w\d]+)/i),
        matches = patt.exec(url);
    if (matches !== null) {
        trelloBoardId = matches[1];
    } else {
        trelloBoardId = '';
    }
    callback({ response: trelloBoardId.toString() });
}

/**
 * This function determines if we are currently in the correct trello domain. This controls
 * whether or not the tab updated event should attempt to set the background.
 * @param {*} url the current browsers current url
 * @param {*} callback a callback function to run if we are indeed in the trello domain.
 */
function inTheTrelloDomain(url, callback) {
    'use strict';
    var patt = new RegExp(/https:\/\/*.trello.com\/b\//i),
        match = patt.exec(url);
    if (match !== null) {
        callback();
    }
}

/**
 * This function initializes the storage for the board image urls. Previously I was
 * constantly checking if the array had been initialized i have since made so we only have to check in one area.
 */
function initTrellozenLocalStorage() {
    browser.storage.local.get(["backgroundsBoardList"],
        function (item) {
            let isTrellozenLocalStorageInit = typeof item.backgroundsBoardList === 'undefined';
            if (isTrellozenLocalStorageInit) {
                browser.storage.local.set({ backgroundsBoardList: [] }, function () {
                    console.log('The storage array has been initialized.');
                });
            }
        });
}

/**
 * This function is my handler function for the user's tab url is changed, due to the
 * way some websites behave like Trello for example, you cannot rely on the document ready function to run code
 * each time the user clicks something. This allows better control execution of the background image and board tiles.
 * @param {*} tabId the current tabid
 * @param {*} changeInfo a object with some helpful attributes/values
 * @param {*} tab the current tab object
 */
function handleTabOnUpdated(tabId, changeInfo, tab) {
    'use strict';
    if (changeInfo.status === 'complete' && tab.status === 'complete') {
        inTheTrelloDomain(tab.url, function () {

            initTrellozenLocalStorage();

            var actionObj = { action: "getAndSetTheBackgroundImage" },
                action2Obj = { action: "setBoardTiles" };


            browser.tabs.sendMessage(tabId, actionObj);
            // browser.tabs.sendMessage(tabId, action2Obj);

        });
    }
}

// assigning the function as a listener
if (browser.tabs.onUpdated.hasListener(handleTabOnUpdated) === false) {
    browser.tabs.onUpdated.addListener(
        handleTabOnUpdated,
        {
            urls: ['https://*.trello.com/b/*'],
            properties: ['status']
        });
}

/**
 * This function receives messages from content.js
 * Recieves a object with a action, the action determines what happens.
 * @param request: a object containing a action and other values.
 * @param {?} sender
 * @param sendResponse: a value that is consumed by the requestee.
 * @return void
 */
function handleMessage_background(request, sender, sendResponse) {
    'use strict';
    if (request.action === 'PARSE_BOARD_ID') {
        parseTrelloBoardId(request.obj, sendResponse);
    } else if (request.action === 'SET_HAS_BG_IMAGE_BEEN_SET') {
        setHasBgImageBeenSet(request.obj, sendResponse);
    } else if (request.action === 'GET_HAS_BG_IMAGE_BEEN_SET') {
        getHasBgImageBeenSet(sendResponse);
    }
}

// assigning the function as a listener
if (browser.runtime.onMessage.hasListener(handleMessage_background) === false) {
    browser.runtime.onMessage.addListener(handleMessage_background);
}
