/**
 * A widget that conains a unit, 4 lessons and all steps in each lesson.
 *
 * @class unit
 */
 define([
    "public/module",
    "jquery",
     "when",
    "troopjs-core/pubsub/hub",
    "troopjs-ef/component/widget",
    "template!./unit.html",
    "public/enum/ccl",
    "public/progress-state",
    "public/query-builder",
    "public/enum/ccl",
    "public/typeid-parser",
    "public/enum/course-type"
], function UnitModule(module, $, when, Hub, Widget, tUnit, cclConstant, ProgressState, QueryBuilder, CCL, Parser, CourseType) {
    "use strict";
    var $ELEMENT = "$element",
        SELECTOR_UNIT_PASSED = ".ets-ui-unit-status-passed",
        SELECTOR_UNIT_CONTAINER= ".ets-ui-unit-bd-container";

    var HUB_LOAD_NAVIGATION_UNITS = "load/navigation/units";

    var CCL_IS_B2B_PARTNER = 'ccl!"siteredesign.b2b.partner"',
        // b2s custom
	    CCL_IS_B2S_PARTNER = 'ccl!"student.is.b2s"',
        // custome unitOverView widget
        CCL_CUSTOM_UNIT_OVERVIEW = 'ccl!"school.e12.showUnitOverview"';

     var RENDER_PROMISE = "_render_promise";
     var IS_UNWEAVED = "_is_unweaved";
     var DEFAULT_UNIT_PASS_ICON = 'public/unitpage/unit/unit-pass-icon/main';

     /*
     * Get a customized widget for unit pass icon
     */
    function getUnitPassIcon(){
        var me = this;
        return me.publish("school/partner-widgets/weave-promise").then(function(){
            return me.publish("school/interface/unitPassIcon", DEFAULT_UNIT_PASS_ICON);
        }).spread(function(unitPassIcon){
            return unitPassIcon;
        });
    }

     /*!
     * Check if one unit should be locked or not,
     * it bases on 4 conditions: 1. CCL; 2. is first unit?; 3. has started in this unit?; 4. previous unit has passed?
     *
     * @api private
     * @return {boolean}
     */
    function isLocked(isEnableLockUnit, currUnitState, prevUnitState) {
        var me = this;

        var isEnableLockUnit = location.search.indexOf("unlockunit") != -1 ? false : isEnableLockUnit;
        var customUnitIsLock = !ProgressState.hasStarted(currUnitState) && !ProgressState.hasPassed(prevUnitState);

        return me.query("student_course_enrollment!" + me.studentCourse_id).spread(function(enroll){
            var isEnrollmentUnit = enroll.studentUnit.id === (me.unit || {}).id;

            return me.publish("school/partner-widgets/weave-promise").then(function () {
                return me.publish("school/interface/unitIsLock", customUnitIsLock).spread(function (promise) {
                    return isEnableLockUnit
                        && !isFirstUnitInLevel.call(me)
                        && !isEnrollmentUnit
                        && promise;
                });
            });
        });

    }

    /*!
     * Get privious unit id(unit!xxx)
     *
     * @api private
     * @return {String} return "" if it's first unit in current level; otherwise, return unit!xxx
     */
    function getPreviousUnitId () {
        var me = this,
            units = me.level.children,
            currUnitId = me.unit.id,
            prevUnitId,
            i = 0;

        // get the previous unit id
        for(i = units.length; i--;) {
            if(units[i].id === currUnitId && i > 0) {
                prevUnitId = units[i - 1].id;
                break;
            }
        }
        return prevUnitId;
    }

    /*!
     * Check if it's first unit in current level
     *
     * @return {boolean}
     * @api private
     */
    function isFirstUnitInLevel () {
        var me = this,
            units = me.level.children;

        return me.unit.id === units[0].id;
    }

    /**
     * Render the widget UI
     *
     * @api private
     */
    function doRender(level, studentCourse_id, course, unit) {
        if(!level || !studentCourse_id|| !unit || !course) {
            return;
        }

        var me = this,
            unit = $.extend({}, unit),
            hasNewContent,
            previousUnitInfo = {},
            currentUnitInfo = {},

            queryArr = [
                QueryBuilder.buildCCLQuery(cclConstant.enableChangeUnit),
                CCL_IS_B2B_PARTNER,
	            CCL_IS_B2S_PARTNER,
                CCL_CUSTOM_UNIT_OVERVIEW
            ],
            previousUnitId = getPreviousUnitId.call(me);

        me._isGE = course.courseTypeCode === CourseType.GeneralEnglish;

        //load unit related info data
        function onLoadNavigationUnits(unitInfo){
            unitInfo = unitInfo || {};

            var units = unitInfo.children || {};
            hasNewContent = unitInfo.isNewerContentAvail;

            $.each(units, function(i, item){
                if(item.id === me.unit.id){
                    previousUnitInfo = previousUnitId && units[i-1];
                    currentUnitInfo = item;
                    return false;
                }
            });
        }

        // reemit(event, senile, context, callback)
        Hub.on(HUB_LOAD_NAVIGATION_UNITS, Hub, onLoadNavigationUnits);
        Hub.reemit(HUB_LOAD_NAVIGATION_UNITS, false, Hub, onLoadNavigationUnits);
        Hub.off(HUB_LOAD_NAVIGATION_UNITS, Hub, onLoadNavigationUnits);

        // only query current unit pregress if current unit is first unit in current level
        // query current and previous unit progress if current unit is not the first unit in current level
        return me[RENDER_PROMISE] = me[RENDER_PROMISE].then(function () {
            return me.query(queryArr)
                .spread(function doneQuery(enableLockUnitQueryResult,
                                           partnerInfo,
                                           isB2S,
                                           customUnitOverView) {

                    var isEnableLockUnit = false,
                        currUnitSate = (currentUnitInfo && currentUnitInfo.progress && currentUnitInfo.progress.state) || 0,
                        prevUnitState = (previousUnitInfo && previousUnitInfo.progress && previousUnitInfo.progress.state) || 0;

                    unit.hasPassed = ProgressState.hasPassed(currUnitSate);
                    unit.hasNewContent = hasNewContent && (partnerInfo && partnerInfo.value === "false");
                    // b2s custom
                    unit.isB2S = !!(isB2S && isB2S.value === "true");
                    // unit overview custom
                    unit.showUnitOverview = !!(customUnitOverView && customUnitOverView.value === "true");

                    return when.all([
                        isLocked.call(me, isEnableLockUnit, currUnitSate, prevUnitState),
                        getUnitPassIcon.call(me)
                    ]).spread(function (resultIsLocked, unitPassIcon) {
                        unit.isLocked = resultIsLocked;
                        unit.unitPassIcon = unitPassIcon;
                        if (unit.id === me.unit.id) {
                            me.unit.isLocked = resultIsLocked;
                            return me[IS_UNWEAVED] || me.html(tUnit, unit).then(arg =>{

                              me.publish('bridge/unitPage', {node: me[$ELEMENT].find('.react-test')[0] }).then(function(result){
                                console.log('get result from react rendering, result :' + result);
                              }).catch(function(err){
                                console.error(err);
                              });
                              return arg;
                            });
                        }
                    });
                });
        });
    }

    return Widget.extend({
        "sig/start":function(){
            this[RENDER_PROMISE] = when.resolve();
        },
        "sig/finalize": function () {
            this[IS_UNWEAVED] = true;
        },
        "hub:memory/load/level": function onUnit(level) {
            var me = this;

            doRender.call(me, me.level = level, me.studentCourse_id, me.course, me.unit);
        },

        "hub:memory/load/unit": function onUnit(unit) {
            var me = this;

            doRender.call(me, me.level, me.studentCourse_id, me.course, me.unit = unit);
        },

        "hub:memory/context": function onContext(context) {
            var me = this;
            me.context = context;
        },

        "hub:memory/load/enrollment": function onLoadEnrollment(enrollment) {
            var me = this;
            if(enrollment) {
                me.studentCourse_id = Parser.parseId(enrollment.id);
            }
            doRender.call(me, me.level, me.studentCourse_id, me.course, me.unit);
        },

        "hub:memory/load/course": function onLoadCourse(course) {
            var me = this;
            doRender.call(me, me.level, me.studentCourse_id, me.course = course, me.unit);
        },

        "hub:memory/load/lesson": function onLoadLesson(pcLesson) {
            this.childActivePcLesson = pcLesson;
        },
        "hub/bridge/send/unit":function(event){
            this[$ELEMENT].find('.event-test').text(event.data);
        },

        //TODO:refactor
        "hub/activity/update/progress": function onActivityContainerClosed() {
            var me = this;
            if(!me.childActivePcLesson) {
                return;
            }

            me.publish("refresh/lesson", me.childActivePcLesson);
        },

        // TODO:remove
        "hub/unit/get/unit-passed-width": function onGetUnitPassedWidth() {
            var width = this[$ELEMENT].find(SELECTOR_UNIT_PASSED).width() || 0;
            return [ width ];
        },

        // TODO:refactor
        "hub:memory/unit/is/locked": function onUnitLocked() {
            return [ this.unit && this.unit.isLocked ];
        },

        "hub/unit/toggle/container/opacity": function(toggle, opacity) {
            var SPEED = 'fast';
            var $container = this[$ELEMENT].find(SELECTOR_UNIT_CONTAINER);
            var nowOpacity = $container.stop(true, true).css('opacity');

            if(toggle === undefined){
                if(nowOpacity < 1){
                    $container.fadeTo(SPEED, 1);
                }
                else {
                    $container.fadeTo(SPEED, opacity);
                }
            }
            else if(toggle === true){
                $container.fadeTo(SPEED, opacity);
            }
            else {
                $container.fadeTo(SPEED, 1);
            }
        },

	    "dom:[data-action='openLink']/click": function openlink(evt){
		    var dataSet = $(evt.currentTarget).data();
		    window.open(dataSet['url'], '_self');
	    }
    });
});
