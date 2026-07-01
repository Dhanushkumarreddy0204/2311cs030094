import {
    LogLevel,
    PackageName,
    Stack
} from "./types";

const TOKEN = process.env.ACCESS_TOKEN;

export async function Log(
    stack: Stack,
    level: LogLevel,
    pkg: PackageName,
    message: string
) {
    try {
        await fetch(
            "http://4.224.186.213/evaluation-service/logs",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${TOKEN}`
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
