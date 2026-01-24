import jwt from 'jsonwebtoken'

//Function to generate the token from user
export const generateToken = (userId) =>{
  const token = jwt.sign({userId},process.env.JWT_SECRET); 
  return token; 
}
