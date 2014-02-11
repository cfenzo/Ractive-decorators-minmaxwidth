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

* min - an array of numbers or a single number (optional)
* max - an array of numbers or a single number (optional)
* key - the keypath to use for setting the current width on the Ractive instance (optional)

```html
<div class="item" decorator="minmaxwidth:{min:[100,200],max:200,key:'my_width'}">
    {{my_width}}
</div>
```

The decorator will add data-attributes for every matched min/max value, and set the given keypath to the current width (not just if it matches one of the min/max values):

```html
<div class="item" data-min-width="100 200" data-max-width="200">200</div>
```

You then use the ~= attribute-selector to write styles targeting specific breakpoints:
```css
.item[data-min-width~="100"] {
  ...
}
```

NOTE! it's adviced to use a classname with the attribute-selector, so your CSS rules don't match more elements than it should.



License
-------

Based on [this hitch plugin from François REMY (FremyCompany)](https://github.com/FremyCompany/prollyfill-min-width/)

Copyright (c) 2014 Jens Anders Bakke. Licensed MIT

Created with the [Ractive.js plugin template](https://github.com/RactiveJS/Plugin-template) for Grunt.