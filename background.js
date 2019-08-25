/*jslint indent: 2 */
/*global browser, document, setTimeout, console*/

function handleError(error) {
    var tempErrObj = { type: "ERROR", message: error };
    console.log(tempErrObj);
}

function outLog(obj) {
    var tempObj = { type: "LOG", logged: obj };
    console.log(tempObj);
}

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
    callback(trelloBoardId.toString());
}

function insertBoardCss(tabId, boardId, css) {
    browser.storage.local.get("backgroundsBoardList", function (items) {
        let boardIndex = items.backgroundsBoardList.findIndex(function (element) {
            return element.boardid.toString() === boardId.toString();
        });

        if (boardIndex !== -1) {
            browser.tabs.insertCSS(tabId, { code: css });
            setBoardTiles(tabId);
        }
    });
}

function removeBoardCss(tabId, cssArr) {
    for (let i = 0; i < cssArr.length; i++) {
        browser.tabs.removeCSS(tabId, { code: cssArr[i] });
    }
}

/**
 * This function sets the trello board tiles image links on the left area of the trello website. Iterates over the 
 * elements until a matching board id is found and sets the image, then exits the loop.
 */
function setBoardTiles(tabId) {
    'use strict';
    browser.tabs.sendMessage(tabId, { action: "SET_BOARD_MENU_TILES" }, function (response) {
        // console.log(response);
    });
}

/**
 * This function initializes the storage for the board image urls. Previously I was
 * constantly checking if the array had been initialized i have since made so we only have to check in one area.
 */
function initTrellozenLocalStorage(callback) {
    browser.storage.local.get(["backgroundsBoardList"],
        function (item) {
            let isTrellozenLocalStorageInit = typeof item.backgroundsBoardList === 'undefined';
            if (isTrellozenLocalStorageInit) {
                browser.storage.local.set({ backgroundsBoardList: [] }, function () {
                    console.log('The local storage array has been initialized successfully.');
                    callback();
                });
            } else {
                callback();
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
    initTrellozenLocalStorage(function () {
        parseTrelloBoardId(tab.url, function (parsedBoardid) {
            browser.storage.local.get("backgroundsBoardList", function (items) {

                if (changeInfo.status === 'complete') {
                    let board = items.backgroundsBoardList.find(function (element) {
                        return element.boardid.toString() === parsedBoardid.toString();
                    }),
                        boardCssArr = items.backgroundsBoardList.map(function (element) {
                            return element.css;
                        });

                    removeBoardCss(tabId, boardCssArr);

                    if (typeof board !== 'undefined') {
                        insertBoardCss(tabId, board.boardid, board.css);
                    }
                }
            });
        });
    });
}

// assigning the function as a listener
if (browser.tabs.onUpdated.hasListener(handleTabOnUpdated) === false) {
    browser.tabs.onUpdated.addListener(
        handleTabOnUpdated,
        {
            urls: ['https://*.trello.com/b/*'],
            properties: ['status'],
            windowId: browser.windows.WINDOW_ID_CURRENT
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
    switch (request.action) {
        case 'PARSE_BOARD_ID': {
            parseTrelloBoardId(request.obj, sendResponse);
            break;
        }
        case 'INSERT_CSS': {
            insertBoardCss(request.tabId, request.boardid, request.css);
            break;
        }
        case 'REMOVE_CSS': {
            removeBoardCss(request.tabId, request.cssArr);
            break;
        }
    }
}

// assigning the function as a listener
if (browser.runtime.onMessage.hasListener(handleMessage_background) === false) {
    browser.runtime.onMessage.addListener(handleMessage_background);
}