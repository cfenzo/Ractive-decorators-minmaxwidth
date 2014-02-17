Ractive.js minmaxwidth decorator
=======================================

*Find more Ractive.js plugins at [ractivejs.org/plugins](http://ractivejs.org/plugins)*

[See the demo here.](http://cfenzo.github.io/Ractive-decorators-minmaxwidth/)

This decorator provides **"Element Media Queries"** by setting *data-attributes* for every matched provided breakpoint.
It will also set the current width as a variable on the Ractive instance when a `keypath` is provided.

You can then do CSS **"Element Media Queries"** by matching the *data-attributes* like this:
```css
.item[data-min-width~="100"] {
  ...
}
.item[data-max-width~="100"] {
  ...
}
```

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

Use the decorator in your template with any of the following syntaxes (explanation of the variables in the "options" syntax):

A single breakpoint:
```html
<div class="item" decorator="minmaxwidth:100">
    html content
</div>
```

An array of breakpoints:
```html
<div class="item" decorator="minmaxwidth:[100,200]">
    html content
</div>
```

A single breakpoint and a keypath:
```html
<div class="item" decorator="minmaxwidth:[100,200],'my_width'">
    {{my_width}}
</div>
```

An array of breakpoints and a keypath:
```html
<div class="item" decorator="minmaxwidth:[100,200],'my_width'">
    {{my_width}}
</div>
```

An object with one or more of these keys:
* `breakpoints` Array of breakpoints (or single breakpoint) to match against, both min and max will be added based on these [optional]
* `keypath` Keypath to use for setting the current width in the Ractive instance [optional]
* ~~`min` Array of min-widths (or single width) to match against [optional]~~ (Deprecated. Can still be used, but the widths are added as `breakpoints`, and both min/max data-attributes are added pr width)
* ~~`max` Array of max-widths (or single width) to match against [optional]~~ (Deprecated. Can still be used, but the widths are added as `breakpoints`, and both min/max data-attributes are added pr width)

```html
<div class="item" decorator="minmaxwidth:{breakpoints:[100,200],keypath:'my_width'}">
    {{my_width}}
</div>
```

The decorator will add `data-min-width` and `data-max-width` attributes holding a space-delimited list of matched min/max values, and set the given keypath to the current width (not just if it matches one of the min/max values):

```html
<div class="item" data-min-width="100" data-max-width="200">199</div>
```

You then use the `~=` attribute-selector to write styles targeting the specific min/max values:
```css
.item[data-min-width~="100"] {
  ...
}
```

**It's recommended to use a className with the attribute-selector, so your CSS rules don't match more elements than it should.**

[See the demo with more CSS examples here.](http://cfenzo.github.io/Ractive-decorators-minmaxwidth/)


Known issues
-----
* Tags without content will not trigger changes/events in Chrome and Firefox `<div decorator="minmaxwidth:300"></div>` ( See [#5](https://github.com/cfenzo/Ractive-decorators-minmaxwidth/issues/5) for more info)
* "greedy" CSS that adds targets `div` elements inside the decorated element can cause the resize events to fail ( See [#2](https://github.com/cfenzo/Ractive-decorators-minmaxwidth/issues/2) for more info)
* Although the `<svg>` element itself is supported (through polling-fallback), `svg` code inside the element is not for the time being. This will be added if possible. ( See [#4](https://github.com/cfenzo/Ractive-decorators-minmaxwidth/issues/4) for more info and progress)


License
-------

Based on [Back Alley Coder's "Cross-Browser, Event-based, Element Resize Detection"](http://www.backalleycoder.com/2013/03/18/cross-browser-event-based-element-resize-detection/)

Copyright (c) 2014 Jens Anders Bakke. Licensed MIT

Created with the [Ractive.js plugin template](https://github.com/RactiveJS/Plugin-template) for Grunt.