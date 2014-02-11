/*

	Ractive-decorators-minmaxwidth
	==============================

	Version 0.1.0.

	A decorator to add min-width and max-width media queries to elements.
	It's based on https://github.com/FremyCompany/prollyfill-min-width/, but with a different css syntax (no hitch.js)

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

	<< more specific instructions for this plugin go here... >>

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
        stylesheet;

    // IE8 polyfills
    if(!Array.isArray) {
        Array.isArray = function (vArg) {
            var isArray;

            isArray = vArg instanceof Array;

            return isArray;
        };
    }
    var htmlEvents = {// list of real events
        //<body> and <frameset> Events
        onload:1,
        onunload:1,
        //Form Events
        onblur:1,
        onchange:1,
        onfocus:1,
        onreset:1,
        onselect:1,
        onsubmit:1,
        //Image Events
        onabort:1,
        //Keyboard Events
        onkeydown:1,
        onkeypress:1,
        onkeyup:1,
        //Mouse Events
        onclick:1,
        ondblclick:1,
        onmousedown:1,
        onmousemove:1,
        onmouseout:1,
        onmouseover:1,
        onmouseup:1
    }
    function triggerEvent(el,eventName){
        var event;
        if(document.createEvent){
            event = document.createEvent('HTMLEvents');
            event.initEvent(eventName,true,true);
        }else if(document.createEventObject){// IE < 9
            event = document.createEventObject();
            event.eventType = eventName;
        }
        event.eventName = eventName;
        if(el.dispatchEvent){
            el.dispatchEvent(event);
        }else if(el.fireEvent && htmlEvents['on'+eventName]){// IE < 9
            el.fireEvent('on'+event.eventType,event);// can trigger only real event (e.g. 'click')
        }else if(el[eventName]){
            el[eventName]();
        }else if(el['on'+eventName]){
            el['on'+eventName]();
        }
    }
    function addEvent(el,type,handler){
        if(el.addEventListener){
            el.addEventListener(type,handler,false);
        }else if(el.attachEvent && htmlEvents['on'+type]){// IE < 9
            el.attachEvent('on'+type,handler);
        }else{
            el['on'+type]=handler;
        }
    }
    function removeEvent(el,type,handler){
        if(el.removeventListener){
            el.removeEventListener(type,handler,false);
        }else if(el.detachEvent && htmlEvents['on'+type]){// IE < 9
            el.detachEvent('on'+type,handler);
        }else{
            el['on'+type]=null;
        }
    }

    function addFlowListener(element, type, fn){
        var flow = type == 'over';
        addEvent(element,'OverflowEvent' in window ? 'overflowchanged' : type + 'flow', function(e){
            if (e.type == (type + 'flow') ||
                ((e.orient === 0 && e.horizontalOverflow === flow) ||
                    (e.orient === 1 && e.verticalOverflow === flow) ||
                    (e.orient === 2 && e.horizontalOverflow === flow && e.verticalOverflow === flow))) {
                e.flow = type;
                return fn.call(this, e);
            }
        }, false);
    }

    function fireEvent(element, type, data, options){
        var options = options || {},
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

    function addResizeListener(element, fn, sensorClass){
        var resize = 'onresize' in element;
        if (!resize && !element._resizeSensor) {
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
                    if (change && event.currentTarget != element) triggerEvent(element, 'resize');
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
        var events = element._flowEvents || (element._flowEvents = []);
        if (events.indexOf(fn) === -1) events.push(fn);
        if (!resize) addEvent(element,'resize', fn);
        element.onresize = function(e){
            events.forEach(function(fn){
                fn.call(element, e);
            });
        };
    }

    function removeResizeListener(element, fn){
        var index = element._flowEvents.indexOf(fn);
        if (index > -1) element._flowEvents.splice(index, 1);
        if (!element._flowEvents.length) {
            var sensor = element._resizeSensor;
            if (sensor) {
                element.removeChild(sensor);
                if (sensor._resetPosition) element.style.position = 'static';
                delete element._resizeSensor;
            }
            if ('onresize' in element) element.onresize = null;
            delete element._flowEvents;
        }
        removeEvent(element,'resize', fn);
    }

    var minmaxwidth = function ( node, options ) {
        var min = options.min || [],
            max = options.max || [],
            key = options.key || false,
            R = node._ractive.root;

        if(!Array.isArray(min)) min = [min];
        if(!Array.isArray(max)) max = [max];

        function on_modified(){
            var minWidths = min.filter(function(width){
                    return node.offsetWidth>=parseInt(width);
                }),
                maxWidths = max.filter(function(width){
                    return node.offsetWidth<parseInt(width);
                });
            node.setAttribute('data-min-width',minWidths.join(' '));
            node.setAttribute('data-max-width',maxWidths.join(' '));
            if(key) R.set(key,node.offsetWidth);
        }

        // add pretty events
        if(!node._flowEvents || node._flowEvents.length===0) {
            addResizeListener(node, function() { triggerEvent(this, "DOMAttrModified"); },minmaxwidth.sensorClass);
        }

        addEvent(node,"DOMAttrModified",on_modified);

        on_modified(); // run on initialization

        return {
            teardown: function () {
                // remove event listeners
                removeResizeListener(node);
                removeEvent(node,'DOMAttrModified',on_modified);
            }
        };
    };

    // defaults
    minmaxwidth.sensorClass = 'resize-sensor';

    Ractive.decorators.minmaxwidth = minmaxwidth;
}));