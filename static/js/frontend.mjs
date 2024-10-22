import {getImage, addImage, addComment,getComments, ImageSize, commentsSize, deleteComment,deleteImage, signup, getUserTotal, getUsers, login,signout, getUsername} from "./api.mjs";

let commentIndex = 0;
let lastComment = 0;
let lastMove = 0;
let imageindex = 0;
let username = getUsername();
let viewingUser = getUsername();

function onError(err) {
    console.error("[error]", err);
  }

  document.getElementById("popdown_start").addEventListener("click", function(){
    const form = document.getElementById("popdown_form");
    if (form.classList.contains("show")){
        form.classList.remove("show");
    }
    else{
        form.classList.add("show");
    }
});
//this is from chatgpt
document.getElementById("entire_feed").addEventListener('mousedown', function(event) {
  // Check if the click is on the main container
  if (event.target === this) {
      event.preventDefault(); // Prevent selection if clicking on the background
  }
});
//
function remove_comment_add(){
  const addCommentsSection = document.querySelector(".addComment");
  addCommentsSection.style.display = "none";
}

function add_comment_add(){
  const addCommentsSection = document.querySelector(".addComment");
  addCommentsSection.style.display = "flex";
}

function show_arrows(){
  document.querySelectorAll(".ButtonImageDirc").forEach(function(arrows){
    arrows.style.display ="block";
  });
}

function hide_arrows(){
  document.querySelectorAll(".ButtonImageDirc").forEach(function(arrows){
    arrows.style.display ="none";
  });
}
function show_next_comment_button(){
  const comment_buttons = document.querySelector(".comments_switch");
  comment_buttons.style.visibility = "visible";
}

function hide_next_comment_button(){
  const comment_buttons = document.querySelector(".comments_switch");
  comment_buttons.style.visibility = "hidden";
}




document.querySelectorAll(".ButtonImageDirc").forEach(function(element){
  element.addEventListener("click", function(e){
    if (e.target.classList.contains("goleft")){
      slipeLeft();
    }
    else if (e.target.classList.contains("goright")){
      slipeRight();
    }
  });
});




function change_image_index(direction){
  ImageSize(viewingUser, onError, function(size){
    console.log("image size " + size);
    console.log("imageindex " + imageindex);
    if (direction === "right"){
      if ((size) > (imageindex + 1)){
        imageindex += 1;
        update_image(viewingUser,"right"); // Update image after changing index
        return;
      }
      imageindex = 0; // Reset to start
      update_image(viewingUser, "right"); // Update image after resetting index
      return;
    }
    else { // direction is left
      if ((imageindex - 1) < 0){
        imageindex = size - 1;
        update_image(viewingUser, "left"); // Update image after changing index
        return;
      }
      imageindex -= 1; // Decrement index
      update_image(viewingUser, "left"); // Update image after changing index
      return;
    }
  });
}


function slipeRight(){
  const image = document.getElementById("photo");
  image.classList.add("slipe_right");
  setTimeout(function(){
    console.log("changing Image");
    change_image_index("right");
    resetEnter();
    setTimeout(function(){
      update_image(viewingUser, "left");
    },10)
  },500);
}

function slipeLeft(){
  const image = document.getElementById("photo");
  image.classList.add("slipe_left");
  setTimeout(function(){
    console.log("changing Image");
    change_image_index("left");
    resetEnter();
    setTimeout(function(){
      update_image(viewingUser, "right");
    },10)
  },500);
}

function resetEnter(){
  const photocontainer = document.getElementById("photocontainer");
  photocontainer.classList.remove("enter_right");
  photocontainer.classList.remove("enter_left");
  photocontainer.classList.remove("enter");
}
function enter(){
  const image = document.getElementById("photocontainer");
  image.classList.add("enter");
}
function enter_left(){
  const image = document.getElementById("photocontainer");
  image.classList.remove("enter_right");
  image.classList.add("enter_left");
}
function enter_right(){
  const image = document.getElementById("photocontainer");
  image.classList.remove("enter_left");
  image.classList.add("enter_right");
}


function no_images(){
  document.querySelector("#photocontainer").innerHTML = "";
  console.log("You have no images :(");
  hide_arrows();
  remove_comment_add();
  hide_next_comment_button();
}

//image stuff
//fix a lot of the issues later 
function update_image(user, way){
  if (user){
    ImageSize(user, onError,function(count){
      if (count !== 0){
        console.log(imageindex);

        getImage(user, imageindex, onError,function(image){
          image = image[0];
          document.querySelector("#photocontainer").innerHTML = "";
          commentIndex = 0;
          let elmt = document.createElement("div");
          elmt.className = "photohelpercontainer";
          // add an image id tag in the img src thing we can just have the size 
          //the ammout of images, and sort it like that way 
          elmt.innerHTML = `
                            <div class="photourl_box" data-imageId = "${image._id}" data-Imagedate = "${image.date}">
                                <img src="/api/images/${imageindex}/${image._id}/" id="photo"> 
                            </div>
                            <div class="photo_author">${image.author}</div>
                            <div class="image_title">${image.title}</div>
          `;
          document.getElementById("photocontainer").prepend(elmt);
          if (count!== 0) {
            add_comment_add();
            show_arrows();
            show_next_comment_button();
            update_comment();
          }
        
          setTimeout(function(){
            if (way === "right"){
              enter_right();
            }
            else if (way === "left"){
              enter_left();
            }
            else{
              enter();
            }
          },100);
          
        }); //will only recieve one image
      }
      else{
        no_images();
        return;
      }
    });
  } 
  else{
    no_images();
    return;
  }
}
update_image(username);

document.getElementById("deleteimage_icon").addEventListener("click", function(e){
  const imageElement = document.querySelector('.photourl_box');
  if (!imageElement){
    console.log("Error getting Image");
    return;
  }
  const imageId = imageElement.getAttribute("data-imageId");
  deleteImage(imageId, onError,function(){
    console.log("Successfully removed image with iamgeId " + imageId);
    change_image_index("right");
    document.querySelector("#comments").innerHTML = "";
    ImageSize(viewingUser, onError, function(size){
      if (size === 0){
        remove_comment_add();
        hide_arrows();
        imageindex = 0;
      }
    });
    update_image(viewingUser);

  });
});

function showLoginPopup(){
  const popup = document.getElementById("login-popup");
    popup.classList.add("show");
    
    setTimeout(() => {
        popup.classList.remove("show");
    }, 3000);
}

document.getElementById("AddImageForm").addEventListener("submit", function(event) {
  event.preventDefault(); 
  const title = document.getElementById("image_title").value;
  const file = document.getElementById("image_actual").files[0];
  if (username){
    addImage(title, file, onError, showLoginPopup, () => update_image(viewingUser));
  }
  else{
    showLoginPopup();
  }
});




//comments 

function update_comment(){
  const holder = document.querySelector('.photoholder');
  const imageId = holder.querySelector('.photourl_box').getAttribute("data-imageId");
  commentsSize(imageId, onError, function(commentsize){
    getComments(imageId, commentIndex,onError,function(comments){
      lastComment = comments.length
      console.log(comments);
      document.querySelector("#comments").innerHTML = "";
      comments.forEach(function(comment){
        let elmt = document.createElement("div");
        elmt.className = "comment";
        elmt.setAttribute("data-commentId", comment._id);

        elmt.innerHTML = `
        <div class="comment_author">${comment.author}</div>
                            <div class="comment_content_container">
                                <div class="comment_content">${comment.content}</div>
                            </div>
                            <div class="comment_date">${new Date(comment.date).toISOString()}</div>

                            <div id = "delete" class="delete" icon data-commentId=${comment._id}></div>    `;
        document.getElementById("comments").prepend(elmt);
        });

    }); 
  });

}


if (document.getElementById("addcommentform")){
  document.getElementById("addcommentform").addEventListener("submit", function(e){
    e.preventDefault();
    let content = document.getElementById("comment_content").value;
    const photobox = this.closest(".photoholder").querySelector('.photourl_box');
    let imageId = photobox.getAttribute("data-imageId");
    addComment(imageId, content,onError, function(){
      document.getElementById("addcommentform").reset();
      update_comment();
    });
  });
}



//deleteing comments hehehe 
if (document.getElementById("comments")){
  document.getElementById("comments").addEventListener("click", function(e){
    const imageElement = document.querySelector('.photourl_box');
    if (!imageElement){
      console.log("Error getting Image");
      return;
    }
    const imageId = imageElement.getAttribute("data-imageId");
    const commentId = e.target.getAttribute("data-commentId");
    if (e.target.classList.contains("delete")){
      if (!commentId){
        console.log("Error getting comment");
        return;
      }
      else{
        deleteComment(imageId, commentId,onError,function(comment){
          console.log(`Successfully deleted comment with ${commentId}`);
          update_comment();
        });
      }
    }
    });
}


//changing comments like moving 
document.querySelector(".comments_switch").addEventListener("click", function(e){
  const photobox = this.closest(".photoholder").querySelector('.photourl_box');
  let imageId = photobox.getAttribute("data-imageId");
  if (e.target.classList.contains("next_10")){
    //what I need TO check if comments + or - 10 is close to over getComments 
    //if we have less the 10 comment remaining display those, 
    commentsSize(imageId, onError, function(size){
      if (lastComment <= 9){
        return;
      }
      commentIndex += 10;
      lastMove += 10;
      update_comment();
    });
   
  }
  else if (e.target.classList.contains("past_10")){
    commentsSize(imageId, onError, function(size){
      if (lastMove < 10){
        return;
      }
      lastMove-=10;
      commentIndex -= 10;
      update_comment();
    });
}});
 


//Wait i need to add a toggle that If i get a login then ehhh
//I remove signup login and then add logout
//also need to not display any gallery if I am not login 
//or i need to be able to browse all gallery but not be able to comment 
//etc etc etc

function onErrorLogin(err) {
  console.error("[error]", err);
  const error_box = document.querySelector("#error_box");
  error_box.innerHTML = err.message;
  error_box.style.visibility = "visible";
}


function loginstatus(){
  username = getUsername();
  document.querySelector("#error_box").style.visibility = username ? "hidden" : "visible";
  document.querySelector(".browsegallery").style.display = username ? "block" :"none";
  document.querySelector(".Login").style.display = username ? "none" : "flex";
  document.querySelector(".signout").style.display = username ? "block" : "none";
}
loginstatus();

function signinfunc(){
  loginstatus();
  document.getElementById("loginForm").reset();
  update_image(username);
  viewingUser = username;
}
function signoutfunc(){
  loginstatus();
}

document.getElementById("loginForm").addEventListener("submit", function(e){
  e.preventDefault();
  const userChoice = e.submitter.id;

  const username = document.getElementById("UsernameForm").value;
  const password = document.getElementById("PasswordForm").value;

  if (userChoice === "loginbutton"){
    login(username, password, onErrorLogin, signinfunc);
  }
  else if (userChoice === "signupbutton"){
    signup(username, password, onErrorLogin, function(){
      login(username, password, onErrorLogin, signinfunc);
    });
  }
});

document.getElementById("logout").addEventListener("click",function(e){
  e.preventDefault();
  signout(onError, signoutfunc);
});

function hide_comments(){
  remove_comment_add();
  hide_next_comment_button();
  document.querySelector("#comments").innerHTML = "";
}

function feedChange(){
  document.querySelector("#photocontainer").innerHTML = "";
  console.log("Viewing Feeds");
  hide_arrows();
  hide_comments();
  createFeed();
  document.querySelector(".CompleteFeed").style.display = "flex";
  document.querySelector(".returnback").style.display="block";
  document.querySelector(".browsegallery").style.display="none";
}

function feedChangeBack(){
  document.querySelector(".CompleteFeed").style.display = "none";
  document.querySelector(".returnback").style.display="none";
  loginstatus();
  update_image(viewingUser);
}
document.getElementById("browsegallery").addEventListener("click",function(e){
  e.preventDefault();
  feedChange();
});

document.getElementById("returnback").addEventListener("click",function(e){
  e.preventDefault();
  feedChangeBack();
});


function createFeed(index){
  helperTotalUser();
  getUsers(index, onError, function(entirefeed){
    document.querySelector(".FeedContainer").innerHTML = "";
    entirefeed.forEach(function(feed){
      let elmt = document.createElement("button");
      elmt.className = "galleryitem";
      elmt.setAttribute("data-username", feed._id);
      elmt.innerHTML= feed._id;
      document.querySelector(".FeedContainer").prepend(elmt);
    });
    helper();
    helper2();
  })
}




let currentUserIndex = 0;
let pageSize = 10;
let totalUsers = 0


function helper(){
  const galleryItems = document.getElementsByClassName("galleryitem");
  if (galleryItems.length > 0) {
    Array.from(galleryItems).forEach(function(item) {
      item.addEventListener("click", function(e) {
        e.preventDefault();
        viewingUser = e.target.getAttribute("data-username");
        imageindex = 0;
        feedChangeBack();
      });
    });}
}

function helperTotalUser(){
  getUserTotal(onError,function(count){
    totalUsers = count;
  })
}
function helper2(){
  document.getElementById("feed_past_10").addEventListener("click", function(e){  
    if (currentUserIndex > 0) {
      currentUserIndex -= pageSize;
      createFeed(currentUserIndex);  
    }
  });

  document.getElementById("feed_next_10").addEventListener("click", function(e){
    if (currentUserIndex + pageSize < totalUsers) { 
      currentUserIndex += pageSize;
      createFeed(currentUserIndex);  
    }
  });
}