


# Dojo 2 i18n#
## Package: `dojo/i18n`##

## Dependencies ##

Dojo's i18n module is built on existing standards and solutions for i18n.

* [cldrjs](https://github.com/rxaviers/cldrjs)
	* Manages [CLDR](http:/cldr.unicode.org) data, which is common localization data for things like dates, currency, numbers.
* [cldr-data](https://www.npmjs.com/package/cldr-data)
	* CLDR data in JSON format.
* [jquery/globalize](https://github.com/jquery/globalize)
	* `cldrjs` provides a very low-level API for managing CLDR data that would be unpleasant and verbose to use in application code. `globalize` provides convenient methods for localization, e.g. `formatDate(), formatNumber()`.
* [messageformat](https://github.com/SlexAxton/messageformat.js)
	* Formats messages; used by `globalize`

## FAQ ##

 1. What is `en_001`?
	 * http://cldr.unicode.org/development/development-process/design-proposals/english-inheritance
 1. What is `en-GB-u-kn-true`?
	* [Unicode extensions for BCP 47](http://cldr.unicode.org/index/bcp47-extension)
	* [technical standard](http://www.unicode.org/reports/tr35/#u_Extension)
 1. How do I pick the right language identifier?
	* http://cldr.unicode.org/index/cldr-spec/picking-the-right-language-code

## Other solutions ##

TODO: discussion/evaluation/comparison of other stuff?

* https://github.com/twitter/twitter-cldr-js
* http://formatjs.io/

## Problem to solve ##

How do we load all bundles for a language (locale?)?

Expected file structure is:

	app/
		messsages/
			root/
				messages.json
			en/
				messages.json
			en-GB/
				messages.json

So for `en-GB` we would have to load all 3 bundles. [Aside: `cldrjs` has the module `cldrjs/unresolved` to handle "unresolved" data. Unresolved data is not data that has not been loaded - it has been loaded, but it is not formatted in the way `cldrjs` likes. As far as I can tell there is no mechanism in `cldrjs` or `globalize` for auto-loading message bundles or CLDR resources.]

This talks about bundle lookup, but it's a bit hard to follow (in part because it refers to files in CLDR that don't exist!]:
https://github.com/rxaviers/cldrjs/blob/master/doc/bundle_lookup_matcher.md

Here's a discussion Bryan Forbes started with `cldrjs`:
https://github.com/rxaviers/cldrjs/issues/30

Having looked in `likelySubtags` and `parentLocales` (in `cldr-data/supplemental`) I don't see how they are useful for this problem.

We could do Dojo's old approach and just guess that a bundle is available at each level and try to load it, ignoring 404s, e.g for `en-GB`:

	request('app/messages/root/messages.json')
	request('app/messages/en/messages.json')
	request('app/messages/en-GB/messages.json')

and for `en-US`:

	request('app/messages/root/messages.json')
	request('app/messages/en/messages.json')
	request('app/messages/en-US/messages.json') [=> 404]

This is a bit ugly. If the response size for 404s is an issue, we could issue `HEAD` requests... but in that case we're always sending two requests for resources that do exist.

We could also extend the message format to do what Dojo 1 currently does, which is to specify all available locales in the root bundle. Bryan is not entirely happy with this approach since it results in some magic during the build process.
