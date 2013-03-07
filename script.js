
var fbUrl = 'https://tweetchat.firebaseio.com/';
var loggedInUser;

var firebaseRef = new Firebase(fbUrl);
var messagesRef = new Firebase(fbUrl + 'messages');
var userRef = new Firebase(fbUrl + 'users');

var authClient = new FirebaseAuthClient(firebaseRef, function(error, user) {
	if(error) {
		console.log(error);
	} else if(user) {

		userRef.child(user.username).set({name: user.username, profileimage: user.profile_image_url});

		var currentUserRef = new Firebase(fbUrl+'users/'+user.username);
		currentUserRef.once('value',function(snapshot){
			loggedInUser = snapshot.val();

			$('h3').html("logged in as: "+loggedInUser.name).show();
			$('#prelogin').hide();
			$('#chatwrapper').show();

		})
		userRef.child(user.username).set({name: user.username, profileimage: user.profile_image_url});		
	}
});



$(document).ready(function(){

	$('#chatwrapper').hide();

	$('#loginbutton').on('click',function() {
		authClient.login('twitter');
	});

	$('#chatbutton').on('click',function() {

		var messageText = $('#chatmessage').val();

		if(messageText == '')
			return;
		
		messagesRef.push({name:loggedInUser.name, picture:loggedInUser.profileimage, message: messageText});
		$('#chatmessage').val('')
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
});

 
 userRef.on('child_added',function(snapshot) {
 	var tempUserData = snapshot.val();
 		
 	$('ul').append('<li>'+tempUserData.name+'</li>');
 	//console.log('a user just logged in');
 });

 userRef.on('child_removed',function(snapshot){
 	var tempUserData = snapshot.val();

 		$('li').each(function(){
 		if($(this).text() == tempUserData.name) {
 			$(this).remove();
 		}
 	});
 	//console.log('a user just logged out');
 });


messagesRef.limit(10).on('child_added',function(snapshot) {
	var messageData = snapshot.val();

	$('#chat').append(newPost(messageData.name,messageData.picture,messageData.message))
	$('#chat').scrollTop($('#chat')[0].scrollHeight);
});


var newPost = function(name,picture,message) {

 	var rString = "<div class='message'> <div class='messagetop'> <div class='messageimage'> <img src='" + picture + "'> </div>"
 	+ "<div class='messagename'> " + name + "</div> </div> <div class='messagetext'> " + message + " </div> </div>";
 	return rString; 
}
