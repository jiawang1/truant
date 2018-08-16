/**
 * # widget/plugin/change-course/main.js
 *
 * Expand/collapse course level list and other functions for change course
 *
 * @author UX Team
 * @version 0.0.1
 */
define([
    "jquery",
    "troopjs-ef/component/widget",
    "template!./change-course.html",
    "public/enum/course-type",
    "public/enum/enroll-node-type",
    "public/typeid-parser",
    "public/update-helper",
    "public/progress-state",
	"public/level-no-mapper",
    "public/enum/ccl",
	"when"
], function ChangeCourseModule($, Widget, tChangeCourse, CourseType, EnrollNodeType, TypeidParser, UpdateHelper, ProgressState, levelNoMapper, ccl, when) {
    "use strict";
    /*!
     * dom constants
     */
    var $ELEMENT = "$element",
        CLASS_HIDDEN = "ets-hidden",
        CLASS_ACTIVE = "ets-active",
	    SELECTOR_LEVEL = ".ets-chl-current-level",
        SELECTOR_CUR_COURSE = ".ets-chl-current-level-course",
        SELECTOR_CUR_LEVEL = ".ets-chl-current-level-name",
        SELECTOR_CHL_CONTAINER = ".ets-chl-options-container",
        SELECTOR_CHL_BTN = ".ets-chl-btn";

    /*!
     * widget data keys
     */
    var ENABLE_CHANGE_LEVEL = "_enableChangeLevel",
        NEED_CHANGE_COURSE = "_needChangeCourse",
        COURSE = "_course",
        COURSE_NAME = "_courseName",
        ENROLLABLE_LEVELS = "_enrollAbleLevels",
        ENROLLABLE_COURSES = "_enrollAbleCourses",
        LEVEL_NAME = "_levelName",
        LEVEL = "_level";

    /*!
     * other constants
     */
    var MEMORY = true,
        HUB_LOAD_COURSE = "load/course",
        HUB_LOAD_LEVEL = "load/level",
        HUB_TRACK = 'tracking/track',
        TOGGLE_DURATION = 500;

    var CHANGE_COURSE = "changecourse",
        RE_CHANGE_COURSE_HASH_PART = new RegExp("\\b" + CHANGE_COURSE + "\\b", "i"),
        RE_CHANGE_COURSE_HASH_FULL = new RegExp("^school\\/.*?" + CHANGE_COURSE, "i"),
        RE_CHANGE_COURSE_HASH_PATH = new RegExp("[\\?|\\||\\&]*" + CHANGE_COURSE, "i"),
        isCourseChangedByRequest = false;

    /*!
     * enable change level ture/false
     *
     * @param {Boolean} enabled true/false
     * @return {void}
     */
    function enableChangeLevel(enabled) {
        var me = this;
        me[ENABLE_CHANGE_LEVEL] = !!enabled;
        me[$ELEMENT]
            .find(SELECTOR_CHL_BTN)
            .toggleClass(CLASS_HIDDEN, !enabled)
	        .end()
	        .find(SELECTOR_LEVEL)
	        .css('cursor', 'pointer');
    }

    /*!
     * get if change level enabled or not
     *
     * @param {void}
     * @return {Boolean} true if enabled else false
     */
    function isEnabledChangeLevel() {
        return !!this[ENABLE_CHANGE_LEVEL];
    }

    /*!
     * expand/collapse course level list
     *
     * @param {Boolean} mustExpanded true/false
     * @return {void}
     */
    function toggleChangeLevel(mustExpanded) {
        var me = this,
            $element = me[$ELEMENT],
            $courseList = $element.find(SELECTOR_CHL_CONTAINER),
            isCourseListExpanded = $courseList.is(":visible");

        if(mustExpanded && isCourseListExpanded) {
            return;
        }

        $courseList.animate({
            height: "toggle",
            opacity: "toggle"
        }, TOGGLE_DURATION);

        $element
            .find(SELECTOR_CHL_BTN)
            .toggleClass(CLASS_ACTIVE);

        if(!isCourseListExpanded) {
            me.publish(HUB_TRACK, 'study/change-course/expand');
        } else {
            me.publish(HUB_TRACK, 'study/change-course/collpase');
        }
    }

    /*!
     * change course by enrollNodeType and nodeId or formJson(optional)
     *
     * @param {Object} enrollInfo, {enrollNodeType(string), nodeId(int), formJson(optional)}
     * @return {void}
     */
    function changeCourse(enrollInfo) {
        var me = this;
        var data = {
            "templateId": enrollInfo.templateId
        };
        var formJson = enrollInfo.formJson;
        if(formJson) {
            $.extend(data, formJson);
        }

		var $changeCourse = me[$ELEMENT].find("[data-template-id=" + data.templateId + "]");

		// for EFEC special logic
		return me.query(["ccl!'Config.Partner.IsEnglishCenter'", "student_enrollable_courses!*.items"]).spread(function(isEC, enrollableCourse){
			levelNoMapper.hasMappingRule() && enrollableCourse.items.forEach(function (course) {
				if (CourseType.isGECourse(course.courseTypeCode)) {
					levelNoMapper.replaceLevelNames(course.children);
				}
			});

			 if( (isEC.value && isEC.value === "true") ) {
				var GECourseID;
				enrollableCourse.items.forEach(function(entry){
					if(entry.courseTypeCode === "GE") {
						GECourseID = entry.studentCourseId;
					}
				});
				if(GECourseID) {
					return me.query("student_course_enrollment!" + GECourseID).spread(function(currentEnroll){
						if(currentEnroll && currentEnroll.studentLevel) {
							return me.query(currentEnroll.studentLevel.id).spread(function(level){
								if ($changeCourse.data("course-type-code") === "GE" && ($changeCourse.data("templateId") != level.templateLevelId)) {
									return me.query("efec_student_level!" + "template_level;" + $changeCourse.data("templateId") + ".parent").spread(function (data) {
										var hash = [
											"school",
											data.parent.studentCourseId,
											data.parent.studentCourseId,
											TypeidParser.parseId(data.id),
											TypeidParser.parseId(data.children[0].id)
										];

										window.location.hash = hash.join("/");
									});
								}
								else {
									return UpdateHelper.updateEnrollment(data).then(function(){
										if(formJson) {
											me.publish("course-list/course/changed", enrollInfo);
										}
										return me.publish("context/update/context");
									});
								}
							});
						}
					});
				}
			}
			else {
				return UpdateHelper.updateEnrollment(data).then(function(){
					if(formJson) {
						me.publish("course-list/course/changed", enrollInfo);
					}
					return me.publish("context/update/context");
				});
			}
		});
	}

    /*!
     * set widget course name and cache it
     *
     * @param {String} courseName
     * @return {void}
     */
    function setCourseName(courseName) {
        var me = this;

        me[COURSE_NAME] = courseName;

        me[$ELEMENT]
            .find(SELECTOR_CUR_COURSE)
            .text((courseName || "") + ":");
    }

    /*!
     * set widget level name and cache it
     *
     * @param {String} levelName
     * @return {void}
     */
    function setLevelName(levelName) {
        var me = this;

        me[LEVEL_NAME] = levelName;

        me[$ELEMENT]
            .find(SELECTOR_CUR_LEVEL)
            .text(levelName || "");
    }

    /*!
     * get current level index by levelid in levels
     *
     * @param {Array} levels
     * @param {String} levelid
     * @return {Integer} index
     */
    function currentLevelIndexOf(levels, levelId) {
        var me = this, index = -1;
        $.each(levels || [], function(i, level) {
            // In new contents, level id is get from "enrollable_courses"
            if(level.studentLevelId === levelId) {
                index = i;
                return false;
            }
        });
        return index;
    }


    function getNextEnrollableLevel(enrollInfo, cb){
        var me = this,
            courses = me[ENROLLABLE_COURSES],
            info,
            templateId = enrollInfo.templateId;

        /*
            TODO: We'd better use a service instead of the following logic
                cause that will:
                a. improve front-end performance
                b. more readable and maintainable

            We need check next level is Chrysalis or not, if it is and
            have passed, then we should skip.

        */
        // 1. Iterator enrollable levels, find current level's next levels.
        //      Find the first not passed legacy level or other level

        // 2. Build new enrollInfo for change course
        if(courses){
            $.each(courses.items, function(i, item){
                $.each(item.children, function(idx, level){
                    if(enrollInfo.templateId == level.templateLevelId &&
                        item.children[idx + 1] ){
                        info = {
                            templateId : item.children[idx + 1].templateLevelId
                        }
                    }
                });
            });
        }

        cb && cb.call(me, info);
        return info;
    }

    /**
     * Change course module definition
     */
    return Widget.extend({
	    "sig/start":function onStart() {
		    this.publish("school/interface-widget/ready");
	    },
        /**
         * sig/initialize
         * render change course
         *
         * @return {void}
         */
        "sig/initialize": function onInitialize() {
            var me = this,
                courseName = me[COURSE_NAME];

	        return me.query('ccl!"school.courseware.showCourseName.enable"').spread(function (showCourseName) {
		        var data = {
			        "courseName": (courseName ? (courseName + ":") : ""),
			        "levelName": (me[LEVEL_NAME] || ""),
			        "ccl": ccl,
			        "showCourseName": !!(showCourseName && showCourseName.value.toLowerCase() === "true")
		        };
		        return me.html(tChangeCourse, data);
	        });
        },
        /**
        *  subscription: hub/load/enrollable/courses
        *  called by "course list" widget when query "enrollable_courses!current"
        */
        "hub:memory/load/enrollable/courses": function enrollableCourses(courses){
            this[ENROLLABLE_COURSES] = courses;
        },
        /**
         * subscription: hub:memory/level/changed
         * called by "level" widget when level changed
         *
         * @param {Object} level
         * @return {void}
         */
        "hub:memory/level/changed": function onLevelChanged(level) {
            if(!level) return;

            var me = this;

            setCourseName.call(me, level.parent.courseName);
            setLevelName.call(me, level.levelName);

            return me.publish("course-list/highlight", level);
        },

        "hub:memory/load/course": function onCourse(course) {
            this[COURSE] = course;
        },

        "hub:memory/load/level": function onLevel(level) {
            var me = this;
            if(level) {
                me[LEVEL] = level;
            }
        },

        /**
         * subscription: hub/change-course/enabled
         * notice me change level is enabled for "course-list" widget
         *
         * @return {void}
         */
        "hub/change-course/enabled": function onEnableChangeLevel() {
            var me = this;
            enableChangeLevel.call(me, true);

            if(me[NEED_CHANGE_COURSE]) {
                me[NEED_CHANGE_COURSE] = false;
                toggleChangeLevel.call(me, true);
            }
        },

        /**
         * subscribe hub:memory/route to detect if change course
         */
        "hub:memory/route": function onRoute(uri) {
            var me = this;

            // check if hash query exists in uri
            var query = uri && uri.query;
            if(query && query.toString().search(RE_CHANGE_COURSE_HASH_PART) >= 0) {
                if(uri.toString().search(RE_CHANGE_COURSE_HASH_FULL) >= 0) {
                    if(isCourseChangedByRequest) {
                        // if has processed the change course request,
                        // skip changecourse page and goto previous page
                        window.history.go(-1);
                        return;
                    }

                    isCourseChangedByRequest = true;
                    var loc = window.location;
                    loc.hash = loc.hash.replace(RE_CHANGE_COURSE_HASH_PATH, "");
                }
                if(me[ENABLE_CHANGE_LEVEL]) {
                    toggleChangeLevel.call(me, true);
                } else {
                    me[NEED_CHANGE_COURSE] = true;
                }
            }
        },

        /**
         * subscription: hub/change-course/change/course
         * change course for "notification" widget
         *
         * @param {Object} enrollInfo, {enrollNodeType(string), nodeId(int), formJson(optional)}
         */
        "hub/change-course/change/course": function onChangeCourse(enrollInfo) {
            var me = this;

            // Cache currentEnrollmentId (so we can compare with it later)
            var previousEnrollmentId = me.currentEnrollmentId;

            return when((function(){
                // hide course list for good user experience
                toggleChangeLevel.call(me, false);
                me.publish("school/spin");
                return changeCourse.call(me, enrollInfo);
            })()).then(function(context){
                    var currentEnrollment;

                    // If we did not change enrollment, just remove the spinner
                    if (context && (currentEnrollment = context.currentEnrollment) && currentEnrollment.id === previousEnrollmentId) {
                        return me.publish("school/despin");
                    }
                },function(){
                    // despin school widget
                    return me.publish("school/despin");
                });
        },

        /**
         * subscription: hub/change-course/next/level
         * goto next level for "level-pass" widget
         *
         * @param {Enum} enrollNodeType
         * @param {Integer} nodeId
         */
        "hub/change-course/next/level": function onNextLevel(templateId, isNext) {
            var me = this,
                enrollInfo = {
                    templateId : templateId
                };

            //1. Get next level info util:
            //  a.  first non-legacy level
            //  b.  first not finished legacy level
            if(isNext) {
                changeCourse.call(this, {
                    templateId : templateId
                });
            } else {
                return getNextEnrollableLevel.call(me, enrollInfo, function(info){
                    info && changeCourse.call(this, info);
                });
            }
        },

        /**
         * open course list for other widgets(i.e. when all SPIN course units passed)
         *
         */
        "hub/change-course/open/course-list": function onOpenCourseList() {
            var me = this;
            if(!isEnabledChangeLevel.call(me)) return;

            toggleChangeLevel.call(me, true);
        },

        /**
         * dom/action/toggle
         * toggle(expand/collapse) change level container
         *
         * @param {Object} $event jQuery event
         * @return {void}
         */
        "dom:[data-action='toggle']/click": function onToggle($event) {
            var me = this;
            if(!isEnabledChangeLevel.call(me)) return;

            toggleChangeLevel.call(me, false);
        },

        /**
         * subscription: hub/school/interface/isSPIN
         * check if student is in SPIN currently
         * this hub is provided for third part use
         *
         * @return {Array} of [result]
         */
        "hub/school/interface/isSPIN": function () {
            var me = this;
            return [CourseType.isSpinCourse(me[COURSE].courseTypeCode)];
        },

        /**
         * subscription: hub/school/interface/courseList/render
         * render course list widget
         * this hub is provided for third part use
         *
         * @return {Object} Promise
         */
        "hub/school/interface/courseList/render": function () {
            return this.publish("course-list/render");
        },

        /**
         * subscription: hub/school/interface/nextLevel
         * switch to next level when student finished a level and on the MoveOn page
         * this hub is provided for third part use
         *
         * @return {Object} Promise
         */
        "hub/school/interface/nextLevel": function (templateId) {
            //TODO: EFEC need to change the parameter
            var me = this;
            return me.query("student_enrollable_courses!*.items.children").spread(function (enrollableCourse) {
                levelNoMapper.hasMappingRule() && enrollableCourse.items.forEach(function (course) {
                    if (CourseType.isGECourse(course.courseTypeCode)) {
                        levelNoMapper.replaceLevelNames(course.children);
                    }
                });
                return me.publish("change-course/next/level", templateId, true);
            });
        }
    });
});
