/*jslint indent: 4 */
/*global browser, document, console*/

function handleError(error) {
    var tempErrObj = { type: "ERROR", message: error };
    console.log(tempErrObj);
}

function outLog(obj) {
    var tempObj = { type: "LOG", logged: obj };
    console.log(tempObj);
}

/**
 * This method simply sets the trello boards background image.
 * @param {*} url the image url provided
 */
function setBoardBackground(url) {
    'use strict';
    if (url !== '') {
        // outLog(sendisemptymessage.response)
        document.querySelector('#classic-body').style.background = '#000 url(' + url + ') no-repeat';
        document.querySelector('#classic-body').style.backgroundSize = 'cover';
    }
}

/**
 * This function sets the trello board tiles image links on the left area of the trello website. Iterates over the 
 * elements until a matching board id is found and sets the image, then exits the loop.
 */
function setBoardTiles() {
    'use strict';
    browser.storage.local.get("backgroundsBoardList", function(items) {
        var patt = new RegExp(/\/b\/([\d\w]+)\/[\S]+/i);
        var compactBoardTilesList = document.querySelectorAll('li.compact-board-tile a.js-open-board');

        for (var i = 0; i < items.backgroundsBoardList.length; i++) {
            for (var k = 0; k < compactBoardTilesList.length; k++) {

                var temp = compactBoardTilesList[k].getAttribute('href'),
                    tempTrelloBoardId = '',
                    matches = patt.exec(temp);

                if (matches !== null) {
                    tempTrelloBoardId = matches[1];
                    if (tempTrelloBoardId === items.backgroundsBoardList[i].boardid) {
                        var listElementThumbnail =
                            compactBoardTilesList[k].querySelectorAll('span.compact-board-tile-link-thumbnail')[0];

                        listElementThumbnail.style.backgroundImage = 'url(' + items.backgroundsBoardList[i].url + ')';
                    }
                }
            }
        }
    });
}

/** 
 * This additional document ready function allows the board tiles to be set correctly. Due to the behaivor of the trello website
 * the pages do not entirely reload each time so this method will only be called once per trello session unless the user refreshes
 * the page of course.
 */
$(document).ready(function() {
    setBoardTiles();
});

/**
 * This will update the background image for the trello board by searching in the local storage for the correct image by matching the 
 * board ids.
 *
 **/
function getAndSetTheBackgroundImage() {
    'use strict';
    var url = window.location.href;
    browser.runtime.sendMessage({ action: "parseboardid", obj: url }, function(sendparseid) {
        browser.storage.local.get("backgroundsBoardList", function(items) {
            for (var i = 0; i < items.backgroundsBoardList.length; i++) {
                if (items.backgroundsBoardList[i].boardid.toLowerCase() === sendparseid.response.toLowerCase()) {
                    if (items.backgroundsBoardList[i].url !== '') {
                        setBoardBackground(items.backgroundsBoardList[i].url);
                    }
                }
            }
        });
    });
}

/**
 * This function is my message event listener that allows communication from other parts of this extension,
 *  like showme.js and background.js. 
 * @param {*} request this is a object contains the action to occur
 * @param {*} sender not used here but another parameter that contains the sender
 * @param {*} sendResponse this is a callback method, not used here but could be in the future
 */
function handleMessage_content(request, sender, sendResponse) {
    'use strict';
    if (request.action === 'getAndSetTheBackgroundImage') {
        getAndSetTheBackgroundImage();
    } else if (request.action === 'setBoardTiles') {
        setBoardTiles();
    }
}

// Assign function listener as a listener for messages from the extension.
// receives messages from showme.js and background.js to apply changes to the users browser
// after certain actions and event occur
browser.runtime.onMessage.addListener(handleMessage_content);