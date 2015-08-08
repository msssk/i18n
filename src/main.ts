import DateObject from 'dojo-core/DateObject';
import has from 'dojo-core/has';
import load, { Require } from 'dojo-core/load';
import Promise from 'dojo-core/Promise';
import coreRequest from 'dojo-core/request';
import Globalize = require('globalize');
import GlobalizeCurrency = require('globalize/currency'); GlobalizeCurrency;
import GlobalizeDate = require('globalize/date'); GlobalizeDate;
import GlobalizeMessage = require('globalize/message'); GlobalizeMessage;
import GlobalizeNumber = require('globalize/number'); GlobalizeNumber;
import GlobalizePlural = require('globalize/plural'); GlobalizePlural;
import GlobalizeRelativeTime = require('globalize/relative-time'); GlobalizeRelativeTime;
import Cldr = require('cldr/unresolved');

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
			return load('dojo-core/request').then(function ([ request ]: [ { default: typeof coreRequest } ]): Promise<{}> {
				return Promise.all(paths.map(function (path: string): Promise<{}> {
					return request.default.get(path + '.json', { responseType: 'json' }).then(function (response) {
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
			(<any> require).toUrl('cldr-data/availableLocales'),
			(<any> require).toUrl('cldr-data/supplemental/likelySubtags'),
			(<any> require).toUrl('cldr-data/supplemental/parentLocales')
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
		this.locale = options && options.locale; // TODO: || this.systemLocale?
		this.globalize = new Globalize(this.locale || this.systemLocale);
	}

	static load(locale: string = systemLocale): Promise<void> {
		return new Promise<void>(function (resolve, reject) {
			getCldrLocale(locale).then(function () {
				return getJson(
					(<any> require).toUrl('cldr-data/supplemental/currencyData'),
					(<any> require).toUrl('cldr-data/supplemental/numberingSystems'),
					(<any> require).toUrl('cldr-data/supplemental/ordinals'),
					(<any> require).toUrl('cldr-data/supplemental/plurals'),
					(<any> require).toUrl('cldr-data/supplemental/timeData'),
					(<any> require).toUrl('cldr-data/supplemental/weekData'),
					(<any> require).toUrl(`cldr-data/main/${locale}/ca-gregorian`),
					(<any> require).toUrl(`cldr-data/main/${locale}/currencies`),
					(<any> require).toUrl(`cldr-data/main/${locale}/dateFields`),
					(<any> require).toUrl(`cldr-data/main/${locale}/numbers`),
					(<any> require).toUrl(`cldr-data/main/${locale}/timeZoneNames`)
				);
			}).then(function (...cldrData: any[]) {
				Globalize.load(...cldrData);
				resolve();
			}).catch(function (error: Error) {
				reject(error);
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
