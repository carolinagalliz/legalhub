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

    if (!db) {
      console.error("Firestore no inicializado");
      return res.status(200).send("Firestore no inicializado");
    }

    const body = req.body || {};

    const paymentId = body?.data?.id || req.query?.["data.id"];
    const type = body?.type || req.query?.type;

    console.log("PAYMENT ID:", paymentId);
    console.log("TYPE:", type);

    let email =
      body?.data?.payer?.email ||
      body?.payer_email ||
      body?.data?.email;

    let plan = "activo";

    if (!email && paymentId) {
      const mpRes = await fetch(
        `https://api.mercadopago.com/preapproval/${paymentId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
          }
        }
      );

      const mpData = await mpRes.json();

      console.log("MP DATA:", JSON.stringify(mpData, null, 2));

      email = mpData?.payer_email || mpData?.payer?.email;

      const planId = mpData?.preapproval_plan_id;

      if (planId === "1b14f1ae27a042049d5e180504f6c4d8") {
        plan = "mensual";
      }

      if (planId === "5363ed616a1e4681b2eebaf676bfd5d6") {
        plan = "anual";
      }
    }

    if (!email) {
      console.log("Sin email para activar usuario");
      return res.status(200).send("Sin email");
    }

    await db.collection("usuarios_autorizados").doc(email.toLowerCase()).set({
      email: email.toLowerCase(),
      activo: true,
      plan,
      origen: "mercadopago",
      fechaActivacion: new Date()
    }, { merge: true });

    console.log("Usuario activado:", email.toLowerCase(), plan);

    return res.status(200).send("OK");

  } catch (error) {
    console.error("ERROR WEBHOOK:", error);
    return res.status(200).send("Error controlado");
  }
}