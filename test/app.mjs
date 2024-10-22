import * as chaiModule from "chai";
import chaiHttp from "chai-http";
const chai = chaiModule.use(chaiHttp);
const expect = chai.expect;
import { server, createTestDb, deleteTestDb, getImages, getComments, getUsers } from "../app.mjs";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

describe("Testing Image, Comment, and User API", () => {
  const testUser = {
    username: "testuser",
    password: "testpassword"
  };

  const testImage = {
    title: "Test Image"
  };

  const testComment = {
    content: "Test comment content"
  };

  before(function () {
    createTestDb();
  });

  after(function () {
    deleteTestDb();
    server.close();
  });

  it("should sign up a new user", function (done) {
    chai.request.execute(server)
      .post("/api/signup/")
      .send({ username: testUser.username, password: testUser.password })
      .end(function (err, res) {
        expect(res).to.have.status(200);
        getUsers(function (err, users) {
          if (err) return done(err);
          expect(users).to.have.length(1);
          expect(users[0]).to.have.property("_id", testUser.username);
          done();
        });
      });
  });

  let munchmunch;
  /*
  this test below was copied from chatgpt since I have no idea of cookies :)
  https://chatgpt.com/share/6716e814-65d0-8006-9984-86b4d6652bc2
  */
  it("should log in the user", function (done) {
    chai.request.execute(server)
      .post("/api/login/")
      .send({ username: testUser.username, password: testUser.password })
      .end(function (err, res) {
        expect(res).to.have.status(200);
        const setCookieHeader = res.headers['set-cookie'];
        munchmunch = setCookieHeader.join('; ');
        done();
      });
  });

  let imageId;
  it("upload a new image", function (done) {
    chai.request.execute(server)
      .post("/api/images/")
      .set('Cookie', munchmunch)
      .field("title", testImage.title)
      .attach("picture", "test/uploads/food.png")
      .end(function (err, res) {
        expect(res).to.have.status(200);
        getImages(function (err, images) {
          if (err) return done(err);
          expect(images).to.have.length(1);
          expect(images[0]).to.have.property("title", testImage.title);
          imageId = images[0]._id;
          done();
        });
      });
  });

  let commentId;
  it("should add a comment to the uploaded image", function (done) {
    chai.request.execute(server)
      .post(`/api/images/${imageId}/comments/add`)
      .set('Cookie', munchmunch)
      .send({ content: testComment.content })
      .end(function (err, res) {
        expect(res).to.have.status(200);
        getComments(function (err, comments) {
          if (err) return done(err);
          expect(comments).to.have.length(1);
          expect(comments[0]).to.have.property("content", testComment.content);
          commentId = comments[0]._id;
          done();
        });
      });
  });

  it("delete a comment", function (done) {
    chai.request.execute(server)
      .delete(`/api/delete/images/comments/${commentId}/${imageId}/`)
      .set('Cookie', munchmunch)
      .end(function (err, res) {
        expect(res).to.have.status(200);
        getComments(function (err, comments) {
          expect(comments).to.have.length(0);
          done();
        });
      });
  });

  it("delete uploaded image", function (done) {
    chai.request.execute(server)
      .delete(`/api/images/${imageId}/`)
      .set('Cookie', munchmunch)
      .end(function (err, res) {
        expect(res).to.have.status(200);
        getImages(function (err, images) {
          expect(images).to.have.length(0);
          done();
        });
      });
  });

  it("should logout", function(done){
    chai.request.execute(server).get(`/api/logout/`)
    .set('Cookie', munchmunch).end(function(err, res){
      expect(res).to.have.status(200);
      getUsers(function (err, users) {
        if (err) return done(err);
        done();
      });
    });
  });

  it("should try adding images now after loggin out", function(done){
    chai.request.execute(server)
      .post("/api/images/")
      .set('Cookie', munchmunch)
      .field("title", testImage.title)
      .attach("picture", "test/uploads/food.png")
      .end(function (err, res) {
        expect(res).to.have.status(401);
        done();
      });
  });

  it ("should try adding comment after logging out", function(done){
    chai.request.execute(server)
      .delete(`/api/delete/images/comments/${commentId}/${imageId}/`)
      .set('Cookie', munchmunch)
      .end(function (err, res) {
        expect(res).to.have.status(401);
        done();
      });
  });
});
