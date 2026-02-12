import express from "express";
import cors from "cors";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
const app = express();
const port = process.env.PORT;
app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());
app.get("/api/me", async (req, res) => {
    // Check for Bearer token in Authorization header (for CLI)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        try {
            // Find session by token
            const session = await auth.api.getSession({
                headers: fromNodeHeaders(req.headers),
            });
            // If session not found via cookie, try to find user by token
            if (!session?.user) {
                const { prisma } = await import("../lib/prisma.js");
                const sessionRecord = await prisma.session.findUnique({
                    where: { token },
                    include: { user: true },
                });
                if (sessionRecord && sessionRecord.user) {
                    return res.json({
                        session: {
                            id: sessionRecord.id,
                            userId: sessionRecord.userId,
                            expiresAt: sessionRecord.expiresAt,
                        },
                        user: {
                            id: sessionRecord.user.id,
                            email: sessionRecord.user.email,
                            name: sessionRecord.user.name,
                            image: sessionRecord.user.image,
                        },
                    });
                }
            }
        }
        catch (error) {
            return res.status(401).json({ error: "Invalid token" });
        }
    }
    // Fall back to cookie-based session
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });
    return res.json(session);
});
app.get("/device", async (req, res) => {
    const { user_code } = req.query;
    res.redirect(`http://localhost:3000/device?user_code=${user_code}`);
});
app.get("/", (req, res) => {
    res.send("ok");
});
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
