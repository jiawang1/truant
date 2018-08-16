/**
 * # widget/unitpage/course/main.js
 *
 * Render course level
 *
 * @author UX Team
 * @version 0.0.1
 */
define([
    "troopjs-ef/component/widget",
    "template!./course.html"
], function CourseModule(Widget, tCourse) {
    "use strict";

    /**
     * Course module definition
     */
    return Widget.extend({
        /**
         * sig/start
         * render course
         *
         * @param {String} signal
         * @param {Object} deferred
         * @return {void}
         */
        "sig/start": function onStart() {
            return this.html(tCourse, {});
        }
    });
});