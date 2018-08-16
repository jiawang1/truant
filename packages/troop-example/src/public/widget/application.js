define([
	"jquery",
	"poly",
	"troopjs-browser/route/uri",
	"troopjs-ef/component/widget"
], function ApplicationModule($, poly, URI, Widget) {
	"use strict";

	var RE = /^\w+!/;
	var _URI = "uri";
	var CONTEXT = "context";
	var CURRENT_ENROLLMENT = "student_course_enrollment!current";
	var initRouted = false;

	return Widget.extend({
		"hub:memory/route" : function onRoute(uri) {
			var me = this;

			me.update(me[CONTEXT], me[_URI] = uri);
		},

		/**
		 * subscription: hub:memory/context
		 * save context, update context and
		 * validate enrollment if isUpdate is not true
		 * @param {Object} context
		 * @param {Boolean} isUpdate
		 */
		"hub:memory/context" : function onContext(context, isUpdate) {
			var me = this;

			me.update(me[CONTEXT] = context, me[_URI], isUpdate, true);
		},

		/**
		 * update context
		 *
		 * @param {Object} context
		 * @param {Object} uri
		 * @param {Boolean} isUpdate
		 * @param {Boolean} ignoreBackward
		 * @return {void}
		 */
		"update" : function update(context, uri, isUpdate, ignoreBackward) {
			var me = this;

			if (!context || !uri || (!isUpdate && uri.path)) {
				return;
			}

			me.publish("school/clearCache", CURRENT_ENROLLMENT).then(function() {
				me.query(CURRENT_ENROLLMENT).spread(function doneQuery(enrollment) {
					// Route to school with all parts of the path set
					uri.path = URI.Path([ "school", enrollment.studentCourse, enrollment.studentCourse, enrollment.studentLevel, enrollment.studentUnit ].map(function (element, i) {
						element = element || "";
						return element.id
							? element.id.replace(RE, "")
							: element;
					}));

					// if it is the first time visit, or ignoreBackward is true (indicates that
					// the call is from loadContext, hence it is trigger programmatically, not the
					// backward button on browser), we should redirect user to the default page
					if (!initRouted || ignoreBackward === true){
						me.route(uri);
						initRouted = true;
					}
					else{
						// otherwise, it means user arriving here by hitting backward button,
						// we should, go backward one more step
						window.history.go(-1);
					}
				});
			});

		}
	});
});