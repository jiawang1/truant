define([
	"jquery",
	"when",
	"poly",
	"troopjs-ef/component/gadget"
], function ($, when, poly, Gadget) {
	var PATTERN_LEVELNAME_PREFIX = /^\d+/;
	var CCL_LEVEL_NO_MAP_QUERY = "ccl!'school.courseware.levelNumMapping.query'";
	var mappingRule;
	var initPromise;

	var gadget = Gadget.create({
		init: function () {
			var me = this;

			if (!initPromise) {
				initPromise = me.query(CCL_LEVEL_NO_MAP_QUERY).spread(function (cclResult) {
					var mappingQuery = cclResult.value;
					return mappingQuery && me.query(mappingQuery).spread(function (queryResult) {
							if (queryResult) {
								mappingRule = $.extend({}, queryResult.courseLevelNoMap);
							}
						});
				});
			}
			return initPromise;
		},
		hasMappingRule: function () {
			return Boolean(mappingRule);
		},

		getMappedLevelNoByCode: function (levelCode) {
			return mappingRule && mappingRule[levelCode];
		},
		getMappedLevelNo: function (level) {
			if (level) {
				return mappingRule ? mappingRule[level.levelCode] : level.levelNo;
			}
		},
		getMappedLevelName: function (level) {
			var levelName;

			if (level) {
				levelName = level.levelName;
				if (mappingRule) {
					var mappedLevelNo = mappingRule[level.levelCode];
					if (mappedLevelNo) {
						levelName = levelName.replace(PATTERN_LEVELNAME_PREFIX, mappedLevelNo);
					}
				}
			}

			return levelName;
		},

		replaceLevelNo: function (level) {
			if (mappingRule && level) {
				level.levelNo = this.getMappedLevelNo(level);
			}
		},
		replaceLevelNos: function (levels) {
			if (mappingRule && levels && levels.length) {
				levels.forEach(this.replaceLevelNo, this);
			}
		},

		replaceLevelName: function (level) {
			if (mappingRule && level) {
				level.levelName = this.getMappedLevelName(level);
			}
		},
		replaceLevelNames: function (levels) {
			if (mappingRule && levels && levels.length) {
				levels.forEach(this.replaceLevelName, this);
			}
		}
	});

	gadget.start();
	return gadget;
});