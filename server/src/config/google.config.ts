import dotenv from "dotenv";
dotenv.config();

export const config ={
    googleApikey:process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
    model:process.env.COREMIND_MODEL || "gemini-2.5-flash",
}