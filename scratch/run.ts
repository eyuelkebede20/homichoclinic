import { auth } from "../src/lib/auth";

async function test() {
  try {
    const res = await auth.api.signInEmail({
      body: {
        email: "doctor@clinic.com",
        password: "password123"
      }
    });
    console.log("Success:", res);
  } catch (err) {
    console.error("FULL ERROR:", err);
  }
}

test();
