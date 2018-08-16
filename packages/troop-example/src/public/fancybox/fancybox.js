define([
	'lodash',
	'shadow!jquery.fancybox#$=jquery&jQuery=jquery&exports=jQuery'
], function(
	_,
	$
){
	'use strict';

	var defaultOptions = {
		wrapCSS: 'csu-fancybox',
		helpers: {
			overlay: {
				closeClick : false,
				css: {
					// background image: img/fancybox_overlay.png
					backgroundImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAI0lEQVQYGe3KMREAAAjDQMC/TmyEq4NOTM2Q6RvYMhrtDwYeQfQD9/w1y0kAAAAASUVORK5CYII=)'
				}
			}
		}
	};

	return {
		'open': function(options){
			$.fancybox.open(_.assign(defaultOptions, options));
		},

		'close': function(){
			$.fancybox.close();
		}
	};
});