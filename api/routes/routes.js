const express = require('express');
const routes = express.Router();
const User = require('../model/user');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { findUser, saveUser } = require('../db/db');
const jwt = require('jsonwebtoken');
const checkAuth = require('../auth/checkAuth');
require('dotenv').config();

routes.post('/signup', (req, res) => {
findUser(req.body.email)
    .then(result => {
        if(result.length > 0){
        return res.status(409).json({
            message:"An account belonging to "+req.body.email+" already exists. Try logging in."
        })
    }
    else {
        const password = bcrypt.hash(req.body.password, 10, (err, hash) => {
            if(err){
                res.status(500).json({
                    message:err.message,
                })
            }
            else{
                const newUser = new User({
                    _id:mongoose.Types.ObjectId(),
                    firstName:req.body.firstName,
                    lastName:req.body.lastName,
                    address:req.body.address,
                    city:req.body.city,
                    state:req.body.state,
                    zip:req.body.zip,
                    email:req.body.email,
                    password:hash
                });
                saveUser(newUser)
                .then(result => {
                    res.status(200).json({
                        message: 'User created',
                        user: {
                            _id:result._id,
                            firstName:result.firstName,
                            lastName:result.lastName,
                            address:result.address,
                            city:result.city,
                            state:result.state,
                            zip:result.zip,
                            email:result.email,
                            password:req.body.password
                        }
                    });
                    console.log(result);
                })
                .catch(err => {
                    if(err){
                        res.status(500).json({
                            message:err.message,
                        })
                    }
                });
            }
        })
        
    }
}) 

});

routes.post('/login', (req, res) => {

    findUser(req.body.email)
            .then(result => {
                const password = result[0].password;
                const firstName = result[0].firstName;
                const lastName = result[0].lastName;
                const address = result[0].address;
                const zip = result[0].zip;
                const city = result[0].city;
                const state = result[0].state;
                const email = result[0].email;
                if(result.length >! 0){
                    res.status(500).json({
                        message:'We could not find an account belonging to email: '+req.body.email,
                    });
                }
                else {
                    bcrypt.compare(req.body.password, password, (err, result)=>{
                        
                        if(err){
                            return res.status(501).json({
                                message:err.message
                            });
                        }
                        if(result){
                            
                            const token = jwt.sign({
                                firstName:firstName,
                                email:email,
                                password:password,
                            }, process.env.jwt)
                            res.status(200).json({
                                message: "Authorization Successful",
                                result: result,
                                firstName: firstName,
                                lastName: lastName,
                                address:address,
                                city:city,
                                state:state,
                                zip:zip,
                                email:email,
                                password:password,
                                token:token
                            });
                        }
                        else {
                            res.status(401).json({
                                message:"Authorization Failed",
                                result: result,
                            });
                        }
                    });
                }
            })
            .catch(err => {
                if(err){
                    res.status(500).json({
                        message:err.message,
                    })
                }
            })
});

routes.get('/profile', checkAuth, (req, res) => {
      res.status(200).json({
        message:req.userData,
      });

    }  
);

module.exports = routes;