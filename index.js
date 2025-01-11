const express = require('express')
const app = express()
const cors = require('cors')
const mongoose=require('mongoose')
require('dotenv').config()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


const userSchema=new mongoose.Schema({
    username: {type:String,required:true,unique:true}
})
const UserModel=mongoose.model('User',userSchema)

const exerciseSchema=new mongoose.Schema({
  username: {type:String,required:true},
  description: {type:String,required:true},
  duration: {type:Number,required:true},
  date: {type:String},
  
})
const ExerciseModel=mongoose.model('Exercise',exerciseSchema)

app.post('/api/users',async (req,res)=>{
  const {username}=req.body
  const user=await UserModel.findOne({username})
  if(user){
    return res.json({username:user.username,_id:user._id})
  }
  const newUser=new UserModel({username})
  await newUser.save()
  res.json({username:newUser.username,_id:newUser._id})
})

app.get('/api/users',async (req,res)=>{
  const users=await UserModel.find().select(['username','_id'])
  res.json(users)
})

app.post('/api/users/:_id/exercises',async (req,res)=>{
  const {_id}=req.params
  const user=await UserModel.findById(_id)
  if(!user){
    return res.json({msg:'user does not exists'})
  }
  const {description,duration,date}=req.body
  const newExercise=new ExerciseModel({username:user.username,description,duration})
  newExercise.date=date?new Date(date).toDateString():new Date().toDateString()
  await newExercise.save()
  res.json({
    username:user.username,
    description:newExercise.description,
    duration:newExercise.duration,
    date:newExercise.date,
    _id:user._id
  })
})

app.get('/api/users/:_id/logs',async(req,res)=>{
  //?[from][&to][&limit]
  const {_id}=req.params
  const user=await UserModel.findById(_id)
  if(!user){
    return res.json({msg:'user does not exists'})
  }
  let exercises=await ExerciseModel.find({username:user.username}).select(['description','duration','date'])
  if(!exercises){
    return res.json({exercises:[]})
  }

  let {from,to,limit}=req.query

  if(from){
    from=new Date(from)
    exercises=exercises.filter(exercise=>new Date(exercise.date)>=from)
  }
  if(to){
    to=new Date(to)
    exercises=exercises.filter(exercise=>new Date(exercise.date)<=to)
  }
  if(limit){
    exercises=exercises.splice(0,parseInt(limit))
  }

  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log: [...exercises]
  })
})

mongoose.connect(process.env.MONGO_URI).then(()=>{
  const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port)
  })
})


