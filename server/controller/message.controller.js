import Message from "../model/message.js";
import User from "../model/User.js";
import cloudinary from "../lib/cloudinary.js"
import {io,userSocketMap} from "../server.js"

//Get all users except the logged in user 
export const getUsersForSidebar = async (req,res)=>{
  try{
    const userId = req.user._id; 
    const filtredUsers = await User.find({_id : {$ne : userId}}).select("-password"); 

    //Count number of message not seen
    const unseenMessages = {}; 
    const promises = filtredUsers.map(async (user)=> {
      const messages = await Message.find({senderId : user._id, receverId : userId, seen : false}); 

      if(messages.length > 0){
        unseenMessages[userId] = messages.length;
      }
    })
    await Promise.all(promises); 
    res.json({success : true, users : filtredUsers, unseenMessages}); 
  }
  catch(error){
    console.log(error.message); 
    res.json({success : false, message : error.message}); 
  }
}

//Get all messages for selected user 
export const getMessages = async (req,res)=> { 
  try{ 
    const {id : selectedUserId } = req.params; 
    const myId = req.user._id;
    console.log("myId:", myId);
    console.log("selectedUserId:", selectedUserId);


    const messages = await Message.find({
      $or : [
        {senderId : myId, receiverId : selectedUserId}, 
        {senderId : selectedUserId, receiverId : myId} 
      ]
    })
    await Message.updateMany({senderId : selectedUserId, receiverId : myId }, {seen : true}); 
    console.log(messages); 
    res.json({success:true,messages});
  }
  catch(error){ 
    res.json({success : false, message : error.message}); 
  }
}

//api to mark message as seen using message id 
export const markMessageAsSeen = async (req,res)=> { 
  try{ 
    const {id} = req.params; 
    await Message.findById(id,{seen : true}); 
    res.json({success : true}); 
  }
  catch(error){ 
    res.json({success : false, message : error.message}); 
  }
}


//Send message to selected user
export const sendMessage = async (req,res)=> { 
  try{
    const {text, image} = req.body; 
    const receiverId = req.params.id; 
    const senderId = req.user._id; 

    let imageUrl; 
    if(image){
      const uploadResponse = await cloudinary.uploader.upload(image); 
      imageUrl = uploadResponse.secure_url; 
    }
    const newMessage = await Message.create({
      senderId, 
      receiverId, 
      text, 
      image :  imageUrl,
      
    })

    //Emit the new message to the reciver's socket 
    const reciverSocketId = userSocketMap[receiverId];
    if(reciverSocketId){
      io.to(reciverSocketId).emit("newMessage", newMessage); 
    }

    console.log("text:", text);
    console.log("newMessages" , newMessage); 

    res.json({success : true, newMessage}); 
  }
  catch(error){
    console.log("Messages comes from here")
    res.json({success : false, message : error.message});
  }
}
