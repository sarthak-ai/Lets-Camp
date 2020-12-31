if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}
const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const Joi=require('joi');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const Campground = require('./models/campground');
const catchAsync = require('./utils/catchAsync');
const {campgroundSchema, reviewSchema}=require('./schemas.js');
const Review=require('./models/review');
const ExpressError = require('./utils/ExpressError');
const session=require('express-session');
const flash=require('connect-flash');
const passport=require('passport');
const LocalStrategy=require('passport-local');
const User=require('./models/user');
const userRoutes=require('./routes/users');
const campgroundRoutes=require('./routes/campgrounds');
const reviewRoutes=require('./routes/reviews');
const { MongoStore } = require('connect-mongo');
const MongoDBStore=require('connect-mongo')(session);
const dbUrl=process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';
mongoose.connect(dbUrl, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: false });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log("we're connected!");
});

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname,'public')));
const secret=process.env.SECRET || 'thisshouldbeabettersecret';
const store=new MongoDBStore({
    url:dbUrl,
    secret,
    touchAfter:24*3600
});
store.on("error",function(e){
    console.log('SESION STORE ERROR')
})
const sessionConfig={
    store,
    name:'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie:{
        httpOnly: true,
        expires:Date.now()+1000*60*6*24*7,
        maxAge:1000*60*6*24*7
    }
}
app.use(session(sessionConfig));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use((req,res,next) =>{
    res.locals.currentUser=req.user;
    res.locals.success=req.flash('success');
    res.locals.error=req.flash('success');
    next();
})
app.get('/fakeUser',async(req,res)=>{
    const user=new User({email:'coltttt@gmail.com', username:'abcc'})
    const newUser=await User.register(user,'chicken');
    res.send(newUser);
})
const validateReview=(req,res,next)=>{
    const {error}=reviewSchema.validate(req.body);
    if(error){
        const msg=error.details.map(el=>el.message).join(',')
        throw new ExpressError(msg,400)
    }
    else{
        next();
    }
}
app.use('/',userRoutes);
app.use('/campgrounds',campgroundRoutes);
app.use('/campgrounds/:id/reviews',reviewRoutes);

app.get('/', (req, res) => {
    res.render('home');
})

app.all('*',(req,res,next)=>{
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
    const {statusCode=500, message='Something went wrong'}=err;
    if(!err.message) err.message = 'Oh no, Something Went Wrong!!'
    res.status(statusCode).render('error', {err})
})
const port=process.env.PORT||3000;
app.listen(port, () => {
    console.log(`Server Created, Listening on port ${port}`);
})