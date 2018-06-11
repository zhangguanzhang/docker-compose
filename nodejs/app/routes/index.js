var express = require('express');
var request = require('request');
var crypto = require('crypto');
var mysql = require('mysql');
var router = express.Router();
var stockSql = require('./../models/stock-sql');
var dbConfig = require('./../models/db-config');
var pool = mysql.createPool(dbConfig.mysql);
var utils = require('./../utils/index.js');
var config = require('./../config/index.js');

function Model(tableName) {
  this.tableName = tableName
  this.result = []
}

Model.prototype.query = function(keys) {
  pool.getConnection(function(err, connection) {
    connection.query(stockSql[this.tableName], keys, function(err, result) {
     this.result = result
      connection.release()
    })
  })
  
  return this
}

Model.prototype.getResult = function() {
  return this.result
}

router.get('/', function(req, res, next) {
  res.json({ author: 'suvllian'})
})

router.post('/login', function(req, res, next) {
  var params = {
    appid: config.APPID,
    secret: config.SECRET,
    js_code: req.body.loginCode,
    grant_type: 'authorization_code'
  }
  var sessionData = {}

	request.get({
    url: utils.addParamsToUrl(config.LOGINURL, params),
    method: 'GET',
    headers: {
      'content-type': 'application/json'
    }
  }, function (error, result, data) {
    sessionData = JSON.parse(data)
    var openId = sessionData.openid

    if (!openId) {
      return utils.failRes(res, {
        msg: '登录失败'
      })
    }

    // 对session_key进行加密
    var sha1 = JSON.stringify(crypto.createHash('sha1').update(sessionData.session_key).digest('suvllian').toJSON().data)

    var isRegisterResult = new Model('query_user_is_register').query([openId]).getResult()
    if (!isRegisterResult || !isRegisterResult.length) {
      return utils.failRes(res, {
        noRegister: true,
        msg: '登录失败'
      })
    }

    return utils.successRes(res, {
      signature: sha1
    })
  })

  

})

// 获取订单类型信息
router.get('/get_order_tpye_info/:id', function(req, res, next) {
  var orderType = req.params.id

	pool.getConnection(function(err, connection) {
    connection.query(stockSql.query_order_type_info, [orderType], function(err, result) {
      utils.responseJSON(res, result, 'get')
      connection.release()
    })
  })
})

// 获取订单列表
router.get('/get_order_list/:user_id', function(req, res, next) {
  var userId = req.params.user_id

	pool.getConnection(function(err, connection) {
    connection.query(stockSql.query_order_list, [userId], function(err, result) {
      utils.responseJSON(res, result, 'get')
      connection.release()
    })
  })
})

// 获取地址
router.get('/get_address/:user_id', function(req, res, next) {
  var userId = req.params.user_id

	pool.getConnection(function(err, connection) {
    connection.query(stockSql.query_address, [userId], function(err, result) {
      utils.responseJSON(res, result, 'get')
      connection.release()
    })
  })
})

// 添加地址
router.post('/add_address', function(req, res, next) {
  var name = req.body.name,
    isMale = req.body.isMale,
    phone = req.body.phone,
    area = req.body.area,
    specificAddress = req.body.specificAddress,
    userId = req.body.userId

	pool.getConnection(function(err, connection) {
    connection.query(stockSql.insert_address, [name, isMale, phone, area, specificAddress, userId], function(err, result) {
      console.log(err)
      utils.responseJSON(res, result, 'post')
      connection.release()
    })
  })
})

module.exports = router;
