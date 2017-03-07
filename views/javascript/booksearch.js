function getBooks() {
    var searchTerm = document.getElementById('searchInput').value;

    postQuery(searchTerm).then(function(response, error) {
        $("#bookResultContainer").empty();
        for (var i = 0; i < response.length; i++) {
            var imgURL = (typeof response[i].volumeInfo.imageLinks != "undefined") ? response[i].volumeInfo.imageLinks.smallThumbnail : "";
            var bookTitle = response[i].volumeInfo.title;
            var bookAuthor = response[i].volumeInfo.authors;
            var bookID = response[i].id;

            $('#bookResultContainer').append($(
                `<div class = 'resultItem'><form method = "POST" action = '/user/add-book'><span class= "resultSpan">
                <img src = "${imgURL}">
                <p><i><b>${response[i].volumeInfo.title}</b></i><br>${response[i].volumeInfo.authors}</p>

                <input type = "submit" class = "addButton" value = "&#10004">
                </span>
                <input type= "hidden" name="bookTitle" value="${bookTitle}">
                <input type= "hidden" name="bookAuthor" value="${bookAuthor}">
                <input type= "hidden" name="bookImageUrl" value="${imgURL}">
                <input type= "hidden" name="bookID" value="${bookID}">
                </form></div>`));
        }
    })
}

function postQuery(searchQuery) {
    return new Promise(function(resolve, reject) {
        var url = "/user";
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                return resolve(JSON.parse(xhr.responseText)); // resolve the result of the post
            }
        }
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.send(JSON.stringify({
            bookTitle: searchQuery,
        }));
    })
}

function clearInput() {
    $('#searchInput').val('');
}
