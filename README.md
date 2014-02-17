Ractive.js minmaxwidth decorator
=======================================

*Find more Ractive.js plugins at [ractivejs.org/plugins](http://ractivejs.org/plugins)*

[See the demo here.](http://cfenzo.github.io/Ractive-decorators-minmaxwidth/)

This decorator provides **"Element Media Queries"** by setting *data-attributes* based on the provided `breakpoints`.
It will also set the current width as a variable on the Ractive instance when a `keypath` is provided.
```html
<div class="item" decorator="minmaxwidth:[100,200],'keypath'">
    Something something {{keypath}}
</div>
```

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

### A single breakpoint
```html
<div class="item" decorator="minmaxwidth:100">
    html content
</div>
```

### An array of breakpoints
```html
<div class="item" decorator="minmaxwidth:[100,200]">
    html content
</div>
```

### A single breakpoint and a keypath
```html
<div class="item" decorator="minmaxwidth:100,'my_width'">
    {{my_width}}
</div>
```

### An array of breakpoints and a keypath
```html
<div class="item" decorator="minmaxwidth:[100,200],'my_width'">
    {{my_width}}
</div>
```

### An object with one or more of these keys
* `breakpoints` Array of breakpoints (or single breakpoint) to match against, both min and max will be added based on these [optional]
* `keypath` Keypath to use for setting the current width in the Ractive instance [optional]
* ~~`min` Array of min-widths (or single width) to match against [optional]~~ (Deprecated. Can still be used, but the widths are added as `breakpoints`, and both min/max data-attributes are added pr width)
* ~~`max` Array of max-widths (or single width) to match against [optional]~~ (Deprecated. Can still be used, but the widths are added as `breakpoints`, and both min/max data-attributes are added pr width)

```html
<div class="item" decorator="minmaxwidth:{breakpoints:[100,200],keypath:'my_width'}">
    {{my_width}}
</div>
```

### Result
The decorator will add `data-min-width` and `data-max-width` attributes holding a space-delimited list of matched min/max values, and set the given `keypath` to the current width (not just if it matches one of the min/max values):

```html
<!-- Ractive template -->
<div class="item" decorator="minmaxwidth:[100,200,300],'width'">{{width}}</div>

<!-- resulting html when the width is 299px -->
<div class="item" data-min-width="100 200" data-max-width="300">299</div>
```

Using the `~=` attribute-selector you can write styles targeting the specific min/max values:
```css
.item[data-min-width~="100"] {
  ...
}
.item[data-max-width~="300"] {
  ...
}
```

**It's recommended to use a className with the attribute-selector, so your CSS rules don't match more elements than it should.**

[See the demo with more CSS examples here.](http://cfenzo.github.io/Ractive-decorators-minmaxwidth/)


Configurable defaults
-----
These decorator-defaults are exposed so they can be overwritten if needed (defaults should work fine)
```javascript
// how often the poller-fallback should poll for changes (for IE11 and other browsers with no support for onresize, over/underflow and flowchanged events on elements, uses setInterval)
Ractive.decorators.minmaxwidth.pollerInterval = 250;
// the classname used on the sensor-html (for firefox and webkit-based browsers)
Ractive.decorators.minmaxwidth.sensorClass = 'resize-sensor';
// should sensor styles be added by the script? (PS. the sensor styles must be provided, the resize listener will not work without them)
Ractive.decorators.minmaxwidth.addSensorStyles = true;
```

Known issues
-----
* "greedy" CSS that targets `div` elements inside the decorated element can cause the resize events to fail. ( See [#2](https://github.com/cfenzo/Ractive-decorators-minmaxwidth/issues/2) for more info)
* Although the `<svg>` element itself is supported (through the polling-fallback), `svg` code inside the element is not for the time being. The goal is to add this later. ( See [#4](https://github.com/cfenzo/Ractive-decorators-minmaxwidth/issues/4) for more info and progress)


License
-------

Based on [Back Alley Coder's "Cross-Browser, Event-based, Element Resize Detection"](http://www.backalleycoder.com/2013/03/18/cross-browser-event-based-element-resize-detection/)

Copyright (c) 2014 Jens Anders Bakke. Licensed MIT

Created with the [Ractive.js plugin template](https://github.com/RactiveJS/Plugin-template) for Grunt.