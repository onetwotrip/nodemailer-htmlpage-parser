var juice = require('juice');
var jsdom = require('jsdom').jsdom;
var request = require('request');
var url = require('url');
var Promise = require('promise');
var path = require('path');
var md5 = require('MD5');

var compiler = function (href, callback) {
	var Browser = require("zombie"),
	    browser = Browser.create({
	    	silent: true,
	    	maxWait: 60,
	    	loadCSS: false
	    });

	browser.visit(href, function (error) {
		function loaded (window) {
			return !window.EmailGenerator.Router.router.activeTransition;
		};

		function waitForLoaded() {
			if (browser.evaluate('EmailGenerator.Router.router.activeTransition')) {
				browser.wait(loaded, waitForLoaded);
			} else {
				parseHTML(href, browser.html(), callback);
			}
		};

		waitForLoaded();
	});


	// var phantomjs = require('phantomjs');
	// var binPath = phantomjs.path;
	// var childProcess = require('child_process');

	// var childArgs = [
	//   path.join(__dirname, 'html.js'),
	//   href
	// ];

	// childProcess.execFile(binPath, childArgs, function (err, html) {
	// 	parseHTML(href, html, callback);
	// });

};

var parseHTML = function (href, html, callback) {
	var css = [],
	    html = jsdom(html),
	    cssSources = html.querySelectorAll('link[rel=stylesheet],style,link[type="text/css"]'),
	    base = html.querySelector('base'),
	    baseHref = href;

	if (base) {
		baseHref = url.resolve(href, base.getAttribute('href'));
	}

	Promise.all(
		Array.prototype.map.call(cssSources, function (cssSource) {
			return new Promise(function (resolve, reject) {
				if (cssSource.tagName === 'STYLE') {
					resolve(cssSource.innerText || '');
				} else if (cssSource.tagName === 'LINK') {
					request({
						url: url.resolve(baseHref, cssSource.href),
						gzip: true
					}, function (err, response) {
						if (!err) {
							resolve(response.body);
						} else {
							resolve('');
						}
					});
				} else {
					resolve('');
				}
			});
		})
	).then(function (css) {
		css = css.join(' ');

		Array.prototype.forEach.call(html.querySelectorAll('script'), function (el) {
			el.parentNode.removeChild(el);
		});

		html = juice.inlineContent(html.documentElement.outerHTML, css);
		html = jsdom(html);

		Array.prototype.forEach.call(html.querySelectorAll('link,style,base'), function (el) {
			el.parentNode.removeChild(el);
		});
		Array.prototype.forEach.call(html.querySelectorAll('[id]'), function (el) {
			el.removeAttribute('id');
		});
		Array.prototype.forEach.call(html.querySelectorAll('[class]'), function (el) {
			el.removeAttribute('class');
		});


		var attachments = [],
		    hashes = {};

		var attach = function (image) {
			image = url.resolve(href, image);
			var hash = md5(image);

			if (!hashes[hash]) {
				attachments.push({
					path: image,
					cid: hash,
					filename: path.basename(image)
				});

				hashes[hash] = true;
			}

			return hash;
		};

		Array.prototype.forEach.call(html.querySelectorAll('[style*="url("]'), function (el) {
			var style = el.getAttribute('style');
			style = style.replace(/url\(([^\)]+)/, function(all, image){
				return 'url(cid:' + attach(image);
			});
			el.setAttribute('style', style);
		});

		Array.prototype.forEach.call(html.querySelectorAll('img'), function (el) {
			var image = el.getAttribute('src');
			el.setAttribute('src', 'cid:' + attach(image));
		});

		html = html.documentElement.outerHTML;

		callback(undefined, {
			html: html,
			attachments: attachments
		});
	});
};


module.exports = compiler;

