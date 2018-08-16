/**
 * # widget/unitpage/unit/unit-pass/main.js
 *
 * Unit pass animation for unit passed
 *
 * @author UX Team
 * @version 0.0.1
 */
define([
    "jquery",
    "troopjs-ef/component/widget",
    "template!./unit-pass.html",
    "template!./legacy-unit-pass.html",
    "public/progress-state",
    "public/query-builder",
    "public/module"
], function UnitPassModule($, Widget, tUnitPass, tLegacyUnitPass, ProgressState, QueryBuilder, module) {
    "use strict";
    /*!
     * dom constants
     */
    var $ELEMENT = "$element",
        ISLEGACYPROGRESS = "isLegacyProgress",
        CLS_ETS_UNIT_PASS_BANNER = "ets-unit-pass-banner",
        CLS_ETS_UNIT_LEGACY_PASS_BANNER = "ets-unit-legacy-pass-banner";

    /*!
     * widget data keys
     */
    var ENROLLMENT_ID = "_enrollmentId",
        UNIT = "_unit",
        UNIT_PASSED = "_unitPassed",
        UNIT_PROGRESS = "_unitProgress",
	    LEVEL_PROGRESS = "_levelProgress";

    /*!
     * other constants
     */
    var TIMEOUT_BEFORE_ANIMATE = 2000,
        TIMEOUT_LEVEL_PASS = 1000,
        DURATION_TIME = 500,
        ANIMATION_LIST = [
            {
                selector: '.ets-unit-pass-banner-content',
                option: {
                    width: 0,
                    height: '30',
                    paddingTop: '15px',
                    paddingRight: '7px',
                    paddingBottom: '10px',
                    paddingLeft: '8px'
                },
                resetOption: {name: 'width', initValue: 15}
            },
            {
                selector: '.ets-unit-pass-tag',
                option: {width: '20', height: '16', top: '2px', marginRight: '5px'}
            },
            {
                selector: '.ets-unit-pass-copy1',
                option: {fontSize: '20px'}
            },
            {
                selector: '.ets-unit-pass-copy2-line1', option: {fontSize: '14px', left: 0, top: '10px'},
                resetOption: {name: 'left', initValue: 50}
            },
            {
                selector: '.ets-unit-pass-copy2-line2', option: {fontSize: '12px', left: 0, top: '25px'},
                resetOption: {name: 'left', initValue: 50}
            }
        ];

	// b2s custom
	var CCL_IS_B2S_PARTNER = 'ccl!"student.is.b2s"';

    /*!
     * animate unit pass
     *
     * @return {void}
     */
    function animateUnitPass() {
        var me = this,
            $element = me[$ELEMENT];


        return me.publish("unit/get/unit-passed-width").spread(function(width){
            $.each(ANIMATION_LIST, function(i, animationData) {
                var $el = animationData.selector ? $element.find(animationData.selector) : $element,
                    resetOption = animationData.resetOption;

                // set resetOption value with the calculated "unit passed" width + its initValue
                if(resetOption) {
                    animationData.option[resetOption.name] = resetOption.initValue + width;
                }
                $el.animate(animationData.option, DURATION_TIME);
            });

	        // b2s custom
	        if(me._isB2S == "true") {
		        var url = me[$ELEMENT].find('.ets-unit-pass-b2s-btn .ets-btn').eq(0).data('url');

		        me[$ELEMENT].find('.ets-unit-pass-b2s-btn').hide(DURATION_TIME)
			        .end().find('.ets-ui-unit-b2s-info').show(DURATION_TIME)
			        .end().css({
				        'cursor': 'pointer'
			        }).animate({
				        'height': 35
			        },200)
			        .on('click',function(){
				        window.open(url, '_self');
				        return false;
			        });
	        }
        });
    }

    /*!
     * show unit pass
     *
     * @return {void}
     */
	function showUnitPass() {
		var me = this;
		var appName = "school-ui-study",
			imgPath = module.config().cacheServer + "/_shared/" + appName + "/" + module.config()["app-version"][appName];

		var data = {
			"imgPath": imgPath,
			"isB2S": !!(me._isB2S && me._isB2S == 'true')
		};

		return me.publish("school/partner-widgets/weave-promise").then(function () {
			// school interface unit-pass
			return me.publish("school/interface/unitPass", true).spread(function (promise) {
				if (!promise) {
					return;
				}
				me[$ELEMENT].css({
					width: "",
					height: "",
					padding: ""
				}).show();

				var renderPromise = me.html(tUnitPass, data);

				// non b2s custom
				if (me._isB2S != "true") {
					setTimeout(function () {
						renderPromise.then(function () {
							animateUnitPass.call(me);
						});
					}, TIMEOUT_BEFORE_ANIMATE);
				}

				return renderPromise;
			});
		});
	}

    /*!
     * show unit legacy pass
     */
    function showLegacyPass(){
        var me = this;
        me.$element.removeClass(CLS_ETS_UNIT_PASS_BANNER).addClass(CLS_ETS_UNIT_LEGACY_PASS_BANNER).show();
        return me.html(tLegacyUnitPass);
    }

    /*!
     * set level and unit progress by progress as widget data
     *
     * @param {Object} progress
     * @return {void}
     */
    function setProgress(progress) {
        var me = this;
        if(progress) {
            me[UNIT_PROGRESS] = progress.unitProgress;
	        me[LEVEL_PROGRESS] = progress.levelProgress;
        } else {
            delete me[UNIT_PROGRESS];
	        delete me[LEVEL_PROGRESS];
        }
    }

    /*!
     * Try query unit progress, if it is successfully queried, call callback
     *
     * @callback {function} gets called when progress are retrived
     */
    function queryUnitProgress() {
        var me = this,
            enrollmentId = me[ENROLLMENT_ID],
            unit = me[UNIT],
            unitInfo = me._unitInfo;

        if (!enrollmentId || !unit || !unitInfo) {
            return;
        }

        var units = (unitInfo && unitInfo.children) || {},
            currentUnitInfo = $.grep(units, function(item, i){
                return item.id === unit.id;
            })[0];

        if(!currentUnitInfo) return;

        me[UNIT_PASSED] = ProgressState.hasPassed(currentUnitInfo.progress.state || 0);
        me[ISLEGACYPROGRESS] = currentUnitInfo.isLegacyProgress;

        if(me[UNIT_PASSED] && me[ISLEGACYPROGRESS]){
            showLegacyPass.call(me);
        }
    }

    /**
     * Unit pass module definition
     */
    return Widget.extend({
        /**
         * subscription, query unit progress and set its state as widget data when load unit
         *
         * @param {Object} unit
         */
        "hub:memory/load/unit": function onUnit(unit) {
            var me = this;

            me[UNIT] = unit;

            queryUnitProgress.call(me);
        },

        "hub:memory/load/enrollment": function onEnrollment(enrollment) {
            if(enrollment) {
                this[ENROLLMENT_ID] = enrollment.id;
            }
            queryUnitProgress.call(this);
        },

        "hub:memory/load/navigation/units": function onLoadNavigationUnits(unitInfo){
            this._unitInfo = unitInfo;
            queryUnitProgress.call(this);
        },

        /**
         * subscription, set progress as widget data when update progress
         *
         */
        "hub/ef/update/progress": function onUpdateProgress() {
            var me = this;
            if (!me[UNIT_PASSED] && me[UNIT]) {
                var unit = me[UNIT];
                var level = unit.parent;

                // clear level to refresh level's current unit progress
                me.publish("school/clearCache", level.id).then(function() {
                    me.query([level.id + ".progress", unit.id + ".progress"]).spread(function (level, unit) {
                        var progress = {
                            levelProgress: level.progress,
                            unitProgress: unit.progress
                        };
                        setProgress.call(me, progress);
                        if (ProgressState.hasPassed(unit.progress.state || 0)) {
                            me.publish("school/interface/unitPassing").spread(function () {
                                me.publish("unit/pass");
                            });
                        }
                    });
                });
            }
        },

        /**
         * subscription: hub/activity/closed
         * show unit/level pass if unit/level passed when close activity container
         *
         * @return {void}
         */
        "hub/activity/closed": function onCloseActivity() {
            var me = this, unitProgress;
            if(me[UNIT_PASSED] && me[ISLEGACYPROGRESS]){
                showLegacyPass.call(me);
            }
            if(me[UNIT_PASSED]) return;

            unitProgress = me[UNIT_PROGRESS];

            if(unitProgress && ProgressState.hasPassed(unitProgress.state || 0)) {
                me[UNIT_PASSED] = true;

	            me.publish('studyplan/rerender');

	            me.query(CCL_IS_B2S_PARTNER).spread(function(isB2S){
		            me._isB2S = isB2S.value;
		            showUnitPass.call(me).then(function(){
			            var state = (me[LEVEL_PROGRESS] || {}).state || 0;
			            return me.publish("level/is/passed", state).spread(function(passed){
				            if(passed) {
					            setTimeout(function() {
						            me.publish("level-pass/show");
					            }, TIMEOUT_LEVEL_PASS);
				            }
			            });
		            }).ensure(function(){
			            setProgress.call(me, null);
		            });
	            });
            }
        },

	    "dom:[data-action='openLink']/click": function openlink(evt){
		    var dataSet = $(evt.currentTarget).data();
		    animateUnitPass.call(this);
		    window.open(dataSet['url'], '_self');
	    }
    });
});
