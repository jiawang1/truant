define([
	"when",
	"poly/array",
	"jquery",
	"mv!jquery#troopjs-1.0",
	"troopjs-browser/loom/config",
	"troopjs-ef/component/widget",
	"public/path-formatter",
	"public/level-no-mapper",
	"public/techcheck/techcheck-render",
	"template!./school.html"
], function SchoolModule(
	when,
	polyArray,
	$,
	jqueryInTroop1,
	loom,
	Widget,
	pathFormatter,
	levelNoMapper,
	techcheckRender,
	tSchool
) {
	"use strict";

	var UNDEF;

	var SLICE = Array.prototype.slice;

	var $ELEMENT = "$element";

	var SEL_HTML = "html",
		SEL_UI_WRAP = ".ets-ui-wrap";

	var HUB_TECHCHECK_REQUEST = "tech-check/request";

	var STARTDFD = "startDfd",
		TECHCHECK_INITIALIZED = "_techcheckInitialized",
		LOADSERVICE_RESULTS = "_loadserviceResults",
		TECHCHECK_BANNER_RENDERED = "_techcheckBannerRendered",
		DFD_PARTNER_WIDGETS = "_dfd_partner_widgets";

	var ATTR_PARTNER_INIT = "data-weave-partner-init";
	var SEL_PARTNER_INIT = "[" + ATTR_PARTNER_INIT + "]";

	function renderFlashInstallBanner() {
		var me = this;
		if (me[TECHCHECK_INITIALIZED] === UNDEF || me[LOADSERVICE_RESULTS] === UNDEF || me[TECHCHECK_BANNER_RENDERED]) {
			return;
		}

		if (!me[LOADSERVICE_RESULTS].step && !me[LOADSERVICE_RESULTS].activity) {   //activity not opened, and not switch to another activity
			me[TECHCHECK_BANNER_RENDERED] = true;
			me.publish(HUB_TECHCHECK_REQUEST, [
				{ id: "flash-install" }
			]).then(null, null, function (checkResults) {
				techcheckRender.renderFlashInstallBanner(me[$ELEMENT].find(SEL_UI_WRAP), checkResults);
			});
		}
	}

	function removeRouteIdPrefix(id) {
		return id.replace("student_", "").replace("course_", "");
	}

	return Widget.extend(function () {
		var me = this;
		me[STARTDFD] = when.defer();
	}, {
		"sig/start": function start() {
			var me = this;
			me[DFD_PARTNER_WIDGETS] = when.defer();

			when.all([
				levelNoMapper.init(),
				me[STARTDFD].promise
			]).spread(function () {
				return me.html(tSchool).then(function () {
					jqueryInTroop1("[data-weave-1]").each(function (entryIndex, entry) {
						var $e = jqueryInTroop1(entry);
						$e.attr("data-weave", $e.attr("data-weave-1")).weave();
					});
				});
			});
		},

		"sig/stop": function stop() {
			var me = this;

			me.empty();
		},

		"hub:memory/plugins/tech-check/enable": function () {
			var me = this;
			me[TECHCHECK_INITIALIZED] = true;
			renderFlashInstallBanner.call(me);
		},

		"hub:memory/load/results": function (results) {
			var me = this;
			me[LOADSERVICE_RESULTS] = results;
			renderFlashInstallBanner.call(me);
		},

		"hub:memory/context": function onContext() {
			this[STARTDFD].resolver.resolve();
		},

		// parameter "id" format is lesson!123 or step!234 or activity!345
		// if unroute "lesson!123", step and activity id will also be unrouted
		// if unroute "step!234", activity id will also be unrouted
		// not support unroute any structure from course to unit.
		"hub:memory/unroute": function onRoute(id) {
			pathFormatter.collapse(removeRouteIdPrefix(id));
		},

		"hub/route/uri": function onRouteUri() {
			var argu = [];
			$.each(arguments, function (entryIndex, entry) {
				entry && argu.push(removeRouteIdPrefix(entry));
			});
			argu.length > 0 && pathFormatter.expand.apply(pathFormatter, argu);
		},

		"hub/load": function onLoad(data) {
			var EXPAND = ["enrollment", "course", "level", "unit", "lesson", "step", "activity"];
			EXPAND.every(function (e) {
				if (data.hasOwnProperty(e)) {
					if (data[e]) {
						pathFormatter.expand.apply(pathFormatter, [e + "!" + data[e]]);
					}
					else {
						pathFormatter.collapse(e + "!" + data[e]);
					}
					return false;
				}
				else {
					return true;
				}
			});
		},

		"hub/school/zindex": function onGetzIndex() {
			return [this[$ELEMENT].data("zIndex")];
		},

		"hub/school/offset": function onGetOffset() {
			return [this[$ELEMENT].offset()];
		},

		"hub/school/toggle/overflow": function toggleOverflow(style) {
			$(SEL_HTML).css('overflow', style);
		},

		"hub/school/interface-widget/ready": function () {
			var me = this;
			var partnerWidgetPromises = [];
			$(SEL_PARTNER_INIT).each(function (index, item) {
				var $item = $(item);
				var promise = $item.attr(loom.weave, $item.attr(ATTR_PARTNER_INIT)).weave();
				partnerWidgetPromises.push(promise);
			});
			when.all(partnerWidgetPromises).then(me[DFD_PARTNER_WIDGETS].resolve);
		},

		"hub/school/partner-widgets/weave-promise": function () {
			return this[DFD_PARTNER_WIDGETS].promise;
		},

		"dom:[data-action='route']/click": function onRoute() {
			pathFormatter.expand.apply(pathFormatter, SLICE.call(arguments, 1));
		},

		"dom:[data-action='wrapClick']/click": function onClickUIWrap() {
			this.publish('unit/wrap/click');
		}
	});
});
