require('dotenv').config();
const express = require('express');
const { Pool }= require('pg');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;
const bcrypt = require('bcrypt');
app.set('view engine', 'ejs');
//postgresql connnect
const isProduction = process.env.NODE_ENV === 'production';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false
});
module.exports = pool;
//middleware replacing the old manuel url prasing code in node
app.use(express.urlencoded({ extended:true }));
app.use(express.json());

const session = require('express-session');
app.use(session({
    secret: 'sahas_secret_key',
    resave:false,
    saveUninitialized: false,
    proxy: true, // Required for Render
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
       // Only require secure/HTTPS if we are in production
        secure: process.env.NODE_ENV === 'production', 
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    } 
}))

app.get('/register',(req,res)=>{
    res.render('register');
});
app.use(cors({
  origin: [
    'http://localhost:5173',          // Local React
    'https://express-test.pages.dev'  // Production React
  ], // Ensure NO trailing slash
  credentials: true
}));
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
    if (req.path.startsWith('/api') || req.xhr) {
        return res.status(401).json({ error: "Not authenticated" });
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


//react ports

app.get('/api/auth/me',async(req,res)=>{
    try{    
        // const currentuser= req.session.user;
        if(req.session.user){
            res.json({
                user:{
                    id: req.session.user,
                    username: req.session.username
                }
            });
        }else{
            res.json({ user: null });
        }

    }catch(err){
        res.status(500).json({ error: err.message });
    }

})

app.post('/api/auth/resgister',async (req,res)=>{
    const {username, password, repassword, validateOnly} = req.body
    const passgateway= false;
    try{

       if(username){
        const userdata = await pool.query(`
            SELECT * FROM users WHERE username=$1`,[username]);
            
        if(userdata.rows.length>0){
            return res.status(409).json({type:"username",error:"username Already exist"});
        }
        }
        if(password||repassword){
        if(password != repassword){
            return res.status(400).json({type:"password",error:"passwords do not Match"});
        }
        if(password.length<3){
            return res.status(400).json({type:"password",error:"passwords should be longer than 3 letter"});
        }
        }

        
        if(validateOnly){
            return res.status(200).json({ message: "Valid so far!" });
        }

        const saltRounds= 10;
        const hashedPassword= await bcrypt.hash(password,saltRounds);

        const registerdata= await pool.query(`
        INSERT INTO users (username,password_hash) VALUES($1,$2) RETURNING *`,[username,hashedPassword]);
        if(registerdata.rows.length>0){
            req.session.user= registerdata.rows[0].id;
            req.session.username= registerdata.rows[0].username;
            res.json({
                user:{
                    id:registerdata.rows[0].id,
                    username:registerdata.rows[0].username
                },
                message:`user ${registerdata.rows[0].username} has been resgistered`
            })
        }else{
            res.status(401).json({
            error:"Issue with register"
            })
        
                }

    }catch(err){
        res.status(500).json({error:err.message})
    }
})
app.post('/api/auth/login', async (req,res)=>{
    const {username,password}= req.body;
    try{
        const {username,password}= req.body;
        const userdata = await pool.query(`
            SELECT * FROM users where username=$1`,[username]);
        const user= userdata.rows[0];
            if(!user){
                return res.status(401).json({error:"user not found"})
            } 
            
        const isMatch= await bcrypt.compare(password,user.password_hash);

        if(isMatch){
            req.session.user= user.id;
            req.session.username = user.username;
            res.json({
                user:{id:user.id,username:user.username},
                message:"login Successful"
            });
        }else{
            res.status(401).json({
                error:"invalid password"
            })
        }

    }catch(err){
        res.status(500).json({error:err.message})
    }
})

app.post('/api/auth/logout',(req,res)=>{
    req.session.destroy((err)=>{
        if(err) return res.status(500).json({error:"couldnt logout"});
        res.clearCookie('connect.sid');
        res.json({message:"logged out"})
    })
})

app.get('/api/tasks', isAuthenticated, async (req, res) => {
    try {
        const currentUserId = req.session.user;
        const {search} = req.query;
       
        
        let query = `
            SELECT tasks.*, categories.name AS category_name FROM tasks
            LEFT JOIN categories ON tasks.category_id = categories.id
            WHERE tasks.user_id = $1
            `;
             let params= [currentUserId];
            if(search){
        query +=` AND (tasks.content ILIKE $2 OR categories.name ILIKE $2)`;
        params.push(`%${search}%`);
        }
        query += `ORDER BY tasks.position ASC,tasks.created_at DESC`;
        const result = await pool.query(query,params);
        res.json(result.rows); 
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// to add task
app.post('/api/tasks', async(req,res)=>{
    try{
        const {note,categoryId}= req.body;
        const currentuser = req.session.user;
        const result = await pool.query(`
            WITH inserted_task AS(   
        INSERT INTO tasks (content,category_id,user_id) VALUES ($1,$2,$3) RETURNING *)
        SElECT it.* ,c.name as category_name from inserted_task it LEFT JOIN
        categories c ON it.category_id= c.id ORDER BY created_at DESC
        `,[note,categoryId,currentuser]);
        res.status(201).json({data:result.rows[0],message:`Task has been added${note}`});
    }catch(err){
        res.status(500).json({error:err.message});

    }
})
app.post('/api/tasks/reorder', isAuthenticated, async (req, res) => {
    const { orderedIds } = req.body; // Array of IDs like [5, 2, 8, 1...]
    const userId = req.session.user;

    try {
        // This is a "Bulk Update". We loop through the IDs and update their position
        // based on their index in the array we received.
        const promises = orderedIds.map((id, index) => {
            return pool.query(
                'UPDATE tasks SET position = $1 WHERE id = $2 AND user_id = $3',
                [index, id, userId]
            );
        });

        await Promise.all(promises);
        res.json({ message: "Positions synced with the stars" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.put('/api/tasks/:id', async(req,res)=>{
    try{
        const {id}= req.params;
        const currentuser=req.session.user;
        const {content,categoryId} =req.body;

        const result =await pool.query(`
            UPDATE tasks SET content= $1,category_id=$2 WHERE id=$3 AND user_id =$4 
            RETURNING *
            `,[content,categoryId,id,currentuser]);
        const enrichedTasks = await pool.query(`
            SELECT t.*, c.name as category_name FROM tasks t LEFT JOIN
            categories c ON t.category_id = c.id WHERE t.id =$1`,[id]);
        
        if(enrichedTasks.rowCount===0){
            return res.status(404).json({error:`Task ${id} not found`});
        }
        res.json({data: enrichedTasks.rows[0],message:`${content} updated in task ${id}`})
    }
    catch(err){
        res.status(500).json({error:err.message});
    }
})
app.patch('/api/tasks/:id/toggle',isAuthenticated,async (req,res)=>{
    try{
        const {id} = req.params;
        const currentuser = req.session.user;

        const taskRes= await pool.query(`
            SELECT is_completed FROM tasks where id=$1 AND user_id=$2`,
        [id,currentuser]);

        if(taskRes.rowCount===0) return res.status(404).json({error:`task ${id} not found`});

        const newStatus = !taskRes.rows[0].is_completed;

        const result = await pool.query(`
            UPDATE tasks SET is_completed=$1, updated_at=now()
            WHERE id=$2 AND user_id=$3 RETURNING *`,
        [newStatus,id,currentuser])

        const enriched = await pool.query(`
            SELECT t.*, c.name as category_name FROM
            tasks t LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.id = $1`,[id]);
        
            res.json({data:enriched.rows[0],message:"Status Updated"})


    }catch(err){
        res.status(500).json({error:err.message})
    }
})

app.delete('/api/tasks/:id', async(req,res)=>{
    try{
        const {id} =req.params;
        const currentuser = req.session.user;
        const result =await pool.query('DELETE FROM tasks where id=$1 and user_id=$2',[id,currentuser])
        if(result.rowCount===0){
            return res.status(404).json({error: `Task${id} not found`})
        }
        res.json({message:`Task ${id} has been removed`});
    }catch(err){
        res.status(500).json({error:err.message});
    }
})

app.get('/api/categories', async(req,res)=>{
    try{
    const currentuser = req.session.user;
    const catRes = await pool.query(`SELECT * FROM categories
        where user_id=$1 OR user_id is NULL`,[currentuser]);
    res.json(catRes.rows);
    }catch(err){
    res.status(500).json({error:err.message});
    }
})

app.post('/api/categories',async(req,res)=>{
    try{
    const currentuser=req.session.user;
    const { name }=req.body;
    const result = await pool.query(`
        INSERT INTO categories (name,user_id) VALUES ($1,$2) RETURNING * `,
    [name,currentuser]);
    res.status(201).json({
        data:result.rows[0],
        message:`added new category ${name}`});

    }catch(err){
        res.status(500).json({error:err.message});
    }
})

app.delete('/api/categories/:id', async(req,res)=>{
    const currentuser = req.session.user;
    const {id} = req.params;

    try{
    const check = await pool.query('SELECT user_id from categories WHERE id=$1',[id]);
    if(check.rows.length ===0)return res.status(404).json({error:"categories not found"})
    if(check.rows[0].user_id===null){
        return res.status(403).json({error:"main category cannot be removed"});
    }
    if(check.rows[0].user_id!=currentuser){
        return res.status(403).json({error:"the category doesnt belong to the user"});
    }
    
    await pool.query(`UPDATE tasks SET category_id = NULL WHERE category_id=$1`,[id])
    await pool.query('DELETE FROM categories WHERE id=$1',[id])
    
    res.json({message:`category ${check.rows[0].name} has been deleted`})
        
        

    }catch(err){
        res.status(500).json({error:err.message})

    }
})

app.listen(PORT, () => {
    console.log(`Server soaring on port ${PORT}`);
});