// NODE_TLS_REJECT_UNAUTHORIZED=0 wird hier global gesetzt, um Zertifikatsfehler zu ignorieren
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import express from 'express';
import fetch from 'node-fetch'; // Für Node 14+; alternativ: "const fetch = require('node-fetch');" bei CommonJS
import bodyParser from 'body-parser';

const app = express();
const PORT = 3001; // Wähle einen freien Port

// Body-Parser zum Auswerten von JSON im Request-Body
app.use(bodyParser.json());

// Endpunkt, der den Request vom Plugin entgegennimmt und an den Zielserver weiterleitet
app.post('/proxy', async (req, res) => {
    // Die im Request übermittelten Daten: basis_url und identifier
    const {targetUrl, identifier, accessToken} = req.body;

    if (!targetUrl || !identifier) {
        res.status(400).json({error: 'Missing basis_url or identifier'});
        return;
    }

    // Konstruieren der Ziel-URL
    console.log("Proxy: Sende Request an:", targetUrl);

    try {
        // Hier geben wir den Request weiter; hier kannst du auch andere Methoden oder Header hinzufügen, falls nötig
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'authorization': accessToken,
            }
        });
        const text = await response.text();
        // Logge den Rückgabestatus und Body
        console.log("Proxy: Antwortstatus", response.status);
        console.log("Proxy: Antworttext:", text);
        res.status(response.status).json({status: response.status, body: text});
    } catch (error) {
        console.error("Proxy-Fehler:", error);
        res.status(500).json({error: error.toString()});
    }
});

app.listen(PORT, () => {
    console.log(`Proxy-Server läuft auf http://localhost:${PORT}`);
});
