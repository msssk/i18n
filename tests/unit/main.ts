import registerSuite = require('intern!object');
import assert = require('intern/chai!assert');
import I18n from 'src/main';

registerSuite({
	name: 'main',

	constructor() {
		let i18n = new I18n();
		console.log(i18n.systemLocale);
	}
});
