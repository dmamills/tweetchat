var fbUrl = 'https://tweetchat.firebaseio.com/';
var loggedInUser;

var firebaseRef = new Firebase(fbUrl);
var messagesRef = new Firebase(fbUrl+'default/messages');
var userRef = new Firebase(fbUrl+'default/users');

var roomName;
var roomRef;

//showing mini-profile when hovering on message
$(function() {
	$(document).tooltip({
		items: "[title]",
		content: function(){
			var element = $(this);
			if(element.is("[title]")) {
				if(element[0].className == "twitter-share-button twitter-count-horizontal")
					return;

				var profileString = "";
				var userName = element[0].attributes.title.nodeValue;
				var profileRef = new Firebase(fbUrl+roomName+'/users/'+userName);
				
				profileRef.once('value',function(snapshot){
				   profileString = tweetChat.getProfile(snapshot.val());		
				});

				return profileString;		
			}
		}
	});
});


//user login via twitter
var authClient = new FirebaseAuthClient(firebaseRef, function(error, user) {
	if (error) {
		console.log(error);
	} else if (user) {

		//assign to variable to prevent undefined values, which error on firefox
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
		//set roomRef
		roomRef = new Firebase(fbUrl+roomName);

		//set userRef and events
		userRef = new Firebase(fbUrl+roomName+'/users');
		userRef.on('child_added',userLogin);
		userRef.on('child_removed',userLogoff);

		//set messagesRef and event
		messagesRef = new Firebase(fbUrl+roomName+'/messages');
		messagesRef.limit(MAX_MESSAGES).on('child_added',tweetChat.onNewMessage);

		//get currentUserRef for displaying name/room
		var currentUserRef = new Firebase(fbUrl+roomName+'/users/'+user.username);
		currentUserRef.once('value',function(snapshot){
			loggedInUser = snapshot.val();

			$('h3').html("Hello, "+loggedInUser.name + ' you are in room: '+roomName).show();
		    $('.tweetroom').html(tweetChat.createTweetButton());
		    twttr.widgets.load();
			$('.prelogin').hide();
			
			//if previously logged out and logging into a new chatroom clear old chat messages
			messagesRef.once('value',function(snapshot){
				var t = snapshot.val();
				if(t == null) 
					$('.chat').children().remove();	
			});
			$('.chatwrapper').fadeIn(500);
		});
	}
});

$(document).ready(function(){

	//check for query string for existing room name, else set to default
	var qs = getParameterByName('room');
	if(qs != "") {
		qs = qs.substring(0,qs.length-1);
		$('#roomname').val(qs);
		$('#roomname').attr('disabled','disabled');
	} else {
		$('#roomname').val('Enter Room Name');
	}

	if(isMobile.any()) {
		window.location = "mobile.html";
	}

	$('#roomname').on({focus :function(){
		if(this.value == 'Enter Room Name') 
			this.value = '';
		},
		blur: function(){
			if(this.value == '')
				this.value = 'Enter Room Name';
		}
	});

	$('.chatwrapper').hide();
	$('#loginbutton').on('click',function() {
		roomName = $('#roomname').val();

		if(roomName == '' || roomName == 'Enter Room Name')
			roomName = 'default';

		authClient.login('twitter');
	});  

	//enter key message submit
	$('#chatmessage').keypress(tweetChat.keyPressEvent); 

	//logout via button click
	$('#logoutbutton').on('click',function(){
		
		authClient.logout();
		var currentUserRef = new Firebase(fbUrl +roomName+'/'+ 'users/'+loggedInUser.name);
		currentUserRef.remove();
		
		messagesRef.off('child_added',tweetChat.onNewMessage);
		userRef.off('child_added',userLogin);
		userRef.off('child_removed',userLogoff);

		//test to see if last user, if so delete room
		var tempUserRef = new Firebase(fbUrl+roomName+'/users');
		tempUserRef.once('value',function(snapshot){
			var t = snapshot.val();
			if(t == null && roomName != 'default') {
				roomRef.remove();
			}
		});
		
		loggedInUser = undefined;
		messageRef = null;
		usersRef = null;

		$('.chat').children().remove();
		count = 0;
		$('.tweetroom').html("");
		$('h3').text('').hide();
		$('.chatwrapper').hide();
		$('.prelogin').fadeIn(500);

		$('li').each(function(){
			$(this).remove();
		});	
	});

	//logout via window close
	$(window).unload(function() {

		authClient.logout();

		if(loggedInUser != undefined) {
			var currentUserRef = new Firebase(fbUrl +roomName+'/'+ 'users/'+loggedInUser.name);
			currentUserRef.remove();
		
			var tempUserRef = new Firebase(fbUrl+roomName+'/users');
			tempUserRef.once('value',function(snapshot){
				var t = snapshot.val();
				if(t == null && roomName != 'default')
					roomRef.remove();
			});
		}
	});
});
 
var tweetChat = (function($) {

    	function keyPressEvent(e){
    		if(e.keyCode === 13) {
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
				newMessageRef.set({name:loggedInUser.name, picture:loggedInUser.profileimage, message: messageText});
				$('#chatmessage').val('');
			}
		};

		function createTweetButton() {
			var url = "http://danielmills.me/tweetchat/";
			return  "<a href='https://twitter.com/share' " +
		    "class='twitter-share-button' data-url='"+url+"?room="+roomName+"/' data-text='join me in my firechat: ' data-lang='en'>Tweet</a> <br> http://danielmills.me/tweetchat/?room="+roomName+"<br>";
		};

		//return a mini profile for a user.
		function getProfile(profileValues){
			if(profileValues != null)
				return "<div class='miniprofile'> " +
										"@"+profileValues.name +
										"<br/>"+profileValues.description +
										"<br/>"+profileValues.location +
										"<br/>"+profileValues.followers + " followers" +
										"<br/>"+profileValues.following + " following" +
										"<br/>"+profileValues.tweetcount + " tweets" +
										"<br/>Last Tweet: '"+profileValues.lasttweet +
										"'<br/></div>";
			else
				return "<div id='miniprofile'> Sorry user is no longer online </div>";
		};
		
		//create new message function
		function createNewMessage(name,picture,message) {
		
		 	var rString = "<div class='message cf'> <div class='messageside'> <div class='messageimage'> <a href='http://twitter.com/" + name + " ' target='_blank' > <img src='" + picture + "'title='"+name+"'> </div>"
		 	+ "<div class='messagename'> " + name+ "</a> </div> </div> <div class='messagetext'> " + createAnchors(message) + " </div>  </div>";
		 	return rString; 
		};

		function onNewMessage(snapshot) {
			var messageData = snapshot.val();
			count++;
			$('.chat').append(createNewMessage(messageData.name,messageData.picture,messageData.message));
			$('.chat').scrollTop($('.chat')[0].scrollHeight);
			if(count>MAX_MESSAGES){
				$('.message').get(0).remove();
				count--;
			};
		};	
    	return {
    		keyPressEvent:keyPressEvent,
    		createTweetButton:createTweetButton,
    		getProfile:getProfile,
    		onNewMessage:onNewMessage
    	};

 }(jQuery) );


var userLogin = function(snapshot) {
	var tempUserData = snapshot.val();
 	$('ul').append('<li>'+tempUserData.name+'</li>');
};

var userLogoff = function(snapshot) {
	var tempUserData = snapshot.val();
 		$('li').each(function(){
 		if($(this).text() == tempUserData.name) {
 			$(this).remove();
 		}
 	});
}

const MAX_MESSAGES = 30;
var count = 0;

//button to share a firechat room to twitter followers
