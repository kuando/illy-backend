/**
 * Koa config
 */

'use strict';

var cors = require('koa-cors');
var _ = require('lodash');
var morgan = require('koa-morgan');
var jwt = require('koa-jwt');
var bodyParser = require('koa-bodyparser');
var xmlParser = require('../app/weixin/xmlParser');
var config = require('./config');
var logger = require('./logger');
var receiverProxy = require('../app/weixin/proxy');

module.exports = function (app) {

    //loading data models
    require('../app/models');

    //parser weixin xml msg
    app.use(xmlParser());

    //handle weixin event and msg
    app.use(receiverProxy());

    app.use(bodyParser());

    //cors settings
    app.use(cors({
        'Access-Control-Allow-Headers': 'X-Requested-With,content-type, Authorization',
        'Access-Control-Max-Age': 1728000
    }));


    // error handler
    app.use(function *(next) {
        try {
            yield next;
        } catch (err) {
            switch (err.status) {
                case 401:
                    this.status = 401;
                    this.body = err.message;
                    break;
                case 400:
                    this.status = 400;
                    this.body = {error: err.message};
                    break;
                case 404:
                    this.status = 404;
                    this.body = {
                        info: 'illy api',
                        docUrl: config.docUrl
                    };
                    break;
                default :
                    throw err;
            }
        }
    });

    // jwt token
    app.use(jwt(config.jwt).unless({path: [/^\/api\/v1\/public/]}));

    //log  request detail in debug mode
    if (config.debug) {
        app.use(function*(next) {
            console.log('request url : ', this.request.url);
            console.log('request body: ', this.request.body);
            yield next;
            console.log('response :', this.body);
        });
    }

    //loading routes
    require('../app/routes')(app);

    // handler 404
    app.use(function *() {
        this.throw(404, 'Resource Not Found');
    });

};
