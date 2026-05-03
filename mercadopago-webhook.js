import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  try {
    const body = req.body;

    console.log("Webhook recibido:", body);

    // 🔥 Intentamos obtener email del pago
    const email =
      body?.data?.payer?.email ||
      body?.payer_email ||
      body?.data?.email;

    if (!email) {
      return res.status(200).send("Sin email");
    }

    // 🔥 Activar usuario automáticamente
    await db.collection("usuarios_autorizados").doc(email).set({
      email: email,
      activo: true,
      plan: "suscripcion",
      fecha: new Date()
    }, { merge: true });

    return res.status(200).send("OK");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Error");
  }
}