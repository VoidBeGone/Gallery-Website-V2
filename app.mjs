import {createServer} from "https";
import { rmSync } from 'fs';
import {join } from "path";
import express from "express";
import DataStore from "nedb";
import multer from "multer";
import {parse, serialize} from "cookie";
import {compare, genSalt, hash} from "bcrypt";
import fs from "fs";
import session from "express-session";
import validator from "validator";
import { readFileSync } from "fs";
import { createSecureServer } from "http2";

/*  ******* Data types *******
 image objects must have at least the following attributes:
        - (String) _id 
        - (String) title
        - (String) author
        - (Date) date
        also a place to store the profile of the image

    comment objects must have the following attributes
        - (String) _id
        - (String) imageId
        - (String) author
        - (String) content

****************************** */

//helps me visualize my data 
const app = express();

app.use(express.urlencoded({extended:true}));
app.use(express.json());

app.use(express.static("static"));

//initialize database
let users = new DataStore({
    filename: 'db/users.db', autoload:true, timestampData:true});
let images = new DataStore({
    filename: 'db/images.db', autoload:true, timestampData:true});
let comments = new DataStore({
    filename:'db/comments.db', autoload: true, timestampData:true});
const upload = multer({dest:'uploads/'});


//login and session stuff 
const secret = fs.readFileSync("./secret.txt","utf8").trim();
app.use(
    session({
        secret:secret,
        resave:false,
        saveUninitialized:false,
        cookie:{
            httpOnly:true,
            secure:true,
            sameSite:"strict",
            maxAge: 1000 * 60 * 60 * 24 * 7,
        }
    })
);
app.use(function(req,res,next){
    console.log("HTTP REQUEST", req.method, req.url, req.body);
    next();
});


const isAuthenticated = function(req,res,next){
    if (!req.session.username){
        return res.status(401).send("access denied");
    } 
    next();
};

const checkUsername = function(req, res, next){
    if (!validator.isAlphanumeric(req.body.username)) {
        return res.status(401).send("bad input"); 
    }
    next();
}
const sanitizeContent = function(req,res,next){
    req.body.content = validator.escape(req.body.content);
    next();
}
const sanitizetitle = function(req,res,next){
    req.body.title = validator.escape(req.body.title);
    next();
}


//login
app.post("/api/signup/", checkUsername, function(req,res,next){
    const username = req.body.username;
    const password = req.body.password;
    
    users.findOne({_id:username}, function(err,user){
        if (err) return res.status(500).send(err);
        if (user){
            return res.status(409).send("username" + username + "exists");
        }

        genSalt(10, function(err, salt){
            hash(password, salt, function(err,hash){
                users.update(
                    {_id: username},
                    {_id: username, password: hash},
                    {upsert:true},
                    function(err){
                        //so i can return this to the user maybe not sure yet add flags btw 
                        res.setHeader(
                            "Set-Cookie",
                            serialize("username", username, {
                                path:"/'",
                                maxAge: 60 * 60 * 24,
                                httpOnly:false,
                                secure:true,
                                sameSite: 'strict'
                            }),
                        );

                        req.session.username = username;

                        if (err) return res.status(500).send(err);
                        return res.json(username);
                    },
                );
            });
        });
    });
});

app.post("/api/login/", checkUsername, function(req,res,next){
    const username = req.body.username;
    const password = req.body.password;

    users.findOne({_id: username}, function(err, user){
        if (err) return res.status(500).send(err);
        if (!user) return res.status(401).send("access denied");
        compare(password, user.password, function(err, result){
            if (!result) return res.status(401).send("access defined");


            req.session.username = username;
            console.log(req.session.username);
            //might not need this part lowkey 
            res.setHeader(
                "Set-Cookie",
                serialize("username", username,{
                    path:"/",
                    maxAge: 60 * 60 * 24,
                    httpOnly:false,
                    secure:true,
                    sameSite: 'strict'
                }),
            );
            return res.json(username);
        });
    });
});



app.get("/api/logout/", function(req,res,next){
    req.session.username = null;
    req.session.destroy();
    //again might not need to his part lowkey
    res.setHeader(
        "Set-cookie",
        serialize("username", "", {
            path:"/",
            maxAge: 0,
            httpOnly:false,
            secure:true,
            sameSite:'strict',
        }),
    );
    return res.redirect("/");
});


app.get(`/users/:index`, isAuthenticated, function(req,res,next){
    users.find({}).sort({createdAt:-1}).skip(parseInt(req.params.index)).limit(10).exec(function(err,data){
        if (err) return res.status(500).send("cannot get feed");
        data = data.reverse();
        return res.json(data);
    });
});

app.get(`/users/total/`, isAuthenticated, function(req,res,next){
    users.count({}, function(err, count){
        if (err) return res.status(500).send("sorry failed");
        return res.json(count);
    });
});


//okay nowe we need to define like pushing new image 
app.post("/api/images/",isAuthenticated, upload.single('picture'),sanitizetitle, function(req,res,next){
    //DETERMINE LATER IF YOU NEED SANITY CHECK TO SEE IF IMAGE HAS ALREADY BEEN ADDED???
    //add while loop to check if id exist 

    //im assuming the data date, author will obvious be sent 
    console.log(req.file);
    const imagestuff = {
        profile:req.file,
        title:req.body.title,
        author:req.session.username,
    }
    images.insert(imagestuff, function(err, returnstuff){
        console.log(returnstuff);
        if (err) return res.status(500).send("error adding image into database");
        return res.redirect('/');
    });
});

app.post("/api/images/:id/comments/add",isAuthenticated, sanitizeContent, function (req, res, next) {
    const imageid = req.params.id;
    images.findOne({_id:imageid}, function(err,image){
        if(err) return res.status(500).send("error adding comment");
        const comment = {
            imageId:imageid,
            imageowner: image.author,
            author:req.session.username,
            content:req.body.content,
            date: Date.now()
        }
        comments.insert(comment, function (err, comment) {
            if (err || !comment) {
                return res.status(500).send("Error adding comment into database");
            }
            return res.json(comment);
    
        });
    });
});





//retriving comments and IMAGES
//retiriving comment only 10 
app.get("/api/images/:id/comments", isAuthenticated, function(req,res,next){
    const imageid = req.params.id;
    comments.count({imageid : imageid}, function(err,num){
        if (err) return res.status(500).send("error counting comments");
        return res.json(num);
    });
});

app.get("/api/images/:id/comments/:commentId/", isAuthenticated, function(req,res,next){
    const imageid = req.params.id;
    console.log(req.params.commentId);
    comments.find({imageId : imageid}).sort({createdAt:-1}).skip(parseInt(req.params.commentId)).limit(10).exec(function(err,data){
        if(err || !data) return res.status(500).send("error retriving comments");
        data = data.reverse();
        return res.json(data);
    })
});

//implement images one its a lot harder.. i think 
//for now Im going to implement this by just returning the first image in the database
//since I am thinkin gthat multiple user could be using this rn so other can delete other post thus
//for now just do it that way 

//need to add a thing that check username 
app.get("/images/:username/count/", isAuthenticated,  function(req,res,next){
    const username = req.params.username;
    images.count({author:username}, function(err,count){
        //console.log(count);
        if (err) return res.status(500).send("error counting");
        console.log(count);
        return res.json(count);
    });
});

//add thing to check username
app.get("/images/:username/:index", isAuthenticated,  function(req,res,next){
    const username = req.params.username;
    console.log(req.params.index);
    console.log(username);
    images.find({author:username}).sort({createdAt:-1}).skip(parseInt(req.params.index)).limit(1).exec(function(err,image){
        if (err) return res.status(500).send("cannot retrive image in database");
        console.log(image);
        return res.json(image);
    });
});

app.get("/api/images/:index/:id/",isAuthenticated, function(req,res,next){
    //wait we could add a sanity check first 
    console.log(req.params.id);
    console.log("hello" + req.params.index);
    const imageid = req.params.id;
    images.findOne({_id:imageid}, function(err,image){
        console.log(image);
        if (err) return res.status(500).send("cannot retrive image in database");
            res.setHeader('Content-Type', image.profile.mimetype);
            return res.sendFile(image.profile.path, {root:"./"});
        });
   
});

//delete comment and image      wodinqwodinwaodinwd //MAYBE INSTEAD OF .json return a message instead?
//delete comment 

//deleting images
app.delete("/api/images/:imageid/", isAuthenticated, function(req,res,next){
    const imageid = req.params.imageid;
    images.findOne({_id: imageid}, function(err,image){
        if (image.author === req.session.username){
            if (deleteAllComments(imageid) === -1){
                console.log("nono happened in the delete all comments");
            }
            images.remove({_id:imageid}, {multi:false}, function(err,numrem){
                if (err) return res.status(500).send("error deleting image");
                return res.json(numrem);
            });
        }
        else{
            return res.json(0);
        }
    });
});
app.delete("/api/delete/images/comments/:commentid/:imageid/", isAuthenticated, function(req,res,next){
    const commentid = req.params.commentid;
    const imageid = req.params.imageid;

    images.findOne({_id: imageid}, function(err, image){
        if (err) return res.status(500).send("error finding image");

        if (!image) {
            return res.status(404).send("Image not found");
        }

        if (req.session.username === image.author) {
            comments.remove({_id: commentid}, {multi: false}, function(err, numrem) {
                if (err) return res.status(500).send("error deleting comment");
                return res.json({ message: "Comment deleted", count: numrem });
            });
        } 
        else {
            comments.findOne({_id: commentid}, function(err, comment) {
                if (err) return res.status(500).send("error finding comment");

                if (!comment) {
                    return res.status(404).send("Comment not found");
                }

                if (comment.author === req.session.username) {
                    comments.remove({_id: commentid}, {multi: false}, function(err, numrem) {
                        if (err) return res.status(500).send("error deleting comment");
                        return res.json({ message: "Comment deleted", count: numrem });
                    });
                } 
            });
        }
    });
});


function deleteAllComments(imageid){
    comments.remove({imageId: imageid}, {multi:true}, function(err,number){
        console.log(number);
        if (err) return -1;
        return number;
    });
};


//THis is for testing only 
export function createTestDb() {
    images = new DataStore({
      filename: "db/test-images.db", 
      autoload: true,
      timestampData: true
    });
  
    comments = new DataStore({
      filename: "db/test-comments.db", // New test database for comments
      autoload: true,
      timestampData: true
    });
  
    users = new DataStore({
      filename: "db/test-users.db", // New test database for users
      autoload: true,
      timestampData: true
    });
  }

  export function deleteTestDb() {
    rmSync("db/test-images.db", { force: true });
    rmSync("db/test-comments.db", { force: true });
    rmSync("db/test-users.db", { force: true });
  }

export function getComments(callback){
    return comments.find({}).sort({createdAt:-1}).exec(function(err,comments){
        if (err) return callback(err, null);
        return callback(err, comments.reverse());
    });
}

export function getImages(callback){
    return images.find({}).sort({createdAt:-1}).exec(function(err,images){
        if (err) return callback(err, null);
        return callback(err, images.reverse());
    });
}

export function getUsers(callback) {
    return users.find({}).sort({ createdAt: -1 }).exec(function(err, users) {
      if (err) return callback(err, null);
      return callback(err, users.reverse());
    });
  }
  
  
  
const privateKey = readFileSync( 'server.key' );
const certificate = readFileSync( 'server.crt' );
const config = {
        key: privateKey,
        cert: certificate
};

const port = process.env.PORT || 3000;

createServer(config, app).listen(port, function(err) {
    if (err) console.log(err);
    else console.log(`Server running securely on https://localhost:${port}`);
});