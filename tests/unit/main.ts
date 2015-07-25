import registerSuite = require('intern!object');
import assert = require('intern/chai!assert');
import I18n from 'src/main';

registerSuite({
	name: 'main',

	constructor() {
		// TODO: 'en-US' is not a thing in cldr-data
		// systemLocale (from browser) is 'en-US'; force 'en' instead
		return I18n.load('en').then(function () {
			let i18n = new I18n('en');
			console.log(i18n.systemLocale);
		});
	}
});
