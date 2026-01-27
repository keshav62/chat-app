import express from 'express';
import { protectRoute } from '../middleware/auth.middleware';
import { getMessages, getUsersForSidebar, markMessageAsSeen, sendMessage } from '../controller/message.controller';


const messageRouter = express.Router();

messageRouter.get("/users",protectRoute,getUsersForSidebar); 
messageRouter.get("/:id",protectRoute,getMessages); 
messageRouter.put("mark/:id",protectRoute,markMessageAsSeen); 
messageRouter.post("/send/:id",protectRoute,sendMessage); 

export default messageRouter; 