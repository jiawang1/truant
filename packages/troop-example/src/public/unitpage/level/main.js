/**
 * # widget/unitpage/level/main.js
 *
 * Render unit and unit browsing
 *
 * @author UX Team
 * @version 0.0.1
 */
define([
    "jquery",
    "troopjs-ef/component/widget",
    "template!./level.html",
    "public/enum/course-type",
    "public/typeid-parser",
    "public/progress-state",
    "public/query-builder",
    "public/level-no-mapper",
    "troopjs-browser/loom/config",
    "troopjs-browser/loom/weave",
    "when"
], function LevelModule($, Widget, tLevel, CourseType, TypeidParser, ProgressState, QueryBuilder, levelNoMapper, config, weave, when) {
    "use strict";
    /*!
     * dom constants
     */
    var $ELEMENT = "$element",
        CLASS_ACTIVE = "ets-active",
        CLASS_DISABLE = "ets-disabled",
        CLASS_UNIT_NAV = "ets-unit-nav",
        SELECTOR_UNIT_NAV = "." + CLASS_UNIT_NAV,
	    SELECTOR_UNIT_NAV_DOT = ".ets-ui-unn-dot",
        SELECTOR_UNIT_PREV_NEXT = [
            { selector: ".ets-ui-unn-btn-prev" },
            { selector: ".ets-ui-unn-btn-next" }
        ],
        SELECTOR_UNWEAVE = "[data-weaving],[data-woven]";

    var MSS_LEVEL_TEST_VERSION = "member_site_setting!'school;student.leveltest.version'";

    /*!
     * widget data keys
     */
    var ENROLLMENT_ID = "_enrollmentId",
        PRIVATE_LEVEL = "_level";

    /*!
    *  Const
    */
    var ENROLLMENT = "enrollment",
        LEVEL = "level",
        COURSE = "course",
        UNIT = "unit";

    /*!
     * other constants
     */
    var HUB_SHOW_NEW_CONTEN_NOTICE = "notification/show",
        UNIT_INDEX = "unitIndex",
        UNIT_ID = "unitId",
        NEW_CONTENT_MEMBER_KEY = 'member_site_setting!"school;e13.newcontentcoming.intercept.popup"',
        CCL_IS_B2B_PARTNER = 'ccl!"siteredesign.b2b.partner"',
        PREV_UNIT = -1,
        NEXT_UNIT = 1;

    /*!
     * check if level is changed by unitid
     *
     * @param {String} unitid
     * @return {Boolean} true if level changed, else false
     */
    function isLevelChanged(unitid) {
        var units = (this[PRIVATE_LEVEL] || {}).children || [],
            changed = true;
        $.each(units, function(index, item) {
            if(item.id === unitid) {
                changed = false;
                return false;
            }
        });

        return changed;
    }

    /*!
     * check if level passed by units for SPIN course
     *
     * @param {Object} deferred
     * @return {void}
     */
    function isLevelPassed() {

        var me = this,
            level = me[PRIVATE_LEVEL],
            passed = false;

        if(!level) {
            return;
        }

        var enrollmentId = me[ENROLLMENT_ID];
        if(!enrollmentId) {
            return;
        }

        me[PRIVATE_LEVEL] = me.level;

        if(me.level.children){
            var isPassed = true;
            $.each(me.level.children, function(i, courseInfo){
                if(!ProgressState.hasPassed(courseInfo.progress.state)){
                    isPassed = false;
                    return false;
                }
            });

            return isPassed;
        } else {
            throw "Backend Service Error!!";
        }
    }

    /*!
     * get sibling unit by type
     *
     * @param {Integer} unitIndex current unit index in unit list
     * @param {Integer} type -1/1 is prev/next
     * @return {Object} return unit if found else undefined
     */
    function siblingUnitOf(unitIndex, type) {
        var units = (this[PRIVATE_LEVEL] || {}).children;
        return (units[unitIndex + type] || undefined);
    }

    /*
    *  Add extra info for move on unit when there have new content
    */
    function setEnrollDataForMoveOnUnitByUnitId($el, unit){
        if(!$el || !this[PRIVATE_LEVEL] || !this[PRIVATE_LEVEL].children) return;

        var levelInfo = this[PRIVATE_LEVEL].children,
            currCourseInfo;

        if(unit){
            currCourseInfo = $.grep(levelInfo, function(v, i){
                return v.id === unit.id;
            })[0];

            $el.data({
                "enrollmentId": "student_course_enrollment!" + TypeidParser.parseId(currCourseInfo.parent.parent.id),
                "courseId": currCourseInfo.parent.parent.id,
                "levelId": currCourseInfo.parent.id,
                "unitId": currCourseInfo.id
            });

        } else {
            $el.removeData(['enrollmentId' , 'courseId' , 'levelId', 'unitId']);
        }
    }

    /*!
     * set prev, next button status
     *
     * @param {Object|undefined} prevUnit Previous unit
     * @param {Object|undefined} nextUnit Next unit
     * @return {void}
     */
    function setPrevNextButtonStatus(/*prevUnit, nextUnit*/) {
        var $element = this[$ELEMENT],
            me = this,
            args = arguments;

        $.each(SELECTOR_UNIT_PREV_NEXT, function(i, it) {
            var $it = $element.find(it.selector),
                unit = args[i];

            setEnrollDataForMoveOnUnitByUnitId.call(me, $it, unit);

            if(unit) {
                $it.removeClass(CLASS_DISABLE);
            } else {
                $it.addClass(CLASS_DISABLE);
            }
        });
    }


    /*!
     * On Level Rendered handler
     * @return {void}
     */
    function onRendered(){
        var me = this,
            prevUnit, nextUnit,
            unitIndex = me[$ELEMENT]
                        .find(SELECTOR_UNIT_NAV_DOT)
                        .removeClass(CLASS_ACTIVE)
                        .filter("[data-unit-id='" + me.unit.id + "']")
                        .addClass(CLASS_ACTIVE)
                        .data(UNIT_INDEX);

        if(unitIndex >= 0) {
            prevUnit = siblingUnitOf.call(me, unitIndex, PREV_UNIT);
            nextUnit = siblingUnitOf.call(me, unitIndex, NEXT_UNIT);
        }

        setPrevNextButtonStatus.call(me, prevUnit, nextUnit);
    }

    function initUnitNavAttr($el, level) {
        $el.data('units', level.children)
            .attr(config.weave, 'troopjs-ef/ccl/placeholder("public/unitpage/unit/unit-navigation/main")')
            .attr('data-ccl', 'school.courseware.enable.navigateUnit')
            .attr('class', CLASS_UNIT_NAV);
    }

    function addUnitNav(level) {
        var me = this;

        if (me[$ELEMENT].find(SELECTOR_UNIT_NAV_DOT).length > 0) {
            onRendered.call(me);
        }
        else {
            var $unitNav = $("<div></div>");
            initUnitNavAttr($unitNav, level);
            $unitNav.on("released", function () {
                me[$ELEMENT].append($unitNav);
                onRendered.call(me);
            });
            weave.call($unitNav);
        }
    }

    function replaceUnitNav(level) {
        var me = this;

        var $UnitNav = me[$ELEMENT].find(SELECTOR_UNIT_NAV);
        $UnitNav.unweave().then(function () {
            initUnitNavAttr($UnitNav, level);
            $UnitNav.weave();
        });
    }

    function _getLevelTestId(level) {
        var me = this;
        return me.query(MSS_LEVEL_TEST_VERSION).spread(function (mssLevelTestVersion) {
            var levelTestVersion = parseInt(mssLevelTestVersion && mssLevelTestVersion.value || 1);
            var levelTestId = levelTestVersion === 1 ? level.legacyLevelId : level.templateLevelId;
            return levelTestId;
        });
    }

    /**
     * Level module definition
     */
    return Widget.extend({
        /**
         * subscription: hub:memory/load/unit
         * render level if level changed and set unit browsing status
         *
         * @param {Object} unit
         */
         "hub:memory/load/unit": function onUnit(unit){
            if(!unit) return;

            var me = this,
                $subElsToUnweave = me[$ELEMENT].find(SELECTOR_UNWEAVE);

            me.unit = unit;
            me.level = unit.parent;
            levelNoMapper.replaceLevelName(me.level);

            var dfd = when.defer();
            dfd.promise.then(function(){
                addUnitNav.call(me, me.level);
            });

            if(isLevelChanged.call(me, unit.id)) {
                // unweave sub widgets before run query
                $subElsToUnweave.length && $subElsToUnweave.unweave();

                me.publish("school/clearCache", me.level.id).then(function() {
                    me.query(me.level.id + ".children.progress").spread(function() {
                        var courseTypeCode = me.level["courseTypeCode"];
                        me.publish("course-property/load/courseTypeCode", courseTypeCode);
                        me.publish("load/navigation/units", me.level);
                        // save level as widget data
                        me[PRIVATE_LEVEL] = me.level;
                        // If current have newer content, then will show notification
                        if (me.level.isNewerContentAvail) {
                            me.query(NEW_CONTENT_MEMBER_KEY, CCL_IS_B2B_PARTNER).spread(function (r, partnerInfo) {
                                if ((r && r.value === "true") || (partnerInfo && partnerInfo.value === "true")) {
                                    return;
                                }
                                me.publish(HUB_SHOW_NEW_CONTEN_NOTICE);
                            });
                        }
                        // publish level changed before render
                        me.publish("level/changed", me.level);
                        _getLevelTestId.call(me, me.level).then(function (levelTestId) {
                            me.html(tLevel, {
                                level: me.level,
                                levelTestId: levelTestId
                            }).then(function doneCall() {
                                dfd.resolver.resolve();
                            });
                        });
                    });
                });
            } else {
                // TODO: optimize else logic
                dfd.resolver.resolve();
            }

        },

        "hub:memory/load/enrollment": function onEnrollment(enrollment) {
            if(enrollment) {
                this[ENROLLMENT_ID] = enrollment.id;
            }
        },

        "hub/unit/pass": function () {
            var me = this;
            var unit = me.unit;
            var level = unit.parent;

            // clear level to refresh level's next unit id
            me.publish("school/clearCache", level.id).then(function(){
                me.query(level.id + ".children").spread(function (level) {
                    me[PRIVATE_LEVEL] = level;
                    replaceUnitNav.call(me,level);
                });
            });
        },

        /**
         * subscription: hub/level/is/passed
         * check if level is passed by units for SPIN course
         *
         */
        "hub/level/is/passed": function onCheckLevelPassed() {
            return when(isLevelPassed.call(this),function(isPassed){
               return [isPassed];
            });
        }
    });
});
