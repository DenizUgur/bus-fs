fetch("/serve/test", {
	method: "POST",
	credentials: "include",
})
	.then((done) => {
		window.location = "/serve/download";
	})
	.catch((err) => {
		window.location = "/serve/download";
	});
