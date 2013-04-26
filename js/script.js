
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
				return tweetChat.getProfile(userName);
				
			}
		}
	});
});

$(document).ready(function(){

	var roomNameEl = $('#roomname');
	var qs = getParameterByName('room');
		if(qs != "") {
			qs = qs.substring(0,qs.length-1);
			roomNameEl.val(qs);
			roomNameEl.attr('disabled','disabled');
		} else {
			roomNameEl.val('Enter Room Name');
		}

	if(isMobile.any()) {
		window.location = "mobile.html";
	}


	roomNameEl.on({focus :function(){
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
		var name = roomNameEl.val();

		if(name == '' || name == 'Enter Room Name')
			name = 'default';

		tweetChat.login(name);
	});  

	//bind event handlers to page
	$('#chatmessage').keypress(tweetChat.keyPressEvent); 
	$('#logoutbutton').on('click',tweetChat.logoutButton);
	$(window).unload(tweetChat.unload);
});
 
var tweetChat = (function($) {

	const MAX_MESSAGES = 30;
	var count = 0;
	var fbUrl = 'https://tweetchat.firebaseio.com/';
	var roomName,userRef, messagesRef, roomRef,loggedInUser;
	var firebaseRef = new Firebase(fbUrl);


	function getProfileRefString(userName){
		var profileRef = new Firebase(fbUrl+roomName+'/users/'+userName);	
		profileRef.once('value',function(snapshot){
			return snapshot.val();		
		});
	};

	function logoutButton(){
		authClient.logout();
		logoutButtonCleanup();
	};

	function unload(){
		authClient.logout();
		windowCloseCleanup();
	};

	function logoutButtonCleanup(){
		
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
	};

	function windowCloseCleanup(){
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
	};


	function login(name){
		roomName = name;
		authClient.login('twitter');
	};

	function createUser(user){
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
	};

	function keyPressEvent(e){
		var chatMessage = $('#chatmessage');
		if(e.keyCode === 13) {
			var messageText = chatMessage.val();
				if(messageText == '')
					return;

			if(messageText.length>200) {
				chatMessage.val('');
				$('.errormessages').html('Message too long').show().delay(1000).fadeOut(500);
				return;
			}
			messageText = strip(messageText);
			var d = new Date();
			var newMessageRef = new Firebase(fbUrl+roomName+'/messages/'+d.getTime());
			newMessageRef.set({name:loggedInUser.name, picture:loggedInUser.profileimage, message: messageText});
			chatMessage.val('');
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

	function userLogin(snapshot) {
		var tempUserData = snapshot.val();
			$('ul').append('<li>'+tempUserData.name+'</li>');
	};

	function userLogoff(snapshot) {
		var tempUserData = snapshot.val();
 		$('li').each(function(){
 		if($(this).text() == tempUserData.name) {
 			$(this).remove();
 			}
 		});
	};


	//user login via twitter
	var authClient = new FirebaseAuthClient(firebaseRef, function(error, user) {
		if (error) {
			console.log(error);
		} else if (user) {
	
			createUser(user);
			//set roomRef
			var roomUrl = fbUrl+roomName;
			roomRef = new Firebase(roomUrl);
	
			//set userRef and events
			userRef = new Firebase(roomUrl+'/users');
			userRef.on('child_added',userLogin);
			userRef.on('child_removed',userLogoff);
	
			//set messagesRef and event
			messagesRef = new Firebase(fbUrl+roomName+'/messages');
			messagesRef.limit(MAX_MESSAGES).on('child_added',onNewMessage);
	
			//get currentUserRef for displaying name/room
			var currentUserRef = new Firebase(roomUrl+'/users/'+user.username);
			currentUserRef.once('value',function(snapshot){
				loggedInUser = snapshot.val();
	
				$('h3').html("Hello, "+loggedInUser.name + ' you are in room: '+roomName).show();
			    $('.tweetroom').html(createTweetButton());
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

	return {
		keyPressEvent:keyPressEvent,
		getProfile:getProfile,
		onNewMessage:onNewMessage,
		login:login,
		getProfileRefString:getProfileRefString,
		logoutButton:logoutButton,
		unload:unload
	};
 }(jQuery));