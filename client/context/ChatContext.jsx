
import { useContext } from "react";
import { useState } from "react";
import { createContext } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";
import { useEffect } from "react";

export const chatContext = createContext(); 


export const ChatProvider = ({children}) => { 
  const [message, setMessage] = useState([]);
  const [users, setUsers] = useState([]); 
  const [selectedUser, setSelectedUser] = useState(null); 
  const [unseenMessages, setunseenMessages] = useState({}); 

  const {socket, axios} = useContext(AuthContext); 

  //function to get all users for sidebar
  const getUsers = async ()=>{
    try {
      const {data}  = await axios.get("/api/messages/users"); 
      if(data.success){ 
        setUsers(data.users); 
        setunseenMessages(data.unseenMessages); 
      }
    } catch (error) {
      toast.error(error.message); 
    }
  }

  //Function to get messages for selected users 
  const getMessages = async (userId)=> { 
    try {
      const {data} = await axios.get(`/api/messages/${userId}`); 
      if(data.success){ 
        setMessage(data.messages); 
      }
    } catch (error) {
      toast.error(error.message); 
    }
  }

  //Function to send messages to selected users 
  const sendMessage = async (messageData)=> { 
    try {
      console.log(selectedUser._id)
      const {data} = axios.post(`/api/messages/send/${selectedUser._id}`,messageData); 
      
      if(data.success){ 
        console.log("after sending messages"); 
        setMessage((prevMessages)=> [...prevMessages, data.newMessage]); 
      }
      else { 
        toast.error(data.message); 
      }
    } catch (error) {
      console.log("befoer sending messages");
      console.log(error.message); 
      toast.error(error.message);
    }
  }


  //function to subscribe to messages for selected user 
  const subscribeToMessages = async ()=>{ 
    if(!socket) return; 

    socket.on("newMessage", (newMessage)=>{ 
      if(selectedUser && newMessage.senderId  === selectedUser._id){
        newMessage.seen = true; 
        setMessage((prevMessages)=> [...prevMessages, newMessage]);
        axios.put(`/api/messages/mark/${newMessage._id}`); 
      }
      else {
        setunseenMessages((prevUnseenMessagess)=> ({
          ...prevUnseenMessagess,
         [newMessage.senderId] : prevUnseenMessagess[newMessage.senderId] ? prevUnseenMessagess[newMessage.senderId] + 1 : 1
        }))
      }
    })
  }

//function to unsubscribe from messages
  const unsubscribeFromMessages = ()=>{
    if(socket) socket.off("newMessge"); 
  }

  useEffect(()=> { 
    subscribeToMessages(); 
    return ()=> unsubscribeFromMessages(); 
  },[socket, selectedUser])

  const value = { 
    message, users, selectedUser, getUsers, sendMessage, 
    setSelectedUser, unseenMessages, setunseenMessages, getMessages
  }
  
  return (
    <chatContext.Provider value={value}> 
      {children}
    </chatContext.Provider>
  )
}