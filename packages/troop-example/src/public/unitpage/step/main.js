/**
 * A widget contains a step
 *
 * @class step
 */
define([
    "jquery",
    "troopjs-ef/component/widget",
    "public/query-builder",
    "public/typeid-parser",
    "public/enum/ccl",
    "template!./step.html"
], function StepModule($, Widget, queryBuilder, parser, CCL, tStep) {
    "use strict";

    // pubsub topic contant
    var TOPIC_RENDER_ACT_CON = "render/activity/container";
    var HUB_LOAD_ENROLLMENT = "load/enrollment";
    var QUERY_TEM_VER = "e12_template_version!current";
    var NEW = "new";

    /**
     * Render the widget UI
     *
     * @api private
     */
    function doRender(){
        var me = this;

        if(!me.studentCourse_id || !me.step_id || !me.id) {
            return;
        }

        me.query(me.id + ".progress").spread(function(step){
            step.uiMode = me.stepUiMode;

            me.html(tStep, step).then(function(){
                delete step["progress"];
                delete step["uiMode"];
            });
        });
    }

    function getIframeWindow() {
        var me = this;
        var doc = me.$element[0].ownerDocument;
        var win = 'defaultView' in doc? doc.defaultView : doc.parentWindow;
        return win;
    }

    /**
     * Show activty container in popup,
     * it will trigger to display a legacy activty page in iframe
     * or display new activity page in current page
     *
     * @api private
     */
    function kickOffActLauncher(){
        var me = this;

        CCL.query(QUERY_TEM_VER).spread(function(templateVersion){
            if (templateVersion && templateVersion.value !== NEW){
                me.publish("activity/launcher/open").then(function(){
                    me.publish("render/activity/container", me.id);
                });
            } else {
                me.publish("render/activity/container", me.id);
            }
        });
    }

    return Widget.extend(function($element, name, id, stepUiMode){
        var me = this;
        me.id = id;
        me.step_id = parser.parseId(id);
        me.stepUiMode = stepUiMode;
    }, {
        "sig/start" : function start() {
            var me = this;
            return doRender.call(me);
        },

        "sig/stop" : function stop() {
            var me = this;
        },

        "sig/render": function onRender(){
            var me = this;

            if(!me.studentCourse_id || !me.step_id || !me.id) {
                return;
            }

            return doRender.call(me);
        },

        "hub:memory/load/step": function onLoadStep(step) {
            var me = this;

            if (!step) {
                return;
            }

            if (me.id === step.id) {
                me.publish("unit/is/locked").spread(function (locked) {
                    if (locked && window.location.search.indexOf("debug") < 0) {
                        // access a locked step is forbidden
                        me.publish("unroute", me.id);
                        return;
                    } else {
                        kickOffActLauncher.call(me);
                    }
                });
            }
        },

        "hub:memory/load/enrollment": function onEnrollment(enrollment) {
            var me = this;

            if (enrollment) {
                me.studentCourse_id = parser.parseId(enrollment.id);
            }

            me.signal("render");
        },

        "dom/action.click": $.noop,

        "dom:[data-action='route']/click": function routeStep(event) {
            var me = this,
                $step = $(event.currentTarget),
                $action = $step.children('.ets-ui-step-action');

            var dataSet = $step.data();
            var stepId = dataSet['stepId'];
            me.publish("route/uri", stepId);

            if (!$step.hasClass('ets-passed') &&
                ($action.length === 0 || $action.is(":hidden"))) {
                    event.stopPropagation();
                    return;
            }

            return false;
        }
    });
});
