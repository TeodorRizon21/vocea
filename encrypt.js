const crypto = require('crypto');
const forge = require('node-forge');

module.exports = {
    encrypt: encrypt,
    decrypt: decrypt
};

function encrypt(publicKey, data, algorithm) {
    try {
        // Generate random key and IV
        const key = forge.random.getBytesSync(32);
        const iv = forge.random.getBytesSync(16);

        // Create cipher using AES-CBC
        const cipher = forge.cipher.createCipher('AES-CBC', key);
        cipher.start({ iv: iv });
        cipher.update(forge.util.createBuffer(data, 'utf8'));
        cipher.finish();

        // Get encrypted data and convert to base64
        const encrypted = forge.util.encode64(cipher.output.getBytes());

        // Extract public key from certificate
        const cert = forge.pki.certificateFromPem(publicKey);
        const publicKeyObj = cert.publicKey;
        const encryptedKey = publicKeyObj.encrypt(key, 'RSAES-PKCS1-V1_5');

        return {
            iv: forge.util.encode64(iv),
            env_key: forge.util.encode64(encryptedKey),
            data: encrypted,
            cipher: 'aes-256-cbc' // Always use this specific string
        };
    } catch (error) {
        console.error('Encryption error:', error);
        throw error;
    }
}

function decrypt(privateKey, iv, envKey, data, cipher) {
    try {
        // Decrypt the symmetric key
        const privateKeyPem = forge.pki.privateKeyFromPem(privateKey);
        const symmetricKey = privateKeyPem.decrypt(forge.util.decode64(envKey), 'RSAES-PKCS1-V1_5');

        // Create decipher using AES-CBC
        const decipher = forge.cipher.createDecipher('AES-CBC', symmetricKey);
        decipher.start({ iv: forge.util.decode64(iv) });
        decipher.update(forge.util.createBuffer(forge.util.decode64(data)));
        decipher.finish();

        return decipher.output.toString('utf8');
    } catch (error) {
        console.error('Decryption error:', error);
        throw error;
    }
} 