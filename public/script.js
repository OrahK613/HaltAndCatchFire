document.getElementById('add').onclick = function() {
    var a = document.getElementById('a').valueAsNumber;
    var b = document.getElementById('b').valueAsNumber;

    var xhr = new XMLHttpRequest();

    xhr.open('POST', '/add');

    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.responseType = 'json';

    xhr.onload = function() {
        document.getElementById('result').innerHTML = xhr.response;
    };

    xhr.send(JSON.stringify({ a: a, b: b }));
};