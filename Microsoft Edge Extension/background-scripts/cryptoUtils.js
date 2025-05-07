// cryptoUtils.js
const DEFAULT_CRYPTO_KEY = "D!l4POwenOpOZ$Z2kKnO#0@RLJnjTh"; // Klar benannter Schlüssel

/**
 * Generische Funktion zur Umkehrung eines Tokens (kann sowohl obfuskieren als auch deobfuskieren).
 * @param {string} token - Das Token, das umgekehrt werden soll.
 * @returns {string} Umgekehrter Token.
 */
function reverseString(token) {
    return token.split('').reverse().join('');
}

/**
 * Einfache XOR-Operation zur Verschlüsselung oder Entschlüsselung.
 * @param {string} input - Eingabedaten (z.B. Token).
 * @param {string} key - Der Schlüssel für die XOR-Operation.
 * @returns {string} Ergebnis der XOR-Operation.
 */
function xorObfuscate(input, key) {
    return Array.from(input).map((char, index) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(index % key.length))).join('');
}

/**
 * Verschlüsselt ein Token mit einem gegebenen Schlüssel.
 * @param {string} token - Das zu verschlüsselnde Token.
 * @param {string} [key=DEFAULT_CRYPTO_KEY] - Der Verschlüsselungsschlüssel.
 * @returns {string} Verschlüsselter Token als Base64.
 */
function encryptToken(token, key = DEFAULT_CRYPTO_KEY) {
    const obfuscated = xorObfuscate(token, key);
    return btoa(obfuscated);
}

/**
 * Entschlüsselt einen verschlüsselten Token mit einem gegebenen Schlüssel.
 * @param {string} encryptedToken - Verschlüsselter Token (Base64).
 * @param {string} [key=DEFAULT_CRYPTO_KEY] - Der Verschlüsselungsschlüssel.
 * @returns {string} Das entschlüsselte Token.
 */
function decryptToken(encryptedToken, key = DEFAULT_CRYPTO_KEY) {
    const obfuscated = atob(encryptedToken);
    return xorObfuscate(obfuscated, key);
}

// Exportiere Funktionen über ein Modulobjekt
export const cryptoUtils = {
    reverseString, encryptToken, decryptToken
};