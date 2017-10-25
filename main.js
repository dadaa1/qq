#!/usr/bin/env node

'use strict';

(function() {
  var log = new (require('log'))('debug');
  var auth = require("./src/qqauth-qrcode");
  var api = require("./src/qqapi");
  var QQBot = require("./src/qqbot");
  var defaults = require('./src/defaults');
  var config = require('./config');
  var KEY_COOKIES = 'qq-cookies';
  var KEY_AUTH = 'qq-auth';
  var list=[];

  var _ = require('lodash'),
  request=require('superagent');
  var url='http://www.tuling123.com/openapi/api'; 
  var APIkey='';
  /*
   * 获取接口需要的cookie和token
   * @param isneedlogin : 是否需要登录，or本地获取
   * @param options     : 配置文件涉及的内容
   * @callback (cookies,auth_info)
   */

  var get_tokens = function(isneedlogin, options, callback) {
    var auth_info, cookies;
    if (isneedlogin) {
      return auth.login(options, function(cookies, auth_info) {
        defaults.data(KEY_COOKIES, cookies);
        defaults.data(KEY_AUTH, auth_info);
        defaults.save();
        return callback(cookies, auth_info);
      });
    } else {
      cookies = defaults.data(KEY_COOKIES);
      auth_info = defaults.data(KEY_AUTH);
      log.info("skip login");
      return callback(cookies, auth_info);
    }
  };

  var run = function() {
    "starting qqbot ...";
    var isneedlogin, params;
    params = process.argv.slice(-1)[0] || '';
    isneedlogin = params.trim() !== 'nologin';
    return get_tokens(isneedlogin, config, function(cookies, auth_info) {
      console.log(cookies,auth_info);
      api.cookies(cookies);
      api.get_group_list(auth_info,function(ret,e){
          console.log('get_group_list',JSON.stringify(ret),e);
      })
      api.get_buddy_list(auth_info,function(ret,e){
         var friends=ret.result.friends;
         friends.forEach(function(item){
          list.push(item.uin);
            
         })
         console.log(list);
         //console.log('get_buddy_list',JSON.stringify(ret),e);
      })
      api.get_discuss_list(auth_info,function(ret,e){
         console.log('get_discuss_list',JSON.stringify(ret),e);
      })
      api.long_poll(auth_info,function(ret,e){
        console.log('long_poll',JSON.stringify(ret),e);
        try{
          if(ret.result[0].poll_type=='message'){
            var con,uin=ret.result[0].value.from_uin;
            if(ret.result[0].value.content.length==2){
              con=ret.result[0].value.content[1];
            }else{
              var oo=[];
              for(var i=1;i<ret.result[0].value.content.length;i++){
                if(!Array.isArray(ret.result[0].value.content[i])&& typeof ret.result[0].value.content[i]=='string'){
                  oo.push(ret.result[0].value.content[i]);
                }
              }
              con=oo.join(',');
            }
          
      console.log(ret.result[0].value.length,con);
      api.send_msg_2buddy(uin,con,auth_info,function(ret,e){
            console.log('发送',JSON.stringify(ret),e);
          })
    postMessage({'info':con,'userid':ret.result[0].value.from_uin},function(a){
      if(a.code==100000){
          api.send_msg_2buddy(uin,a.text,auth_info)
      }else if(a.code==200000){
          api.send_msg_2buddy(uin,a.text+a.url,auth_info)
      }else if(a.code==302000){//新闻类
          api.send_msg_2buddy(uin,a.text,auth_info)
      }else if(a.code==308000){//菜谱类
          api.send_msg_2buddy(uin,a.list[0].name,auth_info)
      }else{
          api.send_msg_2buddy(uin,a.text,auth_info)
      }
      
    });

          
        }
        }catch(e){
          console.log('有错误i~~')
        }
        return 1;
      })
      
    });
  };

  run();



function postMessage(text,callback){
  var text1=_.defaults(text,{
  'key' : APIkey,
  'info' : 'text',
  'userid':'123456'
  });
  request.post(url).send(text1).end(function(err,ress){
    if(err) console.log('错误');
  var a=JSON.parse(ress.text);
  console.log(a)
  callback(a);
});
}

















}).call(this);
