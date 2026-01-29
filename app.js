require('dotenv').config();
const express = require('express');
const { Pool }= require('pg');

const app = express();
const port = process.env.PORT || 3000 ;
const bcrypt = require('bcrypt');
app.set('view engine', 'ejs');
//postgresql connnect
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database:process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
}) 

//middleware replacing the old manuel url prasing code in node
app.use(express.urlencoded({ extended:true }));
app.use(express.json());

const session = require('express-session');
app.use(session({
    secret: 'sahas_secret_key',
    resave:false,
    saveunInitialized:false,
    cookie:{maxAge:600000}  
}))

app.get('/register',(req,res)=>{
    res.render('register');
});

app.use('/checkpass',(req,res)=>{
    const {password,repassword} = req.body;
    if(password === repassword){
        res.json({match:true,message:"passward match"});
    }else{
        res.json({match:false,message:"password mistmatch"})
    }
})

app.use('/check-user', async (req,res)=>{
    const {username} =req.body;
    const userdata= await pool.query('SELECT * from users where username=$1',[username]);
    
    if(userdata.rows.length>0){
        res.json({check:false, message:"user name already exist"});
    }else{
        res.json({check:true,message:""})
    }

})

app.post('/register', async (req,res)=>{
    const{username,password,repassword} = req.body;

    if(password !== repassword){
        return res.send('password incorrect.<a href="/register">try again</a>')
    }

    try{
        const userCheck = await pool.query('SELECT * FROM users where username= $1',[username]);
        if(userCheck.rows.length>0){
            return res.send('user already taken. <a href="/register">try again</a>')
        }

        const saltRounds= 10;
        const hashedPassword= await bcrypt.hash(password,saltRounds);


        const newUser = await pool.query(
            'INSERT INTO users (username,password_hash) VALUES ($1,$2) RETURNING id,username',[username,hashedPassword]
        );

        req.session.user = newUser.rows[0].id;
        req.session.username = newUser.rows[0].username;
        res.redirect('/');

    }catch(err){
        console.error(err);
        res.status(500).send("error creating account");
    }
});
app.get('/login', (req, res) => {
    res.render('login'); // We will create login.ejs in a second
});

app.post('/login', async (req,res)=>{
    const {username,password}=req.body;
    try{
    const success= await pool.query('SELECT * FROM users where username=$1 ',[username]);
    
    if(success.rows.length > 0){
        const userdata = success.rows[0];

        const match =await bcrypt.compare(password,userdata.password_hash);
        if(match){
        req.session.user= userdata.id;
        req.session.username= userdata.username;
        // res.redirect('/');
        return res.json({success:true,message:"sucess"});
        }else {
                // ISSUE WAS HERE: You forgot to respond if the password didn't match!
                return res.status(401).json({ success: false, message: "Invalid password" });
            }
    }else{
        // res.send('Invalid username or password. <a href="/login">Try again</a>')
        return res.status(401).json({success:false,message:"invalid credentials"})
    }
    }
    catch(err){
         return res.status(500).json({success:false, message:"server error"});
    }
})

app.get('/logout',(req,res)=>{
    req.session.destroy();
    res.redirect('/login');
})

function isAuthenticated(req,res,next){
    if(req.session.user){
        return next();
    }
    res.redirect('/login');

}


app.get('/', isAuthenticated, async (req,res)=>{
    try{
        const currentUserId = req.session.user;
        const result = await pool.query('SELECT tasks.*, categories.name AS category_name FROM tasks LEFT JOIN categories ON tasks.category_id = categories.id WHERE tasks.user_id = $1 ORDER by tasks.id ASC',[currentUserId]);
        const catRes = await pool.query('SELECT * FROM categories');
        
        // res.json(result.rows); 
        res.render('index',{
            tasks:result.rows,
            categories:catRes.rows,
            user:req.session.username
        });
    }catch(err){
        res.status(500).send(err.message);
    }

});

app.get('/search', isAuthenticated, async (req,res)=>{
    try{
        const {q} =req.query;
        const userId= req.session.user;

        const result = await pool.query(
            `SELECT tasks.*, categories.name as category_name from tasks
            LEFT JOIN categories ON tasks.category_id = categories.id
            WHERE tasks.user_id = $1 AND tasks.content ILIKE $2 ORDER BY
            tasks.id ASC`,[userId, `%${q}%`]
        );

        res.json(result.rows);
    }catch(err){
        res.status(500).json({error:err.message});
    }
})
//addtask

app.post('/add',async (req,res)=>{
    try{
    // const {note} =req.query;
    const {note}= req.body;
    const {categoryId}=req.body;
    const currentuser= req.session.user;
    if(note){
    await pool.query('INSERT INTO tasks (content,category_id,user_id) VALUES ($1,$2,$3)',[note,categoryId,currentuser]);
    }
    res.redirect('/');
    }catch(err){
        res.status(500).send(err.message);
    }
})

app.post('/del/:id',async(req,res)=>{
    try{
    const {id} = req.params;
    await pool.query('DELETE FROM tasks WHERE id= $1', [id]);
    res.redirect('/');
        }catch(err){
            console.error(err);
            res.status(500).send("server Error");
        }
})

app.post('/update/:id', async(req,res)=>{
    const{id} =req.params;
    const {editcontent} = req.body;
    const {categoryeId}=req.body;
    const currentuser = req.session.user;
    try{
        await pool.query('UPDATE tasks set content= $1, category_id=$3 WHERE id=$2',[editcontent,id,categoryeId]);
        res.redirect('/');
    }catch(err){
        res.status(500).send(err.message);
    }
})

app.listen(port,()=>{
    console.log(`Express is running at http://localhost:${port}`);
})
