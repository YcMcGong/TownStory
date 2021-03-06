// Data Structure to Save Data
var itemCount = 0;
var itemType = [];
var imageCount = 0;
var imageFiles = [];
var uploadURLs = [];
var accessURLs = [];
var story_id = '';
// var article = '';
var article = [];
var globalBlob;

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function renderParagraph(itemNumber){
    return  `<div class="row" id='` + 'item' + itemNumber + 
    `'>
        <div class="col-lg-12">
        <div class="form-group">
        <label for="paragraph">Paragraph</label>
        <textarea class="form-control" rows="3" id=` + itemNumber +
        `></textarea>
        </div>
        </div>
    </div>`;
}

function renderHeader(itemNumber){
    return  `<div class="row" id='` + 'item' + itemNumber + 
    `'>
        <div class="col-lg-12">
        <div class="form-group">
        <label for="header">Header</label>
        <input type="text" style="font-weight: bold;" class="form-control" id='` + itemNumber +
        `'>
        </div>
        </div>
    </div>`;
}

function renderImage(itemNumber){
    return  `<div class="row" id='` + 'item' + itemNumber + 
    `'>
    <div class="col-lg-12">
    <br>
        <img id='` + 'image' + itemNumber +
    `' width="400" alt=""> 
        <input type="file" id="` + itemNumber +`" class="form-control-file" hidden><br>
        </div>
    </div>`;
}

function insertParagraph(){
    itemCount += 1;
    itemType.push('paragraph');
    text = renderParagraph(itemCount);
    document.getElementById('article').insertAdjacentHTML('beforeend', text);
}

function insertHeader(){
    itemCount += 1;
    itemType.push('header');
    text = renderHeader(itemCount);
    document.getElementById('article').insertAdjacentHTML('beforeend', text);
}

function insertImage(){
    itemCount += 1;
    imageCount += 1;
    itemType.push('image');
    text = renderImage(itemCount);
    document.getElementById('article').insertAdjacentHTML('beforeend', text);
}

function deleteItem(){
    document.getElementById('item' + itemCount).remove();
    var type = itemType.pop();
    if (type == 'image'){ 
        imageCount -= 1;
        imageFiles.pop();
    }
    itemCount -= 1;
}

function selectImage(){
    var file = document.getElementById('image').files[0];
    insertImage();
    var reader = new FileReader();
    reader.onloadend = function(e){
        // console.log(this.result);
        document.getElementById('image' + itemCount).src = this.result;
        // imageFiles.push(file);
        // imageFiles.push(resizeImageFile(file));
        resizeImageFileAndPush(file);
        $('#myModal').modal('hide');
    }
    reader.readAsDataURL(file);
}

function getUploadURLs(){
    var xhr = new XMLHttpRequest();
    var requestURL = uploadImgURLs + '?imageCount=' + imageCount;
    xhr.onreadystatechange = function() {
        // console.log(this.readyState);
        if (this.readyState == 4 && this.status == 200) {
            response = JSON.parse(this.responseText);
            uploadURLs = response.uploadURLs;
            accessURLs = response.accessURLs;
            submitData();
        }
      };
    xhr.open('GET', requestURL);
    xhr.send();
}

function sendImage(file, uploadURL){

    var xhr = new XMLHttpReerquest({mozSystem: true});
    xhr.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            imageCount -= 1;
            if (imageCount <= 0){
                finished();
            }
        }
      };
    xhr.open('PUT', uploadURL);
    var reader = new FileReader();
    reader.onload = function(evt) {
        xhr.send(new Uint8Array(evt.target.result));
    };
    reader.readAsArrayBuffer(file);
}

function submitData(){
    var imageIndex = 0;
    for (i=0; i<itemCount; i++){
        type = itemType[i];
        switch (type){
            case 'header':
                var text = document.getElementById((i+1).toString()).value;
                if (text==''){text = ' '};
                article.push(['header', text]);
                break;
            case 'paragraph':
                var text = document.getElementById((i+1).toString()).value;
                if (text==''){text = ' '};
                article.push(['paragraph', text])
                break;
            case 'image':
                sendImage(imageFiles[imageIndex], uploadURLs[imageIndex]);
                article.push(['image', accessURLs[imageIndex]])
                imageIndex += 1;
                break;
        }
    }
    if (imageCount==0) finished();
}

function finished(){
    // Submit the final information
    var formData = new FormData();
    var url = uploadArticleUrl;
    var title = document.getElementById('title').value;
    var summary = document.getElementById('summary').value;
    var city = document.getElementById('city').value;
    formData.append('title', title);
    formData.append('summary', summary);
    // formData.append('article', article);
    var content = JSON.stringify(article);
    formData.append('article', content);
    formData.append('city', city);
    // Append lat/lng data
    formData.append('latitude', latitude)
    formData.append('longitude', longitude)
    var xhr = new XMLHttpRequest({mozSystem: true});
    xhr.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            document.getElementById('finishText').innerHTML = 'Story success!';
            document.getElementById('finish').disabled = false;
            response = JSON.parse(this.responseText);
            story_id = response.story_id;
            }
        }
    xhr.open('POST', url);
    xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
    xhr.send(formData);
}

function redirect(){
    // document.write(article);
    var url = storyUrl + '?story_id=' + story_id
    window.location.assign(url)
}

function resizeImageFileAndPush(file){
    var canvas = document.createElement('canvas');
    var img = document.createElement("img");
    var reader = new FileReader();
    reader.onload = function(e) {
        img.src = e.target.result;
        var MAX_WIDTH = 1280;
        var MAX_HEIGHT = 720;
        var width = img.width;
        var height = img.height;
        
        if (width > height) {
        if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
        }
        } else {
        if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
        }
        }
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        var dataurl = canvas.toDataURL('image/jpeg', 0.7);
        blob = window.dataURLtoBlob && window.dataURLtoBlob(dataurl);
        newFile = new File([blob], "imageFile");
        imageFiles.push(newFile);
    }
    reader.readAsDataURL(file);
}

function validateDataAndSend(){

    // Validate title
    if (document.getElementById('title').value.replace(/\s/g, "").length<5){
        document.getElementById('titleWarning').hidden = false;
        return false;
    }

    // Validate number of items
    if (itemCount<=0){
        document.getElementById('itemWarning').hidden = false;
        return false;
    }

    // Validate city name
    var cityName = document.getElementById('city').value;
    if (!cityName) {
        document.getElementById('cityWaring').hidden = false;
        return false;
    }
    cityfqcn = cityName;
    if (cityfqcn) {
        jQuery.getJSON(
                geobyteUrl+"GetCityDetails?callback=?&fqcn="+cityfqcn+geobyteKey,
                function (data) {
                    if (data.geobytesfqcn) {
                        latitude = data.geobyteslatitude;
                        longitude = data.geobyteslongitude;
                        document.getElementById('city').value = data.geobytesfqcn;
                        $('#submitModal').modal('show');
                        getUploadURLs();
                    }
                    else document.getElementById('cityWaring').hidden = false;
                }
            );
    }
}
