/**
 * A widget that contains 4 lessons
 *
 * @class lesson-list
 */
define(["jquery",
    "troopjs-ef/component/widget",
    "template!./lesson-list.html"
], function LessonListModule($, Widget, tLessonList) {
    "use strict";

    var CLS = {
        LESSON_CONTAINER: 'ets-ui-lesson-container',
        STEP_CONTAINER: 'ets-ui-step-container',
        STEP_WRAP: 'ets-ui-steps-wrap',
        STEP_UI: 'ets-ui-step'
    };

    return Widget.extend({
        "hub:memory/load/unit": function onUnitLoad(unit) {
            var me = this;
            var unit_id;

            if (unit && (unit_id = unit.id) && unit_id !== me.unit_id && unit.children) {
                me.unit_id = unit_id;

                me.html(tLessonList, {
                    unit : unit,
                    lessons: unit.children,
                    classes: CLS
                });
            }
        }
    });
});