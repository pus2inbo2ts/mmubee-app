// MMUbee
var server = 'http://mmubee.zh.my/';
var imageServer = 'http://mmubee.zh.my/upload/';
var uploadServer = 'http://mmubee.zh.my:7000/upload';

// var server = 'http://dev.zh.my/';
//var imageServer = 'http://dev.zh.my/upload/';
//var uploadServer = 'http://dev.zh.my:7000/upload';

var facebookID = '984840978208642';
var version = '2.2.0';
var maxPhoto = 9;
var pushNotice;
var one_day=1000*60*60*24;

//re-defining console to reduce memory  *open it when distribution
window.console.log = function(msg){};
window.console.error = function(msg){};
window.console.warn = function(msg){};


angular.module('MMUbee', ['ionic', 'ngCordova', 'MMUbee.controllers', 'MMUbee.services'])

.run(function($ionicPlatform, $rootScope, $ionicActionSheet, $ionicModal, $ionicSlideBoxDelegate,$timeout, $state, news, mmls, center, fb) {
 
  //on device ready. Note: don't put any ajax connect here, it slowly down app launch speed.
  $ionicPlatform.ready(function() {

    document.addEventListener("resume", onResume, false);


    //for checking device plugin
    try{
      localStorage.setItem('platform', device.platform);
      localStorage.setItem('version', device.version);
      localStorage.setItem('model', device.model);
      localStorage.setItem('uuid', device.uuid);
    }catch(e){
      //alert(e.message);
    }

    //hide splash screen after device ready
    if(navigator.splashscreen){
      setTimeout(function() { navigator.splashscreen.hide(); }, 100);
    }


    // Hide the accessory bar by default
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
    }

    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
 
    //init facebook sdk
    if (!window.cordova) {
      facebookConnectPlugin.browserInit(facebookID);
    }else{
      //trigger fb.update for reduce launch time
      $(window).triggerHandler('fbAsyncInit');
    }


    //register notification service
    try { 
      pushNotice = window.plugins.pushNotification;
      console.log('registering notification for ' +  ionic.Platform.platform());

      if(ionic.Platform.platform() == 'android' ||  ionic.Platform.platform() == 'Android' || ionic.Platform.platform() == 'amazon-fireos'){
        pushNotice.register(successHandler, errorHandler, {"senderID":"485588038499","ecb":"onNotification"});
      }else {//ios
        pushNotice.register(tokenHandler, errorHandler, {"badge":"true","sound":"true","alert":"true","ecb":"onNotificationAPN"});
      }
    }catch(e){ 
      //alert('Notification Error:'+ e.message);
      console.warn('Notification Error:'+ e.message); 
    }

  });


  //execute after a time
  function timingExe(name, day, exe){

    var today = new Date().getTime();
    var lastTime = localStorage.getItem(name);

    if(lastTime !== null){
      var diffTIme = Math.round((today-lastTime)/one_day);
      if(diffTIme >= day){
        exe();
        localStorage.setItem(name, today);
      }
    }else{
      exe();
      localStorage.setItem(name, today);
    }
  }

  //loading cloud resources
  if(localStorage.getItem('sid') !== null){
    //update every 9 days
    timingExe('mmlsUpdateTime', 9, function(){  mmls.mmls(); });

    center.center();
    news.news();

    $(window).bind('fbAsyncInit', function() {
      //update every 1 day
      timingExe('fbUpdateTime', 1, function(){  fb.update(); });
    });
  }


  //used to detect hash-url changes in IOS webview "shouldStartLoadWithRequest"
  $(document).on("click", ".hashChanges", function(e) {
    e.preventDefault();
    var url = $(this).attr('href');
    url = decodeURI(url);
    document.location.href = url;
    return true;
  });

  //handle all <a> links from .item-body
  $(document).on("click", ".item-body a", function(e) {
      var url = $(this).attr('href');
      url = decodeURI(url);
      //alert(url);

      //email
      if(url.indexOf("mailto:") > -1){
        e.preventDefault();
        $ionicActionSheet.show({
          buttons: [
          { text: 'Send an <b>E-mail</b>' }
          ],
          titleText: url.replace('mailto:', ''),
          cancelText: 'Cancel',
          cancel: function() {
          },
          buttonClicked: function(index) {
            document.location.href = url;
            return true;
          }
        });
        //fix ionicActionSheet.show bug
        $rootScope.$apply();
        return true;
      //call phone
      }else if(url.indexOf("tel:") > -1){
        e.preventDefault();
        document.location.href = url;
        return true;
      //calandar
      }else if(url.indexOf("x-apple-data-detectors:") > -1){
        return true;
      //links
      }else{
        e.preventDefault();
        var ref = window.open(encodeURI(url), '_blank',  'location=yes,closebuttoncaption=Close,enableViewportScale=yes,transitionstyle=coververtical');
        return true;
      }
  });



  $rootScope.facebook = function(id, name, sid, cover){
    // Show the action sheet
    var hideSheet = $ionicActionSheet.show({
      buttons: [
        { text: 'Chain' },
        { text: 'Facebook Profile' }
      ],
       //destructiveText: 'Delete',
      titleText: name,
      cancelText: 'Cancel',
      cancel: function() {},
      buttonClicked: function(index) {
        switch(index){
          //paper plane
          case 0: 
          $state.go('tab.planeof', {sid:sid, name:name, fbid:id, cover:cover});
          break;
          //facebook
          case 1: 
          var ref = window.open('https://www.facebook.com/app_scoped_user_id/'+id+'/', '_blank', 'location=yes');
          /*
            $cordovaAppAvailability
            .check('fb://')
            .then(function(success) {
              //var url = 'fb://profile?app_scoped_user_id='+id;
              var url = 'fb://profile?app_scoped_user_id='+id;
              var ref = window.open(url, '_system', 'location=no');
            },
            function (error) {
              var ref = window.open('https://www.facebook.com/app_scoped_user_id/'+id+'/', '_blank', 'location=yes');
            });
          */
          break;
        }

        return true;
      }
    });
  }
  
  $rootScope.badges = {plane:0, mmls:0, center:0, news:0};

  $rootScope.clickBadge = function(object){

  if($rootScope.badges[object] > 0){
    if(object == 'plane'){
      $rootScope.$broadcast('plane', 'refresh');
    }
    if(object == 'news'){
      $rootScope.$broadcast('news', 'refresh');
    }
  }
  
  $rootScope.badges[object] = 0;
  // try{
  //   pushNotice.setApplicationIconBadgeNumber(successHandler, errorHandler, 0);
  // }catch(e){}
 };

  $(window).on('setBadge', function(e, d) {
    $rootScope.badges = {
      plane : d.plane,
      mmls : d.mmls,
      center: d.center,
      news: d.news
    };

    if(d.mmlsList && (d.mmlsList != '')){
      //store badage if page not loaded
      var arr = [d.mmlsList];
      localStorage.setItem('mmlsBadge', JSON.stringify(arr));
      //if page already loaded
      $('#'+d.mmlsList).css('display','inline-block');
    }
    $rootScope.$apply();
  });

})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) { 
  //force android to use ios tab style
  $ionicConfigProvider.platform.android.tabs.position('bottom');
  $ionicConfigProvider.platform.android.navBar.alignTitle('center');


  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

    .state('login', {
      url: "/login",
      templateUrl: 'templates/login.html',
      controller: 'login'
    })


    // setup an abstract state for the tabs directive
    .state('tab', {
      url: "/tab",
      abstract: true,
      templateUrl: 'templates/tabs.html'
    })

    // Each tab has its own nav history stack:
    .state('tab.mmls', {
      url: '/mmls',
      views: {
        'mmls': {
          templateUrl: 'templates/mmls.html',
          controller: 'mmls'
        }
      }
    })
    .state('tab.news', {
      url: '/news',
      views: {
        'news': {
          templateUrl: 'templates/news.html',
          controller: 'news'
        }
      }
    })
    .state('tab.plane', {
      url: '/plane',
      views: {
        'plane': {
          templateUrl: 'templates/plane.html',
          controller: 'plane'  //it's defined in tabs.html for set badge. if declare here once more it cause every thing execute twice
        }
      }
    })

    .state('tab.planeDetail', {
      url: '/planeDetail/:id',
      views: {
        'plane': {
          templateUrl: 'templates/planeDetail.html',
          controller: 'planeDetail'
        }
      }
    })

    .state('tab.planeof', {
      url: '/planeof?sid&name&fbid&cover',
      views: {
        'plane': {
          templateUrl: 'templates/planeof.html',
          controller: 'planeof'
        }
      }
    })

    .state('tab.notice', {
      url: '/notice',
      views: {
        'plane': {
          templateUrl: 'templates/notice.html',
          controller: 'notice'
        }
      }
    })

    .state('tab.startPlane', {
      url: '/startPlane',
      views: {
        'plane': {
          templateUrl: 'templates/startPlane.html',
          controller: 'startPlane'
        }
      }
    })

    .state('tab.written', {
      url: '/written',
      views: {
        'plane': {
          templateUrl: 'templates/written.html',
          controller: 'written'
        }
      }
    })

    .state('tab.center', {
      url: '/center',
      views: {
        'center': {
          templateUrl: 'templates/center.html',
          controller: 'center'
        }
      }
    })

    .state('tab.centerDetail', {
      //url: '/centerDetail/:href/{name}',
      url: '/centerDetail?href&name',
      views: {
        'center': {
          templateUrl: 'templates/centerDetail.html',
          controller: 'centerDetail'
        }
      }
    })
    
    .state('tab.mmlsDetail', {
      url: '/mmlsDetail/:id',
      views: {
        'mmls': {
          templateUrl: 'templates/mmlsDetail.html',
          controller: 'mmlsDetail'
        }
      }
    })

    .state('tab.newsDetail', {
      url: '/newsDetail/:id',
      views: {
        'news': {
          templateUrl: 'templates/newsDetail.html',
          controller: 'newsDetail'
        }
      }
    })

;

  //check if logged-in with sutdent account
  if(localStorage.getItem('sid') === null){
    $urlRouterProvider.otherwise('/login');
  }else{
    if(localStorage.getItem('profile') === null){
      $urlRouterProvider.otherwise('/tab/startPlane');
    }else{
      $urlRouterProvider.otherwise('/tab/plane');
    }
  }

})

.directive('replies', function() {
    return {
        restrict: 'A',
        //controller: 'plane',
        link: function(scope, element, attrs) {
          try{
            //loading latest 10 from cache
            var p = localStorage.getItem('plane');
            var data = JSON.parse(p);
            for (var d in data['plane']) {
              //console.log(data['plane'][d]);
              for (var c in data['plane'][d]['comment']) {
                if(data['plane'][d]['comment'][c]['cid'] == attrs.replies){
                  element.html(data['plane'][d]['comment'][c]['name']);
                }
                //console.log(data['plane'][d]);
              }
            }

          }catch(e){console.warn(e.message);}

          //element.html("testxx");
        }
    };
})


.directive('flaticon', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
          $(element).flatshadow({
            color: attrs.flaticon,  // Background color of elements inside. (Color will be random if left unassigned)
            angle: "SE", // Shadows direction. Available options: N, NE, E, SE, S, SW, W and NW. (Angle will be random if left unassigned)
            fade: true, // Gradient shadow effect
            //boxShadow: "#d7cfb9" // Color of the Container's shadow
          });
        }
    };
})



.directive('moment', function() {
    return {
        //restrict: 'A',
        link: function(scope, element, attrs) {
            attrs.$observe('moment', function(time) {
              //console.log(time);
              if(time != ''){
                var res = moment(time, "YYYY-MM-DD hh:mm:ss").fromNow();
                element.html(res);
              }
            });
        }
    
    };
})

;


/*      Event handler     */
function onResume() {
  //$(window).trigger('plane', 'update');
  var div = document.getElementsByTagName('body')[0];
  var scope = angular.element(div).scope();
  var rootScope = scope.$root;
  rootScope.$broadcast('plane', 'refresh');
  // rootScope.$apply(function() {
  //     rootScope.$broadcast('plane', 'refresh');
  // });
}



function tokenHandler (result) {
  console.log('token: '+ result);
  //alert(result);
  //alert('token: '+ result);
  localStorage.setItem('iosToken', result);
  // Your iOS push server needs to know the token before it can push to this device
  // here is where you might want to send it the token for later use.
}

function successHandler (result) {
  //alert('success:'+ result);
  console.log('success:'+ result);
}

function errorHandler (error) {
  alert('error:'+ error);
  console.log('error:'+ error);
}

//累加badge icon 
var add = function(newBadge, badgeClass){
  var badgeNum = $('.'+badgeClass+' .badge-assertive').html();
  if(badgeNum == null){
    badgeNum = 0;
  }
  if(newBadge == null || newBadge == ''){
    newBadge = 0;
  }
  return parseInt(newBadge) + parseInt(badgeNum);
};

// handle APNS notifications for iOS
function onNotificationAPN(e) {
  console.log('APNS notifications:');
  console.log(e);
/*
  if (e.alert) {
    //alert('push-notification: ' + e.alert);
     console.log('push-notification: ' + e.alert);
     // showing an alert also requires the org.apache.cordova.dialogs plugin
     //navigator.notification.alert(e.alert);
  }
  
  if (e.sound) {
    // playing a sound also requires the org.apache.cordova.media plugin
    //var snd = new Media(e.sound);
    //snd.play();
  }
*/
  //if (e.plane) {

    //$(window).trigger('setBadge', newBadge);
    var plane = add(e.plane, 'planeB');
    var mmls = add(e.mmls, 'mmlsB');
    var center = add(e.center, 'centerB');
    var news = add(e.news, 'newsB');
    var sum = parseInt(plane)+parseInt(mmls)+parseInt(center)+parseInt(news);

    $(window).trigger('setBadge', {plane:plane, mmls:mmls, center:center, news:news, mmlsList:e.mmlsList});

    pushNotice.setApplicationIconBadgeNumber(successHandler, errorHandler, sum);
  //}

  /*
  try{
    $(window).trigger('newNotice', e);
  }catch(e){
    alert(e.message);
  }
 
  */
}
            
// handle GCM notifications for Android
function onNotification(e) {

  switch( e.event ){
    
    case 'registered':
    if (e.regid.length > 0){
      localStorage.setItem('androidToken', e.regid);
      // Your GCM push server needs to know the regID before it can push to this device
      // here is where you might want to send it the regID for later use.
      console.log("regID = " + e.regid);
      //alert(e.regid);
    }
    break;

    case 'message':
    /*
    // if this flag is set, this notification happened while we were in the foreground.
    // you might want to play a sound to get the user's attention, throw up a dialog, etc.
    if (e.foreground){
      //alert('<li>--INLINE NOTIFICATION--' + '</li>');
    }else{
      
      if (e.coldstart)
        alert('<li>--COLDSTART NOTIFICATION--' + '</li>');
      else
        alert('<li>--BACKGROUND NOTIFICATION--' + '</li>');
      }
   
    }
    */
    //累加
    if(e.payload.detail){
      var d = e.payload.detail;
    //$(window).trigger('setBadge', newBadge);
      var plane = add(d.plane, 'planeB');
      var mmls = add(d.mmls, 'mmlsB');
      var center = add(d.center, 'centerB');
      var news = add(d.news, 'newsB');
      var sum = parseInt(plane)+parseInt(mmls)+parseInt(center)+parseInt(news);


      $(window).trigger('setBadge', {plane:plane, mmls:mmls, center:center, news:news, mmlsList:d.mmlsList});

      //$(window).trigger('setBadge', {plane:add(e.payload.detail.plane, 'planeB'), mmls:add(e.payload.detail.mmls, 'mmlsB'), center:add(e.payload.detail.center, 'centerB'), news:add(e.payload.detail.news, 'newsB')});
      //$(window).trigger('setBadge', newBadge);
    }

    break;

    case 'error':
      alert('PUSH SERVICE ERROR:' + e.msg);
    break;

    default:
      //alert('EVENT -> Unknown, an event was received and we do not know what it is');
    break;
  }
  
}