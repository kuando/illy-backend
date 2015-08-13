/**
 * Created by Frank on 15/7/6.
 */
'use strict';
var co = require('co');
var _ = require('lodash');
var models = require('../../models');
var format = require('string-template');
var queue = require('../../tasks');
var messageTemplate = '<xml>' +
    '<ToUserName><![CDATA[{to}]]></ToUserName>' +
    '<FromUserName><![CDATA[{from}]]></FromUserName>' +
    '<CreateTime>{createTime}</CreateTime>' +
    '<MsgType><![CDATA[text]]></MsgType>' +
    '<Content><![CDATA[{content}]]></Content>' +
    '</xml>';

/**
 *
 * 处理关注事件
 * @param ctx
 *
 */
var handleSubscribe = co.wrap(function *(msg) {
    var eventKey = msg.EventKey;
    if (!eventKey) {
        return format(messageTemplate,
            {
                to: msg.FromUserName,
                from: msg.ToUserName,
                createTime: new Date().getTime(),
                content: '欢迎加入家校云'
            });
    }
    var scene = eventKey.split('_')[1];
    //说明是关注学校场景值二维码
    var School = models.School;
    var school = yield School.findOne({username: scene}, '_id schoolName').lean().exec();
    if (school) {
        var visitor = new models.Visitor({
            schoolId: school._id,
            openid: msg.ToUserName
        });
        yield visitor.save();  //保持访客信息
        return format(messageTemplate,
            {
                to: msg.FromUserName,
                from: msg.ToUserName,
                createTime: new Date().getTime(),
                content: '欢迎加入 [' + school.schoolName + ']' + '家校云。'
            });
    }
});

/**
 *
 * 处理取消关注事件
 * @param msg
 *
 */
var handleUnSubscribe = co.wrap(function* (msg) {
    //将任务添加至任务队列中
    queue.create('unSubscribe', {openid: msg.FromUserName}).save();
    return '';
});


/**
 *
 * 其他事件
 *
 */
var handleOther = co.wrap(function*() {
    return '';
});

module.exports = function (msg) {
    var event = msg.Event;
    // 处理关注事件
    if (event === 'subscribe') {
        return handleSubscribe(msg);
    }
    // 处理取关事件
    if (event === 'unsubscribe') {
        return handleUnSubscribe(msg);
    }
    return handleOther();
};
