var express = require('express');
var router = express.Router();
var app = express();
var url= require('url');
var request = require('request');
var http = require("http");
var laststatus= "";
var lastmsg= "";


let jsonappdef= new String(process.env.APPDEF);
jsonappdef= jsonappdef.replace(/\'/g, '\"');

let appdef= JSON.parse(jsonappdef);
let fields= new Array(); 
let types= new Array();

for(var i= 0; i< appdef.fields.length; i++) {
  fields[i] = appdef.fields[i].name;
  types[i] = appdef.fields[i].type;
}
console.log(JSON.stringify(fields));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: "Validator", status: laststatus, msg: lastmsg });
});

function isInt(value) {
  let t1= !isNaN(value) && 
         parseInt(Number(value)) == value && 
         !isNaN(parseInt(value, 10));
  if(!t1)
    return false;
  if(value> 2147483647 || value< -2147483648)
    return false;
  return true;
};

function isLong(value) {
  return !isNaN(value) && 
         parseInt(Number(value)) == value && 
         !isNaN(parseInt(value, 10));
};

function isFloat(value) {
  return !isNaN(value) && 
         parseFloat (Number(value)) == value && 
         !isNaN(parseFloat(value));
};

function validate(val, t) {
  if(t === "String") 
    return true;
  if(t === "Integer") 
    return isInt(val);
  if(t === "Long") {
    return isLong(val);
  }
  if(t === "Double") 
    return isFloat(val);
  if(t === "Boolean") {
    if(val === "true" || val==="1" || val=== "false" || val==="0" || typeof val== "boolean")
      return true;
    return false;
  }
  if(t === "Date/Time" || t === "Date/time") {
    let d= null;
    try {
      d= Date.parse(val);
    }
    catch(ex) {
      return false;
    }
    if(d!= null)
      return true;
    return false;
  }
  if(t === "Location") {
    let sp= val.split(",");
    if(isFloat(sp[0]) && isFloat(sp[1]))
      return true;
    return false;
  }
}

function sendError(res, w) {
  if(w== 0) {
    console.log("Can't convert to json.");
  }
  if(w== 1) {
    console.log("Number of fields does not match.");
  }
  if(w== 2) {
    console.log("Field not found.");
  }
  if(w== 3) {
    console.log("Content does not match type.");
  }
  
   res.statusCode= 400;
   res.end();
};

router.post('/validate', function(req, res, next) {
 let msg= req.body;
 console.log("Validating: "+msg);
 
 let jsonmsg= null;
 try {
   jsonmsg= JSON.parse(msg);
 }
 catch(ex) {
   console.log(ex);
   sendError(res, 0);
   return;
 }
 if(Object.keys(jsonmsg).length!= fields.length) {
   sendError(res, 1);
   return;
 }

 let pass= true;
 let n= fields.length;
 for (var property in jsonmsg) {
 
   for(var i= 0; i< fields.length; i++) {
   
    if(fields[i]=== property) {
        n= i;
        break;
    }
   }
  
   if(n== fields.length) {
     sendError(res, 2);
     return;
   }
   if(! validate(jsonmsg[property], types[n])) {
      sendError(res, 3);
      return;
   }
}
  
 res.statusCode= 200;
 res.end();

 console.log("Validator passed.");
});

module.exports = router;

