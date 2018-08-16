/**
*   Notification Module
*   This module is used to presente full screen messages.
*   TODO in version 1:
*   1. consist one notification at the same time
*   2. notification will show by fullscreen
*   3. have hard coded unit notification content
*/
define([
    "jquery",
    "troopjs-ef/component/widget",
    "public/update-helper",
    "template!./notification.html"
], function notificationModule($, Widget, UpdateHelper, tNotification) {
    "use strict";

    //Const Variables
    var CLS_NONE = "ets-none",
        NEW_CONTENT_KEYCODE = "e13.newcontentcoming.intercept.popup";

    //Construtor
    function ctor(){

    }

    //Instance method


    //Util method
    function onClose(){
        if(!this.$element) return;
        this.$element.addClass(CLS_NONE);
    }

    return  Widget.extend(ctor, {
        "sig/start": function(){
            return this.html(tNotification);
        },
        "hub/notification/show": function(){
            if(!this.$element) return;
            this.$element.removeClass(CLS_NONE);
        },
        "hub/notification/hide": function(){
            onClose.call(this);
        },
        "dom:[data-action='close']/click": function(){
            onClose.call(this);
            UpdateHelper.saveMemberSite({
                keycode: NEW_CONTENT_KEYCODE,
                keyValue: true,
                siteArea: "school"
            });
        }
    });
});
