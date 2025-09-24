import { Worker } from 'bullmq';
import Twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const client = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const worker = new Worker(
  'callQueue',
  async (job) => {
    console.log(`[Worker] Processing job for ${job.data.phone}`);

    try {
      const call = await client.calls.create({
        to: job.data.phone,
        from: process.env.TWILIO_FROM,
        url: `https://flashfire-backend-hoisted.onrender.com/twilio-ivr?meetingTime=${encodeURIComponent(job.data.meetingTime)}`
      });

      console.log(`📞 Call initiated. SID: ${call.sid}`);
    } catch (err) {
      console.error(`❌ Failed to create call for ${job.data.phone}:`, err.message);
      throw err; // important so BullMQ marks job as failed
    }
  },
  { connection: { url: process.env.REDIS_CLOUD_URL } }
);

// Track worker lifecycle
worker.on("completed", (job) => {
  console.log(`✅ Job completed: ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job failed: ${job.id}`, err);
});
