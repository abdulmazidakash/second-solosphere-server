const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 4000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');



//middleware
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.j0hxo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

	const jobsCollection = client.db('second-solo-db').collection('jobs');
	const bidsCollection = client.db('second-solo-db').collection('bids');

	//add job post
	app.post('/add-job' , async(req, res) =>{
		const jobData = req.body;
		// console.log(jobData);
		const result = await jobsCollection.insertOne(jobData);
		// console.log(result);
		res.send(result)
	})

	//get jobs data api
	app.get('/jobs', async(req, res) =>{
		const data = req.body;
		const result = await jobsCollection.find(data).toArray();
		// console.log(result);
		res.send(result);
	})

	//get specific user collection
	app.get('/jobs/:email', async(req, res) =>{
		const email = req.params.email;
		const query = {'buyer.email': email};
		const result = await jobsCollection.find(query).toArray();
		res.send(result);
	})

	//jobs delete api
	app.delete('/job/:id', async(req, res) =>{
		const id = req.params.id;
		const query = { _id: new ObjectId(id)};
		const result = await jobsCollection.deleteOne(query);
		res.send(result);
	})

	//jobs update button api
	app.get('/job/:id', async(req, res) =>{
		const id = req.params.id;
		const query = { _id: new ObjectId(id)};
		const result = await jobsCollection.findOne(query);
		res.send(result);
	})

	//update job data
	app.put('/update-job/:id', async(req, res)=>{
		const jobData = req.body;
		const id = req.params.id;
		const updated = {
			$set: jobData,
		}
		const query = { _id: new ObjectId(id)};
		const options = {upsert: true};
		const result = await jobsCollection.updateOne(query, updated, options);
		res.send(result);
	})


	//save a bid data
	app.post('/add-bid', async(req, res) =>{
		const bidData = req.body;

		//
		const query = {email: bidData.email, job_id: bidData.job_id};
		const alreadyExist = await bidsCollection.findOne(query);

		console.log('if already exist---->', alreadyExist);
		if(alreadyExist)
			return res
		.status(400)
		.send('Already bid on this job');
		const result = await bidsCollection.insertOne(bidData);

		//increase bid count in jobs collection
		const filter = {_id: new ObjectId(bidData.job_id)};
		const update = {
			$inc: {bid_count: 1}
		}
		const updateCollection = await jobsCollection.updateOne(filter, update);
		res.send(result);
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



app.get('/', (req, res) =>{
	res.send('solosphere market is running');
})

app.listen(port, ()=>{
	console.log(`solosphere market is running port ${port}`);
})