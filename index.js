const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const fileUpload = require('express-fileupload');
const cors = require('cors');
require('dotenv').config();

//stripe for payment
const stripe = require("stripe")(process.env.STRIPE_SECRET);

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nsqce.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });



async function run() {
    try {
        await client.connect()
        console.log("connect to database");
        const database = client.db('swiss-eagle');
        const serviceCollection = database.collection('service');
        const memberCollection = database.collection('member');
        const reviewCollection = database.collection('review');
        const ordersCollection = database.collection('orders')
        const usersCollection = database.collection('users')
        const subscriberCollection = database.collection('subscriber')


        //post api for services insert me
        app.post('/review', async (req, res) => {
            const service = req.body;
            const result = await reviewCollection.insertOne(service);
            res.json(result)
        });


        // GET API all service for show data me
        app.get('/service', async (req, res) => {
            const cursor = serviceCollection.find({});
            const services = await cursor.toArray();
            res.send(services);
        });
        // GET API all service for show data me
        app.get('/review', async (req, res) => {
            const cursor = reviewCollection.find({});
            const services = await cursor.toArray();
            res.json(services);
        });

        // GET API all orders  for show data me
        app.get('/orders', async (req, res) => {
            const cursor = ordersCollection.find({});
            const services = await cursor.toArray();
            res.json(services);
        });

        // GET API all orders  for show data me
        app.get('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await ordersCollection.findOne(query);
            // const services = await cursor.toArray();
            res.json(result);
        });

        // GET API all subscriber  for show data me
        app.get('/subscriber', async (req, res) => {
            const cursor = subscriberCollection.find({});
            const subscriber = await cursor.toArray();
            res.json(subscriber);
        });


        // GET Single Service id me
        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.json(service);
        })


        //check user he/she admin or not
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin })
        })

        // Add Orders API me
        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.json(result);
        })
        // Add users API me
        app.post('/users', async (req, res) => {
            const order = req.body;
            const result = await usersCollection.insertOne(order);
            res.json(result);
        })

        // Add users API me
        app.post('/products', async (req, res) => {
            const order = req.body;
            // console.log('picture', order.picture);
            const result = await serviceCollection.insertOne(order);
            res.json(result);
        })

        //collect member from client
        app.post('/member', async (req, res) => {
            const name = req.body.name;
            const price = req.body.price;
            const description = req.body.description;
            const image = req.files.image;
            const imageData = image.data;
            const encodedPic = imageData.toString('base64');
            const imageBuffer = Buffer.from(encodedPic, 'base64');
            const products = {
                name,
                price,
                description,
                image: imageBuffer
            };
            const result = await memberCollection.insertOne(products);
            // console.log('body', req.body);
            // console.log('files', req.files);
            res.json(result)
        })


        // Add subscriber API me
        app.post('/subscriber', async (req, res) => {
            const order = req.body;
            const result = await subscriberCollection.insertOne(order);
            res.json(result);
        })


        //collect google login in data
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result)
        })

        //create admin and check already admin or not
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            console.log(result);
            res.json(result)
        })

        // show only users orders to ui
        app.get('/orders/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const result = await ordersCollection.find(filter).toArray();
            res.json(result)
        });

        // cancel an order cancel by customer from my order
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(query);
            // console.log('deleting user with id ', result);
            res.json(result);
        })

        // delete product to admin from my manage order
        app.delete('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await serviceCollection.deleteOne(query);
            // console.log('deleting user with id ', result);
            res.json(result);
        })

        // update order status status
        app.put('/update/:id', async (req, res) => {
            const id = req.params.id;
            const updatedOrder = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: updatedOrder.status,
                },
            };
            const result = await ordersCollection.updateOne(filter, updateDoc, options)
            console.log('updating', id)
            res.json(result)
        })



        // dynamic api for update products
        app.get('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const order = await ordersCollection.findOne(query);
            // console.log('load user with id: ', id);
            res.send(order);
        })

        //payment of card
        app.post("/create-payment-intent", async (req, res) => {
            const paymentInfo = req.body;
            const amount = paymentInfo.price * 100;
            // const paymentIntent = await stripe.paymentIntents.create
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                payment_method_types: ['card']
            });
            res.json({
                clientSecret: paymentIntent.client_secret,
            });
        })

        //update orders after payment complete 
        app.put('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) };
            const updateDoc = {
                $set: { payment: payment }
            };
            const result = await ordersCollection.updateOne(filter, updateDoc);
            res.json(result)
        })
    }
    finally {

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('running Dialz server')
})
app.listen(port, () => {
    console.log('listening on port', port);
});