define([
	"jquery",
	"troopjs-ef/component/widget",
	"template!./unit-navigation.html"
], function UnitLockModule($, Widget, tUnitNav) {
	"use strict";
	var $ELEMENT = "$element";

	return Widget.extend({
		"sig/start": function onStart() {
			var me = this;
			return me.html(tUnitNav, me[$ELEMENT].data('units'));
		},

		"dom:[data-action='route']/click": function($event){
			var dataSet = $($event.currentTarget).data();

			this.publish(
				"route/uri",
				dataSet["enrollmentId"] ,
				dataSet["courseId"],
				dataSet["levelId"],
				dataSet["unitId"]);

			return false;
		}
	});
});