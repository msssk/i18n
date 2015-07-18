import DateObject from 'dojo-core/DateObject';
import has from 'dojo-core/has';
import load, { Require } from 'dojo-core/load';
import Promise from 'dojo-core/Promise';
import coreRequest from 'dojo-core/request';
import Globalize = require('globalize');
import Cldr = require('cldrjs');

declare var require: Require;
declare var define: any;

export const systemLocale: string = (function () {
	let systemLocale: string;
	if (has('host-browser')) {
		systemLocale = navigator.language;
	}
	else if (has('host-node')) {
		systemLocale = process.env.LANG;
	}
	if (!systemLocale) {
		systemLocale = 'en';
	}
	return systemLocale;
})();

const getJson: (...paths: string[]) => Promise<{}[]> = (function () {
	if (has('host-node')) {
		return function (...paths: string[]): Promise<{}[]> {
			return load(require, ...paths);
		};
	}
	else if (typeof define === 'function' && define.amd) {
		return function (...paths: string[]): Promise<{}[]> {
			return load(require, 'dojo-core/request').then(function ([ request ]: [ typeof coreRequest ]): Promise<{}> {
				return Promise.all(paths.map(function (path: string): Promise<{}> {
					return request.get(path + '.json', { responseType: 'json' }).then(function (response) {
						return response.data;
					});
				}));
			});
		};
	}
	else {
		throw new Error('Unknown loader');
	}
})();

function loadCldrData(locale: string, paths: string[]): Promise<any> {
	if (paths.indexOf('cldr-data/supplemental/likelySubtags') === -1) {
		paths.unshift('cldr-data/supplemental/likelySubtags');
	}
	return null;
}

interface AvailableLocales {
	availableLocales: string[];
}

let parentDataPromise: Promise<any>;
function getCldrLocale(locale: string = systemLocale): Promise<string> {
	if (!parentDataPromise) {
		parentDataPromise = getJson(
			'cldr-data/availableLocales',
			'cldr-data/supplemental/likelySubtags',
			'cldr-data/supplemental/parentLocales'
		).then(function ([ available, subtags, parents ]: [ AvailableLocales, {}, {} ]) {
			Cldr.load(subtags, parents);
			available.availableLocales.splice(available.availableLocales.indexOf('root'), 1);
			(<any> Cldr)._availableBundleMapQueue = available.availableLocales;
			return Cldr;
		});
	}
	return parentDataPromise.then(function (Cldr) {
		return new Cldr(locale).attributes.bundle;
	});
}

export interface Options {
	bundles?: string[];
	locale?: string;
	require?: Require;
}

export default class I18n {
	bundles: string[];
	locale: string;
	require: Require;
	systemLocale: string;

	protected globalize: Globalize;

	constructor(options?: Options) {
		this.locale = options && options.locale; // TODO: || systemLocale?
		this.globalize = new Globalize(this.locale || this.systemLocale);
	}

	load(): Promise<void> {
		return getCldrLocale(this.locale).then(function () {
			var locale = this.locale;

			return getJson(
				'cldr-data/supplemental/currencyData.json',
				'cldr-data/supplemental/numberingSystems.json',
				'cldr-data/supplemental/ordinals.json',
				'cldr-data/supplemental/plurals.json',
				'cldr-data/supplemental/timeData.json',
				'cldr-data/supplemental/weekData.json',
				`cldr-data/main/${locale}/ca-gregorian.json`,
				`cldr-data/main/${locale}/currencies.json`,
				`cldr-data/main/${locale}/dateFields.json`,
				`cldr-data/main/${locale}/numbers.json`,
				`cldr-data/main/${locale}/timeZoneNames.json`
			).then(function (...cldrData: any[]) {
				Globalize.load(...cldrData);
			});
		});
	}

	formatCurrency(amount: number, currency: string, options?: Globalize.NumberOptions): string {
		return this.globalize.formatCurrency(amount, currency, options);
	}
	formatDate(date: DateObject, options?: Globalize.DateOptions): string {
		return this.globalize.formatDate(new Date(date.time), options);
	}
	formatNumber(number: number, options?: Globalize.NumberOptions): string {
		return this.globalize.formatNumber(number, options);
	}
	formatRelativeTime(value: number, unit: string, options?: Globalize.TimeOptions): string {
		return this.globalize.formatRelativeTime(value, unit, options);
	}

	getMessage(messageId: string, ...variables: any[]): string {
		return this.globalize.formatMessage(messageId, ...variables);
	}
	loadBundle(bundle: string): Promise<void> {
		return null;
	}

	parseDate(date: string, options?: Globalize.DateOptions): DateObject {
		return new DateObject(this.globalize.parseDate(date, options));
	}
	parseNumber(string: string, options?: Globalize.NumberOptions): number {
		return this.globalize.parseNumber(string, options);
	}

	pluralize(value: number, options?: Globalize.PluralOptions): string {
		return this.globalize.plural(value, options);
	}
}
I18n.prototype.systemLocale = systemLocale;
