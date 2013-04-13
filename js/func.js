
//object of functions for detecting mobile devices
var isMobile = {
    Android: function() {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function() {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function() {
        return navigator.userAgent.match(/IEMobile/i);
    },
    any: function() {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    }
};


//function check for urls in user message and wrap with anchor tags if needed
function createAnchors(str) {
   var arr = str.split(' ');
    var rStr = "";
    for(var i =0; i < arr.length;i++) 
      rStr = rStr + anchorWrap(arr[i]) + " ";
    return rStr;
}

//function if string passed contains http:// wrap it in an anchor 
function anchorWrap(str) {
    if(str.indexOf('http://')>-1) {
        return '<a href="'+str+'" target="_blank">'+str+'</a>'   
    }
    else 
        return str;
}


//function to prevent html injection in messages
function strip(html)
{
   var tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent||tmp.innerText;
}

//function to get room name from query string.
function getParameterByName(name)
{
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regexS = "[\\?&]" + name + "=([^&#]*)";
  var regex = new RegExp(regexS);
  var results = regex.exec(window.location.search);
  if(results == null)
    return "";
  else
    return decodeURIComponent(results[1].replace(/\+/g, " "));
}
