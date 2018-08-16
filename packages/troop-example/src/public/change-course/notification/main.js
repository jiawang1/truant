/**
 * # widget/plugin/change-course/notification/main.js
 *
 * Confirm notification for change course
 *
 * @author UX Team
 * @version 0.0.1
 */
define([
    "jquery",
    "troopjs-ef/component/widget",
	"json2",
	"when",
    "template!./notification.html",
    "template!./legacyForm.html"
], function ChangeCourseNotificationModule($, Widget, JSON, when, tNotification, tLegacyForm) {
    "use strict";
    /*!
     * dom constants
     */
    var $ELEMENT = "$element";
    var UNDEF,
        CLS_NONE = "ets-none",
        SEL_CONFIRM_BUTTON = ".ets-chl-alert-btn-confirm",
        EVENT_NAMESPACE = ".notification.chcs",
        EVENT_SCORLL = "scroll" + EVENT_NAMESPACE,
        EVENT_RESIZE = "resize" + EVENT_NAMESPACE;

	var SEL_HEADERFOOTER= ".ue-header-container";

    /*!
     * widget data keys
     */
    var ACTION_TYPE_TARGET = "_actionTypeTarget",
        BUSY = "_busy",
        SHOWN = "_shown",
        TOP = "_top",
        LEFT = "_left",
        HEADER_HEIGHT = "_headerHeight";

    // other constants
    var DEFAULT = "default",
        TYPE_FUNCTION = "function";
    var CONFIRM_BUTTON = "confirmButton",
        CONFIRM_ACTION = "confirmAction",
        CANCEL_BUTTON = "cancelButton";

	var CCL_CHANGECOURSE_CONFIRMLEVEL_BLURB = "ccl!'school.courseware.changeCourseNotificationConfirmLevel'";

    var BLURB = "blurb!",
        BLURB_LOADED = "_blurbLoaded",
        BLURB_LIST = {};
    BLURB_LIST[BLURB + "450016"] = "Are you sure you want to change the level?";
    BLURB_LIST[BLURB + "450311"] = "Your progress in this level will be saved, but we recommend that you complete the levels in order.";
    BLURB_LIST[BLURB + "450018"] = "Cancel";
    BLURB_LIST[BLURB + "450019"] = "Confirm";
    BLURB_LIST[BLURB + "458008"] = "This course is for Level 6 or higher.";
    BLURB_LIST[BLURB + "458009"] = "You need to be studying at General English Level 6 or above to take advantage of this course.";
    BLURB_LIST[BLURB + "150652"] = "OK";
    BLURB_LIST[BLURB + "461321"] = "Do you want to change courses?";
    BLURB_LIST[BLURB + "461322"] = "Don't worry. Your progress in this course will be saved.";
    BLURB_LIST[BLURB + "161177"] = "We see that you've already completed some lessons in the selected course. Where would you like to start studying?";
    BLURB_LIST[BLURB + "161178"] = "I want to continue studying where I left off. Please keep my study history and enroll me in the next incomplete unit.";
    BLURB_LIST[BLURB + "161179"] = "I want to make a fresh start! Please enroll me at the beginning of the course and remove my old study records.";
    BLURB_LIST[BLURB + "161182"] = "You have completed an older version of this course. You can now enroll in the new version.";

    /*!
     * build data for render by type and target
     *
     * key format: type!target
     */
    var DATA_BUILDER = {};
    DATA_BUILDER["confirm!level"] = function onBuildConfirmLevelData() {
        var blurbList = BLURB_LIST;

		return this.query(CCL_CHANGECOURSE_CONFIRMLEVEL_BLURB).spread(function(blurb){
			var mainTitle = blurbList[BLURB + JSON.parse(blurb.value).mainTitle],
				subTitle = blurbList[BLURB + JSON.parse(blurb.value).subTitle];
			return buildData(mainTitle, subTitle);
		});

    };
    DATA_BUILDER["confirm!course"] = DATA_BUILDER[DEFAULT] = function onBuildConfirmCourseData() {
        var blurbList = BLURB_LIST;
        var mainTitle = blurbList[BLURB + "461321"],
            subTitle = blurbList[BLURB + "461322"];
        return buildData(mainTitle, subTitle);
    };
    DATA_BUILDER["alert!course"] = function onBuildAlertCourseData() {
        var blurbList = BLURB_LIST;
        var mainTitle = blurbList[BLURB + "458008"],
            subTitle = blurbList[BLURB + "458009"];
        return buildData(mainTitle, subTitle);
    };
    DATA_BUILDER["alert!legacy.first"] = function onBuildAlertLegacyFirstData() {
        var blurbList = BLURB_LIST;
        var mainTitle = 'You can not change to this level as you have finished it in an older version of the online school.',
            subTitle = '';
        return buildData(mainTitle, subTitle);
    };
    DATA_BUILDER["confirm!legacy.second"] = function onBuildConfirmLegacySecondData() {
        var blurbList = BLURB_LIST;
        var mainTitle = blurbList[BLURB + "161177"],
            subTitle = tLegacyForm({
                "blurb161178": blurbList[BLURB + "161178"],
                "blurb161179": blurbList[BLURB + "161179"]
            });
        return buildData(mainTitle, subTitle);
    };
    DATA_BUILDER["confirm!legacy.second.be"] = function onBuildConfirmLegacySecondBEData() {
        var blurbList = BLURB_LIST;
        var mainTitle = blurbList[BLURB + "161177"],
            subTitle = tLegacyForm({
                "blurb161178": blurbList[BLURB + "161178"],
                "blurb161179": blurbList[BLURB + "161179"],
                "isBE": true
            });
        return buildData(mainTitle, subTitle);
    };
    DATA_BUILDER["alert!legacy.third"] = function onBuildAlertLegacyThirdData() {
        var blurbList = BLURB_LIST;
        var mainTitle = blurbList[BLURB + "161182"],
            subTitle = '';
        return buildData(mainTitle, subTitle);
    };
    function buildData(mainTitle, subTitle) {
        var tpl = {
            "mainTitle": mainTitle,
            "subTitle": subTitle
        };
        return tpl;
    }

    /*!
     * clear widget data by key
     */
    function clearData(key) {
        delete this[key];
    }

    /*!
     * bind window scroll and resize event
     *
     * @param {void}
     * @return {void}
     */
    function bindWindowEvent() {
        var me = this, $element = me[$ELEMENT];

        function onWindowScroll($event) {
            if(!me[SHOWN]) return;

            var top = me[HEADER_HEIGHT] || 0;

            if(me[TOP] !== top) {
                me[TOP] = top;
                $element.css("top", top);
            }
        }

        function onWindowResize($event) {
            if(!me[SHOWN]) return;

            var left = ($(this).width() - $element.width()) * 0.5;

            if(me[LEFT] !== left) {
                me[LEFT] = left;
                $element.css("left", left);
            }
        }

        $(window)
            .bind(EVENT_SCORLL, onWindowScroll)
            .bind(EVENT_RESIZE, onWindowResize);
    }

    /*!
     * unbind window scroll and resize event
     *
     * @param {void}
     * @return {void}
     */
    function unbindWindowEvent() {
        $(window)
            .unbind(EVENT_SCORLL)
            .unbind(EVENT_RESIZE);
    }

    /*!
     * set notification position
     *
     * @param {void}
     * @return {void}
     */
    function setPosition() {
        $(window)
            .trigger(EVENT_RESIZE)
            .trigger(EVENT_SCORLL);
    }

    /*!
     * show notification(confirm/alert)
     *
     * @param {Object} enrollInfo, {enrollNodeType(string), nodeId(int)}
     * @param {Object} actionInfo, {type(string), target(string)}
     * @return {void}
     */
    function show(enrollInfo, actionInfo) {
        var me = this;
        clearData.call(me, BUSY);

        // get header height from header widget
	    if ( $(SEL_HEADERFOOTER).length > 0 ) {
		    me[HEADER_HEIGHT] = $(SEL_HEADERFOOTER).height();
	    }

        // try to get school offset top as header height if no header hub
        if(me[HEADER_HEIGHT] === UNDEF) {
            me.publish("school/offset").spread(function(offset) {
                if(offset) {
                    me[HEADER_HEIGHT] = offset.top;
                }
            });
        }

        var actionType = actionInfo.type,
            actionTarget = actionInfo.target,
            actionTypeTarget = actionType + "!" + actionTarget;

            me[ACTION_TYPE_TARGET] = actionTypeTarget;

        var isAlert = actionType === "alert";
        var dataBuilder = DATA_BUILDER[actionTypeTarget];
        if(typeof(dataBuilder) !== TYPE_FUNCTION) {
            isAlert = false;
            dataBuilder = DATA_BUILDER[DEFAULT];
        }
        var tpl = dataBuilder.call(me) || {};

		return when(tpl).then(function(tpl){
			var blurbList = BLURB_LIST;

			if(isAlert) {
				tpl[CONFIRM_BUTTON] = blurbList[BLURB + "150652"];
				tpl[CONFIRM_ACTION] = "ok";
			} else {
				tpl[CONFIRM_BUTTON] = blurbList[BLURB + "450019"];
				tpl[CONFIRM_ACTION] = "confirm";
			}
			tpl[CANCEL_BUTTON] = blurbList[BLURB + "450018"];

			var data = {
				"isConfirm": !isAlert,
				"tpl": tpl
			};
			return me.html(tNotification, data).then(function doneCall() {
				unbindWindowEvent.call(me);
				bindWindowEvent.call(me);
				me[SHOWN] = true;
				setPosition.call(me);
				me[$ELEMENT]
					.removeClass(CLS_NONE)
					.find(SEL_CONFIRM_BUTTON)
					.data("templateId", enrollInfo.templateId);
			});
		});
    }

    /*!
     * hide notification and do some clear works
     *
     * @param {void}
     * @return {void}
     */
    function hide() {
        var me = this;
        unbindWindowEvent.call(me);
        clearData.call(me, SHOWN);
        me[$ELEMENT].addClass(CLS_NONE);
    }

    /**
     * Notification module definition
     */
    return Widget.extend({
        /**
         * sig/start
         * preload blurb
         */
        "sig/start": function onStart() {
            var me = this;

            if(me[BLURB_LOADED]) {
                return;
            }

            me[BLURB_LOADED] = true;

			return me.query(CCL_CHANGECOURSE_CONFIRMLEVEL_BLURB).spread(function(blurb){

				var blurbList = BLURB_LIST;
				blurbList[BLURB + window.JSON.parse(blurb.value).mainTitle] = "";
				blurbList[BLURB + window.JSON.parse(blurb.value).subTitle] = "";

				var q = [];
				$.each(blurbList || false, function(blurbid, value) {
					q.push(blurbid);
				});

				return me.query(q).spread(function doneQuery() {
					$.each(arguments || false, function(i, blurb) {
						var translation = blurb && blurb.translation;
						if(translation) {
							blurbList[blurb.id] = translation;
						}
					});
				},function failQuery() {
					me[BLURB_LOADED] = false;
				});
			});

        },

        /**
         * subscription: hub/change-course/notification/show
         * show confirm/alert notification
         *
         * @param {Object} enrollInfo, {enrollNodeType(string), nodeId(int)}
         * @param {Object} actionInfo, {type(string), target(string)}
         * @return {void}
         */
        "hub/change-course/notification/show": function onShow(enrollInfo, actionInfo) {
            var me = this;

            show.call(me, enrollInfo, actionInfo);
        },

        /**
         * dom/action/confirm
         * change course when click confirm button
         *
         * @param {Object} $event jQuery event
         * @param {Enum} enrollNodeType
         * @param {Integer} nodeId
         * @return {void}
         */
        "dom:[data-action='confirm']/click": function onConfirm($event) {
            var me = this;
            if(me[BUSY]) return;

            me[BUSY] = true;
            var $widget = me[$ELEMENT],
                dataSet = $($event.currentTarget).data();

            var templateId = dataSet["templateId"];

            var formArray = $widget.find('form').serializeArray();
            var formJson;

            if(formArray.length) {
                formJson = {};
                $(formArray).each(function(i, item) {
                    formJson[item.name] = item.value;
                });
            }

            var enrollInfo = {
                "templateId" : templateId,
                "formJson": formJson
            };

            // hide notification for good user experience
            hide.call(me);
            return me.publish("change-course/change/course", enrollInfo).ensure(function(){
                clearData.call(me, BUSY);
            });
        },

        /**
         * dom/action/cancel
         * hide notification and do some clear works for confirm
         *
         * @param {Object} $event jQuery event
         * @return {void}
         */
        "dom:[data-action='cancel']/click": function onCancel($event) {
            hide.call(this);
        },

        /**
         * dom/action/ok
         * hide notification and do some clear works for alert
         */
        "dom:[data-action='ok']/click": function onOK($event) {
            hide.call(this);
        }
    });
});
