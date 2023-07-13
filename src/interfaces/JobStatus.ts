export type JobStatus = {
    id: string
    status: "queued" | "processing" | "completed" | "failed"
    message: string
}