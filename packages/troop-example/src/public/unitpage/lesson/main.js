/**
 * A widget that contains a lesson
 *
 * @class lesson
 */
define([
    "jquery",
    "troopjs-ef/component/widget",
    "public/progress-state",
    "public/query-builder",
    "public/typeid-parser",
    "public/path-formatter",
    "shadow!jquery.fancybox#$=jquery&jQuery=jquery&exports=jQuery",
    "template!./lesson.html"
], function LessonModule($, Widget, progressState, queryBuilder, parser, pathFormatter, jFancybox, tLesson) {
    "use strict";

    var UNDEF;
    var $ELEMENT = "$element";
    var BOTTOM = "bottom";
    var TOP = "top";

    var CLS = {
        UNIT : 'ets-ui-unit-bd-content',
        LESSON : 'ets-ui-lesson-container',
        ACTIVE : 'ets-active',
        TOP : 'ets-ui-steps-' + TOP,
        BOTTOM : 'ets-ui-steps-' + BOTTOM
    };

    var MOVEMENT_LENGTH_AVOID_OVERLAY = 30,
        MOVEMENT_LENGTH = 40 + MOVEMENT_LENGTH_AVOID_OVERLAY + 5, // 50 is the padding of STEP_CONTAINER
        MOVEMENT_DURATION = 400;

    var HAS_NEW_CONTENT = "_hasNewContent";

    var CCL_IS_B2B_PARTNER = 'ccl!"siteredesign.b2b.partner"';


    /**
     * Render the widget UI
     *
     * @api private
     */
    function doRender(unitId, lessonId) {
        var me = this;

        if (!unitId || !lessonId) {
            return;
        }

        var lessonQ = lessonId + ".lessonImage,.progress.detail";
        var unitQ = unitId;
        var pcLesson;

        return me.query(lessonQ, unitQ, CCL_IS_B2B_PARTNER).spread(function (lesson, unit, partnerInfo) {
            //add .children preload data for step-list
            return me.query("pc_student_lesson_map!" + lesson.templateLessonId + ".lesson.children,.lesson.progress").spread(function(lessonMap){
                pcLesson = lessonMap.lesson || {};
                unit = unit || {};

                me.pcLessonId = pcLesson.id;
                me._lesson = pcLesson;
                me._unit = unit;

                var mobileProgress;
                var pcProgress;

                lesson.progress.detail.items.forEach(function(entry, entryIndex){
                    if(entry.sourceTypeCode === "PCLesson") {
                        pcProgress = entry;
                    }
                    else if(entry.sourceTypeCode === "MOBLesson") {
                        mobileProgress = entry;
                    }
                });

                return me.html(tLesson, {
                    lesson: lesson,
                    pcProgress: pcProgress,
                    mobileProgress: mobileProgress,
                    progress: lesson.progress,
                    pcLesson: pcLesson,
                    _hasPassed: progressState.hasPassed,
                    _hasStarted: progressState.hasStarted,
                    hasPassed: function(){
                        return progressState.hasPassed(pcLesson && pcLesson.progress && pcLesson.progress.state);
                    },
                    isLocked: function(){
                        return isUnitLocked.call(me);
                    },
                    hasNewContent: function(){
                        //Get information from "isNewContentUpgradeAvail"
                        return me[HAS_NEW_CONTENT] && (partnerInfo && partnerInfo.value === 'false');
                    }
                }).then(function(){
                    delete pcLesson["isLocked"];
                });
            });

        });
    }

    /**
     * Check if current unit which this lesson belong to is locked or not,
     * if unit locked, lesosn will display locked status
     *
     * @api private
     * @return {boolean}
     */
    function isUnitLocked () {
        return this._unit.isLocked;
    }

    return Widget.extend(function($element, name, count, unitId, lessonId) {
        var me = this;
        me.count = count;
        me.unitId = unitId;
        me.lessonId = lessonId;
        me.pcLessonId = UNDEF;
    }, {
        "sig/start": function() {
            var me = this;
            return doRender.call(me, me.unitId, me.lessonId);
        },

        "hub:memory/load/lesson" : function onLesson(lesson) {
            var me = this;

	        if(!lesson) {
		        me.close();
		        return;
	        }

            //Unroute lesson if unit is locked
            me.publish("unit/is/locked").spread(function (locked) {
                if (locked && window.location.search.indexOf("debug") < 0) {
                    me.publish("unroute", lesson.id);
                    return;
                } else {
                    if (lesson && lesson.id === me.pcLessonId) {
                        me.open();
                    }
                    else {
                        me.close();
                    }
                }
            });

        },

        "hub:memory/load/navigation/units" : function onNavUnits(unitInfo) {
            var me = this;

            me[HAS_NEW_CONTENT] = unitInfo && unitInfo.isNewerContentAvail;
        },

        "dom/action.click": $.noop,

        "dom:[data-action='click/lesson']/click": function onClickLesson() {
            this.publish("unit-lock/show");
            return false;
        },

        "dom/action/route" : function onRoute($event, lessonId) {
            var me = this;

            if (me[$ELEMENT].hasClass(CLS.ACTIVE)) {
                me.publish("unroute", lessonId);
                return false;
            }
        },

        //will be called by activity
        "hub/refresh/lesson": function onRefreshLesson(pcLesson){
            var me = this;

            if (!pcLesson || pcLesson.id != me.pcLessonId) {
                return;
            }

            doRender.call(me, me.unitId, me.lessonId);
        },

        "dom:[data-action='route']/click" : function onRoute(evt) {
            var me = this;

            var dataSet = $(evt.currentTarget).data();
            var lessonId = dataSet['lessonId'];

            if (me[$ELEMENT].hasClass(CLS.ACTIVE)) {
                me.publish("unroute", lessonId);
            } else {
                me.publish("route/uri", lessonId);
            }

            return false;
        },

        "dom:[data-action='mobile-pass']/click" : function onMobilePass(evt) {
            var me = this;

            jFancybox.fancybox({
                type: "html",
                topRatio: 0.4,
                content: me[$ELEMENT].find(".ets-ui-lesson-xd-popup-mobile-wrapper-pass").html(),
                padding: 0,
                margin: 0,
                closeBtn: false,
                helpers: {
                    overlay :{
                        closeClick: false
                    }
                },
                afterShow: function(obj) {
                    $(".fancybox-wrap").find("[data-action='close-popup']").click(function(){
                        jFancybox.fancybox.close();
                    });
                }
            });

            return false;
        },

        "dom:[data-action='mobile-start']/click" : function onMobileStart(evt) {
            var me = this;

            jFancybox.fancybox({
                type: "html",
                topRatio: 0.4,
                content: me[$ELEMENT].find(".ets-ui-lesson-xd-popup-mobile-wrapper-start").html(),
                padding: 0,
                margin: 0,
                closeBtn: false,
                helpers: {
                    overlay :{
                        closeClick: false
                    }
                },
                afterShow: function(obj) {
                    $(".fancybox-wrap").find("[data-action='close-popup']").click(function(){
                        jFancybox.fancybox.close();
                    });
                }
            });

            return false;
        },

        "hub/unit/wrap/click":function(){
            pathFormatter.collapse('lesson');
        },

        /**
         * Open current lesson
         */
        "open" : function() {
            var me = this;
            var $element = me[$ELEMENT];
            var position = me.count <= 2
                ? TOP
                : BOTTOM;

            return $element
                .closest("." + CLS.UNIT)
                .removeClass(CLS.TOP + " " + CLS.BOTTOM)
                .addClass(position === TOP ? CLS.TOP : CLS.BOTTOM)
                .end()
                .addClass(CLS.ACTIVE)
                .stop()
                .animate(position === TOP ? { "bottom" : -1 * MOVEMENT_LENGTH } : { "top" : -1 * MOVEMENT_LENGTH }, MOVEMENT_DURATION)
                .promise();
        },

        /**
         * Close current lesson
         */
        "close": function(){
            var me = this;
            var $element = me[$ELEMENT];
            var position = me.count <= 2
                ? TOP
                : BOTTOM;

            return $element
                .removeClass(CLS.ACTIVE)
                .stop()
                .animate(position === TOP ? { "bottom" : 0 } : { "top" : 0 }, MOVEMENT_DURATION)
                .promise();
        }
    });
});
