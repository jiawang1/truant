/**
 * A widget contains all of the steps in one specific lesson
 *
 * @class step-list
 */
define([
    "jquery",
    "troopjs-ef/component/widget",
    "public/progress-state",
    "public/query-builder",
    "public/typeid-parser",
    "template!./step-list.html"
], function StepListModule($, Widget, progressState, queryBuilder, parser, tStepList) {
    "use strict";

    var $ELEMENT = "$element";

    var CLS = {
        EXPANDED: "ets-expanded",
        STEP: 'ets-ui-step',
        STEP_CONTAINER: 'ets-ui-step-container',
        STEP_WRAP: 'ets-ui-steps-wrap',
        STEP_UI: 'ets-ui-step'
    };

    var SEL_STEP = ".ets-ui-step";

    var MOVEMENT_DURATION = 400,
        DEFAULT_STEP_HEIGHT = 37,
        DEFAULT_PADDING_HEIGHT = 107;

    /**
     * Rich steps status that for rendering the UI
     *
     * @api private
     * @param {object} steps a array contains steps
     * @param {object} progresses a array contains steps progresses
     */
    function fillStepsState (steps) {
        var me = this;

        var existTriedOrStartupStep = false;

        for (var i = 0; i < steps.length; i++) {
            var step = steps[i];
            var progress = step.progress;

            step.hasPassed = progressState.hasPassed(progress.state);
            if(!step.hasPassed) {
                step.hasStarted = progressState.hasStarted(progress.state);
            }
            if (!step.hasPassed && !step.hasStarted && !existTriedOrStartupStep) {
                /* if one step is not passed (!hasPassed), and don't have any studied activities (!hasTried), and
                    all of the steps (in current lesson) before this step are passed and not tried (lastStepPassedNotTried) */
                step.isStartup = true;
            }
            if (!existTriedOrStartupStep)
            {
                existTriedOrStartupStep = (step.hasStarted || step.isStartup);
            }
        }
    }

    /**
     * Render the widget UI
     *
     * @api private
     */
    function doRender(lessonId, studentCourse_id) {
        var me = this;

        if (!lessonId || !studentCourse_id) {
            return;
        }

        return me.query(lessonId + ".children.progress").spread(function (lesson) {

            var steps = lesson.children;

            fillStepsState.call(me, steps);

            return me
                .html(tStepList, steps)
                .then(function () {
                    $.each(steps, function (i, step) {
                        delete step["hasPassed"];
                        delete step["hasTried"];
                        delete step["isStartup"];
                        delete step["uiMode"];
                    });

                    me.$element
                    .addClass(CLS.EXPANDED)
                    .show();

                    me.$element
                        .find(SEL_STEP)
                        .css('opacity', '0')
                        .each(function(i, el){
                            var $el = $(el);

                            setTimeout(function(){
                                $el.animate({
                                        opacity: 1
                                    })
                            }, i * 30);
                        });
                });
        });
    }

    return Widget.extend({
        "hub:memory/load/enrollment": function onEnrollment(enrollment) {
            var me = this;

            me.studentCourse_id = enrollment && parser.parseId(enrollment.id);

            doRender.call(me, me.lessonId, me.studentCourse_id);
        },

        "hub:memory/load/lesson": function onLesson(lesson) {
            var me = this;

	        if(!lesson){
		        me.close();
		        return;
	        }

            me.publish("unit/is/locked").spread(function (locked) {
                //Unroute lesson if unit is locked
                if (locked && window.location.search.indexOf("debug") < 0) {
                    me.publish("unroute", lesson.id);
                    return;
                } else {
                    me.lessonId = lesson && lesson.id;

                    if (lesson) {

                        var offset;

                        if (lesson.lessonNo <= 2)  {
                            offset = 30;
                        } else {
                            offset = -30;
                        }

                        me.open(lesson.children.length * DEFAULT_STEP_HEIGHT + DEFAULT_PADDING_HEIGHT, offset).then(function(){
                            doRender.call(me, me.lessonId, me.studentCourse_id);
                        });
                    }
                    else {
                        me.close();
                    }
                }
            });

        },

        "hub/activity/update/progress": function refreshStepList() {
            var me = this;

            return doRender.call(me, me.lessonId, me.studentCourse_id);
        },

        "open": function (height, offset) {
            var me = this;
            var $element = me[$ELEMENT];

            return $element
                .find(SEL_STEP)
                .css('opacity', '0')
                .end()
                .addClass(CLS.EXPANDED)
                .stop()
                .animate({
                    "height" : height,
                    "top" : offset
                }, MOVEMENT_DURATION)
                .promise();
        },

        "close" : function () {
            var me = this;
            var $element = me[$ELEMENT];

            return $element
                .removeClass(CLS.EXPANDED)
                .stop()
                .animate({
                    "height" : 0,
                    "top" : 0
                }, MOVEMENT_DURATION)
                .promise();
        }
    });
});
