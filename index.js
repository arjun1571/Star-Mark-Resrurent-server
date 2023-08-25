const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const app = express()
const cors = require('cors')
require('dotenv').config()
const port = 5000

// middleware 
app.use(cors())
app.use(express.json())

// verfyJWT function 

const verfyJWT = (req,res,next) =>{
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error: true, message: 'unauthrozed access'})
  }

  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
    if(err){
      return res.status(401).send({error: true, message: 'unauthrozed access'})
    }
    req.decoded=decoded;
    next();
  })
}





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.trgh7.mongodb.net/?retryWrites=true&w=majority`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db("starMarkDB").collection("users");
    const menuCollection = client.db("starMarkDB").collection("menus");
    const reviewsCollection=client.db("starMarkDB").collection("reviews")
    const cartCollection=client.db("starMarkDB").collection("carts")


    // create jwt 
    app.post("/jwt",async(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({token})
      
    })

    // secutiye layer : verifyJwt 

    app.get("/users/admin/:email",verfyJWT,async(req,res)=>{
      const email = req.params.email;

      if(req.decoded.email !== email){
        res.send({admin:false})
      }
      const query = {email: email}
      const user = await userCollection.findOne(query);
      const result= {admin: user?.role === 'admin'}
      res.send(result)

    })

    // get user data 
    app.get("/users",async(req,res)=>{
      const result = await userCollection.find().toArray()
      res.send(result)
    })

    // post the user data 
    app.post("/users", async(req,res)=>{
      const items = req.body;
      console.log(items);
      const query= {email: items.email}
      const exstingUser = await userCollection.findOne(query)
      if(exstingUser){
        return res.send({message: "user already exisist"})
      }
      const result = await userCollection.insertOne(items)
      res.send(result)

    })
    // cheange the role 
    app.patch('/users/admin/:id',async(req,res)=>{
      const id =req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updateDoc ={
        $set:{
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter,updateDoc)
      res.send(result)

    })

    // delete the user 
    app.delete("/users/:id",async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await userCollection.deleteOne(query)
      res.send(result);
    })

    // get the menus data 

    app.get('/menus',async(req,res)=>{
        const result = await menuCollection.find().toArray()
        res.send(result) 
    })

    // post item menu 
    app.post("/menus",async(req,res)=>{
      const newItem = req.body;
      const result = await menuCollection.insertOne(newItem)
      res.send(result)
    })

    // delete the menu 
    app.delete("/menus/:id",async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await menuCollection.deleteOne(query)
      res.send(result)
    })

    // get the reviews data 

    app.get('/reviews',async(req,res)=>{
        const result = await reviewsCollection.find().toArray()
        res.send(result) 
    })

    // put the data 
    app.post("/carts", async(req,res)=>{
      const items = req.body;
      console.log(items);
      const result = await cartCollection.insertOne(items)
      res.send(result)

    })

    // delte the data 

    app.delete("/carts/:id", async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await cartCollection.deleteOne(query)
      res.send(result)


    })

    // get the cart data 
    app.get('/carts',verfyJWT,async(req,res)=>{
      const email = req.query.email;

      if(!email){
        res.send([])
      }
      const decodeEamil = req.decoded.email;
      if(email !== decodeEamil){
        return res.status(401).send({error: true, message: 'forviden access'})
      }
      const query = {email: email}
      const result = await cartCollection.find(query).toArray()
      res.send(result)

    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('star mark')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})