Ractive.js minmaxwidth decorator
=======================================

*Find more Ractive.js plugins at [ractivejs.org/plugins](http://ractivejs.org/plugins)*

[See the demo here.](http://cfenzo.github.io/Ractive-decorators-minmaxwidth/)

Usage
-----

Include this file on your page below Ractive, e.g:

```html
<script src='lib/Ractive.js'></script>
<script src='lib/Ractive-decorators-minmaxwidth.js'></script>
```

Or, if you're using a module loader, require this module:

```js
// requiring the plugin will 'activate' it - no need to use the return value
require( 'Ractive-decorators-minmaxwidth' );
```

Add the decorator in your template with one or more of these options:

* `min` Array of min-widths (or single width) to match against [optional]
* `max` Array of max-widths (or single width) to match against [optional]
* `keypath` Keypath to use for setting the current width in the Ractive instance [optional]

```html
<div class="item" decorator="minmaxwidth:{min:[100,200],max:200,keypath:'my_width'}">
    {{my_width}}
</div>
```

The decorator will add `data-min-width` and `data-max-width` attributes holding a space-delimited list of matched min/max values, and set the given keypath to the current width (not just if it matches one of the min/max values):

```html
<div class="item" data-min-width="100 200" data-max-width="200">200</div>
```

You then use the `~=` attribute-selector to write styles targeting the specific min/max values:
```css
.item[data-min-width~="100"] {
  ...
}
```

**It's recommended to use a className with the attribute-selector, so your CSS rules don't match more elements than it should.**

[See the demo with more CSS examples here.](http://cfenzo.github.io/Ractive-decorators-minmaxwidth/)



License
-------

Based on [this hitch plugin from François REMY (FremyCompany)](https://github.com/FremyCompany/prollyfill-min-width/)

Copyright (c) 2014 Jens Anders Bakke. Licensed MIT

Created with the [Ractive.js plugin template](https://github.com/RactiveJS/Plugin-template) for Grunt.