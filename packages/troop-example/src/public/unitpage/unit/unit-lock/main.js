/**
 * # widget/unitpage/unit/unit-lock/main.js
 *
 * Unit lock info animation when clik locked unit lesson
 *
 * @author UX Team
 * @version 0.0.1
 */
define([
    "jquery",
    "troopjs-ef/component/widget",
    "template!./unit-lock.html"
], function UnitLockModule($, Widget, tUnitLock ) {
    "use strict";
    /*!
     * dom constants
     */
    var $ELEMENT = "$element";

    /*!
     * other constants
     */
    var TIMEOUT_ANIMATE = 1500,
        DURATION_TIME = 500,
        IS_SHOWING = "_isShowing";

    /*!
     * show unit lock info
     *
     * @param {Object} deferred
     * @return {void}
     */
    function showUnitLock() {
        var me = this,
            $element = me[$ELEMENT];

        function onAnimationEnd() {
            delete me[IS_SHOWING];
        }

        function animateUnitLock(onComplete) {
            $element.animate(
                {
                    "height": "toggle"
                },
                {
                    "duration": DURATION_TIME,
                    "complete": onComplete
                }
            );
        }

        animateUnitLock(function() {
            setTimeout(function() { animateUnitLock(onAnimationEnd); }, TIMEOUT_ANIMATE);
        });
    }

    /**
     * Unit lock module definition
     */
    return Widget.extend({
        "sig/start": function onStart() {
            return this.html(tUnitLock);
        },

        "hub/unit-lock/show": function onShowUnitLock() {
            var me = this;
            if(me[IS_SHOWING]) {
                return;
            }
            me[IS_SHOWING] = true;

            showUnitLock.call(me);
        }
    });
});