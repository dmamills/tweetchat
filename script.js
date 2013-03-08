
var fbUrl = 'https://tweetchat.firebaseio.com/';
var loggedInUser;

var firebaseRef = new Firebase(fbUrl);
var messagesRef = new Firebase(fbUrl + 'messages');
var userRef = new Firebase(fbUrl + 'users');

$(function() {
	$(document).tooltip({
		items: "[title]",
		content: function(){
			var element = $(this);
			if(element.is("[title]")) {
				var userName = element[0].attributes.title.nodeValue;
				var profileRef = new Firebase(fbUrl+'users/'+userName);
				
				return "<div class='miniprofile'> <b> hello, "+userName +" </b> <img src='twitterlight.png'> </div>";
			}
		}
	});
});


var authClient = new FirebaseAuthClient(firebaseRef, function(error, user) {
	if(error) {
		console.log(error);
	} else if(user) {


		var templasttweet = (user.status) ? user.status.text : '';

		userRef.child(user.username).set({ name: user.username, 
										   profileimage: user.profile_image_url, 
										   url: user.url,
										   location: user.location, 
										   description: user.description, 
										   followers: user.followers_count, 
										   following: user.friends_count, 
										   lasttweet: templasttweet, 
										   tweetcount: user.statuses_count 
										});		

		var currentUserRef = new Firebase(fbUrl+'users/'+user.username);
		currentUserRef.once('value',function(snapshot){
			loggedInUser = snapshot.val();

			$('h3').html("Hello, "+loggedInUser.name).show();
			$('#prelogin').hide();
			$('#chatwrapper').show();

		})
		
	}
});



$(document).ready(function(){

	$('#chatwrapper').hide();

	$('#loginbutton').on('click',function() {
		authClient.login('twitter');
	});

	$('#chatmessage').keypress(function(event){
		if(event.keyCode === 13) {

			var messageText = $('#chatmessage').val();
			if(messageText == '')
				return;
			messagesRef.push({name:loggedInUser.name, picture:loggedInUser.profileimage, message: messageText});
			$('#chatmessage').val('')
		}
	});


	$('#logoutbutton').on('click',function(){
		authClient.logout();
		var currentUserRef = new Firebase(fbUrl + 'users/'+loggedInUser.name);
		currentUserRef.remove();
		loggedInUser = undefined;

		$('h3').text('').hide();
		$('#chatwrapper').hide();
		$('#prelogin').show();
	});

	$(window).unload(function(){
		authClient.logout();
		var currentUserRef = new Firebase(fbUrl + 'users/'+loggedInUser.name);
		currentUserRef.remove();
	});

});
 
 userRef.on('child_added',function(snapshot) {
 	var tempUserData = snapshot.val();
 	$('ul').append('<li>'+tempUserData.name+'</li>');
 });

 userRef.on('child_removed',function(snapshot){
 	var tempUserData = snapshot.val();
 		$('li').each(function(){
 		if($(this).text() == tempUserData.name) {
 			$(this).remove();
 		}
 	});
 });


messagesRef.limit(10).on('child_added',function(snapshot) {
	var messageData = snapshot.val();

	$('#chat').append(newPost(messageData.name,messageData.picture,messageData.message));
	$('#chat').scrollTop($('#chat')[0].scrollHeight);
});


var newPost = function(name,picture,message) {

 	var rString = "<div class='message'> <div class='messagetop'> <div class='messageimage'> <a href='http://twitter.com/" + name + "' > <img src='" + picture + "'title='"+name+"'> </div>"
 	+ "<div class='messagename'> " + name+ "</a> </div> </div> <div class='messagetext'> " + message + " </div> </div>";
 	return rString; 
}