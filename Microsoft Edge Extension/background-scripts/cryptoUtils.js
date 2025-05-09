// cryptoUtils.js
const DEFAULT_CRYPTO_KEY = "D!l4POwenOpOZ$Z2kKnO#0@RLJnjTh"; // Clearly named key

/**
 * Generic function for reversing a token (can both obfuscate and deobfuscate).
 * @param {string} token - The token that is to be reversed.
 * @returns {string} Inverted token.
 */
function reverseString(token) {
    return token.split('').reverse().join('');
}

/**
 * Simple XOR operation for encryption or decryption.
 * @param {string} input - Input data (e.g. token).
 * @param {string} key - The key to the XOR operation.
 * @returns {string} Result of the XOR operation.
 */
function xorObfuscate(input, key) {
    return Array.from(input).map((char, index) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(index % key.length))).join('');
}

/**Encrypts a token with a given key.
 * @param {string} token - The token to be encrypted.
 * @param {string} [key=DEFAULT_CRYPTO_KEY] - The encryption key.
 * @returns {string} Encrypted token as Base64.
 */
function encryptToken(token, key = DEFAULT_CRYPTO_KEY) {
    const obfuscated = xorObfuscate(token, key);
    return btoa(obfuscated);
}

/**
 * Decrypts an encrypted token with a given key.
 * @param {string} encryptedToken - Encrypted token (Base64).
 * @param {string} [key=DEFAULT_CRYPTO_KEY] - The encryption key.
 * @returns {string} The decrypted token.
 */
function decryptToken(encryptedToken, key = DEFAULT_CRYPTO_KEY) {
    const obfuscated = atob(encryptedToken);
    return xorObfuscate(obfuscated, key);
}

// Export functions via a module object
export const cryptoUtils = {
    reverseString, encryptToken, decryptToken
};