require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
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
app.use(cookieParser());

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


app.use(cors({
  origin: [
    'http://localhost:5173',          // Local React
    'https://express-test.pages.dev'  // Production React
  ], // Ensure NO trailing slash
  credentials: true
}));




function isAuthenticated(req,res,next){
    const token = req.cookies.token;
    if(!token){
        return res.status(401).json({error:"Access Denied: NO token found"})
    }
    try{
        const verified = jwt.verify(token,process.env.JWT_SECRET);
        req.user =verified;
        next();

    }catch(err){
        res.status(401).json({error:"invalid token"})
    }
    // res.redirect('/login');

}
function isAdmin(req,res,next){
    console.log("Checking Admin for User:", req.user);
    if(req.user && req.user.role === 'admin'){
        next();
    }else{
        res.status(403).json({error:"forbiden user logged in"});
    }
}


//react ports

app.get('/api/auth/me',async(req,res)=>{
    const token=  req.cookies.token;
    if(!token) return res.json({user:null});
    try{    
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        res.json({
            user:{
                id:decoded.id,
                username: decoded.username,
                role:decoded.role
            }
        });

    }catch(err){
        res.clearCookie('token');
        res.status(500).json({ error: err.message });
    }

})

const dns = require('dns').promises;
app.post('/api/auth/resgister',async (req,res)=>{
    const {email,username, password, repassword,otp, validateOnly} = req.body
    const passgateway= false;
    let otpVerified = false; 
    try{
          if (email) {
                const domain = email.split('@')[1];
                // Use !domain instead of empty(domain)
                if (!domain) return res.status(400).json({ type: "email", error: "Enter a valid email" });

                try {
                    const mxRecords = await dns.resolveMx(domain);
                    if (!mxRecords || mxRecords.length === 0) {
                        return res.status(400).json({ type: "email", error: "Domain does not exist" });
                    }
                    
                    // Wrap email in an array [email]
                    const emaildata = await pool.query('SELECT email FROM users WHERE email=$1', [email]); 
                    if (emaildata.rowCount !== 0) {
                        return res.status(409).json({ type: "email", error: "Email already registered" });
                    }
                    // if (emaildata.rowCount===0){
                    //     return res.json({type:"email",valid:true});
                    // }
                } catch (dnsErr) {
                    return res.status(400).json({ type: "email", error: "Invalid email domain" });
                }
            }
             
        if(otp){
               const result = await pool.query(
                `SELECT * FROM otp_storage WHERE email = $1 AND code = $2`, 
                [email, otp]
                );
        if (result.rowCount === 0) {
            return res.status(400).json({ type: "otp", error: "Incorrect or expired code" });
        }

        // 2. Check if expired
        const now = new Date();
        if (new Date(result.rows[0].expires_at) < now) {
            return res.status(400).json({ type: "otp", error: "Code has expired. Send a new one." });
        }
            otpVerified = true;
        }
            
        
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
            return res.status(200).json({ 
                otppass:otpVerified
                ,message: "Valid so far!" });
        }

        const saltRounds= 10;
        const hashedPassword= await bcrypt.hash(password,saltRounds);

        const registerdata= await pool.query(`
        INSERT INTO users (email,username,password_hash) VALUES($1,$2,$3) RETURNING *`,[email,username,hashedPassword]);
        if(registerdata.rows.length>0){
            newuser= registerdata.rows[0];
            const token =jwt.sign(
                {id:newuser.id,email:newuser.email,username:newuser.username,role:'user'},
                process.env.JWT_SECRET,
                {expiresIn:'24h'}
            )
            res.cookie('token',token,{
                httpOnly:true,
                secure:true,
                sameSite:'none',
                maxAge:24*60*60*1000
            })
            res.json({
                user:{id:newuser.id,email:newuser.email,username:newuser.username,role:newuser.role},
                message:"User has been Registered"})
        }else{
            res.status(401).json({                                  
            error:"Issue with register"
            })
        
                }

    }catch(err){
        res.status(500).json({error:err.message})
    }
})

// const{Resend} = require('resend');
// const resend = new Resend(process.env.RESEND_API_KEY);
const nodemailer = require('nodemailer');
app.post('/api/auth/send-otp', async (req,res)=>{
    const {email}= req.body;

    if(!email) return res.status(400).json({error:"Email field shouldnt be empty"})
    const otp = Math.floor(100000 +Math.random()*900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60000);

    try{
        await pool.query(`
            INSERT INTO otp_storage (email,code,expires_at)
            VALUES ($1,$2,$3) ON CONFLICT (email)
            DO UPDATE SET 
                code = EXCLUDED.code,
                expires_at =EXCLUDED.expires_at,
                created_at =NOW()`,
            [email,otp,expiresAt]);
        // const { data, error } = await resend.emails.send({
        //     from: 'Verification <onboarding@resend.dev>', // Use this for testing
        //     to: [email],
        //     subject: 'Your Access Code',
        //     html: `
        //         <div style="font-family: sans-serif; background: #000; color: #fff; padding: 20px; border-radius: 10px;">
        //             <h2 style="color: #ffaa00;">Verification Code</h2>
        //             <p>Your code is below. It will expire in 5 minutes.</p>
        //             <h1 style="letter-spacing: 5px; font-size: 40px; color: #ffaa00;">${otp}</h1>
        //         </div>
        //     `,
        // });
            const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your gmail
        pass: process.env.EMAIL_PASS  // The 16-character App Password
    }
});
const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Verification Code',
    html: `<h1>${otp}</h1>` // Same HTML as before
};

await transporter.sendMail(mailOptions);
        // if(error){
        //     console.error("Resend Error",error);
        //     return res.status(400).json({error:"Failed to send email"})
        // }

        res.json({valid:true,message:"Otp code has been forwarded"})
    }catch(err){
        res.status(500),json({error:"Internal Server Error"})
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
            const token = jwt.sign(
                {id:user.id, username:user.username,role:user.role},
                process.env.JWT_SECRET,
                {expiresIn:'24h'}
            );
            res.cookie('token',token,{
                httpOnly:true,
                secure: true,
                sameSite:'none',
                maxAge:24*60*60*1000
            });
            res.json({
                user:{id:user.id,username:user.username,role:user.role},
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
    res.clearCookie('token');
    res.json({message:"logged out"})
   
})
app.get('/api/global', async (req, res) => {
    try {
        const { search } = req.query;

        // Note: Changed 'catgeory' to 'category' and 'postition' to 'position'
        let query = `
            SELECT tasks.*, 
                   categories.name as category_name, 
                   users.username as username 
            FROM tasks
            LEFT JOIN categories ON tasks.category_id = categories.id
            LEFT JOIN users ON tasks.user_id = users.id
            WHERE 1=1`; // This allows us to use AND safely below

        let params = [];
        if (search) {
            // Changed 'task.content' to 'tasks.content' (plural)
            query += ` AND (tasks.content ILIKE $1 OR categories.name ILIKE $1 OR users.username ILIKE $1)`;
            params.push(`%${search}%`);
        }

        query += ` ORDER BY tasks.position ASC, tasks.created_at DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err); // Always log the real error to your console!
        res.status(500).json({ message: err.message }); // Use err.message, not error
    }
});
app.get('/api/tasks', isAuthenticated, async (req, res) => {
    try {
        // const currentUserId = req.session.user;
        const currentUserId = req.user.id;
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
app.post('/api/tasks', isAuthenticated, async(req,res)=>{
    try{
        const {note,categoryId}= req.body;
        // const currentuser = req.session.user;
        const currentuser= req.user.id;
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

app.put('/api/tasks/:id',isAuthenticated, async(req,res)=>{
    try{
        const {id}= req.params;
        // const currentuser=req.session.user;
        const currentuser = req.user.id;
        const {content,categoryId,subtask} =req.body;

        let update=[];
        let params= [];
        let count = 1;

        if(content != undefined){
            update.push(`content = $${count++}`);
            params.push(content);
        }
        if(categoryId != undefined){
            update.push(`category_id = $${count++}`);
            params.push(categoryId);
        }
        if(subtask != undefined){
            update.push(`subtasks = $${count++} `);
            params.push(JSON.stringify(subtask));
        }

        if(update.length === 0) return res.status(400).json({error:"no data recived"})
        
        params.push(id,currentuser);

        const query= `UPDATE tasks SET ${update.join(', ')} WHERE 
        id= $${count++} AND user_id = $${count++} RETURNING *`;
        await pool.query(query,params);
    
        // const result =await pool.query(`
        //     UPDATE tasks SET content= $1,category_id=$2 WHERE id=$3 AND user_id =$4 
        //     RETURNING *
        //     `,[content,categoryId,id,currentuser]);
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
        // const currentuser = req.session.user;
        const currentuser=req.user.id;

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



app.delete('/api/tasks/:id', isAuthenticated,async(req,res)=>{
    try{
        const {id} =req.params;
        // const currentuser = req.session.user;
        const currentuser = req.user.id;
        const result =await pool.query('DELETE FROM tasks where id=$1 and user_id=$2',[id,currentuser])
        if(result.rowCount===0){
            return res.status(404).json({error: `Task${id} not found`})
        }
        res.json({message:`Task ${id} has been removed`});
    }catch(err){
        res.status(500).json({error:err.message});
    }
})
app.post('/api/tasks/reorder', isAuthenticated, async (req, res) => {
    const { orderedIds } = req.body; // Array of IDs like [5, 2, 8, 1...]
    // const userId = req.session.user;
    const userId = req.user.id;

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
app.get('/api/categories', isAuthenticated,async(req,res)=>{
    try{
    // const currentuser = req.session.user;
    const currentuser= req.user.id;
    const catRes = await pool.query(`SELECT * FROM categories
        where user_id=$1 OR user_id is NULL`,[currentuser]);
    res.json(catRes.rows);
    }catch(err){
    res.status(500).json({error:err.message});
    }
})

app.post('/api/categories', isAuthenticated,async(req,res)=>{
    try{
    // const currentuser=req.session.user;
    const currentuser= req.user.id;
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

app.delete('/api/categories/:id',isAuthenticated, async(req,res)=>{
    // const currentuser = req.session.user;
    const currentuser= req.user.id;
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


app.get('/api/admin/user',isAuthenticated,isAdmin,async(req,res)=>{
    try{
        currentuser= req.user.id
        const result = await pool.query('SELECT id,username,role,status from users WHERE id!=$1 ORDER BY id ASC',[currentuser]);
        res.json(result.rows);

    }catch(err){
        res.status(404).json({error:err.message})
    }
})
app.put('/api/admin/user/:id',isAuthenticated,isAdmin, async(req,res)=>{
try{
    const {id} = req.params;
    const {username,role}= req.body;

    const result = await pool.query(`UPDATE users SET username=$1 ,role=$2 
        WHERE id=$3 RETURNING id,username,role,status`,[username,role,id]);
    if(result.rowCount===0) return res.json({message:"issue when updating user"})
    res.json({data:result.rows[0],message:`User data of ${username} has been updated`})

}
catch(err){
    res.status(404).json({error:err.message});
}
})
app.delete('/api/admin/user/:id',isAuthenticated,isAdmin, async(req,res)=>{
    try{
        const {id}= req.params;
        const result = await pool.query(`
            DELETE from users where id=$1`,[id]);
        if(result.rowCount===0){
            return res.status(404).json({error:`user ${id} not found`});
        }
        res.json({message:`Task ${id} has been removed`})
    }catch(err){
        res.status(404).json({error:err.message});
    }
    
})
app.patch('/api/admin/user/:id/status',isAuthenticated,isAdmin, async(req,res)=>{
    try{
        const {id} = req.params;
        const statusDetail = await pool.query(`SELECT status FROM users where id=$1`,[id]);
        if(statusDetail.rowCount===0) return res.status(404).json({message:`user ID ${id} not found`});
        newStatus=!statusDetail.rows[0].status;
        const userChange = await pool.query(`UPDATE users SET status=$1 where id=$2 RETURNING id,username,status`,[newStatus,id]);
        if(userChange.rowCount===0) return res.status(401).json({message:"issue occured during process"});
        res.json({data:userChange.rows[0],message:`User Id ${id} status changed`})
                
    }catch(err){
        res.status(400).json({message:err});
    }

})
app.listen(PORT, () => {
    console.log(`Server soaring on port ${PORT}`);
});