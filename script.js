
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

			$('h3').html("logged in as: "+loggedInUser.name);
			$('#prelogin').hide();
			$('#chatwrapper').show();
			bindCss();
		})
		userRef.child(user.username).set({name: user.username, profileimage: user.profile_image_url});

		
	}
});

 var bindCss = function() {
 		$('#chatwrapper').css({"margin":"0 auto", "border":"1px solid black","width":"600px","border-radius":"15px","padding":"15px 0 15px 0"});
		$('#chat').css({"margin":"0 auto", "border":"1px solid blue","height":"500px","overflow-y":"scroll","width":"500px"});
		$('#chatmessage').css({"width":"95%","margin":"5px"});
		$('input').css({"margin":"15px 5px 0 5px"});
		$('footer').css({"margin-top":"25px"});
 }

 var messagesCss = function() {

	    $('.message').each(function() {
			$(this).css({"border":"1px solid red","margin":"1px 5px 1px 5px","padding":"5px","border-radius":"5px"});
			$(this).find('.messagetop').css({"border":"1px solid red"})
			$(this).find('.messagetext').css({"word-wrap":"break-word"});
		});
}


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

		$('#chatwrapper').hide();
		$('#prelogin').show();
	});

});

 
 userRef.on('child_added',function(snapshot) {
 	var tempUserData = snapshot.val();
 		
 	$('ul').append('<li>'+tempUserData.name+'</li>');
 	console.log('a user just logged in');
 });

 userRef.on('child_removed',function(snapshot){
 	var tempUserData = snapshot.val();

 		$('li').each(function(){
 		if($(this).text() == tempUserData.name) {
 			$(this).remove();
 			console.log('found it!');
 		}
 	});
 	console.log('a user just logged out');
 });


messagesRef.limit(10).on('child_added',function(snapshot) {
	var messageData = snapshot.val();

	$('#chat').append(newPost(messageData.name,messageData.picture,messageData.message))
	messagesCss();
	$('#chat').scrollTop($('#chat')[0].scrollHeight);
});


var newPost = function(name,picture,message) {

 	var rString = "<div class='message'> <div class='messagetop'> <div class='messageimage'> <img src='" + picture + "'> </div>"
 	+ "<div class='messagename'> " + name + "</div> </div> <div class='messagetext'> " + message + " </div> </div>";
 	return rString; 
}
