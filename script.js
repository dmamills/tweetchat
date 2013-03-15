
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
				var profileString = "";
				var userName = element[0].attributes.title.nodeValue;
				var profileRef = new Firebase(fbUrl+roomName+'/users/'+userName);
				
				profileRef.once('value',function(snapshot){
				   profileString = getProfile(snapshot.val());		
				});

				return profileString;		
			}
		}
	});
});

//user login via twitter
var authClient = new FirebaseAuthClient(firebaseRef, function(error, user) {
	if(error) {
		console.log(error);
	} else if(user) {

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
		messagesRef.limit(MAX_MESSAGES).on('child_added',onNewMessage);

		//get currentUserRef for displaying name/room
		var currentUserRef = new Firebase(fbUrl+roomName+'/users/'+user.username);
		currentUserRef.once('value',function(snapshot){
			loggedInUser = snapshot.val();

			$('h3').html("Hello, "+loggedInUser.name + ' you are in room: '+roomName).show();
			$('#prelogin').hide();
			$('#chatwrapper').show();
		});
	}
});


$(document).ready(function(){

	$('#chatwrapper').hide();
	$('#loginbutton').on('click',function() {
		roomName = $('#roomname').val();

		if(roomName == '')
			roomName = 'default';

		authClient.login('twitter');
	});

	//enter key message submit
	$('#chatmessage').keypress(function(event){
		if(event.keyCode === 13) {
			var messageText = $('#chatmessage').val();
			if(messageText == '')
				return;
			
				messagesRef.push({name:loggedInUser.name, picture:loggedInUser.profileimage, message: messageText});
				$('#chatmessage').val('');
			}
	});

	//logout via button click
	$('#logoutbutton').on('click',function(){
		authClient.logout();
		var currentUserRef = new Firebase(fbUrl +roomName+'/'+ 'users/'+loggedInUser.name);
		currentUserRef.remove();
		$('.message').each(function(){
			$(this).remove();
		})
		messagesRef.off('child_added',onNewMessage)
		loggedInUser = undefined;

		$('h3').text('').hide();
		$('#chatwrapper').hide();
		$('#prelogin').show();
	});

	//logout via window close
	$(window).unload(function(){
		authClient.logout();
		var currentUserRef = new Firebase(fbUrl +roomName+'/'+ 'users/'+loggedInUser.name);
		currentUserRef.remove();
		
	});

});
 

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
//message added
/*messagesRef.limit(MAX_MESSAGES).on('child_added',onNewMessage);*/

var onNewMessage = function(snapshot) {
	var messageData = snapshot.val();
		count++;
		$('#chat').append(createNewMessage(messageData.name,messageData.picture,messageData.message));
		$('#chat').scrollTop($('#chat')[0].scrollHeight);
		if(count>MAX_MESSAGES){
			$('.message').get(0).remove();
			count--;
		}
};


//return a mini profile for a user.
var getProfile = function(profileValues){

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
var createNewMessage = function(name,picture,message) {

 	var rString = "<div class='message'> <div class='messagetop'> <div class='messageimage'> <a href='http://twitter.com/" + name + " ' target='_blank' > <img src='" + picture + "'title='"+name+"'> </div>"
 	+ "<div class='messagename'> " + name+ "</a> </div> </div> <div class='messagetext'> " + message + " </div> </div>";
 	return rString; 
}