const mongoose=require('mongoose'); 
require('dotenv').config(); 
mongoose.connect(process.env.MONGO_URI).then(async ()=>{ 
  const Store=require('./models/Store'); 
  const Promotion=require('./models/Promotion'); 
  const stores=await Store.find({state:'Johor'}); 
  const ids=stores.map(s=>s._id); 
  const p=await Promotion.find({ storeId: {$in: ids} }); 
  console.log('Total promotions for Johor stores:', p.length); 
  process.exit(0); 
});
