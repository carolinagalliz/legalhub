import admin from "firebase-admin";

let db;

try {
  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  db = admin.firestore();
} catch (e) {
  console.error("Error Firebase init:", e);
}

export default async function handler(req, res) {
  try {
    console.log("Webhook funcionando");

    // 👇 IMPORTANTE: responder aunque no haya body
    if (!req.body) {
      return res.status(200).send("Webhook activo");
    }

    const body = req.body;

    const email =
      body?.data?.payer?.email ||
      body?.payer_email ||
      body?.data?.email;

    if (!email) {
      return res.status(200).send("Sin email");
    }

    await db.collection("usuarios_autorizados").doc(email).set({
      email,
      activo: true,
      plan: "suscripcion",
      fecha: new Date()
    }, { merge: true });

    return res.status(200).send("OK");

  } catch (error) {
    console.error("ERROR WEBHOOK:", error);
    return res.status(200).send("Error controlado");
  }
}