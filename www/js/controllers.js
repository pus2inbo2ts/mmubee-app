angular.module('MMUbee.controllers', [])


.controller('mmls', function($scope, $timeout, mmls){
  //var cachedLen;
  try{
    var data = JSON.parse(localStorage.getItem('mmls'));
    data = data['subject'];
    $scope.data = data;
    //var cachedLen = data.length + data[0]['name'].length;

    // //save campus information
    // localStorage.setItem('campus', data[0]['campus']);

  }catch(e){
    console.warn(e.message);
  }


  //lisen on mmls event
  $scope.$on('mmls', function(d, feedback){  
    $scope.$broadcast('scroll.refreshComplete');
    if(feedback == "updated"){
      try {
        var data = JSON.parse(localStorage.getItem('mmls'));
        data = data['subject'];
        $scope.data = data;
      } catch (e) {
        console.warn(e.message);
      }
    }
  });

  $scope.refresh = function() {
    mmls.mmls();
  };

  $timeout(function(){
    var mmlsBadge = localStorage.getItem('mmlsBadge');
    if(mmlsBadge != null){
      var m = JSON.parse(mmlsBadge);
      for (var i = m.length - 1; i >= 0; i--) {
        $('#'+m[i]).css('display','inline-block');
      };
    }
  });



})

.controller('news', function($scope,$rootScope, $ionicScrollDelegate,news) {

  $rootScope.$on('news', function(d, feedback){
    switch(feedback){
      case 'refresh':
        news.news();
        break;
    }
  });

  var data;
  try{
    data = JSON.parse(localStorage.getItem('news'));
    $scope.data = data;
    //var cachedLen = data.length + data[0]['title'].length;
  }catch(e){
    console.warn(e.message);
  }

  //lisen on mmls event
  $scope.$on('news', function(d, feedback){  
    $scope.$broadcast('scroll.refreshComplete');
    if(feedback == "updated"){
      try {
        data = JSON.parse(localStorage.getItem('news'));
        $scope.data = data;
        /*
        var newLen = data.length + data[0]['title'].length;
        //don't update dom if this is old data
        if(newLen != cachedLen){
          $scope.data = data;
        }*/
      } catch (e) {
        console.warn(e.message);
      }
    }
  });


  $scope.limit = 9;
  $scope.loadmore = function() {
      $scope.limit = data.length;
      $ionicScrollDelegate.resize();
      return false;
  };

  $scope.refresh = function() {
    news.news();
  };

})

.controller('login', function($scope, $state, $ionicHistory, api, msg, mmls, center, news) {
  $ionicHistory.clearHistory();
  $scope.login = function(){
    var sid = $('.sid').val();
    //var pw = $('.pw').val();
    var mpw = $('.mpw').val();
    var cpw = $('.cpw').val();
    var data = {sid:sid, mpw:mpw, cpw:cpw};

    api.simplePost('login.php', data, 

    function(data){ //ok

      localStorage.setItem('sid', sid);
      //localStorage.setItem('pw', pw);
      localStorage.setItem('mpw', mpw);
      localStorage.setItem('cpw', cpw);
      localStorage.setItem('branch', data['branch']);
      localStorage.setItem('mmls', JSON.stringify(data['mmls']));
      //load resouce
      mmls.mmls();
      center.center();
      news.news();
      //$state.go('tab.plane');
      $state.go('tab.startPlane');
    },

    function(data){ //error
      msg.show('<li class="ion ion-alert"></li> &nbsp;Invalid Account or Network Error.<br />', 1500);
    });

  }


})



.controller('planeof', function($scope, $stateParams, $ionicModal, $ionicSlideBoxDelegate, $timeout, $state, $ionicActionSheet, $ionicNavBarDelegate, $ionicPopup, plane, api) {

  /*  galary  */
  $scope.galary = [];
  $scope.height = $(document).height();
  var galary;
  $ionicModal.fromTemplateUrl('galary.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
    galary = $ionicSlideBoxDelegate.$getByHandle('galary');
  });


  $scope.closeGallery = function() {
    $scope.modal.hide();
  };

  $scope.openGallery = function(images, index){
    var tmp = [];
    for(var i=0; i<images.length; i++){
      tmp.push({
        'src' : imageServer+'photo/'+images[i]+'.jpg', 
        'msg' : ''
      });
    }
    $scope.galary = tmp;
    galary.update();
    
    $timeout(function() {
      galary.slide(index, 1);
    });

    $scope.modal.show();
  }

  $scope.$on('$destroy', function() {
    $scope.modal.remove();
  });
  $scope.$on('modal.hidden', function() {
    galary.update();
  });
  $scope.$on('modal.removed', function() {
  });


  var sidOf = $stateParams.sid;
  $scope.name = $stateParams.name;
  $scope.fbid = $stateParams.fbid;
  $scope.cover = $stateParams.cover;
  $scope.sid = localStorage.getItem('sid');

  $scope.data = [];


  //infinite loading.
  $scope.nomore = true;
  var page = 0;
  $scope.loadMore = function() {

    page++;
    var action = 'of';
    try{
      var pid = $scope.data[$scope.data.length-1]['id']; //oldest plane id
    }catch(e){
      var pid = 0; //open default page
    }

    plane.plane(action, page, pid, function(data){
      $scope.$broadcast('scroll.infiniteScrollComplete');
      console.log(data);
      for (var d in data['plane']) {
        //console.log(data['plane'][d]);
        $scope.data.push(data['plane'][d]);
      }
      $scope.$apply();
    },
    function(data){
      //error
      $scope.nomore = false;
      $scope.$apply();
      $scope.$broadcast('scroll.infiniteScrollComplete');
      console.log(data);
    }, sidOf);
  }


  $scope.server = imageServer;

  $scope.like = function(to, index){
    api.simplePost('like.php', {id: localStorage.getItem('sid'), plane_id: to},
    function(data){
      //refresh this plane
      plane.plane('one', null, to, function(one){
        $scope.data[index] = one['plane'][0];
        $scope.$apply();
      },function(one){ })

    }, 
    function(){
      //error
    });
  }

  $scope.deletePost = function(id, sid, planeIndex){

    // Show the action sheet
    var hideSheet = $ionicActionSheet.show({
     buttons: [
       { text: '<b>Delete</b>' }
     ],
     //destructiveText: 'Delete',
     titleText: 'Delete this post?',
     cancelText: 'Cancel',
     cancel: function() {},

     buttonClicked: function(index) {

      api.simplePost('deletePost.php', {id: id, sid: sid},
      function(data){
        $scope.data.splice(planeIndex, 1);
        $scope.$apply();
      }, 
      function(){
        //error
      });
      return true;
     
     }
    });

  }


  $scope.deleteComment = function(cid, planeID, index, csid, id, name, sid, cover, content){

    //Fires click when stop scroll with tap/click
    //https://github.com/driftyco/ionic/issues/1438 
    // var diff =  Date.now() - $scope.lastScrolling;    
    // console.log(diff);
    // if (diff < 200) {
    //     return false;
    // }

    if(csid != localStorage.getItem('sid')){
      // Show the action sheet
      var hideSheet = $ionicActionSheet.show({
        buttons: [
          { text: '<b>Reply</b>' },
          { text: 'Chain' },
          { text: 'Facebook Profile' }
        ],
         //destructiveText: 'Delete',
        titleText: name,
        cancelText: 'Cancel',
        cancel: function() {},
        buttonClicked: function(x) {
          switch(x){
            //paper plane
            case 0: 
              $ionicPopup.prompt({
               title: 'Re: '+name,
               subTitle: '<span style="white-space: nowrap;overflow: hidden;">'+content+'</span>',
               template: '<input type="text" placeholder="Reply" autofocus style="padding-left:5px; padding-right:5px;" class="replyContent">',
              }).then(function(btnClicked) {
                var res = $('.replyContent').val();
                if(typeof res != 'undefined' && res != '' && btnClicked != null){

                  api.simplePost('comment.php', {id: localStorage.getItem('sid'), plane_id: planeID, content: res, comment_id:cid},
                  function(data){

                    //refresh this plane
                    plane.plane('one', null, planeID, function(one){
                      $scope.data[index] = one['plane'][0];
                      plane.cache($scope);
                      $scope.$apply();
                    },function(one){ })

                  }, 
                  function(){
                    //error
                  });

                }else{
                  console.log('Cancel', res);
                }
              });
            break;

            //paper plane
            case 1: 
            $state.go('tab.planeof', {sid:sid, name:name, fbid:id, cover:cover});
            break;
            //facebook
            case 2: 
            var ref = window.open('https://www.facebook.com/app_scoped_user_id/'+id+'/', '_blank', 'location=yes');
            break;

          }
          return true;
        }
      });
    }else{ //show delete comment sheet if it's owner
      $ionicActionSheet.show({
        buttons: [
        { text: '<b>Delete</b>' }
        ],
        titleText: 'Delete this comment?',
        cancelText: 'Cancel',
        cancel: function() {
          return false;
        },
        buttonClicked: function(x) {
          //console.log(index);
          api.simplePost('deleteComment.php', {id: localStorage.getItem('sid'), cid: cid},

          function(data){
            //refresh this plane
            plane.plane('one', null, planeID, function(one){
              $scope.data[index] = one['plane'][0];
              plane.cache($scope);
              $scope.$apply();
            },function(one){ })

          }, 
          function(){
            //error
          });
          return true;
        }
      });
    }
  }
/*
  $scope.deleteComment = function(cid, planeID, index, csid, id, name, sid, cover){
    if(csid != localStorage.getItem('sid')){
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
        buttonClicked: function(x) {
          switch(x){
            //paper plane
            case 0: 
            $state.go('tab.planeof', {sid:sid, name:name, fbid:id, cover:cover});
            break;
            //facebook
            case 1: 
            var ref = window.open('https://www.facebook.com/app_scoped_user_id/'+id+'/', '_blank', 'location=yes');
            break;
          }
          return true;
        }
      });
    }else{ //show delete comment sheet if it's owner
      $ionicActionSheet.show({
        buttons: [
        { text: '<b>Delete</b>' }
        ],
        titleText: 'Delete this comment?',
        cancelText: 'Cancel',
        cancel: function() {
          return false;
        },
        buttonClicked: function(x) {
          //console.log(index);
          api.simplePost('deleteComment.php', {id: localStorage.getItem('sid'), cid: cid},
          function(data){
            //refresh this plane
            plane.plane('one', null, planeID, function(one){
              $scope.data[index] = one['plane'][0];
              plane.cache($scope);
              $scope.$apply();
            },function(one){ })
          }, 
          function(){
            //error
          });
          return true;
        }
      });
    }
  }
*/

  $scope.comment = function(toName, toContent, toID, index){

    $ionicPopup.prompt({
     title: toName,
     subTitle: '<span style="white-space: nowrap;overflow: hidden;">'+toContent+'</span>',
     template: '<input type="text" placeholder="Comment" autofocus style="padding-left:5px; padding-right:5px;" class="replyContent">',
    }).then(function(btnClicked) {
      var res = $('.replyContent').val();
      if(typeof res != 'undefined' && res != '' && btnClicked != null){

        api.simplePost('comment.php', {id: localStorage.getItem('sid'), plane_id: toID, content: res},
        function(data){

          //refresh this plane
          plane.plane('one', null, toID, function(one){
            $scope.data[index] = one['plane'][0];
            $scope.$apply();
          },function(one){ })

        }, 
        function(){
          //error
        });

      }else{
        console.log('Cancel', res);
      }
    });


  }

  $scope.fb = function(id, name){
    // Show the action sheet
    var hideSheet = $ionicActionSheet.show({
      buttons: [
        { text: 'Facebook Profile' }
      ],
       //destructiveText: 'Delete',
      titleText: name,
      cancelText: 'Cancel',
      cancel: function() {},
      buttonClicked: function(index) {
        var ref = window.open('https://www.facebook.com/app_scoped_user_id/'+id+'/', '_blank', 'location=yes');
/*
        $cordovaAppAvailability
        .check('fb://')
        .then(function(success) {
          var url = 'fb://profile?app_scoped_user_id='+id;
          var ref = window.open(url, '_system', 'location=no');
        },
        function (error) {
          var ref = window.open('https://www.facebook.com/app_scoped_user_id/'+id+'/', '_blank', 'location=yes');
        });
*/
        return true;
      }
    });
  }


})


.controller('planeDetail', function($scope, $stateParams, $timeout, $ionicSlideBoxDelegate, $ionicModal, $state, $ionicActionSheet, $ionicPopup, $ionicHistory, api, plane, msg) {

  /*  galary  */
  $scope.galary = [];
  $scope.height = $(document).height();
  var galary;
  $ionicModal.fromTemplateUrl('galary.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
    galary = $ionicSlideBoxDelegate.$getByHandle('galary');
  });


  $scope.closeGallery = function() {
    $scope.modal.hide();
  };

  $scope.openGallery = function(images, index){
    var tmp = [];
    for(var i=0; i<images.length; i++){
      tmp.push({
        'src' : imageServer+'photo/'+images[i]+'.jpg', 
        'msg' : ''
      });
    }
    $scope.galary = tmp;
    galary.update();
    
    $timeout(function() {
      galary.slide(index, 1);
    });

    $scope.modal.show();
  }

  $scope.$on('$destroy', function() {
    $scope.modal.remove();
  });
  $scope.$on('modal.hidden', function() {
    galary.update();
  });
  $scope.$on('modal.removed', function() {
  });




  var pid = $stateParams.id;

  //get this plane
  plane.plane('one', null, pid, function(one){
    $scope.data = one['plane'][0];
    $scope.$apply();
  },function(one){
    msg.show('<li class="ion ion-alert"></li> &nbsp;Oops, this page does not exist', 2000);
    $ionicHistory.goBack();
  });

  //copying from 'plane' controller
  $scope.sid = localStorage.getItem('sid');


  $scope.server = imageServer;


/*
  $scope.date = function(date){
    //console.log(date);
    var res = moment(date, "YYYY-MM-DD hh:mm:ss").fromNow();
    //console.log(res);
    return res;
  }
*/
  $scope.like = function(to, index){
    api.simplePost('like.php', {id: localStorage.getItem('sid'), plane_id: to},
    function(data){
      //refresh this plane
      plane.plane('one', null, to, function(one){
        $scope.data = one['plane'][0];
        //$scope.$broadcast('scroll.refreshComplete');
        $scope.$apply(); //fix bug?.
      },function(one){
      });

    }, 
    function(){
    });
  }

  $scope.deletePost = function(id, sid, planeIndex){

    // Show the action sheet
    var hideSheet = $ionicActionSheet.show({
     buttons: [
       { text: '<b>Delete</b>' }
     ],
     //destructiveText: 'Delete',
     titleText: 'Are u sure?',
     cancelText: 'Cancel',
     cancel: function() {},

     buttonClicked: function(index) {

      api.simplePost('deletePost.php', {id: id, sid: sid},
      function(data){
        $ionicHistory.goBack();
      }, 
      function(){
        //error
      });
      return true;
     
     }
    });

  }



$scope.deleteComment = function(cid, planeID, index, csid, id, name, sid, cover, content){

  //Fires click when stop scroll with tap/click
  //https://github.com/driftyco/ionic/issues/1438 
  // var diff =  Date.now() - $scope.lastScrolling;    
  // console.log(diff);
  // if (diff < 200) {
  //     return false;
  // }

  if(csid != localStorage.getItem('sid')){
    // Show the action sheet
    var hideSheet = $ionicActionSheet.show({
      buttons: [
        { text: '<b>Reply</b>' },
        { text: 'Chain' },
        { text: 'Facebook Profile' }
      ],
       //destructiveText: 'Delete',
      titleText: name,
      cancelText: 'Cancel',
      cancel: function() {},
      buttonClicked: function(x) {
        switch(x){
          //paper plane
          case 0: 
            $ionicPopup.prompt({
             title: 'Re: '+name,
             subTitle: '<span style="white-space: nowrap;overflow: hidden;">'+content+'</span>',
             template: '<input type="text" placeholder="Reply" autofocus style="padding-left:5px; padding-right:5px;" class="replyContent">',
            }).then(function(btnClicked) {
              var res = $('.replyContent').val();
              if(typeof res != 'undefined' && res != '' && btnClicked != null){

                api.simplePost('comment.php', {id: localStorage.getItem('sid'), plane_id: planeID, content: res, comment_id:cid},
                function(data){
                  //refresh this plane
                  plane.plane('one', null, planeID, function(one){
                    $scope.data = one['plane'][0];
                    $scope.$apply();
                    //$scope.$broadcast('scroll.refreshComplete');
                  },function(one){ })
                }, 
                function(){
                  //error
                });

              }else{
                console.log('Cancel', res);
              }
            });
          break;

          //paper plane
          case 1: 
          $state.go('tab.planeof', {sid:sid, name:name, fbid:id, cover:cover});
          break;
          //facebook
          case 2: 
          var ref = window.open('https://www.facebook.com/app_scoped_user_id/'+id+'/', '_blank', 'location=yes');
          break;

        }
        return true;
      }
    });
  }else{ //show delete comment sheet if it's owner
    $ionicActionSheet.show({
      buttons: [
      { text: '<b>Delete</b>' }
      ],
      titleText: 'Delete this comment?',
      cancelText: 'Cancel',
      cancel: function() {
        return false;
      },
      buttonClicked: function(x) {
        //console.log(index);
        api.simplePost('deleteComment.php', {id: localStorage.getItem('sid'), cid: cid},

        function(data){
          //refresh this plane
          plane.plane('one', null, planeID, function(one){
            $scope.data = one['plane'][0];
            $scope.$apply();
            //$scope.$broadcast('scroll.refreshComplete');
          },function(one){ })

        }, 
        function(){
          //error
        });
        return true;
      }
    });
  }
}
/*
$scope.deleteComment = function(cid, planeID, index, csid, id, name, sid, cover){
  if(csid != localStorage.getItem('sid')){
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
      buttonClicked: function(x) {
        switch(x){
          //paper plane
          case 0: 
          $state.go('tab.planeof', {sid:sid, name:name, fbid:id, cover:cover});
          break;
          //facebook
          case 1: 
          var ref = window.open('https://www.facebook.com/app_scoped_user_id/'+id+'/', '_blank', 'location=yes');
          break;
        }
        return true;
      }
    });
  }else{ //show delete comment sheet if it's owner
    $ionicActionSheet.show({
      buttons: [
      { text: '<b>Delete</b>' }
      ],
      titleText: 'Delete this comment?',
      cancelText: 'Cancel',
      cancel: function() {
        return false;
      },
      buttonClicked: function(x) {
        //console.log(index);
        api.simplePost('deleteComment.php', {id: localStorage.getItem('sid'), cid: cid},
        function(data){
          //refresh this plane
          plane.plane('one', null, planeID, function(one){
            $scope.data = one['plane'][0];
            $scope.$apply();
            //$scope.$broadcast('scroll.refreshComplete');
          },function(one){ })
        }, 
        function(){
          //error
        });
        return true;
      }
    });
  }
}
*/

  $scope.comment = function(toName, toContent, toID, index){

    $ionicPopup.prompt({
     title:  toName,
     subTitle: '<span style="white-space: nowrap;overflow: hidden;">'+toContent+'</span>',
     template: '<input type="text" placeholder="Comment" autofocus style="padding-left:5px; padding-right:5px;" class="replyContent">',
    }).then(function(btnClicked) {
      var res = $('.replyContent').val();
      if(typeof res != 'undefined' && res != '' && btnClicked != null){

        api.simplePost('comment.php', {id: localStorage.getItem('sid'), plane_id: toID, content: res},
        function(data){

          //refresh this plane
          plane.plane('one', null, toID, function(one){
            $scope.data = one['plane'][0];
            $scope.$apply();
          },function(one){ })

        }, 
        function(){
          //error
        });

      }else{
        console.log('Cancel', res);
      }
    });


  }





})


.controller('notice', function($scope, $rootScope, $ionicHistory, api, fb) {

  var data;
  try{
    data = JSON.parse(localStorage.getItem('notice'));
    $scope.data = data;
    //console.log(data);
  }catch(e){
    console.warn(e.message);
  }


  api.simplePost('cleanNotice.php', {id: localStorage.getItem('sid')},
  function(data){
    localStorage.removeItem('notice');
  }, 
  function(){
    //error
  });
  
  $scope.refreshPlane = function(){
    $rootScope.$broadcast('plane', 'refresh');
    $ionicHistory.goBack();
  }

})


.controller('startPlane', function($scope, $state, $timeout, $ionicLoading, fb) {
  //mmls.mmls();

  $scope.login = function(){ 
    $ionicLoading.show({ template: '<li class="icon ion-loading-c"></li> Processing to FB.'});
    fb.login();
    $timeout(function(){$ionicLoading.hide();}, 33000);
  }

  $scope.$on('fb', function(d, feedback){  
    $ionicLoading.hide();
    if(feedback == "logged-in"){
      //$ionicHistory.currentView =  $ionicHistory.backView;
      $state.go('tab.plane');
      //location = '#tab/plane';
      $timeout(function(){location.reload();}, 300);

    }
  });
  
})







/*
open app
$limit = 10
first time load $limit
loading cache (latest $limit)
loading all latest (depended on last cache id) and cache $limit of them.
loading history by scrolling at bottom (depended on oldest cache id) (no cache)
//open from controller
//loading controllerCache
//loading all latest depended on last cache id and cache $limit of them.
cache laest 10 after comment and like
refresh after Like and Comment
refresh by plane id?
*/

.controller('plane', function($scope, $rootScope, $ionicPopup, $ionicActionSheet, $ionicSlideBoxDelegate, $timeout, $ionicModal, $ionicLoading, $state, plane, api) {
  //for history.goback()
  $rootScope.$on('plane', function(d, feedback){
    switch(feedback){
      case 'refresh':
        plane.refresh($scope, function(){});
        break;
    }
  });

  // Jquery version: listen for plane update event
  // $(window).on('plane', function(e, d) {
  //  if(d == 'update'){
  //    alert(2);
  //    plane.refresh($scope, function(){});
  //  }
  // });


  /*  galary  */
  $scope.galary = [];
  $scope.height = $(document).height();
  var galary;
  $ionicModal.fromTemplateUrl('galary.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
    galary = $ionicSlideBoxDelegate.$getByHandle('galary');
  });


  $scope.closeGallery = function() {
    $scope.modal.hide();
  };

  $scope.openGallery = function(images, index){
    var tmp = [];
    for(var i=0; i<images.length; i++){
      tmp.push({
        'src' : imageServer+'photo/'+images[i]+'.jpg', 
        'msg' : ''
      });
    }
    $scope.galary = tmp;
    galary.update();
    
    $timeout(function() {
      galary.slide(index, 1);
    });

    $scope.modal.show();
  }

  $scope.$on('$destroy', function() {
    $scope.modal.remove();
  });
  $scope.$on('modal.hidden', function() {
    galary.update();
  });
  $scope.$on('modal.removed', function() {
  });





  $scope.data = [];
  $scope.noticeNum = 0;

  //first time load 10 and cache latest 10
  if(localStorage.getItem('plane') === null){
    $ionicLoading.show({ template: '<li class="icon ion-loading-c"></li> Loading.'});

      var action = 'default';
      var page = null;
      var pid = null;

      plane.plane(action, page, pid, function(data){

      //cache it
      localStorage.setItem('plane', JSON.stringify(data));

      for (var d in data['plane']) {
        //console.log(data['plane'][d]);
        $scope.data.push(data['plane'][d]);
      }

      localStorage.setItem('notice', JSON.stringify(data['notice']));
      $scope.noticeNum = data['notice'].length;
      if(data['notice'].length > 0){
        $scope.noticeFBID = 'https://graph.facebook.com/'+data['notice'][0]['fbid']+'/picture?width=50&height=50';
      }

      $ionicLoading.hide();
    },
    function(data){
      //error
      $ionicLoading.hide();
    });

  }else{

    try{
      //loading latest 10 from cache
      var p = localStorage.getItem('plane');
      var data = JSON.parse(p);
      //console.log(data);
      console.log('Plane: Loading cached data');
      //console.log(data);

      for (var d in data['plane']) {
        //console.log(data['plane'][d]);
        $scope.data.push(data['plane'][d]);
      }

    }catch(e){console.warn(e.message);}
    var action = 'refresh';
    var page = null;

    //refresh all latest Plane (depended on last cache id) and cache 10 of them.
    plane.refresh($scope, function(){});


  }





  
  //infinite loading.
  $scope.nomore = true;
  var page = 0;
  $scope.loadMore = function() {
    try{
      page++;
      var action = 'infinite';
      var pid = $scope.data[$scope.data.length-1]['id']; //oldest plane id
      
      plane.plane(action, page, pid, function(data){
        $scope.$broadcast('scroll.infiniteScrollComplete');
        for (var d in data['plane']) {
          //console.log(data['plane'][d]);
          $scope.data.push(data['plane'][d]);
        }
        $scope.$apply();
      },
      function(data){
        //error
        $scope.nomore = false;
        $scope.$apply();
        $scope.$broadcast('scroll.infiniteScrollComplete');
        console.log(data);
      });
    }catch(e){
      //alert(e.message);
      console.log(e.message);
    }
  }

  $scope.refresh = function() {
    plane.refresh($scope, function(){
      $scope.$apply();
    });

  };
  

  //load facebook profile
  try{
    if(localStorage.getItem('profile') == null){
      $state.go('tab.startPlane');
    }
    
    var profile = JSON.parse(localStorage.getItem('profile'));
    //console.log(profile);
    $scope.profile = profile;
    //use HD cover by removing size info
    //$scope.cover = profile.cover.source.replace(/s\d\d\dx\d\d\d\//ig, '');
    $scope.cover = profile.cover.source;
    //alert(profile.cover.source);
    //console.log(profile);

  }catch(e){
    console.warn(e.message);
  }


  $scope.sid = localStorage.getItem('sid');

  $scope.server = imageServer;



  $scope.like = function(to, index){
    api.simplePost('like.php', {id: localStorage.getItem('sid'), plane_id: to},
    function(data){
      //refresh this plane
      plane.plane('one', null, to, function(one){
        $scope.data[index] = one['plane'][0];
        plane.cache($scope);
        $scope.$apply();
      },function(one){ })

    }, 
    function(){
      //error
    });
  }

  $scope.deletePost = function(id, sid, planeIndex){

    // Show the action sheet
    var hideSheet = $ionicActionSheet.show({
     buttons: [
       { text: '<b>Delete</b>' }
     ],
     //destructiveText: 'Delete',
     titleText: 'Delete this post?',
     cancelText: 'Cancel',
     cancel: function() {},

     buttonClicked: function(index) {

      api.simplePost('deletePost.php', {id: id, sid: sid},
      function(data){
        $scope.data.splice(planeIndex, 1);
        plane.cache($scope);
        $scope.$apply();

      }, 
      function(){
        //error
      });
      return true;
     
     }
    });

  }


  // $scope.lastScrolling = Date.now();
  // $scope.preventTap = function() {
  //     $scope.lastScrolling = Date.now();
  //     //console.log('preventTap ' + $scope.lastScrolling);
  // };

  $scope.deleteComment = function(cid, planeID, index, csid, id, name, sid, cover, content){

    //Fires click when stop scroll with tap/click
    //https://github.com/driftyco/ionic/issues/1438 
    // var diff =  Date.now() - $scope.lastScrolling;    
    // console.log(diff);
    // if (diff < 200) {
    //     return false;
    // }

    if(csid != localStorage.getItem('sid')){
      // Show the action sheet
      var hideSheet = $ionicActionSheet.show({
        buttons: [
          { text: '<b>Reply</b>' },
          { text: 'Chain' },
          { text: 'Facebook Profile' }
        ],
         //destructiveText: 'Delete',
        titleText: name,
        cancelText: 'Cancel',
        cancel: function() {},
        buttonClicked: function(x) {
          switch(x){
            //paper plane
            case 0: 
              $ionicPopup.prompt({
               title: 'Re: '+name,
               subTitle: '<span style="white-space: nowrap;overflow: hidden;">'+content+'</span>',
               template: '<input type="text" placeholder="Reply" autofocus style="padding-left:5px; padding-right:5px;" class="replyContent">',
              }).then(function(btnClicked) {
                var res = $('.replyContent').val();
                if(typeof res != 'undefined' && res != '' && btnClicked != null){

                  api.simplePost('comment.php', {id: localStorage.getItem('sid'), plane_id: planeID, content: res, comment_id:cid},
                  function(data){

                    //refresh this plane
                    plane.plane('one', null, planeID, function(one){
                      $scope.data[index] = one['plane'][0];
                      plane.cache($scope);
                      $scope.$apply();
                    },function(one){ })

                  }, 
                  function(){
                    //error
                  });

                }else{
                  console.log('Cancel', res);
                }
              });
            break;

            //paper plane
            case 1: 
            $state.go('tab.planeof', {sid:sid, name:name, fbid:id, cover:cover});
            break;
            //facebook
            case 2: 
            var ref = window.open('https://www.facebook.com/app_scoped_user_id/'+id+'/', '_blank', 'location=yes');
            break;

          }
          return true;
        }
      });
    }else{ //show delete comment sheet if it's owner
      $ionicActionSheet.show({
        buttons: [
        { text: '<b>Delete</b>' }
        ],
        titleText: 'Delete this comment?',
        cancelText: 'Cancel',
        cancel: function() {
          return false;
        },
        buttonClicked: function(x) {
          //console.log(index);
          api.simplePost('deleteComment.php', {id: localStorage.getItem('sid'), cid: cid},

          function(data){
            //refresh this plane
            plane.plane('one', null, planeID, function(one){
              $scope.data[index] = one['plane'][0];
              plane.cache($scope);
              $scope.$apply();
            },function(one){ })

          }, 
          function(){
            //error
          });
          return true;
        }
      });
    }
  }


  $scope.comment = function(toName, toContent, toID, index){

    $ionicPopup.prompt({
     title: toName,
     subTitle: '<span style="white-space: nowrap;overflow: hidden;">'+toContent+'</span>',
     template: '<input type="text" placeholder="Comment" autofocus style="padding-left:5px; padding-right:5px;" class="replyContent">',
    }).then(function(btnClicked) {
      var res = $('.replyContent').val();
      if(typeof res != 'undefined' && res != '' && btnClicked != null){

        api.simplePost('comment.php', {id: localStorage.getItem('sid'), plane_id: toID, content: res},
        function(data){

          //refresh this plane
          plane.plane('one', null, toID, function(one){
            $scope.data[index] = one['plane'][0];
            plane.cache($scope);
            $scope.$apply();
          },function(one){ })

        }, 
        function(){
          //error
        });

      }else{
        console.log('Cancel', res);
      }
    });


  }

  $scope.mine = function(id, name, sid, cover){
    $state.go('tab.planeof', {sid:sid, name:name, fbid:id, cover:cover});
  }

})

.controller('written', function($scope, $ionicActionSheet, $cordovaCamera, $state, $ionicPopup, $ionicLoading, $timeout, $rootScope, $ionicHistory, api, msg) {

  var uuid = Math.uuid();

  try{
    var branch = localStorage.getItem('branch');
    $scope.campus = branch;
  }catch(e){
    console.error(e.message);
  }

  $scope.progressList = [];

  var upload = function (imageURI) {

    //add to progress list
    $scope.progressList.push(imageURI);

    var ft = new FileTransfer(), options = new FileUploadOptions();

    options.fileKey = "file";
    options.fileName = imageURI; // We will use the name auto-generated by Node at the server side.
    options.mimeType = "image/jpeg";
    options.chunkedMode = false;
    options.headers = { "MMUbee-Uuid": uuid };
    options.params = { // Whatever you populate options.params with, will be available in req.body at the server-side.
        //"description": "Uploaded from my phone"
    };

    /*
    ft.onprogress = function(progressEvent) {
        if (progressEvent.lengthComputable) {
          loadingStatus.setPercentage(progressEvent.loaded / progressEvent.total);
        } else {
          loadingStatus.increment();
        }
    };*/

 

    ft.upload(imageURI, uploadServer,
        function (e) {
          //alert(JSON.stringify(progressList));
          //remove from list
          //alert(JSON.stringify(e));
          $scope.progressList.splice($scope.progressList.indexOf(imageURI), 1);
        },
        function (e) {
          //alert(JSON.stringify(e));
          $scope.progressList.splice($scope.progressList.indexOf(imageURI), 1);

          msg.show('<li class="ion ion-alert"></li> &nbsp;Failed to upload photo <br />'+e.cide, 2000);

          var t = $('#written .photos').find('.thumbanil[data$="'+imageURI+'"]')
          var src = t.attr('data');
          t.remove();
          console.log(e);

        }, options);
  }

  try{
    var data = JSON.parse(localStorage.getItem('mmls'));
    data = data['subject'];
    $scope.data = data;
  }catch(e){
    console.warn(e.message);
  }

  $scope.flying = function(){
    var content = $('#written .textarea').val();
    if(content.length == 0){
     var alertPopup = $ionicPopup.alert({
       title: 'What\'s on your mind?',
       template: 'Please write something on your paper-plane.'
     });
    }else{

      //check if photos are all uploaded.
      //$ionicLoading.show({ template: '<li class="icon ion-loading-c"></li> Uploading photos'});
      $ionicLoading.show({ template: '<li class="icon ion-loading-c"></li> uploading photos'});
      
      var timer = setInterval(function(){
        //alert('timer');
        if( $scope.progressList.length == 0 ){
          clearInterval(timer);
          $ionicLoading.hide();
          //post only if photos are all uploaded
          api.simplePost('flying.php', {content:content, from:localStorage.getItem('sid'), to:$('.to').val(), uuid:uuid},
          function(data){
            //tell Plane controller to refresh data
            $rootScope.$broadcast('plane', 'refresh');
            $ionicHistory.goBack();
          }, 
          function(){
          });

        }

      }, 500);

    }
  }


  $('#written .photos').on('click', '.thumbanil', function(event) {
    var t = $(this);
    $ionicActionSheet.show({
      buttons: [
      { text: '<b>Delete</b>' }
      ],
      titleText: 'Delete this photo?',
      cancelText: 'Cancel',
      cancel: function() {
        return false;
      },
      buttonClicked: function(index) {

        var src = t.attr('data');
        //var src = t.css('background-image');
        //return array. match: url(http://dev.zh.my:8100/img/tmp.jpg)
        //srcMatch = src.match(/^url\((.*)\)$/);
        t.remove();
        api.simplePost('deletePhoto.php', { src:src, uuid:uuid }, function(){}, function(){})

      return true;
    }
  });
  //fix ionicActionSheet.show bug
  $scope.$apply();
/*
    if (confirm("Delete this photo?")) {
      var src = $(this).attr('src');
      $(this).remove();
      var api = 'deletePhoto.php';
      $.ajax({
        url: server + api,
        type: 'POST',
        data: { src:src, uuid:uuid },
        dataType: 'json',
        timeout: 22000,//22 seconds
        crossDomain: true,
        beforeSend: function(xhr) {
          $('#loading').css('display','block');
        },
        complete: function(data, status){
          if(status == 'success'){
            //data = data.responseJSON;
            //save records if data not empty
            if(typeof data['err'] === 'undefined'){
            }else{
              console.error(api+': '+data['err']);
            }
            $('#loading').css('display','none');
          }else{
            msg.show('<li class="ion ion-alert"></li> &nbsp;Network Error. <br /> Unable access  to the server '+api, 1000)
            $('#loading').css('display','none');
          }
        }
      });
      return true;
    }else{
      return false;
    }
    */
  });
  
  //take photos and pick up from galary
  $scope.photos = function(){
    //alert($('#written .photos img').size() + ' - ' + maxPhoto);
    if($('#written .photos .thumbanil').size() >= maxPhoto){
      var alertPopup = $ionicPopup.alert({
       title: 'Sorry my friend',
       template: 'You can only upload '+maxPhoto+' photos.'
      });

      return false;
    }

    var hideSheet = $ionicActionSheet.show({
      buttons: [
      { text: 'Take a <b>Photo</b>' },
      { text: 'Choose from <b>Album</b> ' }
      ],
      titleText: 'Adding Photos',
      cancelText: 'Cancel',
      cancel: function() {
      // add cancel code..
      },
      buttonClicked: function(index) {
        switch(index){
          case 0: //take from camera
            try{
              var options = { 
                quality : 50, 
                destinationType: Camera.DestinationType.FILE_URI, 
                sourceType: Camera.PictureSourceType.CAMERA,
                mediaType: Camera.MediaType.PICTURE,
                correctOrientation: true,
                //allowEdit : true,
                //encodingType: Camera.EncodingType.JPEG,
                targetWidth: 1024,
                targetHeight: 768,
                //popoverOptions: CameraPopoverOptions,
                saveToPhotoAlbum: true
              };
              $cordovaCamera.getPicture(options).then(function(imageData) {
                //console.log(imageData);         
                var img = '<div class="thumbanil" style="background-image: url(\''+imageData+'\');" data="'+imageData+'"></div>';
                $('#written .photos').append(img);

                //upload(imageData);
                 $timeout(function() { upload(imageData); }, 300);
              // Success! Image data is here
              }, function(err) {
                console.warn(err);
              // An error occured. Show a message to the user
              });
            }catch(e){
              console.error(e.message);
            }

           break;
          case 1: //choose from photo libaray
            try{
              var options = { 
                quality : 50, 
                targetWidth: 1024,
                targetHeight: 768,
                correctOrientation: true,
                mediaType: Camera.MediaType.PICTURE,
                destinationType : Camera.DestinationType.FILE_URI, 
                sourceType : Camera.PictureSourceType.PHOTOLIBRARY
              };
              $cordovaCamera.getPicture(options).then(function(imageData) {
                //console.log(imageData);
                var img = '<div class="thumbanil" style="background-image: url(\''+imageData+'\');" data="'+imageData+'"></div>';
                $('#written .photos').append(img);
                //upload(imageData);
                $timeout(function() { upload(imageData); }, 300);
              // Success! Image data is here
              }, function(err) {
                console.warn(err);
              // An error occured. Show a message to the user
              });
            }catch(e){
              console.error(e.message);
            }
          break;
        }
        return true;
      }
    });
  }

})


.controller('center', function($scope, $sce, $ionicActionSheet, $timeout, $state, fb, downloading, mmls, session) {

  try{
    var data = JSON.parse(localStorage.getItem('center'));
    $scope.text = $sce.trustAsHtml(data.text);
    $scope.data = data.list;
  }catch(e){
    console.warn(e.message);
  }

  //lisen on mmls event
  $scope.$on('center', function(d, feedback){ 

    if(feedback == "updated"){
      try {
        var data = JSON.parse(localStorage.getItem('center'));

        //fouce to reload mmls (fix mmls lock and unlock method)
        if(data['forceReload']){
          mmls.mmls();
        }

        $scope.text = $sce.trustAsHtml(data['text']);
        $scope.data = $sce.trustAsHtml(data['list']);
      } catch (e) {
        console.warn(e.message);
      }
    }
  });


  $scope.logout = function(){
    $ionicActionSheet.show({
      buttons: [
      { text: 'Log-out' }
      ],
      titleText: 'Are u sure?',
      cancelText: 'Cancel',
      cancel: function() {
        return false;
      },
      buttonClicked: function(index) {
        session.unregister(); //unregister token from server
        session.clear();

        fb.logout();
        downloading.clear();

        $state.go('login');

        return true;
      }
    });
  };

  $scope.clearDoc = function(){
    $ionicActionSheet.show({
      buttons: [
      { text: 'Clear Files' }
      ],
      titleText: 'Are u sure?',
      cancelText: 'Cancel',
      cancel: function() {
        return false;
      },
      buttonClicked: function(index) {
        downloading.clear();
        return true;
      }
    });
  };

})

.controller('centerDetail', function($scope, $stateParams, $sce, api) {
  var href = $stateParams.href;
  $scope.name = $stateParams.name;
  api.post(href, {}, href);
  
  //get content height
  var headerHeight = parseInt($('.bar-header').height());
  var tabHeight = parseInt($('.tab-nav').height());
  $scope.height = parseInt($("#centerDetail").height()) - headerHeight - tabHeight; //减去tabs height
  //alert($scope.height);
  
  try{
    var data = JSON.parse(localStorage.getItem(href));
    $scope.html = $sce.trustAsHtml(data.html);
    //$scope.zooming = data.zooming;
  }catch(e){
    console.warn(e.message);
  }

  //listen on event's feedback
  $scope.$on(href, function(d, feedback){ 
    if(feedback == "updated"){
      try {
        data = JSON.parse(localStorage.getItem(href));
        //$scope.zooming = data.zooming;
        $scope.html = $sce.trustAsHtml(data.html);
        //$scope.$apply();
      } catch (e) {
        console.warn(e.message);
      }
    }
  });


})



.controller('mmlsDetail', function($scope, $rootScope, $stateParams, $ionicScrollDelegate, mmls, $ionicActionSheet, $cordovaFile, downloading, msg) {

  var id = $stateParams.id;
  var m, key, data;
  //get list and set title name
  try{
    var m = JSON.parse(localStorage.getItem('mmls'));
    //get current detail content
    m = m['subject'][id];
    $scope.code = m.code;
    key = 'mmls_' + m.code;
  }catch(e){
    console.warn(e.message);
  }


  //clear mmlsList badge
  var mmlsBadge = localStorage.getItem('mmlsBadge');
  if(mmlsBadge != null){
    var mb = JSON.parse(mmlsBadge);
    mb.splice(mb.indexOf(m.code), 1);
    localStorage.setItem('mmlsBadge', JSON.stringify(mb));
    $('#'+m.code).css('display','none');

    if($rootScope.badges.mmls > 0){
      $rootScope.badges.mmls -= 1;
    }

  }

  //read data from local storage
  if(localStorage.getItem(key) !== null){
    try {
      data = JSON.parse(localStorage.getItem(key));
      console.log("Local data");
      //console.log(data);
      $scope.announcement = data['announcement'];
      $scope.lecture = data['lecture'];
      $scope.tutorial = data['tutorial'];
      //cachedLen = data['announcement'][0]['content'].length + data['announcement'].length;
      
    } catch (e) {
      console.warn(e.message);
    }
  }

  //loading resource
  try{
    mmls.mmlsDetail(m["url"], m.code);
  }catch(e){
    console.warn(e.message);
  }

  //listen on event's feedback
  $scope.$on(key, function(d, feedback){ 
    if(feedback == "updated"){
      try {
        data = JSON.parse(localStorage.getItem(key));
        //var newLen = data['announcement'][0]['content'].length + data['announcement'].length;

        if(data['announcement'].length != 0){
          $scope.announcement = data['announcement'];
        }
        $scope.lecture = data['lecture'];
        $scope.tutorial = data['tutorial'];
      } catch (e) {
        console.warn(e.message);
      }
    }
  });


  //load more content
  $scope.limit = 6;
  $scope.loadmore = function() {
      $scope.limit = data['announcement'].length;
      $ionicScrollDelegate.resize();
      return false;
  };

  //download and open file

  $scope.fileExist = function(url){
    return downloading.exist(url);
  }

  $scope.openfile = function(url, name, $event) {

    var filename = url.split('/').pop().replace(/\s+/g, '_');

    //alert(localStorage.getItem('downloading'));
    var fullpath = downloading.path(url, m.code);
    //alert(fullpath);
    //url = encodeURI(url);

    //check if exist
     
     //downloading.rm('https://mmls.mmu.edu.my/Contents/002/TSN2201/TSN2201/Tutorials/10150/Tutorial02.pdf', 'TSN2201', 'Tutorial02.pdf');

    if(downloading.exist(url)){
      //alert(fullpath);
      //# http://plugins.cordova.io/#/package/com.bridge.open
      //open file

      cordova.plugins.bridge.open(fullpath, null, function(code){
        //handle errors
        if (code === 1) {
          alert('For open your documents, Please install "WPS Office", "Office Mobile", "OfficeSuite" etc.');
          //alert('No file handler found');
          console.warn('No file handler found');
        }else{
          //re-download if open error
          downloading.rm(url, m.code, filename);
          //alert('Undefined error');
          console.warn('Undefined error');
        }

      });

    }else{
      //change icon to downloading
      var icon = $($event.currentTarget).children('.icon');
      icon.removeClass('ion-ios7-cloud-download-outline').addClass('ion-ios7-reloading');
      console.log('Downloading ' + url + ' to ' + fullpath);
      //alert('Downloading ' + url + ' to ' + fullpath);

      //start to download
      try{
        $cordovaFile
        .downloadFile(url, fullpath, true, {} )
        .then(function(result) {

          //add to downloading list
          downloading.add(url);
          //alert(result.fullPath);
          icon.removeClass('ion-ios7-reloading').addClass('ion-ios7-bookmarks-outline');
          //fileExist(result.fullPath);
          console.log("download complete: " + result.fullPath);
          //alert("download complete: " + result.fullPath);
          // Success! 
        }, function(err) {
          //alert("download error: " + JSON.stringify(err, null, 4));
          //alert(JSON.stringify(err, null, 4));
          console.log("download error: " + err);
          
          icon.removeClass('ion-ios7-reloading').addClass('ion-ios7-cloud-download-outline');
          downloading.rm(url, m.code, filename);
          msg.show('<li class="ion ion-alert"></li> &nbsp;Failed to download<br /> Please insert an SD card or try again later.', 1000);
          // Error
        }, function (progress) {
          //console.log(progress);
          // constant progress updates
        });
      }catch(e){
        downloading.rm(url, m.code, filename);
        //alert(e.message);
      }
    }

  };


  //send an email or make a phone call to lecture
  $scope.email = function(name, email, phone) {
    // Show the action sheet
    var hideSheet = $ionicActionSheet.show({
      buttons: [
      { text: 'Send an <b>E-mail</b>' },
      { text: 'Make a Phone <b>Call</b> ' }
      ],
      titleText: name,
      cancelText: 'Cancel',
      cancel: function() {
      // add cancel code..
      },
      buttonClicked: function(index) {
        switch(index){
          case 0:
            if(email != '' && email != null){
              document.location.href = "mailto:"+email;
            }else{
              msg.show(':( <br /> Email  address not found', 1500);
            }
           break;

          case 1:
            if(phone != '' && phone != null){
              window.location.href = 'tel:'+phone;
            }else{
              msg.show(':( <br /> Phone number not found', 1500);
            }
          break;
        }
        return true;
      }
    });
  };

  //for top menu
  $scope.show = function(to) {
    switch(to){
      case 'announcement':
        $('.ann').css('display','block');
        $(".tut").css('display','none');
        $(".lec").css('display','none');

        $(".tabAnn").addClass('active');
        $(".tabTut").removeClass('active');
        $(".tabLec").removeClass('active');
      break;

      case 'tutorials':
        $('.ann').css('display','none');
        $(".tut").css('display','block');
        $(".lec").css('display','none');
        
        $(".tabAnn").removeClass('active');
        $(".tabTut").addClass('active');
        $(".tabLec").removeClass('active');
      break;

      case 'lectures':
        $('.ann').css('display','none');
        $(".tut").css('display','none');
        $(".lec").css('display','block');
        
        $(".tabAnn").removeClass('active');
        $(".tabTut").removeClass('active');
        $(".tabLec").addClass('active');
      break;
    }


    $ionicScrollDelegate.scrollTop();
  };

})


.controller('newsDetail', function($scope, $stateParams) {

  var id = $stateParams.id;
  var data;

  try{
    data = JSON.parse(localStorage.getItem('news'));
    data = data[id];
    $scope.data = data;
  }catch(e){
    console.warn(e.message);
  }


})
;