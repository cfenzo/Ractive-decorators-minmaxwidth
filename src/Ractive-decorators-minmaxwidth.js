/*

	Ractive-decorators-minmaxwidth
	==============================

	Version <%= VERSION %>.

	A decorator to add min-width and max-width media queries to elements.
	It's based on http://www.backalleycoder.com/2013/03/18/cross-browser-event-based-element-resize-detection/
	IE11 support thanks to https://github.com/sdecima/javascript-detect-element-resize

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

    Add the decorator in your template with one or more of these options:

        * `min` Array of min-widths (or single width) to match against [optional]
        * `max` Array of max-widths (or single width) to match against [optional]
        * `keypath` Keypath to use for setting the current width in the Ractive instance [optional]

        <div class="item" decorator="minmaxwidth:{min:[100,200],max:200,keypath:'my_width'}">
        {{my_width}}
        </div>

    The decorator will add `data-min-width` and `data-max-width` attributes holding a space-delimited list of matched min/max values, and set the given keypath to the current width (not just if it matches one of the min/max values):

        <div class="item" data-min-width="100 200" data-max-width="200">200</div>

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
            var style = '.'+sensorClass+', .'+sensorClass+' > div {position: absolute;top: 0;left: 0;width: 100%;height: 100%;overflow: hidden;z-index: -1;}';
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
        if(!supports_onresize && no_flowevents){
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
            addFlowListener(sensor, 'over', matchFlow);
            addFlowListener(sensor, 'under', matchFlow);
            addFlowListener(sensor.firstElementChild, 'over', matchFlow);
            addFlowListener(sensor.lastElementChild, 'under', matchFlow);
            element.appendChild(sensor);
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
            if (!supports_onresize && no_flowevents) removeResizePoller(element); // only call removeResizePoller when there's no resize events left on the element
        }
        if(!supports_onresize) element.removeEventListener('resize', fn);
    }

    var minmaxwidth = function ( node, options ) {
        var min, max, keypath, R;

        function on_modified(){
            var minWidths = min.filter(function(width){
                    return node.offsetWidth>=parseInt(width);
                }),
                maxWidths = max.filter(function(width){
                    return node.offsetWidth<parseInt(width);
                });
            node.setAttribute('data-min-width',minWidths.join(' '));
            node.setAttribute('data-max-width',maxWidths.join(' '));
            if(keypath) R.set(keypath,node.offsetWidth);
            node.className = node.className; // ugly IE8 hack to reset styles
        }

        options = options || {};
        min = options.min || [];
        max = options.max || [];
        keypath = options.keypath || false;
        R = node._ractive.root;

        if(!Array.isArray(min)) min = [min];
        if(!Array.isArray(max)) max = [max];

        // add pretty events
        addResizeListener(node, on_modified, minmaxwidth.sensorClass);
        on_modified(); // run on initialization

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