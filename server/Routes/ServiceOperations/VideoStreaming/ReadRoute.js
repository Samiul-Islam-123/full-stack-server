const PostModel = require('../../../Database/Models/VideoStreaming/PostModel');
const axios = require('axios')
const VideoStreamingReadRoute = require('express').Router();

VideoStreamingReadRoute.get('/feed', async (req, res) => {
    try {
        const FetchedData = await PostModel.find().populate('owner');
       
        res.json({
            success: true,
            feedData: FetchedData
        })
    }
    catch (error) {
        console.log(error);
        res.json({
            success : false,
            errro : error
        })
    }
})

VideoStreamingReadRoute.get('/stream', async (req, res) => {
    try {
        const { url } = req.query;

        // Fetch the video from the provided URL
        const response = await axios.get(url, {
            responseType: 'stream', // Set responseType to stream to get the video as a stream
        });

        // Set the appropriate headers for streaming the video
        res.set('Content-Type', response.headers['content-type']);
        res.set('Content-Length', response.headers['content-length']);

        // Pipe the video stream to the response
        response.data.pipe(res);
    } catch (error) {
        console.error('Error streaming video:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



module.exports = VideoStreamingReadRoute;