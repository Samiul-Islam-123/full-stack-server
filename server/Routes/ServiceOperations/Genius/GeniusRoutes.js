const express = require('express');
const GeniusRoute = express.Router();
const OpenAI =require("openai");

const openai = new OpenAI({
    apiKey : `${process.env.OPENAI_API_KEY}`
});


const Process = async()=>{
    const completion = await openai.chat.completions.create({
        messages: [{"role": "system", "content": "You are a helpful assistant."}],
        


        model: "gpt-3.5-turbo",
      });
      
      console.log(completion.choices[0]);
    }
    
    GeniusRoute.post('/process', async(req,res)=>{
        //console.log(`${process.env.OPENAI_API_KEY}`)
        const prompt = req.body.prompt;
         await Process();
        res.send(`PROMPT : ${prompt}`)
        
})

module.exports = GeniusRoute;