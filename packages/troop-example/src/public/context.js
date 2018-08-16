/**
 * load student current school context
 */
define([
	"troopjs-ef/component/service",
	"poly/array",
	"poly/object"
], function ContextModule(Service) {
	"use strict";

	function loadContext(isUpdate) {
		var me = this;

		return me.query("school_context!current").spread(function doneQuery(context) {

			return me.publish("context", context || {}, isUpdate);
		});
	}

	/**
	 * context module definition
	 */
	return Service.extend({
		"displayName" : "school-ui-study/service/context",

		"sig/start": function onStart() {
			return loadContext.call(this, false);
		},

		"hub/context/update/context": function onUpdateContext() {
			return loadContext.call(this, true);
		}
	});
});