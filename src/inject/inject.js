let a11yTree;

chrome.extension.sendMessage({}, function (response) {
	var readyStateCheckInterval = setInterval(function () {
		if (document.readyState === "complete") {
			clearInterval(readyStateCheckInterval);
			console.log("Accessibility tree extension was injected.");
		}
	}, 10);
});

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {

	if(msg.action == "scrollTop") {
		document.scrollingElement.scrollTop = 0;
		clearRectContainer();
		enableShortcuts();
		sendResponse({msg: "Done!"});
	}

	if(msg.action == "a11yTree") {
		console.log("Received tree background ", msg.a11yTree);
		sendResponse({msg: "Thank you!"});
		a11yTree = msg.a11yTree;
		showTextRect(msg.a11yTree);
	}
	
});


function showLandmarksRect(a11yNode, showChildren = false){
	if(typeof a11yNode !== "object") {
		return;
	}
	if(!showChildren 
		&& ["banner", "navigation", "main", "complementary", "search", "contentInfo", "form", "region"].includes(a11yNode.role)
		&& !a11yNode.isRootNode
		) {
		createRects(a11yNode);
	} 
	if(Array.isArray(a11yNode.children) && a11yNode.children.length) {
		a11yNode.children.forEach(node => {
			showLandmarksRect(node);
		});
	}
}

function showTextRect(a11yNode, showChildren = false){
	if(typeof a11yNode !== "object") {
		return;
	}
	if(!showChildren 
		&& (["staticText", "heading", "link", "button", "input"].includes(a11yNode.role) || ("name" in a11yNode &&  a11yNode.name.trim() !== "")) 
		&& (!["lineBreak", "genericContainer"].includes(a11yNode.role))
		&& !a11yNode.isRootNode
		) {
		createRects(a11yNode);
	} else if(Array.isArray(a11yNode.children) && a11yNode.children.length) {
		a11yNode.children.forEach(node => {
			showTextRect(node);
		});
	}
}

function showTextWithoutPseudoRect(a11yNode, showChildren = false){
	if(typeof a11yNode !== "object") {
		return;
	}
	if(!showChildren 
		&& (["staticText", "heading", "link", "button", "input"].includes(a11yNode.role) || ("name" in a11yNode && a11yNode.name.trim() !== "")) 
		&& (!["lineBreak", "genericContainer"].includes(a11yNode.role))
		&& !a11yNode.isRootNode
		) {
		createRects(a11yNode);
	} else if(Array.isArray(a11yNode.children) && a11yNode.children.length && (a11yNode.htmlTag || "").indexOf("<pseudo:") === -1) {
		a11yNode.children.forEach(node => {
			showTextWithoutPseudoRect(node);
		});
	}
}

function getRectsContainer(){
	let el_0, el_0_attr;
	if(!(el_0 = document.getElementById("a11yContainer"))){
		el_0 = document.createElement("div");
		el_0_attr = document.createAttribute("id");
		el_0_attr.value = "a11yContainer";
		el_0.setAttributeNode(el_0_attr);
		document.body.appendChild(el_0);
	}
	return el_0;
}

function clearRectContainer(){
	getRectsContainer().parentNode.removeChild(getRectsContainer());
}

function toggleRectsConatinerTransparent(){
	const container = getRectsContainer();
	if(container.style.pointerEvents === "none"){
		container.style.pointerEvents = "auto";
		return false;
	}else{
		container.style.pointerEvents = "none";
		return true;
	}
}

function createRects(a11yNode) {
	let el_0, el_1, el_1_attr, locationStyle = "";

	for(let k in a11yNode.unclippedLocation) {
		locationStyle += `${k}: ${a11yNode.unclippedLocation[k]}px; `
	}
	el_0 = getRectsContainer();
	el_1 = document.createElement("div");
	el_1_attr = document.createAttribute("class");
	el_1_attr.value = "a11y-rect a11y-" + a11yNode.role;
	el_1.setAttributeNode(el_1_attr);
	el_1_attr = document.createAttribute("style");
	el_1_attr.value = locationStyle;
	el_1.setAttributeNode(el_1_attr);
	el_1_attr = document.createAttribute("title");
	el_1_attr.value = getRectTitle(a11yNode);
	el_1.setAttributeNode(el_1_attr);

	el_1.addEventListener("click", function() {
		if(!this.dataset.hasChildren){
			showTextRect(a11yNode, true);
			this.dataset.hasChildren = true
		}

		console.log(a11yNode);
	});

	el_0.appendChild(el_1);
}

function getRectTitle(a11yNode) {
	let title = `[${a11yNode.language}] `;
	if(a11yNode.htmlTag) {
		title += `<${a11yNode.htmlTag}`;
		if(a11yNode.htmlTag === "a") {
			title += `:${a11yNode.url}`;
		}
		if(a11yNode.htmlTag === "input") {
			title += `:${a11yNode.htmlAttributes.type}`;
		}
		title += `> `
	}
	title += a11yNode.name? a11yNode.name : "[no-content]";
	return title;
}

function enableShortcuts(){
	const handleShortcuts = function(event){
		let notification = "";
		switch(event.code){
			case "KeyL":
				clearRectContainer();
				showLandmarksRect(a11yTree);
				notification = "Pressed L: Showing landmarks";
				break;
			case "KeyP":
				clearRectContainer();
				showTextRect(a11yTree);
				notification = "Pressed P: Showing full content";
				break;
			case "KeyC":
				clearRectContainer();
				showTextWithoutPseudoRect(a11yTree);
				notification = "Pressed C: Showing content without pseudo elements";
				break;
			case "KeyT":
				notification = toggleRectsConatinerTransparent()? "Pressed T: Transparent ON" : "Pressed T: Transparent OFF";
				break;
			case "KeyH":
				clearRectContainer();
				notification = "Pressed H: Hide accessibility layers";
				break;
		}
		notification !=="" && showNotification(notification, 2000);
	};
	window.removeEventListener("keypress", handleShortcuts);
	window.addEventListener("keypress", handleShortcuts);
}

function showNotification(title, closeTimeout){
	chrome.runtime.sendMessage({action: "showNotification", options: { 
		type: "basic", 
		title,
		closeTimeout
	}});
}