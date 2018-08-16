define([
	"jquery",
	"poly",
	"troopjs-ef/component/service",
	"public/path-formatter",
	"public/typeid-parser"
], function LoadModule($, poly, Service, pathFormatter, TypeidParser) {
	// Constants

	var UNDEF;
	var URI = "uri";
	var CONTEXT = "context";
	var CACHE = "cache";
	var TYPEOF_STRING = typeof String();

	var PREFIX = pathFormatter.PREFIX;
	var EXPAND = pathFormatter.EXPAND;

	var RE_URI = /^school\/(?:([;\-\w]+)(?:\/([;\-\w]+)(?:\/([;\-\w]+)(?:\/([;\-\w]+)(?:\/([;\-\w]+)(?:\/([;\-\w]+)(?:\/([;\-\w]+))?)?)?)?)?)?)?/;
	var RE_ID = /^(?:(\w+)!)?([;\-\w]+)/;
	var TOPIC_START_LOAD = 'start/load';

    // Shared variable or singletons
    var updatingQueue = [], updating = false;

    /**
     * call to indicates the current updating cycle is just started
     */
    function startUpdate(){
        updating = true;
    }

    /**
     * call to indicates the current updating cycle is all done
     */
    function stopUpdate(){
        updating = false;

        // keep updating if there is sth in queue
        if (updatingQueue.length > 0){
            update.apply(this, updatingQueue.shift());
        }
    }

	function update(context, uri, cache) {
		var me = this, diff = [];

		// No context || no uri = no entry
		if (!context || !uri || !cache) {
			return;
		}

        if (updating){
            updatingQueue.push(Array.prototype.slice.call(arguments));
            return;
        }

        startUpdate.call(me);

		var match = RE_URI.exec(uri.path);

		if (match){
			// Compare to cache, undefined if no change, element if changed, null if removed
			diff = match.map(function (element, index) {
				return cache[index] === element
					? UNDEF
					: element || null;
			});
		}

		var l;
		var stringResult = {};
		// TODO:question what is prefix for?
		// Prefix (where possible)
		var expanded = diff.map(function (element, index) {
			var expand = EXPAND[index];
			var prefixIndex, topic;

			// find String parameter
			if(element != UNDEF && index > 0 && !(element.indexOf("-") >= 0) && !(element.indexOf("template_") >= 0)){
				prefixIndex = index - 1;
				topic = ['load'];
				cache[index] = element;

				if (PREFIX[prefixIndex]){
					topic.push(PREFIX[prefixIndex]);
				}

				topic.push(element);
				me.publish(topic.join('/'));

				stringResult[PREFIX[index]] = element;
				return UNDEF;
			}
			else {
				return typeof element === TYPEOF_STRING && expand
					? element.replace(RE_ID, expand)
					: element;
			}
		});

		expChecking: {
			// check if all expanded is empty
			for(l = expanded.length; l--;){
				if (expanded[l] != UNDEF){
					break expChecking;
				}
			}
		}

		var student_expanded = [];
		// publish every expand and id
		for(l = expanded.length; l--; ) {
			var expand = expanded[l];

			if(TypeidParser.parseType(expand) === "enrollment") {
				student_expanded.unshift("student_course_" + expand);
			}
			else if(TypeidParser.parseType(expand) === "level") {
				student_expanded.unshift("student_" + expand + ".children.parent.parent");
			}
			else if(TypeidParser.parseType(expand)) {
				student_expanded.unshift("student_" + expand);
			}
			else {
				student_expanded.unshift(expand);
			}

		}

		// Query
		me.query(student_expanded).then(function doneQuery(results) {
			if(results.length > 0) {
				var result = {};
				results.forEach(function(e,i){
					PREFIX[i] && (result[PREFIX[i]] = e);
				});

				me.publish("load/results", $.extend(stringResult, result));
			}

			// Iterate arguments, update cache, publish
			results.forEach(function (e,i) {
				var d = diff[i];
				var p = PREFIX[i];

				// null d - we know this was a removal from cache
				if (d === null) {
					cache[i] = UNDEF;

					if (p) {
						me.publish("load/" + p);
					}
				}
				else if (d && e) {
					cache[i] = d;

					if (p) {
						me.publish(TOPIC_START_LOAD + '/' + p, {id: e.templateActivityId});
						me.publish("load/" + p, e);
					}
				}
				else if (!isNaN(d) && e === UNDEF && !~window.location.search.indexOf("atpreview")){
					// TODO: need use better way to change hash
					window.location.hash = "";
					window.location.reload();
					return false;
				}
			});

			stopUpdate.call(me);
		});
	}

	return Service.extend(function () {
		this[CACHE] = [];
	}, {
		"displayName" : "school-ui-study/service/load",

		"hub:memory/context" : function onContext(context) {
			var me = this;

			update.call(me, me[CONTEXT] = context, me[URI], me[CACHE]);
		},

		"hub:memory/route" : function onRoute(uri) {
			var me = this;
      if(uri.path[0] === ''){
        uri.path.splice(0,1);
      }
			update.call(me, me[CONTEXT], me[URI] = uri, me[CACHE]);
		}
	});
});
