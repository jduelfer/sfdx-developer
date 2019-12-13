$(document).ready(function() {
    var postTitleElement = document.getElementById('postTitle');
    var postTitle;
    if (postTitleElement) {
        postTitle = postTitleElement.textContent;
    }
    var userAgent = navigator.userAgent;
    var language = navigator.language;
    var isPossibleBot = /bot|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent);
    var site = 'SFDX Developer';
    $.ajax({
        type: 'GET',
        url: 'https://criticalinquiries-developer-edition.na85.force.com/services/apexrest/v1/tracking?referrer=' + document.referrer
             + '&title=' + postTitle + '&agent=' + userAgent + '&bot=' + isPossibleBot + '&language=' + language + '&site=' + site,
        jsonp: "callback",
        dataType: "jsonp",
        success: function(response) {
            // Personalize page dependent on referrer
        }
    });
});