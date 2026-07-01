import {
    LogLevel,
    PackageName,
    Stack
} from "./types";

// Handle both Node.js (backend) and Vite (frontend) environments
const getAccessToken = () => {
    if (typeof process !== "undefined" && process.env && process.env.ACCESS_TOKEN) {
        return process.env.ACCESS_TOKEN;
    }
    // For Vite frontend, assuming we might expose it or hardcode for evaluation if needed
    // In a real app, you'd use import.meta.env.VITE_ACCESS_TOKEN
    if (typeof import.meta !== "undefined" && (import.meta as any).env && (import.meta as any).env.VITE_ACCESS_TOKEN) {
        return (import.meta as any).env.VITE_ACCESS_TOKEN;
    }
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJjZGhuYXVzaGt1bWFycmVkZHlAZ21haWwuY29tIiwiZXhwIjoxNzgyODg2ODk0LCJpYXQiOjE3ODI4ODU5OTQsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiJiNjdkOTNjNC0wNGEyLTRlZTMtYTBkMS1hM2MwNTYyZTNmOTUiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJkaGFudXNoIiwic3ViIjoiZjQ4YTU3Y2YtMWI3MC00ZmQ2LTk1MjktMTlkMTE5ZDlmMjkyIn0sImVtYWlsIjoiY2RobmF1c2hrdW1hcnJlZGR5QGdtYWlsLmNvbSIsIm5hbWUiOiJkaGFudXNoIiwicm9sbE5vIjoiMjMxMWNzMDMwMDk0IiwiYWNjZXNzQ29kZSI6InhwUWRkZCIsImNsaWVudElEIjoiZjQ4YTU3Y2YtMWI3MC00ZmQ2LTk1MjktMTlkMTE5ZDlmMjkyIiwiY2xpZW50U2VjcmV0IjoiRlN2WHR1aEV0WUhKQ0RIayJ9.ETf8WP-8c1rSWuflZhkRafAQVN3-BFnVTPZ7RXmkuQM"; // Fallback to provided token for evaluation
};

const getBaseUrl = () => {
    if (typeof process !== "undefined" && process.env && process.env.BASE_URL) {
        return process.env.BASE_URL;
    }
    if (typeof import.meta !== "undefined" && (import.meta as any).env && (import.meta as any).env.VITE_BASE_URL) {
        return (import.meta as any).env.VITE_BASE_URL;
    }
    return "http://4.224.186.213/evaluation-service";
};

export async function Log(
    stack: Stack,
    level: LogLevel,
    pkg: PackageName,
    message: string
) {
    try {
        const token = getAccessToken();
        const baseUrl = getBaseUrl();
        await fetch(
            `${baseUrl}/logs`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    stack,
                    level,
                    package: pkg,
                    message
                })
            }
        );
    } catch (err) {
        // Never crash application
        console.error("Logger Failed");
    }
}
