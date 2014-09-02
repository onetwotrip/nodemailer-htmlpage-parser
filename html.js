var page = require('webpage').create(),
    system = require('system');

page.open(system.args[1], function(status) {
	if (status === 'success') {
		waitForEmberReady(function () {
			html = page.evaluate(function() {
				return document.documentElement.outerHTML;
			});

			console.log(html);
			phantom.exit();
		});
	} else {
		phantom.exit(1);
	}

});


function waitFor ($config) {
    $config._start = $config._start || new Date();

    if ($config.timeout && new Date - $config._start > $config.timeout) {
        if ($config.error) $config.error();
        if ($config.debug) console.log('timedout ' + (new Date - $config._start) + 'ms');
        return;
    }

    if ($config.check()) {
        if ($config.debug) console.log('success ' + (new Date - $config._start) + 'ms');
        return $config.success();
    }

    setTimeout(waitFor, $config.interval || 50, $config);
};

function waitForEmberReady (callback) {
	waitFor({
		debug: false,
		timeout: 20000,
		check: function () {
		    return page.evaluate(function() {
		        return !window.EmailGenerator.Router.router.activeTransition;
		    });
		},
		success: callback,
		error: function () {
			phantom.exit(1);
		}
	});
};
