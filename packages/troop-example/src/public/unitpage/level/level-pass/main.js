/**
 * # widget/unitpage/level/leve-pass/main.js
 *
 * Level completion for level passed
 *
 * @author UX Team
 * @version 0.0.1
 */
define([
    "jquery",
    "when",
    "troopjs-ef/component/widget",
    "public/enum/course-type",
    "template!./level-pass.html"
], function LevelPassModule($, when, Widget, CourseType, tLevelPass) {
    "use strict";
    /*!
     * dom constants
     */
    var $ELEMENT = "$element";

    /*!
     * widget data keys
     */
    var BUSY = "_busy";

    /*!
     * other constants
     */
    var CCL_ENABLE_LEVLE_TEST =  'ccl!"school.courseware.enableleveltest"',
	    CCL_ENABLE_CHANGE_COURSE = 'ccl!"school.courseware.enableChangeLevel"',
		CCL_ENABLE_GOTO_NEXT_LEVEL = 'ccl!"school.courseware.enableSelectNextLevel"';

    /*!
     * show level pass for GE, get next level before show level pass
     * show course pass for SPIN
     *
     * @param {void}
     * @return {void}
     */
	function showLevelPass() {
		var me = this;
		var levelTemplateId = me[$ELEMENT].data("levelTemplateId");
		var levelId = me[$ELEMENT].data("levelId");
		delete me[BUSY];

		return me.publish("school/partner-widgets/weave-promise").then(function () {
			return me.publish("school/interface/levelPass", true);
		}).spread(function (isLevelPassed) {
			if(!isLevelPassed) {
				return;
			}

			return me.query([
				levelId + ".parent.children",
				CCL_ENABLE_LEVLE_TEST,
				CCL_ENABLE_GOTO_NEXT_LEVEL,
				CCL_ENABLE_CHANGE_COURSE
			]).spread(function (level, cclEnableLevelTest, cclEnableGoToNextLevel, cclEnableSelectCourse) {
				var courseTypeCode = level.parent.courseTypeCode;
				var isLastLevel = level.parent.children[level.parent.children.length - 1].id === level.id;

				return me.html(tLevelPass, {
					isGE: CourseType.isGECourse(courseTypeCode),
					isSPIN: CourseType.isSpinCourse(courseTypeCode),
					levelTemplateId: levelTemplateId,
					isLastLevel: isLastLevel,
					hasLevelTest: !!(cclEnableLevelTest && cclEnableLevelTest.value.toLowerCase() === "true"),
					levelTestId: me[$ELEMENT].data('level-test-id'),
					enableGoToNextLevel: !!(cclEnableGoToNextLevel && cclEnableGoToNextLevel.value.toLowerCase() === "true"),
					enableSelectCourse: !!(cclEnableSelectCourse && cclEnableSelectCourse.value.toLowerCase() === "true")
				}).ensure(function alwaysCall() {
					me[$ELEMENT].show();
				});
			});
		});
	}

    /*!
     * render course/level pass page if level(GE)/course passed when page start
     *
     * @param {void}
     * @return {void}
     */
    function start() {
        var me = this;

        return me.publish("level/is/passed").spread(function doneCall(passed) {
            // show level/course pass page if level/course has passed
            if(passed) {
                showLevelPass.call(me);
            }
        });
    }

    function close() {
        this[$ELEMENT].hide().empty();
    }

    /**
     * Level pass module definition
     */
    return Widget.extend({
        /**
         * sig/start
         * show level pass page if level passed(GE)
         *
         */
        "sig/start": function onStart() {
            var me = this;
            start.call(me);
        },

        /**
         * subscription: hub/level-pass/show
         * used by other widget("unit-pass") to show level pass
         *
         */
        "hub/level-pass/show": function onShowLevelPass() {
            var me = this;

            showLevelPass.call(me);

            // call course-list hub
            me.publish("course-list/level/passed");
        },

        /**
         * dom/action/next/level
         * go to next level by enollNodeType and nodeId
         *
         * @param {Object} $event jQuery event
         * @param {Enum} enrollNodeType
         * @param {Integer} nodeId
         */
        "dom:[data-action='next/level']/click": function onGotoNextLevel($event) {
            var me = this,
                dataSet = $($event.currentTarget).data(),
                templateId = dataSet['templateId'];

            if(me[BUSY]) {
                return;
            }

            me[BUSY] = true;

            return me.publish("change-course/next/level", templateId).ensure(function(){
                delete me[BUSY];
            });
        },

        /**
         * dom/action/open/course-list
         * open course-list for SPIN course
         *
         * @param {Object} $event jQuery event
         * @return {void}
         */
        "dom:[data-action='open/course-list']/click": function onOpenCourseList($event) {
            return this.publish("change-course/open/course-list");
        },

        /**
         * dom/action/close
         * close level pass page
         *
         * @param {Object} $event jQuery event
         * @return {void}
         */
        "dom:[data-action='close']/click": function onClose($event) {
            close.call(this);
        }
    });
});
