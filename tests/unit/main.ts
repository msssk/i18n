import DateObject from 'dojo-core/DateObject';
import { Require } from 'dojo-loader/loader';
import registerSuite = require('intern!object');
import assert = require('intern/chai!assert');
import I18n from 'src/main';

declare var require: Require;

let i18n:I18n;
let dateObject = new DateObject(new Date(2015, 7, 7));

registerSuite({
	name: 'main',

	systemLocale() {
		assert.ok(I18n.prototype.systemLocale);
	},

	// TODO: subsequent tests are dependent on this one
	'load and constructor'() {
		// TODO: 'en-US' is not a thing in cldr-data
		// systemLocale (from browser) is 'en-US'; use 'en' instead
		return I18n.load('en').then(function () {
			i18n = new I18n({ locale: 'en' });
			assert.strictEqual(i18n.locale, 'en', 'Locale property should be set');
		});
	},

	formatCurrency() {
		assert.strictEqual(i18n.formatCurrency(5.3605, 'USD'), '$5.36');
	},

	formatDate() {
		assert.strictEqual(i18n.formatDate(dateObject), '8/7/2015');
	},

	formatNumber() {
		assert.strictEqual(i18n.formatNumber(5.3605), '5.361');
	},

	formatRelativeTime() {
		assert.strictEqual(i18n.formatRelativeTime(-1, 'day'), 'yesterday');
	},

	'loadBundle and getMessage'() {
		return i18n.loadBundle(require.toUrl('../data/messages/colors')).then(function () {
			assert.strictEqual(i18n.getMessage('red'), 'maroon');
		});
	},

	parseDate() {
		assert.strictEqual(dateObject.compareDate(i18n.parseDate('8/7/2015')), 0);
	},

	parseNumber() {
		assert.strictEqual(i18n.parseNumber('5.361'), 5.361);
	},

	pluralize() {
		assert.strictEqual(i18n.pluralize(3, { type: 'ordinal' }), 'few');
	}
});
