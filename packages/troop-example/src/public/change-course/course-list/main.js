/**
 * # widget/plugin/change-course/course-list/main.js
 *
 * Course list for change course
 *
 * @author UX Team
 * @version 0.0.1
 */
define([
	"jquery",
	"when",
	"troopjs-ef/component/widget",
	"template!./course-list.html",
	"public/enum/course-type",
	"public/enum/enroll-node-type",
	"public/progress-state",
	"public/level-no-mapper"
], function CourseListModule($, when, Widget, tCourseList, CourseType, EnrollNodeType, ProgressState, levelNoMapper) {
	"use strict";
	/*!
	 * dom constants
	 */
	var $ELEMENT = "$element",
		CLS_NONE = "ets-none",
		CLS_ACTIVE = "ets-active",
		CLS_PASSED = "ets-passed",
		SEL_LEVEL_OPTIONS = ".ets-chl-options",
		SEL_LEVEL_CONTAINER = ".ets-chl-course-level-container",
		SEL_ACTIVE_LEVEL_CONTAINER = SEL_LEVEL_CONTAINER + "." + CLS_ACTIVE,
		SEL_LEVEL_STATUS = ".ets-chl-course-level-status";

	/*!
	 * widget data keys
	 */
	var CURRENT_COURSE_TYPE = "_currentCourseType";

	/*!
	 * other constants
	 */
	var ACTION_TYPE_CONFIRM = "confirm",
		ACTION_TYPE_ALERT = "alert",
		HUB_LOAD_ENROLLABLE_COURSES = "load/enrollable/courses";

	var LEVEL_NO = "_levelNo";
	var TEMPLATE_LEVEL_ID = "_template_level_id";

	/*!
	 * render course list
	 *
	 * @return {void}
	 */
	function renderCourseList() {
		var me = this;
		return when.all([
			me.publish("school/partner-widgets/weave-promise"),
			levelNoMapper.init()
		]).then(function () {
			return me.publish("school/interface/courseList/queryString", "student_enrollable_courses!*.items.children.progress").spread(function (queryString) {
				// cache CCL for click use
				return me.query([queryString, 'ccl!"school.changecourse.minimum.levelno"']).spread(function (courses) {
					levelNoMapper.hasMappingRule() && courses.items.forEach(function (course) {
						if (CourseType.isGECourse(course.courseTypeCode)) {
							levelNoMapper.replaceLevelNames(course.children);
						}
					});

					courses = courses || {};
					sortCourses(courses.items);

					//Publish for new content changes
					me.publish(HUB_LOAD_ENROLLABLE_COURSES, courses);

					var data = {
						"courses": courses,
						"levelNotices": getLevelNotices(courses),
						"hasPassed": ProgressState.hasPassed // check if level has passed by state
					};

					return me.html(tCourseList, data).then(function () {
						me[$ELEMENT].find(SEL_LEVEL_OPTIONS).removeClass(CLS_NONE);
						highlightLevelElement.call(me, me[TEMPLATE_LEVEL_ID]);
					});
				});
			});
		});
	}

	function sortCourses(courseItems) {
		courseItems.sort(function sort(prev, next) {
			if (CourseType.isGECourse(prev.courseTypeCode)) {
				return -1;
			}
			else if (CourseType.isGECourse(next.courseTypeCode)) {
				return 1;
			}
			else if (prev.children.length !== next.children.length) {
				return prev.children.length - next.children.length;
			}
			else {
				return prev.templateCourseId - next.templateCourseId;
			}
		});
	}

	function getLevelNotices(courses) {
		//if enrollable courses' service is "efec_student_enrollable_courses!*", there would be accessibleComment on level
		var uniqNotes = [];

		courses.items.forEach(function (course) {
			course.children.forEach(function (level) {
				var comment = level.accessibleComment;
				if (comment && uniqNotes.indexOf(comment) === -1) {
					uniqNotes.push(comment);
				}
			})
		});

		return uniqNotes;
	}

	function highlightLevelElement(templateLevelId) {
		if (templateLevelId) {
			this.$element
			.find(SEL_LEVEL_CONTAINER).removeClass(CLS_ACTIVE)
			.filter("[data-template-id='" + templateLevelId + "']").addClass(CLS_ACTIVE);
		}
	}

	/**
	 * Course list module definition
	 */
	return Widget.extend({
		/**
		 * sig/start
		 * notice "change-course" widget change level is enabled
		 *
		 */
		"sig/start": function onStart() {
			var me = this;
			return renderCourseList.call(me).then(function () {
				me.publish("change-course/enabled");
			})
		},

		/**
		 * subscription: hub/course-list/render
		 */
		"hub/course-list/render": function onRender() {
			renderCourseList.call(this);
		},

		/**
		 * subscription: hub:memory/course-list/highlight
		 * highlight current accessed level
		 * called by "change-course" widget when level changed
		 *
		 * @param {Object} level
		 */
		"hub:memory/course-list/highlight": function onHighlight(level) {
			var me = this;

			me[TEMPLATE_LEVEL_ID] = level.templateLevelId;
			highlightLevelElement.call(me, me[TEMPLATE_LEVEL_ID]);
		},

		"hub:memory/load/level": function onLevel(level) {
			var me = this;
			if (level) {
				me[LEVEL_NO] = level.levelNo;
				me[TEMPLATE_LEVEL_ID] = level.templateLevelId;
				highlightLevelElement.call(me, me[TEMPLATE_LEVEL_ID]);
			}
		},

		"hub:memory/load/course": function onCourse(course) {
			var me = this;
			if (course) {
				me[CURRENT_COURSE_TYPE] = course.courseTypeCode;
			}
		},

		/**
		 * subscription: hub/course-list/level/passed
		 * set course level status passed for "level-pass" widget
		 *
		 * @return {void}
		 */
		"hub/course-list/level/passed": function onLevelPassed() {
			this[$ELEMENT]
			.find(SEL_ACTIVE_LEVEL_CONTAINER)
			.find(SEL_LEVEL_STATUS)
			.addClass(CLS_PASSED);
		},

		/**
		 * subscription, set progress as widget data when update progress
		 *
		 */
		"hub/ef/update/progress": function onUpdateProgress() {
			renderCourseList.call(this);
		},

		/**
		 * show change course notification confirm/alert
		 *
		 * @param {Object} $event jQuery event
		 * @param {String} courseTypeCode
		 * @param {Enum} enrollNodeType
		 * @param {Integer} nodeId
		 * @param {Bool} legacyProgress
		 * @param {Bool} passed
		 */
		"dom:[data-action='change/course']/click": function onChangeCourse($event) {
			var me = this;
			var $currentTarget = $($event.currentTarget);

			// return immediately if change to the current actived course/level
			if ($currentTarget.hasClass(CLS_ACTIVE)) {
				return;
			}

			var dataSet = $currentTarget.data();
			//Get data from data-XX
			var targetCourseTypeCode = dataSet["courseTypeCode"];
			var targetTemplateId = dataSet["templateId"];

			var isFromGE = CourseType.isGECourse(me[CURRENT_COURSE_TYPE]),
				isToGE = CourseType.isGECourse(targetCourseTypeCode);

			me.query('ccl!"school.changecourse.minimum.levelno"').spread(function getLevelLimitation(levelInfo) {
				// check GE level if change course from GE to SPIN
				var actionType = isFromGE && !isToGE && me[LEVEL_NO] < parseInt(levelInfo.value || 0) ?
					ACTION_TYPE_ALERT :
					ACTION_TYPE_CONFIRM;
				var actionTarget = isFromGE && isToGE ? "level" : "course";

				var enrollInfo = {
					"templateId": targetTemplateId
				};
				var actionInfo = {
					"type": actionType,
					"target": actionTarget
				};

				me.publish("change-course/notification/show", enrollInfo, actionInfo);
			});
		},

		"dom:[data-action='navigate']/click": function onNavigate($event) {
			var url = $($event.currentTarget).data('url');
			location.href = url;
		},

		/**
		 * prevent bubble event to parent element. see ECS-7603
		 */
		"dom/click": function (e) {
			e.stopPropagation();
		}
	});
});
