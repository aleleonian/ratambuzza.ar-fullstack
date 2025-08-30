// globalSetup.js
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' }); // Ensure test env is loaded

export default async () => {
  console.log("Starting tests...")
};
