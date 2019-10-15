var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
//var async = require('async');
var index = require('./routes/index');
var users = require('./routes/users');
var fs = require('fs');

var async = require('async')
var app = express();


var superagent = require('superagent');
var cheerio = require('cheerio');
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
function sleep(milliSeconds) {
    var startTime = new Date().getTime();
    while (new Date().getTime() < startTime + milliSeconds);
};
app.use('/', index);
app.use('/users', users);
var reptileUrl = "https://coinmarketcap.com/coins/views/all/";


superagent.get(reptileUrl).end(function (err, res) {
    // 抛错拦截
    if(err){
        return Error(err);
    }
    /**
     * res.text 包含未解析前的响应内容
     * 我们通过cheerio的load方法解析整个文档，就是html页面所有内容，可以通过console.log($.html());在控制台查看
     */
    console.log("success in getting webpages");
     $ = cheerio.load(res.text);
    //console.log($.html());
    var data=[];
    var rank=1;
    $('.currency-name-container').each(function(i, elem) {
        // 拿到当前li标签下所有的内容，开始干活了
        var _this=$(elem);
        //console.log(_this.attr("href"));
        var currencyurl={};
        currencyurl.rank=rank;
        rank++;
        currencyurl.name=_this.text();
        currencyurl.url="https://coinmarketcap.com"+_this.attr("href");
        var par=$(_this).parent('.currency-name');
        var cap=$(par).siblings(".market-cap");
        //console.log(cap.attr("data-usd"));
        currencyurl.market_cap=cap.attr("data-usd");
        var money=$(par).siblings();
        var price=$(money).children(".price");
        //console.log(price.attr("data-usd"));
        currencyurl.price=price.attr("data-usd");
        var supply=$(par).siblings(".circulating-supply");
        currencyurl.circulating_supply=supply.attr('data-sort');
        //console.log(supply.attr('data-sort'));

        var volume=$(money).children(".volume");
        currencyurl.volume=volume.attr('data-usd');
        //console.log(volume.attr('data-usd'));
        //console.log(currencyurl);
        data.push(currencyurl);
    });
    var coinini=new Array();
    var girurls=new Array();
    var sum=0;
    var numm=0;
    var length=data.length;
    var isdownloaded=new Array(data.length);
    for(var i=0;i<data.length;i++){
        isdownloaded[i]=0;
    }
    async.mapLimit(data,100, function (url, callback) {
    var currenturl=url.url+"historical-data/?start=20180301&end=20191001";
    var hisdata=new Array();
    console.log("starting to get rank"+url.rank);

        async.retry({times:5, interval:1000},function(cb){

            superagent.get(currenturl) .timeout({
                response: 5000,  // Wait 5 seconds for the server to start sending,
                deadline: 60000 // but allow 1 minute for the file to finish loading.
            })
                .end(function (err, res) {
        // 抛错拦截
        if(err){
            console.log(url.rank+"timeout");
            //return Error(err);
            cb("timeout");
        }else{

        console.log("success in getting webpages");
        $ = cheerio.load(res.text);
        var coinsinit={};
        coinsinit.name=url.name;
        //console.log($.html());
        //var data=new Array();

        $('tbody').each(function(i, elem) {
            // 拿到当前li标签下所有的内容，开始干活了
            var _this=$(elem);
            //console.log(_this);
            var children=$(_this).children('.text-right');
            //console.log(children);
            console.log("2");
            var children1=$(_this).children();
            var childlen=children1.length;
            $(children1).each(function(i1,elem1){
               var _that=elem1;
               var children2=$(_that).children();
              // console.log(i1);
                var hisdata1={};
                $(children2).each(function(i2,elem2){

                    var _that1=elem2;
                    if(i2===0){hisdata1.date=$(_that1).text();
                    if(i1===0){
                        coinsinit.last_date=$(_that1).text();
                    }
                        if(i1===childlen-1){
                            coinsinit.first_date=$(_that1).text();
                        }
                    }
                    if(i2===4){hisdata1.closing_price=$(_that1).text();
                        if(i1===0){
                            coinsinit.last_price=$(_that1).text();
                        }
                        if(i1===childlen-1){
                            coinsinit.first_price=$(_that1).text();
                        }}
                    if(i2===6){hisdata1.market_cap=$(_that1).text();
                        if(i1===0){
                            coinsinit.last_market_cap=$(_that1).text();
                        }
                        if(i1===childlen-1){
                            coinsinit.first_market_cap=$(_that1).text();
                        }}

                  // console.log(i2+' '+$(_that1).text());
                  // console.log(hisdata);
                });

                hisdata.push(hisdata1);
            });
            console.log("123");
            $('.list-unstyled li a').each(function(i, elem) {
                // 拿到当前li标签下所有的内容，开始干活了
                var _this=$(elem);

                if(_this.text()==="Source Code"){console.log(sum++ + "  "+_this.attr("href"));
                    url.git=_this.attr("href");

                }

            });
           // if(_this.text()==="Source Code"){console.log(sum++ + "  "+_this.attr("href"));
             //   url.git=_this.attr("href");

            //    girurls.push(_this.attr("href"));
                /**
                 fs.writeFile("giturls.json", JSON.stringify({
                           status: 0,
                           data:girurls
                       }), function (err) {
                           if (err) throw err;
                           console.log('写入完成');
                           console.log(_this.attr("href")+' '+url.name)
                       });
                 */
         //   }
            //   var currencyurl="https://coinmarketcap.com"+_this.attr("href");
            //   data.push(currencyurl);
        });
        console.log("finished getting rank"+url.rank+'num:'+ numm++);
        url.hisdata=hisdata;
        //console.log(hisdata);
        isdownloaded[url.rank]=1;
        coinini.push(coinsinit);
        if(url.rank>900){fs.writeFile("coins.json", JSON.stringify(data), function (err) {
            if (err) throw err;
            console.log('写入完成');
        });}

        if(url.rank>900||numm%100===0){
            console.log("还未写入的有");
            for(var i=0;i<=length;i++){
                if(isdownloaded[i]===0){console.log(i);}

            }
        }
        //console.log(hisdata);

      cb(null,hisdata);
        //console.log(data[0]);
        // source.code
        }

    });
           },function(err,result){
            callback(null,hisdata);
        });
    }, function (err, result) {
        console.log('final:');
        fs.writeFile("coins.json", JSON.stringify(data), function (err) {
            if (err) throw err;
            console.log('写入完成');
        });
        fs.writeFile("coinsfirstandlast.json", JSON.stringify(coinini), function (err) {
            if (err) throw err;
            console.log('coinini写入完成');});

    });
    /**
   $(data).each(function(i, elem) {
       console.log(i);
       setTimeout(function() {
           superagent.get(elem).end(function (err, res) {
               // 抛错拦截
               if(err){
                   return Error(err);
               }
               /**
                * res.text 包含未解析前的响应内容
                * 我们通过cheerio的load方法解析整个文档，就是html页面所有内容，可以通过console.log($.html());在控制台查看
                */
    /**
               console.log("success in getting webpages");
               $ = cheerio.load(res.text);
               //console.log($.html());
               //var data=new Array();
               $('.list-unstyled li a').each(function(i, elem) {
                   // 拿到当前li标签下所有的内容，开始干活了
                   var _this=$(elem);

                   if(_this.text()==="Source Code"){console.log(sum++ + "  "+_this.attr("href"));
                   girurls.push(_this.attr("href"));
                       fs.writeFile("giturls.json", JSON.stringify({
                           status: 0,
                           data:girurls
                       }), function (err) {
                           if (err) throw err;
                           console.log('写入完成');
                       });}



                   //   var currencyurl="https://coinmarketcap.com"+_this.attr("href");
                   //   data.push(currencyurl);
               });
               //console.log(data[0]);
               // source.code
           });
       }, 100+100000*(i/100));

   });
*/
   console.log("finished");

});
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
