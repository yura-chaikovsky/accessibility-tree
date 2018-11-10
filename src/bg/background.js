chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.tabs.sendMessage(tab.id, { action: "scrollTop" }, function (response) {
        console.log(response);
        sendA11yTree(tab);
    });
    
});

function sendA11yTree(tab) {
    chrome.automation.getTree(tab.id, (rootNode) => {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
        }
        else {
            const a11yTree = cloneTree(rootNode);
            chrome.tabs.sendMessage(tab.id, { action: "a11yTree", a11yTree }, function (response) {
                console.log(response);
            });
        }
    });
}

chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
    if(request.action === "showNotification") {
        showNotification(request.options.title, request.options.closeTimeout);
    }
    sendResponse();
});

function showNotification(title, closeTimeout){
	chrome.notifications.create({
        type: 'basic',
        title,
        message: '',
        iconUrl: "icons/icon19.png"
     }, function(notificationId) {
		setTimeout(function(){
			chrome.notifications.clear(notificationId);
		}, closeTimeout)
	 });
}

function cloneTree(tree) {

    const clonedMap = new Map();

    const clone = function(tree) {
        const newTree = Array.isArray(tree) ? [] : {};
        if(clonedMap.has(tree)){
            return "[circular]";
        }
        clonedMap.set(tree, newTree);

        for(let key in tree) {
            if(["constructor"].includes(key)) {
                continue;
            } else if (key === "tableCellRowHeaders"){ //Bug in automation api extension: https://bugs.chromium.org/p/chromium/issues/detail?id=901886
                continue;
            } else if (!Array.isArray(tree) && tree[key] && tree[key].constructor && tree[key].constructor.name === "AutomationNode") {
                continue;
            } else if (typeof tree[key] === "object"){
                if(Array.isArray(tree)){
                    newTree.push(clone(tree[key]));
                } else {
                    newTree[key] = clone(tree[key]);
                }
            } else {
                newTree[key] = tree[key];
            }
        }
        return newTree;
    }

    return clone(tree);
}
