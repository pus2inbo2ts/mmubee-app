angular.module('MMUbee.services', [])

.factory('mmls', function(api) {

  var mmlsDetail = function(url, code){
    var data = {url: url, code:code};
    api.post('mmlsDetail.php', data, 'mmls_'+code);
  }
  var mmls = function(url, code){
    var data = {};
    api.post('mmls.php', data, 'mmls');
  }

  return { mmls : mmls, mmlsDetail : mmlsDetail }
})


.factory('news', function(api) {

  var news = function(){
    api.post('news.php', {}, 'news');
  }

  return { news : news }
})

.factory('center', function(api) {

  var center = function(){
    api.post('center.php', {}, 'center');
  }

  return { center : center }
})

.factory('session', function(api, msg){
  var unregister = function(){
    var data = {iosToken:localStorage.getItem('iosToken'), androidToken:localStorage.getItem('androidToken')};
    api.simplePost('logout.php', data, 

    function(data){ //ok
    },
    function(data){ //error
      msg.show('<li class="ion ion-alert"></li> &nbsp;Failed to unregister device.<br />', 1500);
    });
  }

  var clear = function(){
    //clear all data except tokens and device detail
    if(localStorage.getItem('iosToken') != null){
      var iostoken = localStorage.getItem('iosToken');
    }
    if(localStorage.getItem('androidToken') != null){
      var androidtoken = localStorage.getItem('androidToken');
    }

    if(localStorage.getItem('platform') != null){
      var platform = localStorage.getItem('platform');
    }
    if(localStorage.getItem('uuid') != null){
      var uuid = localStorage.getItem('uuid');
    }

    if(localStorage.getItem('version') != null){
      var version = localStorage.getItem('version');
    }
    if(localStorage.getItem('model') != null){
      var model = localStorage.getItem('model');
    }

    localStorage.clear();

    if(iostoken != null){
      localStorage.setItem('iosToken', iostoken);
    }
    if(androidtoken != null){
      localStorage.setItem('androidToken', androidtoken);
    }
    if(platform != null){
      localStorage.setItem('platform', platform);
    }
    if(uuid != null){
      localStorage.setItem('uuid', uuid);
    }
    if(version != null){
      localStorage.setItem('version', version);
    }
    if(model != null){
      localStorage.setItem('model', model);
    }
  }

  return {unregister:unregister, clear:clear}
})

.factory('plane', function(msg) {

  var plane = function(action, page, pid, success, error, sidOf){
    var data = { action:action, page:page, pid:pid, sid:localStorage.getItem('sid'), pw:localStorage.getItem('pw'), mpw:localStorage.getItem('mpw'), cpw:localStorage.getItem('cpw'), sidOf:sidOf};


    data.mmubeeVersion = version;
    data.deviceUUID = localStorage.getItem('uuid');
    data.devicePlatform = localStorage.getItem('platform');
    data.deviceVersion = localStorage.getItem('version');
    data.deviceModel = localStorage.getItem('model');
    data.iosToken = localStorage.getItem('iosToken');
    data.androidToken = localStorage.getItem('androidToken');
    // console.log("Plane>>>>>");
    // console.log(data);

    $.ajax({
      url: server + 'plane.php',
      type: 'POST',
      data: data,
      dataType: 'json',
      timeout: 33000,//22 seconds
      crossDomain: true,
      beforeSend: function(xhr) {
        $('.loadingBar').css('display','inline-block');
      }
    }).done(function(data){
      //alert(Object.keys(data).length);
      if(data['err'] == null && Object.keys(data).length > 0){
        $('.loadingBar').css('display','none');
        success(data);
      }else{
        $('.loadingBar').css('display','none');
        if(Object.keys(data).length > 0){
          msg.show('<li class="ion ion-alert"></li> &nbsp;'+data['err'] + '<br />' + data['detail'], 1500);
        }
        error(data);
      }
    }).fail(function(){
      error('network');
      $('.loadingBar').css('display','none');
    })
  }

  var cache = function(scope){
    //cache latest 10
    var cache = {plane:scope.data.slice(0, 10), notice:[]};
    cache = JSON.stringify(cache);
    console.log('Plane: Caching 10 latest');
    //console.log(cache);
    localStorage.setItem('plane', cache);
  }

  //refresh latest planes
  var refresh = function(scope, success){
    try{
      var action = 'refresh';
      var page = null;
      //var data = JSON.parse(localStorage.getItem('plane'));
      //var last = data['plane'].length-1;
      //var pid = data['plane'][last]['id'];
      var pid = scope.data[scope.data.length-1]['id'];
      //console.log(pid);
      //alert(scope.data['last']['id']);
      //alert(pid);

      //refresh all latest Plane (depended on last cache id) and cache 10 of them.
      plane(action, page, pid, function(data){
        //clean old data
        scope.data = [];
        //scope.length = 0;

        //console.log('Plane: New data:');
        //console.log(data);
        for (var i = data['plane'].length - 1; i >= 0; i--) {
          scope.data.unshift(data['plane'][i]);
        }

        //console.log('Plane: unshift data');
        //console.log(scope.data);

        localStorage.setItem('notice', JSON.stringify(data['notice']));
        scope.noticeNum = data['notice'].length;
        if(data['notice'].length > 0){
          scope.noticeFBID = 'https://graph.facebook.com/'+data['notice'][0]['fbid']+'/picture?width=50&height=50';
        }

        scope.$broadcast('scroll.refreshComplete');
        //cache latest 10
        cache(scope);
        success();
      },
      
      function(data){
        //if data is empty
        if(data == '' && typeof data !== 'undefined'){
          scope.data = [];
        }else{
          console.log('Plane: Network error');
        }
      });
    }catch(e){
      localStorage.removeItem('plane');
      var action = 'default';
      var page = null;
      var pid = null;

      plane(action, page, pid, function(data){
        //cache it
        localStorage.setItem('plane', JSON.stringify(data));

        for (var d in data['plane']) {
          //console.log(data['plane'][d]);
          scope.data.push(data['plane'][d]);
        }
        localStorage.setItem('notice', JSON.stringify(data['notice']));
        scope.noticeNum = data['notice'].length;
        if(data['notice'].length > 0){
          scope.noticeFBID = 'https://graph.facebook.com/'+data['notice'][0]['fbid']+'/picture?width=50&height=50';
        }
      },
      function(data){
      });

      console.warn(e.message);
    }

  }

  return { plane:plane, cache:cache, refresh:refresh }
})


//put downloaded file to list for checking
.factory('downloading', function($cordovaFile, msg) {


  var path = function(url, code){
    //filename
    var filename = url.split('/').pop().replace(/\s+/g, '_');
    if(ionic.Platform.platform() == 'ios'){
      return cordova.file.documentsDirectory+'NoCloud/MMUbee/'+code+'/'+filename;
    }else{
      return cordova.file.externalRootDirectory+'MMUbee/'+code+'/'+filename;
    }
  }

  //add new file
  var add = function(url){
    //url = encodeURI(url);
    try {
      var data = JSON.parse(localStorage.getItem('downloading'));
      data.push(url);
      localStorage.setItem('downloading', JSON.stringify(data));
    } catch (e) {
      var data = [url];
      localStorage.setItem('downloading', JSON.stringify(data));
      console.warn(e.message);
    }
  }

  var rm = function(url, code, filename){
    try {
      var dir;
      if(ionic.Platform.platform() == 'ios'){
        dir = '/NoCloud/MMUbee/';
        //dir = cordova.file.documentsDirectory+'NoCloud/MMUbee/';
        //dir = dir.replace('file://', '')
      }else{
        //dir = './MMUbee';
        dir = cordova.file.externalRootDirectory+'MMUbee/';
        dir = dir.replace('file://', '')
      }

      //remove file
      $cordovaFile.removeFile(dir+code+'/'+filename).then(function(result) {
        //alert(result);
      }, function(err) {
        //alert(JSON.stringify(err));
      });

      //clear record
      var data = JSON.parse(localStorage.getItem('downloading'));
      data.splice(data.indexOf(url), 1);
      localStorage.setItem('downloading', JSON.stringify(data));
    } catch (e) {
      console.warn(e.message);
    }
  }


  var clear = function(){
    //remove downloading list
    localStorage.removeItem('downloading');

    if(ionic.Platform.platform() == 'ios'){

      //ios
      var dir = '/NoCloud/MMUbee/';
      $cordovaFile.listDir(dir).then(function(dirs) {

        //alert(JSON.stringify(dirs));

        for (var i = dirs.length - 1; i >= 0; i--) {

          if(dirs[i]['isDirectory']){

            console.log('listing document' + dirs[i]['fullPath']);

            $cordovaFile.listDir(dirs[i]['fullPath']).then(function(files){
            //alert(JSON.stringify(files));
              for (var i = files.length - 1; i >= 0; i--) {
                if(files[i]['isFile']){
                  console.log('removeing '+ files[i]['fullPath']);
                  $cordovaFile.removeFile(files[i]['fullPath']).then(function(result) {
                    //console.log(result);
                  }, function(err) {
                    //alert(JSON.stringify(err));
                  });
                }
              }
             }, function(err) { alert(JSON.stringify(err)); });

          }

        };

      }, function(err) {
        alert(JSON.stringify(err));
      });

    }else{
      //android
      var dir = cordova.file.externalRootDirectory+'MMUbee/';
      dir = dir.replace('file://', '')
      $cordovaFile.listDir(dir).then(function(dirs) {

        //alert(JSON.stringify(dirs));

        for (var i = dirs.length - 1; i >= 0; i--) {

          if(dirs[i]['isDirectory']){

            console.log('listing ' + dirs[i]['nativeURL'].replace('file://', ''));

            $cordovaFile.listDir(dirs[i]['nativeURL'].replace('file://', '')).then(function(files){
            //alert(JSON.stringify(files));
              for (var i = files.length - 1; i >= 0; i--) {
                //console.log(files);
                if(files[i]['isFile']){
                  console.log('removeing '+ files[i]['nativeURL'].replace('file://', ''));
                  $cordovaFile.removeFile(files[i]['nativeURL'].replace('file://', '')).then(function(result) {
                    //console.log(result);
                  }, function(err) {
                    //alert(JSON.stringify(err));
                  });
                }
              }
             }, function(err) {alert(JSON.stringify(err)); });

          }

        };

      }, function(err) {
        alert(JSON.stringify(err));
      });
    }



    msg.show('<li class="ion ion-checkmark-round"></li> &nbsp;Successd', 1500);
 
  }

  var exist = function(url){
    //url = encodeURI(url);

    var data = JSON.parse(localStorage.getItem('downloading'));
    if(data === null){
      return false;
    }else{
      if( data.indexOf(url) >= 0){
        return true;
      }else{
        return false;
      }
    }
  }

  return { add:add, exist:exist, rm:rm, path:path, clear:clear }
})

//show msgs
.factory('msg', function($ionicLoading, $timeout) {
  var show = function(msg, timeout){
    if(typeof timeout === 'undefined'){
      timeout = 3000;
    }
    $ionicLoading.show({ template: msg});
    $timeout(function(){$ionicLoading.hide();}, timeout);
  }

  return { show : show }
})


//store user profile and login status
.factory('fb', function($rootScope, $ionicLoading, api, msg) {

  var err = function(err){
    $ionicLoading.hide();
    alert(JSON.stringify(err));
    console.warn("FB: "+err);
  }

  var update = function(){

    try{
      facebookConnectPlugin.getLoginStatus(
        function (status) {
          //console.log(JSON.stringify(status)); //get login status
          if(status.status == 'connected'){
            facebookConnectPlugin.api('me/?fields=id,name,email,link,gender,locale,birthday,cover',
              [],
              function(profile){
                //console.log(profile);
                //alert(JSON.stringify(profile));
                //store user's profile and jmp to plane
                store(profile);
            }, function(err){
                //alert(JSON.stringify(err));
                //localStorage.removeItem('profile');
                //login();
            });
          }
        },
        function (e) {
          //alert("Failed: " + e);
      });

    }catch(e){
      //alert(JSON.stringify(e.message));
    }
  }

  //store profile both local and cloud
  var store = function(profile){
    //var p =  profile;
    localStorage.setItem('profile', JSON.stringify(profile));

    //var data = {name: p.name, email: p.email, birthday: p.birthday, cover: p.cover.source, gender:p.gender, link: p.link, fbid:p.id };

    //pass datas dynamicly
    var data = {};
    for (var key in profile) {
      switch(key){
        case 'id': data.fbid = profile[key]; break;
        case 'name': data.name = profile[key]; break;
        case 'email': data.email = profile[key]; break;
        case 'birthday': data.birthday = profile[key]; break;
        case 'cover': data.cover = profile[key]['source']; break;
        case 'gender': data.gender = profile[key]; break;
        case 'link': data.link = profile[key]; break;
        case 'locale': data.locale = profile[key]; break;
      }
    }
    //console.log(profile);
    // if(profile['cover']['offset_y'] != null){
    //   data.coverOffset_y = profile['cover']['offset_y'];
    // }

    // data.iosToken = localStorage.getItem('iosToken');
    // data.androidToken = localStorage.getItem('androidToken');
    // data.mmubeeVersion = version;
    // data.deviceVersion = ionic.Platform.version();
    // data.platform = ionic.Platform.platform();


    //alert(JSON.stringify(data));

    api.simplePost('fb.php', data,
    function(data){
      //go to plane
      //alert('ok');
      $rootScope.$broadcast('fb', 'logged-in');

    }, 
    function(){
      //disconnect with facebook
      //logout();
      //alert('FB: could not reach fbserver');
      console.error('FB: could not reach fbserver');
      return false;

    }, true);
  }


  var login = function(){
    //logout();
    
    //login facebook
    facebookConnectPlugin.login(['email', 'public_profile', 'user_birthday'], function(token){
      console.log(token);
      //get user's profile after login
      facebookConnectPlugin.api('me/?fields=id,name,email,link,gender,locale,birthday,cover',
        [],
        function(profile){
          //console.log(profile);
          //alert(JSON.stringify(profile));
          //store user's profile and jmp to plane
          store(profile);
      }, err); 

   }, err);

 }

  var logout = function(){
    localStorage.removeItem('profile');
    facebookConnectPlugin.logout(function(){
      console.log('FB: logout');
    }, err);
  }
/*
  var token = function(){
    facebookConnectPlugin.getAccessToken(function(response){
      alert(JSON.stringify(response));
    }, err);
  }
*/


 
  return { login : login, logout:logout, store:store, update:update }
})


//access api
.factory('api', function($http, $rootScope, $ionicLoading, $ionicActionSheet, $timeout, $state, msg) {

  var loading = function(){
    
  }

  var simplePost = function(api, data, success, error, background){
    //show loadingbar by default
    if(background == null){
      background = false;
    }

    //fix for login bug
    if(localStorage.getItem('sid') != null){
      data.sid = localStorage.getItem('sid');
      //data.pw = localStorage.getItem('pw');
      data.mpw = localStorage.getItem('mpw');
      data.cpw = localStorage.getItem('cpw');
    }

    data.mmubeeVersion = version;
    data.deviceUUID = localStorage.getItem('uuid');
    data.devicePlatform = localStorage.getItem('platform');
    data.deviceVersion = localStorage.getItem('version');
    data.deviceModel = localStorage.getItem('model');
    data.iosToken = localStorage.getItem('iosToken');
    data.androidToken = localStorage.getItem('androidToken');

    // console.log("simplePost>>>>>");
    // console.log(data);
    $.ajax({
      url: server + api,
      type: 'POST',
      data: data,
      dataType: 'json',
      timeout: 33000,//22 seconds
      crossDomain: true,
      beforeSend: function(xhr) {
        try{
          cordova.plugins.Keyboard.close();
        }catch(e){console.warn(e.message);}
        if(!background){
          $ionicLoading.show({ template: '<li class="icon ion-loading-c"></li> Wait...'});
        }
      }})
      .done(function(data){
      if(Object.keys(data).length > 0 && data['err'] == null){
        success(data);
        $ionicLoading.hide();
      }else{
        error(data['err'], data['detail']);
        if(Object.keys(data).length > 0){ //show error if there is one
          msg.show('<li class="ion ion-alert"></li> &nbsp;'+data['err'] + '<br />' + data['detail'], 1500);
        }
      }})
      .fail(function(){
        msg.show('<li class="ion ion-alert"></li> &nbsp;Network Error. <br /> Unable access to the server '+api, 1500);
        $('.loadingBar').css('display','none');
      });
      /*,
      complete: function(data, status){
        if(status == 'success'){
          data = data.responseJSON;
          if(data['err'] != ''){
            msg.show('<li class="ion ion-alert"></li> &nbsp;'+data['err'], 1500);
            error(data);
          }else{
            success(data);
            $ionicLoading.hide();
          }
        }else{
          msg.show('<li class="ion ion-alert"></li> &nbsp;Network Error. <br /> Unable access to the server '+api, 1500);
          $('.loadingBar').css('opacity','0');
        }
      }
    });
*/
  }

  var post = function(api, data, key, index){
    data.sid = localStorage.getItem('sid');
    data.mpw = localStorage.getItem('mpw');
    data.cpw = localStorage.getItem('cpw');
    data.mmubeeVersion = version;
    data.deviceUUID = localStorage.getItem('uuid');
    data.devicePlatform = localStorage.getItem('platform');
    data.deviceVersion = localStorage.getItem('version');
    data.deviceModel = localStorage.getItem('model');
    data.iosToken = localStorage.getItem('iosToken');
    data.androidToken = localStorage.getItem('androidToken');

    // console.log("Post>>>>>");
    // console.log(data);
    $.ajax({
      url: server + api,
      type: 'POST',
      data: data,
      dataType: 'json',
      timeout: 33000,//22 seconds
      crossDomain: true,
      beforeSend: function(xhr) {
        try{
          cordova.plugins.Keyboard.close();
        }catch(e){}
        
        //$('.loadingBar').css('opacity','1');
        $('.loadingBar').css('display','inline-block');

        // if(localStorage.getItem(key) === null){
        //   $ionicLoading.show({ template: '<li class="icon ion-loading-c"></li> Loading'});
        // }
      }})
      .done(function(data){
        if(Object.keys(data).length > 0 && data['err'] == null){
          try{
            localStorage.setItem(key, JSON.stringify(data));
            $rootScope.$broadcast(key, 'updated');
            console.log(key+': updated');
          }catch (e) {
            console.warn(e.message);
          }
          $ionicLoading.hide();
        }else if(data['err'] == 'login'){//tell user to re-login
          msg.show('<li class="ion ion-alert"></li> &nbsp;'+data['err'] + '<br />' + data['detail'] + ', Please try to re-login MMUbee', 3500);
          $ionicActionSheet.show({
            buttons: [
            { text: 'Re-login' }
            ],
            titleText: 'Did you changed your password?',
            cancelText: 'Cancel',
            cancel: function() {
              return false;
            },
            buttonClicked: function(index) {
              //$cordovaFile.removeFile(cordova.file.documentsDirectory);
              localStorage.clear();
              $state.go('login');
              $timeout(function(){location.reload();}, 300);
              return true;
            }
          });
        }else{
          if(Object.keys(data).length > 0){ //show error if there is one
            msg.show('<li class="ion ion-alert"></li> &nbsp;'+data['err'] + '<br />' + data['detail'], 1500);
          }
        }
        $('.loadingBar').css('display','none');
      //$('.loadingBar').css('opacity','0');
      })
      .fail(function(){
        msg.show('<li class="ion ion-alert"></li> &nbsp;Network Error. <br /> Unable access to the server '+api, 1500);
        //$('.loadingBar').css('opacity','0');
        $('.loadingBar').css('display','none');
      });
      /*,
      complete: function(data, status){
        if(status == 'success'){
          data = data.responseJSON;
          //save records if data not empty
          if(typeof data['err'] === 'undefined'){
            //check activation
            if(data['status'] == 'need activation'){
              alert("Please activation your account.")
            }else{
              try{
                localStorage.setItem(key, JSON.stringify(data));
                $rootScope.$broadcast(key, 'updated');
                console.log(key+': updated');
              }catch (e) {
                console.warn(e.message);
              }
            }
          }else{
            console.error(key+': '+data['err']);
          }
          $ionicLoading.hide();
          $('.loadingBar').css('opacity','0');
        }else{
          msg.show('<li class="ion ion-alert"></li> &nbsp;Network Error. <br /> Unable access to the server '+key, 1000);
          $('.loadingBar').css('opacity','0');
          $rootScope.$broadcast(key, status);
        }
      }
    });
*/
  }

  
  return { post:post, simplePost:simplePost, loading:loading }
})

;