define([
	"when",
	"jquery",
	"troopjs-ef/component/widget",
	"template!./unit-overview.html"
], function (when, $, Widget, tButton) {
	"use strict";

	var HUB_TRACK = 'tracking/track';
	var SEL_UNIT_PAGE = ".ets-ui-unit-page";
	var CLS_UO_WIDGET = "ets-uo-widget";

	/**
	 * Show unit overview
	 *
	 * @api private
	 */
	function showUnitOverview() {
		var me = this;

		$("." + CLS_UO_WIDGET).remove();
		var $widgetUniOverview = $('<div></div>', {
			"class": "gud " + CLS_UO_WIDGET,
			"data-weave": "school-ui-shared/widget/unit-overview/modal-container/main(templateUnitid)"
		});

		return $widgetUniOverview
			.data('templateUnitid', me._templateUnitId)
			.insertAfter($(SEL_UNIT_PAGE))
			.weave();
	}

	return Widget.extend(function (element, path, templateUnitId) {
		this._templateUnitId = templateUnitId;
	}, {
		"sig/start": function () {
			var me = this;
			me.html(tButton);
		},
		"dom/click": function () {
			var me = this;
			me.publish(HUB_TRACK, 'study/unit-overview/open');
			showUnitOverview.call(me);
		}
	});
});