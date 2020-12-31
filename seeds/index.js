const mongoose=require('mongoose');
const cities=require('./cities');
const {descriptors, places}=require('./seedHelpers');
const Campground=require('../models/campground');

mongoose.connect('mongodb://localhost:27017/yelp-camp', {useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("we're connected!");
});

const sample = array => array[Math.floor(Math.random()* array.length)];

const seedDB = async () => {
    await Campground.deleteMany({});
    for(let i=0;i<50;i++){
      const random1000=Math.floor(Math.random()*1000);
      const price=Math.floor(Math.random()*20)+10;
      const camp = new Campground({
        author: '5fec8ae550bafc1f5c07bdca',
        location: `${cities[random1000].city}, ${cities[random1000].state}`,
        title: `${sample(descriptors)} ${sample(places)}`,
        image: 'https://unsplash.com/collections/3711104/camp',
        description: "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Odio explicabo harum sapiente quidem quae, ullam dolores earum cumque tempora, rem ex. Molestiae et, placeat accusamus iure sit officia numquam. Tempore.",
        price: price
      })
      await camp.save();
    }
}

seedDB().then(() => {
  mongoose.connection.close();
})