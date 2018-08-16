define([
	"jquery",
	"troopjs-ef/component/widget",
	"template!./unit-pass-icon.html"
], function UnitPassModule($, Widget, tUnitPassIcon) {
	"use strict";

	return Widget.extend({
		"sig/start": function onStart() {
			var me = this;
			return me.html(tUnitPassIcon);
		}
	});
});