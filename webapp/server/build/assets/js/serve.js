var callback = function () {
	var path = window.location.pathname.split("/");
	window.location = "/serve/download/" + path[path.length - 1];
};

if (
	document.readyState === "complete" ||
	(document.readyState !== "loading" && !document.documentElement.doScroll)
) {
	callback();
} else {
	document.addEventListener("DOMContentLoaded", callback);
}
