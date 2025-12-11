import express from 'express';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('./'));

const USERS_FILE = './data/users.json';
const JWT_SECRET = process.env.JWT_SECRET || 'DEV_SECRET_123';

function loadUsers(){
 return JSON.parse(fs.readFileSync(USERS_FILE));
}
function saveUsers(u){
 fs.writeFileSync(USERS_FILE, JSON.stringify(u,null,2));
}

app.post('/register',(req,res)=>{
 let {username,password}=req.body;
 let users=loadUsers();
 if(users[username]) return res.json({success:false,message:'User exists'});
 users[username]={password};
 saveUsers(users);
 let token=jwt.sign({username},JWT_SECRET,{expiresIn:'7d'});
 res.json({success:true,token});
});

app.post('/login',(req,res)=>{
 let {username,password}=req.body;
 let users=loadUsers();
 if(!users[username] || users[username].password!==password)
   return res.json({success:false,message:'Invalid login'});
 let token=jwt.sign({username},JWT_SECRET,{expiresIn:'7d'});
 res.json({success:true,token});
});

app.post('/generate-image',(req,res)=>{
 let {prompt}=req.body;
 res.json({image:`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(prompt)}`});
});

const PORT=process.env.PORT || 10000;
app.listen(PORT,()=>console.log('Server running on '+PORT));
