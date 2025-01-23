// Import necessary modules
import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import { clientCredentials } from "axios-oauth-client";

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Read environment variables for OAuth and backend configuration
const tokenUrl = process.env.CHOREO_BOOK_LISTING_CONNECTION_TOKENURL;
const consumerKey = process.env.CHOREO_BOOK_LISTING_CONNECTION_CONSUMERKEY;
const consumerSecret =
  process.env.CHOREO_BOOK_LISTING_CONNECTION_CONSUMERSECRET;
const backendUrl = process.env.CHOREO_BOOK_LISTING_CONNECTION_SERVICEURL;

if (!tokenUrl || !consumerKey || !consumerSecret || !backendUrl) {
  console.error(
    "Missing required environment variables. Please check your .env file."
  );
  process.exit(1);
}

// Create a middleware to fetch the access token
const getClientCredentials = clientCredentials(
  axios.create(),
  tokenUrl,
  consumerKey,
  consumerSecret
);

// Middleware to handle requests and forward them to the backend
app.use(async (req, res) => {
  try {
    // Get the access token
    const auth = await getClientCredentials();
    const accessToken = auth.access_token;

    // Forward the request to the backend
    const response = await axios({
      method: req.method,
      url: `${backendUrl}${req.path}`, // Append the resource path to backend URL
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...req.headers, // Pass along the original request headers
      },
      data: req.body, // Forward the request body
    });

    // Respond with the backend's response
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error("Error forwarding request:", error.message);
    res
      .status(error.response?.status || 500)
      .send(error.response?.data || "Internal Server Error");
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`BFF is running on http://localhost:${PORT}`);
});
