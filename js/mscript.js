var fbUrl = 'https://tweetchat.firebaseio.com/';
var loggedInUser;

var firebaseRef = new Firebase(fbUrl);
var messagesRef = new Firebase(fbUrl+'default/messages');
var userRef = new Firebase(fbUrl+'default/users');

var roomName;
var roomRef;

$(document).ready(function() {

	var location = window.location.href;
	if(location.indexOf('#bar') >-1){
		window.location = "mobile.html";
	}

	if(!isMobile.any()) {
		window.location = "index.html";
	}

	$('#loginbutton').on('click',function(){
		roomName = $('#roomname').val();

		if(roomName == '' || roomName =='Enter Room Name')
			roomName = 'default';

		authClient.login('twitter');
	});

	$(window).unload(function(){
		authClient.logout();
		var currentUserRef = new Firebase(fbUrl +roomName+'/'+ 'users/'+loggedInUser.name);
			currentUserRef.remove();
		
			var tempUserRef = new Firebase(fbUrl+roomName+'/users');
			tempUserRef.once('value',function(snapshot){
				var t = snapshot.val();
				if(t == null && roomName != 'default')
					roomRef.remove();
			});
	});

	$('#logoutbutton').on('click',function(){
		authClient.logout();
		var currentUserRef = new Firebase(fbUrl +roomName+'/'+ 'users/'+loggedInUser.name);
		currentUserRef.remove();
		
		//test to see if last user, if so delete room
		var tempUserRef = new Firebase(fbUrl+roomName+'/users');
		tempUserRef.once('value',function(snapshot){
			var t = snapshot.val();
			if(t == null && roomName != 'default') {
				roomRef.remove();
			}
		});

		window.location = "mobile.html";
	});

	//enter key message submit
	$('#chatmessage').keypress(function(event){
		if(event.keyCode === 13) {
			var messageText = $('#chatmessage').val();
			if(messageText == '')
				return;

			if(messageText.length>200) {
				$('#chatmessage').val('');
				$('.errormessages').html('Message too long').show().delay(1000).fadeOut(500);
				return;
			}
			
			messageText = strip(messageText);
			var d = new Date();
			var newMessageRef = new Firebase(fbUrl+roomName+'/messages/'+d.getTime());
			newMessageRef.set({name:loggedInUser.name, picture:loggedInUser.profileimage, message: messageText,ts:d.getTime()});
			$('#chatmessage').val('');
		}
	}); 
   
   	
	//change message limit 
    $('#sliderWrap').on('slidestop',function(){
    	var value = parseInt($('#messageLimit').val());
        
        if(value > MAX_MESSAGES)
        	maxDifference = value - MAX_MESSAGES;

        MAX_MESSAGES = value;
		console.log('new limit: '+value + ' MAX: '+MAX_MESSAGES);
        messagesRef.off('child_added');
	    $('.message').each(function(){ 
        	$(this).remove();
        });
        count = 0; 
        var d = new Date();

        messagesRef.endAt(d.getTime()).limit(MAX_MESSAGES).on('child_added',onNewMessage);
    });

});

var authClient = new FirebaseAuthClient(firebaseRef,function(error,user) {
	if(error) {
		console.log(error);
	} else if(user){

		var lastTweet = (user.status) ? user.status.text : '';

		firebaseRef.child(roomName+'/users/'+user.username).set({
										   name: user.username, 
										   profileimage: user.profile_image_url, 
										   url: user.url,
										   location: user.location, 
										   description: user.description, 
										   followers: user.followers_count, 
										   following: user.friends_count, 
										   lasttweet: lastTweet, 
										   tweetcount: user.statuses_count
		});

		roomRef = new Firebase(fbUrl+roomName);
		userRef = new Firebase(fbUrl+roomName+'/users');

		userRef.on('child_added',userLogin);
		userRef.on('child_removed',userLogoff);

		//set messagesRef and event
		messagesRef = new Firebase(fbUrl+roomName+'/messages');
		messagesRef.limit(MAX_MESSAGES).on('child_added',onNewMessage);

		var currentUserRef = new Firebase(fbUrl+roomName+'/users/'+user.username);
		currentUserRef.once('value',function(s){
			loggedInUser = s.val();
			
			$('.chatheader').html("Hello "+loggedInUser.name +" you are in room: "+roomName);
			
			//create tweetbutton, call twttr.widgets.load();
			window.location = window.location+'#bar';
		});

	}
});

function userLogin(snapshot){
var tempUserData = snapshot.val();
 	$('ul').append('<li>'+tempUserData.name+'</li>');
}

function userLogoff(snapshot){
	var tempUserData = snapshot.val();
	 		$('li').each(function(){
	 		if($(this).text() == tempUserData.name) {
	 			$(this).remove();
	 		}
	 	});
}
var maxDifference = 0;
var MAX_MESSAGES = 5;
var count = 0;
var prependArray = [];

function onNewMessage(snapshot){
	var messageData = snapshot.val();
	count++;
	
	if(maxDifference > 0 && count > MAX_MESSAGES-maxDifference) {
		prependArray.push(createNewMessage(messageData.name,messageData.picture,messageData.message,messageData.ts));

		maxDifference--;
		if(maxDifference == 0) {
			prependArray.reverse();
			for(var i =0; i < prependArray.length;i++) {
				$('.chat').prepend(x[i]);
			}
			prependArray= [];
		}
	} else {
		$('.chat').append(createNewMessage(messageData.name,messageData.picture,messageData.message,messageData.ts));
	}
	if(count>MAX_MESSAGES){
		$('.message').get(0).remove();
		count--;
	}
}

function createNewMessage(name,picture,message,ts){
 	var rString = "<div class='message cf'><div id='ts' style='display:none;'>"+ts+"</div>  <div class='messageside'> <div class='messageimage'> <a href='http://twitter.com/" + name + " ' target='_blank' > <img src='" + picture + "'title='"+name+"'> </div>"
 	+ "<div class='messagename'> " + name+ "</a> </div> </div> <div class='messagetext'> " + createAnchors(message) + " </div>  </div>";
 	return rString; 
}


