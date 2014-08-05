/*

 Ractive-decorators-minmaxwidth
 ==============================

 Version <%= VERSION %>.

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

    var isIE = /*@cc_on!@*/0,
        requestFrame = window.requestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            function(fn){ return window.setTimeout(fn, 20);},
        styles_added = [],
        stylesheet,
        _poller_interval = 250,
        _poller_runner,
        _poller_elements = [];

    function debounceTrigger(){
        var el = this;
        if (!el.__trigger__) {
            el.__trigger__ = requestFrame(function(){
                var size = el._lastSize || {width:el.offsetWidth,height:el.offsetHeight};
                el.__eq__.fn.forEach(function(fn){
                    fn.call(el, size);
                });
                el.__trigger__ = null;
            });
        }
    }

    // for non-svg
    function attachObject(box,sensorDataAttr){
        box.setAttribute(sensorDataAttr,'true');
        addSensorStyles(sensorDataAttr);
        var obj = document.createElement('object');
        obj.__querybox__ = box;
        obj.onload = objectLoad;
        obj.type = 'text/html';
        if (!isIE) obj.data = 'about:blank';
        box.appendChild(obj);
        if (isIE) obj.data = 'about:blank'; // must add data source after insertion, because IE is a goon
        return obj;
    }
    function objectLoad(){
        var box = this.__querybox__,
            doc = box.__eq__.doc = this.contentDocument,
            win = doc.defaultView || doc.parentWindow;

        doc.__querybox__ = box;
        win.addEventListener('resize', function(){
            debounceTrigger.call(box);
        });
        box.__eq__.loaded = true;
        debounceTrigger.call(box);
    }
    function addSensorStyles(sensorDataAttr){
        if(!styles_added[sensorDataAttr]){
            var style = '['+sensorDataAttr+'] {position: relative;} ['+sensorDataAttr+'] > object {display: block;position: absolute;top: 0;left: 0;width: 100%;height: 100%;border: none;padding: 0;margin: 0;opacity: 0;z-index: -1000;pointer-events: none;}';
            if(!stylesheet){
                stylesheet = document.createElement('style');
                stylesheet.type = 'text/css';
                stylesheet.id = 'resize-listener-styles';
                document.getElementsByTagName("head")[0].appendChild(stylesheet);
            }

            if (stylesheet.styleSheet) {
                stylesheet.styleSheet.cssText = style;
            }else {
                stylesheet.appendChild(document.createTextNode(style));
            }
            styles_added[sensorDataAttr] = true;
        }
    }

    // for svg/fallback
    function use_poll(element){
        // TODO add more tests for whatever needs poll (svg++, video?, audio?, iframe?)
        return element instanceof SVGElement || !!element.ownerSVGElement || false;
    }
    function addResizePoller(element){
        if(_poller_elements.indexOf(element) === -1) _poller_elements.push(element);
        if(!_poller_runner) _poller_runner = window.setInterval(function(){
            _poller_elements.forEach(function(element){
                var _lastSize = element._lastSize || {width:0,height:0},
                    _newSize = element.getBoundingClientRect?element.getBoundingClientRect():{width:element.offsetWidth,height:element.offsetHeight}; // getBoundingClientRect or getBBox...

                if(_newSize.width !== _lastSize.width || _newSize.height !== _lastSize.height){
                    element._lastSize = _newSize;
                    debounceTrigger.call(element);
                }
            });
        },_poller_interval);

        return true; // return true to set poller ON on element
    }
    function removeResizePoller(element){
        var index = _poller_elements.indexOf(element);
        if(index > -1) _poller_elements.splice(index,1);
        if(_poller_elements.length < 1) window.clearInterval(_poller_runner);
    }

    function addResizeListener(box,fn,force_poll){
        if (!box.__eq__) {
            box.__eq__ = {};
            box.__eq__.fn = [fn];
            if(force_poll || use_poll(box)){
                box.__eq__.poller = addResizePoller(box);
            }else{
                box.__eq__.object = attachObject(box,'resize-sensor');
            }
        }else{
            box.__eq__.fn.push(fn);
        }
    }

    function removeResizeListener(box,fn){
        if (box.__eq__) {
            if(fn){
                var index = box.__eq__.fn.indexOf(fn);
                if(index > -1) box.__eq__.fn.splice(index,1);
                if(box.__eq__.fn.length > 0) return;
            }
            if(box.__eq__.object) box.removeChild(box.__eq__.object);
            if(box.__eq__.poller) removeResizePoller(box);
            delete box.__eq__;
        }
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

        function on_modified(size){
            var minWidths = [],
                maxWidths = [],
                node_width = size.width;

            breakpoints.forEach(function(width){
                (node_width>=parseInt(width)?minWidths:maxWidths).push(width);
            });
            node.setAttribute('data-min-width',minWidths.join(' '));
            node.setAttribute('data-max-width',maxWidths.join(' '));
            if(keypath) R.set(keypath, node_width);
            if(isIE) node.className = node.className; // ugly IE8 hack to reset styles
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
        // add pretty events
        addResizeListener(node, on_modified);

        return {
            teardown: function () {
                // remove event listeners
                removeResizeListener(node);
            }
        };

    };

    // defaults
    minmaxwidth.sensorClass = 'resize-sensor';
    minmaxwidth.addSensorStyles = true;
    minmaxwidth.pollerInterval = 250;

    Ractive.decorators.minmaxwidth = minmaxwidth;

}));