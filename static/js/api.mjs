
if (!localStorage.getItem("imageIndex")){
    localStorage.setItem("imageIndex", "0");
}




//things I need to implmenet rn 
/*
    basically what I need to implmeent rn is that I just need to figure out 
    a way to talk to the database 
    and thats really it 
    and other then that 
    all i have to do 
    is reconfgirue all this code 
    add an error handler then I am finish 



*/
/*  ******* Data types *******
    image objects must have at least the following attributes:
        - (String) imageId 
        - (String) title
        - (String) author
        - (String) url
        - (Date) date

    comment objects must have the following attributes
        - (String) commentId
        - (String) imageId
        - (String) author
        - (String) content
        - (Date) date


    just a storage of the current index
    
****************************** */
//get the stuff for the images



function handleReponse(res){
	if (res.status != 200) { 
        return res.text().then(text => {
             throw new Error(`${text} (status: ${res.status})`)}); 
    }
	return res.json();
}

//dont need anything for add image since that is done by the front end 
//also dont need anythign like get image since that is als hanlde by the front end 
export function addImage(title, file, fail, showLoginPopup, success) {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('picture', file);
    
    fetch('/api/images/', {
        method: 'POST',
        body: formData,
    })
    .then((response) => {
        if (response.redirected) {
            window.location.href = response.url;
            return;
        } 
        else if (response.status === 401){
            showLoginPopup();
            return;
        }else if (response.status === 200) {
            success();
            return;
        } 
        else {
            return response.text().then(text => {
                throw new Error(`${text} (status: ${response.status})`);
            });
        }
    })
    .catch(fail);
}


export function addComment(imageId, content, fail, success){
    const comment = {imageId: imageId, content:content};
    fetch(`/api/images/${imageId}/comments/add`,{
        method:"POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(comment),
    })
    .then(handleReponse)
    .then(success)
    .catch(fail);
}

//getComments is done AND linked with odd one i think 
export function getComments(imageId, commentId, fail, success){
    fetch(`/api/images/${imageId}/comments/${commentId}/`,{
        method: "GET",
        headers:{'Content-Type':"application/json"},
    })
    .then(handleReponse)
    .then(success)
    .catch(fail);
}

export function getImage(username, imageindex, fail,success){
    fetch(`/images/${username}/${imageindex}`,{
        method:"GET",
        headers: {"Content-Type": "application/json"}, 
    })
    .then(handleReponse)
    .then(success)
    .catch(fail);
}

export function ImageSize(username, fail,success){
    fetch(`/images/${username}/count/`,{
        method:"GET",
    })
    .then(handleReponse)
    .then(success)
    .catch(fail);
}

export function commentsSize(imageId,fail, success){
    fetch(`/api/images/${imageId}/comments`,{
        method:"GET",
        headers:{"Content-Type":"application/json"},
    })
    .then(handleReponse)
    .then(success)
    .catch(fail);
}

export function deleteComment(imageid, commentId, fail, success){
    fetch(`/api/delete/images/comments/${commentId}/${imageid}/`,{
        method:"delete",
        headers:{"Content-Type":"application/json"},
    })
    .then(handleReponse)
    .then(success)
    .catch(fail);
}


export function deleteImage(imageId, fail, success){
    fetch(`/api/images/${imageId}/`,{
        method:"delete",
        headers:{"Content-Type": "application/json"},
    })
    .then(handleReponse)
    .then((data)=>{
        if (data == 0){
            return;
        }
        success(data);
    })
    .catch(fail);
}


export function returnIndex(){
    return localStorage.getItem("imageIndex");
}

export function setIndex(index){
    localStorage.setItem("imageIndex", String(index));
}


export function signup(username, password, fail, success){
    fetch(`/api/signup/`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({username:username, password:password}),
    })
    .then(handleReponse)
    .then(success)
    .catch(fail);
}

export function login(username, password, fail, success){
    fetch(`/api/login/`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({username:username, password:password}),
    })
    .then(handleReponse)
    .then(success)
    .catch(fail);
}

export function signout(fail,success){
    fetch(`/api/logout/`,{
        method:"GET",
        headers:{"Content-Type":"application/json"},
    })
    .then((response) => {
        if (response.redirected) {
            window.location.href = response.url;
        } else if (response.status === 200) {
            success();
        } else {
            return response.text().then(text => {
                throw new Error(`${text} (status: ${response.status})`);
            });
        }
    })
    .catch(fail);
}

export function getUsername(){
    return document.cookie.replace(
        /(?:(?:^|.*;\s*)username\s*\=\s*([^;]*).*$)|^.*$/,
        "$1",
      );
}

export function getUsers(index,fail,success){
    fetch(`/users/${index}`,{
        method:"GET",
        headers:{"Content-Type":"application/json"},
    })
    .then(handleReponse)
    .then(success)
    .catch(fail);
}
export function getUserTotal(fail,success){
    fetch(`/users/total`,{
        method:"GET",
        headers:{"Content-Type":"application/json"},
    })
    .then(handleReponse)
    .then(success)
    .catch(fail);
}