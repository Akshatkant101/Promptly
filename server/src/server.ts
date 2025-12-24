import express from "express";
import cors from "cors"; 
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth";

const app = express();
const port = process.env.PORT!;

app.use(
  cors({
    origin: "http://your-frontend-domain.com", 
    methods: ["GET", "POST", "PUT", "DELETE"], 
    credentials: true, 
  })
);

app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json());

app.get("/api/me", async (req, res) => {
 	const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
	return res.json(session);
});

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});