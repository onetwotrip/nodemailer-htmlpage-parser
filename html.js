var page = require('webpage').create(),
    system = require('system');

page.open(system.args[1], function(status) {
	if (status === 'success') {
		html = page.evaluate(function() {
			return document.documentElement.outerHTML;
		});

		console.log(html);
	}

	phantom.exit();
});

