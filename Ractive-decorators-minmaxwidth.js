/*

	Ractive-decorators-minmaxwidth
	==============================

	Version 0.1.0.

    This decorator provides Element Media Queries by setting data-attributes for every matched min/max widths in the decorator options.
    It will also set the current width as a variable on the Ractive instance if you provide a keypath in the options.

	The resize-detection is based on http://www.backalleycoder.com/2013/03/18/cross-browser-event-based-element-resize-detection/
	with a setInterval-fallback for for browsers with none of the following events on elements:
	    - over/underflow events
	    - OverflowEvent/overflowchanged event
	    - onresize (IE11 removed 'onresize' events in favor of Mutators. But the mutators doesn't trigger on css/non-js triggered changes..)

	A big thank you to https://github.com/sdecima, which research on IE11's lack of onresize events and the Mutators shortcomings made my life so much easier.

	==========================

	Troubleshooting: If you're using a module system in your app (AMD or
	something more nodey) then you may need to change the paths below,
	where it says `require( 'Ractive' )` or `define([ 'Ractive' ]...)`.

	==========================

	Usage: Include this file on your page below Ractive, e.g:

	    <script src='lib/Ractive.js'></script>
	    <script src='lib/Ractive-decorators-minmaxwidth.js'></script>

	Or, if you're using a module loader, require this module:

	    // requiring the plugin will 'activate' it - no need to use
	    // the return value
	    require( 'Ractive-decorators-minmaxwidth' );

    Use the decorator in your template with any of the following syntaxes (explanation of the variables in the "options" syntax):

    A single breakpoint:
        <div class="item" decorator="minmaxwidth:100">
        html content
        </div>

    An array of breakpoints:
        <div class="item" decorator="minmaxwidth:[100,200]">
        html content
        </div>

    A single breakpoint and a keypath:
        <div class="item" decorator="minmaxwidth:[100,200],'my_width'">
        {{my_width}}
        </div>

    An array of breakpoints and a keypath:
        <div class="item" decorator="minmaxwidth:[100,200],'my_width'">
        {{my_width}}
        </div>

    An object with one or more of these keys:
        - breakpoints   - Array of breakpoints (or single breakpoint) to match against, both min and max will be added based on these [optional]
        - keypath       - Keypath to use for setting the current width in the Ractive instance [optional]
        - min           - (Deprecated) Array of min-widths (or single width) to match against [optional]~~ (Deprecated. Can still be used, but the widths are added as `breakpoints`, and both min/max data-attributes are added pr width)
        - max           - (Deprecated) Array of max-widths (or single width) to match against [optional]~~ (Deprecated. Can still be used, but the widths are added as `breakpoints`, and both min/max data-attributes are added pr width)

        <div class="item" decorator="minmaxwidth:{breakpoints:[100,200],keypath:'my_width'}">
        {{my_width}}
        </div>

    The decorator will add `data-min-width` and `data-max-width` attributes holding a space-delimited list of matched min/max values, and set the given keypath to the current width (not just if it matches one of the min/max values):
        <div class="item" data-min-width="100" data-max-width="200">199</div>

    You then use the `~=` attribute-selector to write styles targeting the specific min/max values:
        .item[data-min-width~="100"] {
        ...
        }

    It's recommended to use a className with the attribute-selector, so your CSS rules don't match more elements than it should.

    See the demo with more CSS examples: http://cfenzo.github.io/Ractive-decorators-minmaxwidth/

*/

(function ( global, factory ) {

	'use strict';

	// Common JS (i.e. browserify) environment
	if ( typeof module !== 'undefined' && module.exports && typeof require === 'function' ) {
		factory( require( 'Ractive' ) );
	}

	// AMD?
	else if ( typeof define === 'function' && define.amd ) {
		define([ 'Ractive' ], factory );
	}

	// browser global
	else if ( global.Ractive ) {
		factory( global.Ractive );
	}

	else {
		throw new Error( 'Could not find Ractive! It must be loaded before the Ractive-decorators-minmaxwidth plugin' );
	}

}( typeof window !== 'undefined' ? window : this, function ( Ractive ) {

	'use strict';

    var styles_added = [],
        stylesheet,
        no_flowevents = ( (!(window.ActiveXObject) && "ActiveXObject" in window) || !('UIEvent' in window) ), // this is ugly, but we have to live with it..
        _poller_interval = 250,
        _poller_runner,
        _poller_elements = [];

    // IE8 polyfill
    if(!Array.isArray) {
        Array.isArray = function (vArg) {
            var isArray;
            isArray = vArg instanceof Array;
            return isArray;
        };
    }

    function fireEvent(element, type, data, options){
        var event;
        options = options || {};
        event = document.createEvent('Event');
        event.initEvent(type, 'bubbles' in options ? options.bubbles : true, 'cancelable' in options ? options.cancelable : true);
        for (var z in data) event[z] = data[z];
        element.dispatchEvent(event);
    }

    function addSensorStyles(sensorClass){
        if(!styles_added[sensorClass]){
            var style = '.'+sensorClass+', .'+sensorClass+' div {position: static !important;margin:0 !important;padding:0 !important;border:none !important;} .'+sensorClass+', .'+sensorClass+' > div {position: absolute !important;top: 0 !important;left: 0 !important;width: 100% !important;height: 100% !important;overflow: hidden !important;z-index: -1 !important;}';
            if(!stylesheet){
                stylesheet = document.createElement('style');
                stylesheet.type = 'text/css';
                stylesheet.id = 'ractive_decorator_minmaxwidth_styles';
                document.getElementsByTagName("head")[0].appendChild(stylesheet);
            }

            if (stylesheet.styleSheet) {
                stylesheet.styleSheet.cssText = style;
            }else {
                stylesheet.appendChild(document.createTextNode(style));
            }
            styles_added[sensorClass] = true;
        }
    }

    function usePollResizer(element,supports_onresize){
        return (!supports_onresize && no_flowevents) || !(!element.namespaceURI || element.namespaceURI === 'http://www.w3.org/1999/xhtml');
    }
    function addResizePoller(element){
        if(_poller_elements.indexOf(element) === -1) _poller_elements.push(element);
        if(!_poller_runner) _poller_runner = window.setInterval(function(){
            _poller_elements.forEach(function(element){
                var _lastSize = element._lastSize || {width:0,height:0},
                    ow = element.offsetWidth,
                    oh = element.offsetHeight;

                if(ow !== _lastSize.width || oh !== _lastSize.height){
                    element._lastSize = {width:ow,height:oh};
                    fireEvent(element,'resize');
                }
            });
        },_poller_interval);
    }
    function removeResizePoller(element){
        var index = _poller_elements.indexOf(element);
        if(index > -1) _poller_elements.splice(index,1);
        if(_poller_elements.length < 1) window.clearInterval(_poller_runner);
    }

    function addFlowListener(element, type, fn){
        var flow = type == 'over';
        element.addEventListener('OverflowEvent' in window ? 'overflowchanged' : type + 'flow', function(e){
            if (e.type == (type + 'flow') ||
                ((e.orient === 0 && e.horizontalOverflow === flow) ||
                    (e.orient === 1 && e.verticalOverflow === flow) ||
                    (e.orient === 2 && e.horizontalOverflow === flow && e.verticalOverflow === flow))) {
                e.flow = type;
                return fn.call(this, e);
            }
        }, false);
    }

    function addResizeListener(element, fn, sensorClass){
        var supports_onresize = 'onresize' in element;
        if(usePollResizer(element,supports_onresize)){
            addResizePoller(element);
        }else if (!supports_onresize && !element._resizeSensor) {
            var sensor = element._resizeSensor = document.createElement('div');
            sensor.className = sensorClass || 'resize-sensor';
            sensor.innerHTML = '<div><div></div></div><div><div></div></div>';
            addSensorStyles(sensorClass);

            var x = 0, y = 0,
                first = sensor.firstElementChild.firstChild,
                last = sensor.lastElementChild.firstChild,
                matchFlow = function(event){
                    var change = false,
                        width = element.offsetWidth;
                    if (x != width) {
                        first.style.width = width - 1 + 'px';
                        last.style.width = width + 1 + 'px';
                        change = true;
                        x = width;
                    }
                    var height = element.offsetHeight;
                    if (y != height) {
                        first.style.height = height - 1 + 'px';
                        last.style.height = height + 1 + 'px';
                        change = true;
                        y = height;
                    }
                    if (change && event.currentTarget != element) fireEvent(element, 'resize');
                };

            if (window.getComputedStyle(element).position == 'static'){
                element.style.position = 'relative';
                element._resizeSensor._resetPosition = true;
            }
            element.appendChild(sensor);
            addFlowListener(sensor, 'over', matchFlow);
            addFlowListener(sensor, 'under', matchFlow);
            addFlowListener(sensor.firstElementChild, 'over', matchFlow);
            addFlowListener(sensor.lastElementChild, 'under', matchFlow);
            matchFlow({});
        }
        var events = element._resizeEvents || (element._resizeEvents = []);
        if (events.indexOf(fn) === -1) events.push(fn);
        if (!supports_onresize) element.addEventListener('resize', fn);
        element.onresize = function(e){
            events.forEach(function(fn){
                fn.call(element, e);
            });
        };
    }
    function removeResizeListener(element, fn){
        var index,
            supports_onresize = 'onresize' in element;

        index = element._resizeEvents.indexOf(fn);
        if (index > -1) element._resizeEvents.splice(index, 1);
        if (!element._resizeEvents.length) {
            var sensor = element._resizeSensor;
            if (sensor) {
                element.removeChild(sensor);
                if (sensor._resetPosition) element.style.position = 'static';
                try { delete element._resizeSensor; } catch(e) { /* delete arrays not supported on IE 7 and below */}
            }
            if (supports_onresize) element.onresize = null;
            try { delete element._resizeEvents; } catch(e) { /* delete arrays not supported on IE 7 and below */}
            if(usePollResizer(element,supports_onresize)) removeResizePoller(element); // only call removeResizePoller when there's no resize events left on the element
        }
        if(!supports_onresize) element.removeEventListener('resize', fn);
    }

    var minmaxwidth = function( node ){
        var breakpoints,
            keypath,
            min,
            max,
            R = node._ractive.root;

        if(arguments.length < 2) {
            throw new Error( 'Ractive-decorators-minmaxwidth needs at least one argument. See http://cfenzo.github.io/Ractive-decorators-minmaxwidth/ for documentation and examples.' );
        }

        function on_modified(){
            var minWidths = [],
                maxWidths = [],
                node_width = node.offsetWidth;
                breakpoints.forEach(function(width){
                    (node_width>=parseInt(width)?minWidths:maxWidths).push(width);
                });
            node.setAttribute('data-min-width',minWidths.join(' '));
            node.setAttribute('data-max-width',maxWidths.join(' '));
            if(keypath) R.set(keypath, node_width);
            node.className = node.className; // ugly IE8 hack to reset styles
        }

        if(Object.prototype.toString.call(arguments[1]).slice(8, -1).toLowerCase() === 'object'){
            breakpoints = arguments[1].breakpoints || [];
            min = arguments[1].min || [];
            max = arguments[1].max || [];
            keypath = arguments[1].keypath || false;

            if(!Array.isArray(breakpoints)) breakpoints = [breakpoints];
            if(!Array.isArray(min)) min = [min];
            if(!Array.isArray(max)) max = [max];

            min.concat(max).forEach(function(val){
               if(breakpoints.indexOf(val) === -1) breakpoints.push(val);
            });
        }else{
            // got array
            breakpoints = Array.isArray(arguments[1]) ? arguments[1] : [arguments[1]];
            if(arguments.length > 2 && typeof arguments[2] === 'string') keypath = arguments[2];
        }

        on_modified(); // run on initialization
        // add pretty events
        addResizeListener(node, on_modified, minmaxwidth.sensorClass);

        return {
            teardown: function () {
                // remove event listeners
                removeResizeListener(node);
            }
        };

    };

    // defaults
    minmaxwidth.sensorClass = 'resize-sensor';

    Ractive.decorators.minmaxwidth = minmaxwidth;
}));