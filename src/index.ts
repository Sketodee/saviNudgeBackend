import express from 'express';
const app = express();
require('dotenv').config();
import testRoute from './routes/api/test'
import userRoute from './routes/api/user'
import dbConn from './config/dbConn';

dbConn();  

// Middleware
app.use(express.json());


app.use('/api/test', testRoute);
app.use('/api/users', userRoute);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});